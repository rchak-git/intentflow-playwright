import express, { type ErrorRequestHandler } from 'express';
import { promises as fs } from 'fs';
import path from 'path';
import { parseDocument, type Document } from 'yaml';

type JsonObject = Record<string, unknown>;

function isObject(value: unknown): value is JsonObject {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function parseSuite(text: string): { document: Document; suite: JsonObject } {
  const document = parseDocument(text, { uniqueKeys: true });
  if (document.errors.length) throw new Error(document.errors.map(error => error.message).join('; '));
  const suite: unknown = document.toJS();
  if (!isObject(suite)) throw new Error('Suite YAML must contain a mapping at its root');
  return { document, suite };
}

// Update only changed nodes so comments and formatting on untouched YAML nodes survive.
function updateDocument(document: Document, before: unknown, after: unknown, keys: (string | number)[] = []): void {
  if (JSON.stringify(before) === JSON.stringify(after)) return;
  if (isObject(before) && isObject(after)) {
    for (const key of Object.keys(before)) {
      if (!Object.hasOwn(after, key)) document.deleteIn([...keys, key]);
    }
    for (const key of Object.keys(after)) {
      if (!Object.hasOwn(before, key)) document.setIn([...keys, key], after[key]);
      else updateDocument(document, before[key], after[key], [...keys, key]);
    }
  } else if (Array.isArray(before) && Array.isArray(after) && before.length === after.length) {
    after.forEach((value, index) => updateDocument(document, before[index], value, [...keys, index]));
  } else if (keys.length) {
    document.setIn(keys, after);
  } else {
    document.contents = document.createNode(after);
  }
}

export function createApp(suitesDirectory = path.resolve(__dirname, '../../../tests/suites')) {
  const app = express();
  app.use((req, res, next) => {
    const host = req.get('host') || '';
    const origin = req.get('origin');
    if (!/^127\.0\.0\.1(?::\d+)?$/.test(host) || (origin && origin !== `http://${host}`)) {
      res.status(403).json({ error: 'Only same-origin requests to 127.0.0.1 are allowed' });
      return;
    }
    next();
  });
  app.use(express.json({ limit: '5mb', strict: true }));

  async function resolveSuite(filePath: unknown): Promise<string> {
    if (typeof filePath !== 'string' || !filePath || path.isAbsolute(filePath) || !filePath.endsWith('.yaml')) {
      throw new Error('filePath must be a relative .yaml file path');
    }
    const root = await fs.realpath(suitesDirectory);
    const target = await fs.realpath(path.resolve(root, filePath));
    const relative = path.relative(root, target);
    if (!relative || relative === '..' || relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative)) {
      throw new Error('filePath must be inside the suites directory');
    }
    if (!(await fs.stat(target)).isFile()) throw new Error('filePath must refer to a file');
    return target;
  }

  app.get('/api/suites', async (_req, res) => {
    try {
      const suites: { name: string; filePath: string; profileCount: number }[] = [];
      async function scan(directory: string): Promise<void> {
        const entries = await fs.readdir(directory, { withFileTypes: true });
        for (const entry of entries) {
          const fullPath = path.join(directory, entry.name);
          if (entry.isDirectory()) await scan(fullPath);
          else if (entry.isFile() && entry.name.endsWith('.yaml')) {
            const { suite } = parseSuite(await fs.readFile(fullPath, 'utf8'));
            const profiles = isObject(suite.profiles) ? suite.profiles : {};
            suites.push({
              name: entry.name,
              filePath: path.relative(suitesDirectory, fullPath),
              profileCount: Object.keys(profiles).length,
            });
          }
        }
      }
      await scan(suitesDirectory);
      suites.sort((a, b) => a.filePath.localeCompare(b.filePath));
      res.json(suites);
    } catch (error) {
      res.status(500).json({ error: `Could not scan suites: ${String(error)}` });
    }
  });

  app.get('/api/suite-details', async (req, res) => {
    try {
      const file = await resolveSuite(req.query.filePath);
      res.json(parseSuite(await fs.readFile(file, 'utf8')).suite);
    } catch (error) {
      res.status(400).json({ error: `Could not read suite: ${String(error)}` });
    }
  });

  app.post('/api/suites/save', async (req, res) => {
    try {
      if (!req.is('application/json') || !isObject(req.body) || !isObject(req.body.suiteData)) {
        res.status(400).json({ error: 'Expected JSON with filePath and a suiteData object' });
        return;
      }
      const file = await resolveSuite(req.body.filePath);
      const { document, suite } = parseSuite(await fs.readFile(file, 'utf8'));
      if (req.body.originalSuite !== undefined && JSON.stringify(req.body.originalSuite) !== JSON.stringify(suite)) {
        res.status(409).json({ error: 'Suite changed on disk. Reload it before saving.' });
        return;
      }
      updateDocument(document, suite, req.body.suiteData);
      await fs.writeFile(file, document.toString(), 'utf8');
      res.json({ ok: true });
    } catch (error) {
      res.status(400).json({ error: `Could not save suite: ${String(error)}` });
    }
  });

  const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
    res.status(400).json({ error: `Invalid request: ${String(error)}` });
  };
  app.use(errorHandler);
  app.use(express.static(path.join(__dirname, 'dist')));
  return app;
}

if (require.main === module) {
  const port = 4173;
  createApp().listen(port, '127.0.0.1', () => {
    console.log(`YAML Suite Inspector: http://127.0.0.1:${port}`);
  });
}
