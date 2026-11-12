export type JsonValue = null | boolean | number | string | JsonValue[] | { [key: string]: JsonValue };
export type JsonObject = { [key: string]: JsonValue };
export type DataPath = (string | number)[];
export type Suites = Record<string, JsonObject>;
type Source = { file: string; path: DataPath };
export type ExpandedStep = { step: JsonObject; source: Source };
export type DataOverrides = { data: JsonObject; source: Source; label: string };

export function isObject(value: JsonValue | undefined): value is JsonObject {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function normalize(file: string): string {
  const parts: string[] = [];
  for (const part of file.replace(/\\/g, '/').split('/')) {
    if (part === '..') {
      if (!parts.length) throw new Error(`Reference escapes the suites directory: ${file}`);
      parts.pop();
    } else if (part && part !== '.') parts.push(part);
  }
  return parts.join('/');
}

function resolveFile(from: string, reference: string): string {
  const name = /\.ya?ml$/i.test(reference) ? reference : `${reference}.yaml`;
  const directory = normalize(from).split('/').slice(0, -1).join('/');
  return normalize(`${directory}/${name}`);
}

export function expandProfile(suites: Suites, selectedFile: string, profileName: string): {
  steps: ExpandedStep[];
  overrides: DataOverrides[];
} {
  const files: Suites = {};
  for (const [file, suite] of Object.entries(suites)) files[normalize(file)] = suite;
  const root = normalize(selectedFile);
  const steps: ExpandedStep[] = [];
  const overrides: DataOverrides[] = [];
  const seenOverrides = new Set<string>();

  function suiteAt(file: string): JsonObject {
    const suite = files[file];
    if (!suite) throw new Error(`Suite not found: ${file}`);
    return suite;
  }

  function lookup(file: string, section: 'profiles' | 'sharedScenarios', name: string, stack: string[] = []): Source | undefined {
    if (stack.includes(file)) throw new Error(`Circular suite includes: ${[...stack, file].join(' → ')}`);
    const suite = suiteAt(file);
    const entries = suite[section];
    if (isObject(entries) && Object.hasOwn(entries, name)) return { file, path: [section, name] };
    if (section === 'sharedScenarios' && isObject(entries)) {
      const parts = name.split('.');
      let nested: JsonValue | undefined = entries;
      for (const part of parts) nested = isObject(nested) ? nested[part] : undefined;
      if (nested !== undefined) return { file, path: [section, ...parts] };
      const base = parts[parts.length - 1];
      if (Object.hasOwn(entries, base)) return { file, path: [section, base] };
    }
    if (suite.includes !== undefined && !Array.isArray(suite.includes)) throw new Error(`Invalid includes in ${file}`);
    const includes = Array.isArray(suite.includes) ? suite.includes : [];
    for (const item of [...includes].reverse()) {
      if (typeof item !== 'string') throw new Error(`Invalid include in ${file}`);
      const found = lookup(resolveFile(file, item), section, name, [...stack, file]);
      if (found) return found;
    }
    return undefined;
  }

  function get(source: Source): JsonValue {
    let value: JsonValue = suiteAt(source.file);
    for (const part of source.path) {
      if (typeof part === 'number' && Array.isArray(value)) value = value[part];
      else if (typeof part === 'string' && isObject(value)) value = value[part];
      else throw new Error(`Invalid reference in ${source.file}`);
    }
    return value;
  }

  function recordData(object: JsonObject, source: Source, label: string) {
    if (object.data === undefined) return;
    if (!isObject(object.data)) throw new Error(`Invalid data in ${source.file}: ${label}`);
    const path = [...source.path, 'data'];
    const id = JSON.stringify([source.file, path]);
    if (!seenOverrides.has(id)) {
      seenOverrides.add(id);
      overrides.push({ data: object.data, source: { file: source.file, path }, label });
    }
  }

  function profileReference(file: string, reference: string): Source {
    let targetFile = file;
    let name = reference;
    if (reference.includes('#')) {
      const parts = reference.split('#');
      if (parts.length !== 2 || !parts[0] || !parts[1]) throw new Error(`Invalid profile reference: ${reference}`);
      targetFile = resolveFile(file, parts[0]);
      name = parts[1];
    } else if (reference.includes('.')) {
      const separator = reference.lastIndexOf('.');
      targetFile = resolveFile(file, reference.slice(0, separator));
      name = reference.slice(separator + 1);
    }
    const found = lookup(targetFile, 'profiles', name);
    if (!found) throw new Error(`Profile '${reference}' not found from ${file}`);
    return found;
  }

  function expand(source: Source, kind: 'profile' | 'scenario', stack: string[]) {
    const id = `${source.file}:${JSON.stringify(source.path)}`;
    if (stack.includes(id)) throw new Error(`Circular reference: ${[...stack, id].join(' → ')}`);
    const nextStack = [...stack, id];
    const node = get(source);
    if (!isObject(node) && !(kind === 'scenario' && Array.isArray(node))) {
      throw new Error(`Invalid ${kind} in ${source.file}: ${source.path.join('.')}`);
    }
    const object = isObject(node) ? node : undefined;
    if (object) recordData(object, source, `${kind} ${source.path.slice(1).join('.')}`);
    if (kind === 'profile' && object?.preconditions !== undefined) {
      if (!Array.isArray(object.preconditions)) throw new Error(`Invalid preconditions in ${id}`);
      object.preconditions.forEach((entry, index) => {
        if (!isObject(entry) || typeof entry.refProfile !== 'string') throw new Error(`Invalid precondition in ${id}`);
        const entrySource = { file: source.file, path: [...source.path, 'preconditions', index] };
        recordData(entry, entrySource, `Precondition ${entry.refProfile}`);
        expand(profileReference(source.file, entry.refProfile), 'profile', nextStack);
      });
    }
    const rawSteps = Array.isArray(node) ? node : object?.steps;
    if (rawSteps !== undefined && !Array.isArray(rawSteps)) throw new Error(`Invalid steps in ${id}`);
    if (Array.isArray(rawSteps) && (rawSteps.length || kind === 'scenario')) {
      const base = Array.isArray(node) ? source.path : [...source.path, 'steps'];
      rawSteps.forEach((entry, index) => {
        if (!isObject(entry)) throw new Error(`Invalid step ${index + 1} in ${id}`);
        const entrySource = { file: source.file, path: [...base, index] };
        if (typeof entry.refScenario === 'string') {
          recordData(entry, entrySource, `Scenario ${entry.refScenario}`);
          const target = lookup(source.file, 'sharedScenarios', entry.refScenario);
          if (!target) throw new Error(`Scenario '${entry.refScenario}' not found from ${source.file}`);
          expand(target, 'scenario', nextStack);
        } else if (typeof entry.refProfile === 'string') {
          recordData(entry, entrySource, `Profile ${entry.refProfile}`);
          expand(profileReference(source.file, entry.refProfile), 'profile', nextStack);
        } else if (typeof entry.intent === 'string') steps.push({ step: entry, source: entrySource });
        else throw new Error(`Step ${index + 1} in ${id} has no intent or reference`);
      });
    } else if (object && typeof object.refScenario === 'string') {
      const target = lookup(source.file, 'sharedScenarios', object.refScenario);
      if (!target) throw new Error(`Scenario '${object.refScenario}' not found from ${source.file}`);
      expand(target, 'scenario', nextStack);
    } else if (object && typeof object.refProfile === 'string') {
      expand(profileReference(source.file, object.refProfile), 'profile', nextStack);
    } else if (kind === 'profile') throw new Error(`Profile has no steps or reference: ${id}`);
  }

  const target = lookup(root, 'profiles', profileName);
  if (!target) throw new Error(`Profile '${profileName}' not found in ${root}`);
  expand(target, 'profile', []);
  return { steps, overrides };
}
