import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { expandProfile, isObject, type DataPath, type JsonObject, type JsonValue, type Suites } from './resolveSteps';

type SuiteItem = { name: string; filePath: string; profileCount: number };

function display(value: JsonValue | undefined): string {
  return value === undefined ? '—' : typeof value === 'string' ? value : JSON.stringify(value);
}

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, options);
  const body: unknown = await response.json();
  if (!response.ok) {
    const message = body && typeof body === 'object' && 'error' in body ? String(body.error) : response.statusText;
    throw new Error(message);
  }
  return body as T;
}

function ValueEditor({ label, value, onChange, onValidity }: {
  label: string;
  value: JsonValue;
  onChange: (value: JsonValue) => void;
  onValidity: (valid: boolean) => void;
}) {
  const [isString] = useState(typeof value === 'string');
  const [draft, setDraft] = useState(typeof value === 'string' ? value : JSON.stringify(value));
  const [invalid, setInvalid] = useState(false);
  const textarea = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!invalid) setDraft(typeof value === 'string' && isString ? value : JSON.stringify(value));
  }, [value, isString]);

  useLayoutEffect(() => {
    if (textarea.current) {
      textarea.current.style.height = 'auto';
      const borders = textarea.current.offsetHeight - textarea.current.clientHeight;
      textarea.current.style.height = `${textarea.current.scrollHeight + borders}px`;
    }
  }, [draft]);

  function change(text: string) {
    setDraft(text);
    if (isString) {
      onChange(text);
      return;
    }
    try {
      const parsed: JsonValue = JSON.parse(text);
      onChange(parsed);
      setInvalid(false);
      onValidity(true);
    } catch {
      setInvalid(true);
      onValidity(false);
    }
  }

  return <label className="value-editor">
    <span>{label}{!isString && ' (JSON)'}</span>
    <textarea ref={textarea} aria-label={label} rows={1} value={draft} onChange={event => change(event.target.value)} />
    {invalid && <span className="error">Enter a valid JSON value.</span>}
  </label>;
}

export default function App() {
  const [suites, setSuites] = useState<SuiteItem[]>([]);
  const [selectedFile, setSelectedFile] = useState('');
  const [suite, setSuite] = useState<JsonObject | null>(null);
  const [suiteFiles, setSuiteFiles] = useState<Suites>({});
  const [originalSuite, setOriginalSuite] = useState<JsonObject | null>(null);
  const [selectedProfile, setSelectedProfile] = useState('');
  const [dirty, setDirty] = useState(false);
  const [invalidFields, setInvalidFields] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    request<SuiteItem[]>('/api/suites').then(setSuites).catch(reason => setError(String(reason)));
  }, []);

  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => {
      if (dirty || invalidFields.length) event.preventDefault();
    };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty, invalidFields]);

  async function selectSuite(filePath: string) {
    if (filePath === selectedFile) return;
    if ((dirty || invalidFields.length) && !window.confirm('Discard unsaved changes?')) return;
    setBusy(true);
    setError('');
    setMessage('');
    try {
      const entries = await Promise.all(suites.map(async item => [
        item.filePath,
        await request<JsonObject>(`/api/suite-details?filePath=${encodeURIComponent(item.filePath)}`),
      ] as const));
      const loaded = Object.fromEntries(entries);
      const data = loaded[filePath];
      if (!data) throw new Error(`Suite not found: ${filePath}`);
      setSuiteFiles(loaded);
      setSuite(data);
      setOriginalSuite(data);
      setSelectedFile(filePath);
      setSelectedProfile('');
      setDirty(false);
      setInvalidFields([]);
    } catch (reason) {
      setError(String(reason));
    } finally {
      setBusy(false);
    }
  }

  function selectProfile(name: string) {
    if (name === selectedProfile) return;
    if (invalidFields.length && !window.confirm('Discard invalid, uncommitted input?')) return;
    setInvalidFields([]);
    setSelectedProfile(name);
  }

  function updateValue(path: DataPath, value: JsonValue) {
    setSuite(current => {
      if (!current) return current;
      const updated = structuredClone(current);
      let node: JsonValue = updated;
      for (const part of path.slice(0, -1)) {
        if (typeof part === 'number' && Array.isArray(node)) node = node[part];
        else if (typeof part === 'string' && isObject(node)) node = node[part];
        else throw new Error('Invalid editor path');
      }
      const last = path[path.length - 1];
      if (typeof last === 'number' && Array.isArray(node)) node[last] = value;
      else if (typeof last === 'string' && isObject(node)) node[last] = value;
      else throw new Error('Invalid editor path');
      return updated;
    });
    setDirty(true);
    setMessage('');
  }

  function editor(label: string, value: JsonValue, path: DataPath, instance = '') {
    const id = JSON.stringify([path, instance]);
    return <ValueEditor key={id} label={label} value={value}
      onChange={next => updateValue(path, next)}
      onValidity={valid => setInvalidFields(current => valid ? current.filter(item => item !== id) : [...new Set([...current, id])])} />;
  }

  async function save() {
    if (!suite || !selectedFile || invalidFields.length) return;
    setBusy(true);
    setError('');
    setMessage('');
    try {
      await request('/api/suites/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filePath: selectedFile, suiteData: suite, originalSuite }),
      });
      setOriginalSuite(suite);
      setDirty(false);
      setMessage('Changes saved.');
    } catch (reason) {
      setError(String(reason));
    } finally {
      setBusy(false);
    }
  }

  const profiles = suite && isObject(suite.profiles) ? suite.profiles : {};
  const profile = isObject(profiles[selectedProfile]) ? profiles[selectedProfile] : undefined;
  let expanded: ReturnType<typeof expandProfile> | null = null;
  let expansionError = '';
  if (suite && profile) {
    try {
      expanded = expandProfile({ ...suiteFiles, [selectedFile]: suite }, selectedFile, selectedProfile);
    } catch (reason) {
      expansionError = reason instanceof Error ? reason.message : String(reason);
    }
  }
  const localFile = selectedFile.replace(/\\/g, '/');

  return <main>
    <header>
      <div><h1>YAML Suite Inspector</h1><p>Browse and edit local IntentFlow suites</p></div>
      <button onClick={save} disabled={!suite || !dirty || busy || invalidFields.length > 0}>Save Changes</button>
    </header>
    {error && <div className="notice error" role="alert">{error}</div>}
    {message && <div className="notice" role="status">{message}</div>}
    {dirty && <div className="notice">Unsaved changes</div>}
    <div className="columns">
      <section>
        <h2>Suites</h2>
        {suites.length === 0 && <p>No suites found.</p>}
        {suites.map(item => <button className={`card ${selectedFile === item.filePath ? 'selected' : ''}`}
          key={item.filePath} disabled={busy} onClick={() => void selectSuite(item.filePath)}>
          <strong>{item.name}</strong><small>{item.filePath}</small><small>{item.profileCount} profiles</small>
        </button>)}
      </section>
      <section>
        <h2>Profiles &amp; Setup</h2>
        {!suite && <p>Select a suite.</p>}
        {suite && Object.keys(profiles).filter(name => name.startsWith('td_')).length === 0 && <p>No public td_ profiles.</p>}
        {Object.entries(profiles).filter(([name]) => name.startsWith('td_')).map(([name, value]) => {
          const item = isObject(value) ? value : {};
          const preconditions = Array.isArray(item.preconditions) ? item.preconditions : [];
          return <button className={`card ${selectedProfile === name ? 'selected' : ''}`} key={name}
            disabled={busy} onClick={() => selectProfile(name)}>
            <strong>{name}</strong><span>{display(item.description)}</span>
            {preconditions.length > 0 && <span>Preconditions: {preconditions.map(condition =>
              isObject(condition) ? display(condition.refProfile) : display(condition)).join(' → ')}</span>}
            {isObject(item.data) && <span>Data: {JSON.stringify(item.data)}</span>}
          </button>;
        })}
      </section>
      <section className="inspector">
        <h2>Step Inspector</h2>
        {!profile && <p>Select a profile.</p>}
        {profile && <fieldset disabled={busy}>
          <h3>{selectedProfile}</h3>
          <p>Recursive preview: nested preconditions are expanded even though the runner executes them shallowly.</p>
          {expansionError && <p className="error" role="alert">Could not expand steps: {expansionError}</p>}
          {expanded && expanded.overrides.length > 0 && <div className="overrides">
            <h4>Data overrides</h4>
            {expanded.overrides.map(({ data, source, label }) => <div className="override-group" key={JSON.stringify([source.file, source.path])}>
              <strong>{label}</strong> <small>{source.file}{source.file !== localFile ? ' (read-only)' : ''}</small>
              {Object.entries(data).map(([key, value]) => source.file === localFile
                ? editor(key, value, [...source.path, key])
                : <div className="readonly-value" key={key}><span>{key}</span><code>{display(value)}</code></div>)}
            </div>)}
          </div>}
          {expanded && (expanded.steps.length === 0 ? <p>No steps.</p> : <div className="table-wrap">
            <table><thead><tr><th>#</th><th>Description</th><th>fieldKey</th><th>intent</th><th>subIntent</th><th>Values / data</th></tr></thead>
              <tbody>{expanded.steps.map(({ step: value, source }, index) => {
                const params = isObject(value.params) ? value.params : {};
                return <tr key={index}><td>{index + 1}</td>
                  <td>{display(value.step)}<small className="source">{source.file} · {source.path.slice(0, 2).join('.')}</small></td>
                  <td>{display(value.fieldKey)}</td><td>{display(value.intent)}</td><td>{display(params.subIntent)}</td>
                  <td>{params.value !== undefined && (source.file === localFile
                    ? editor(source.path[0] === 'sharedScenarios' ? 'params.value (shared)' : 'params.value', params.value, [...source.path, 'params', 'value'], String(index))
                    : <div className="readonly-value"><span>params.value (read-only)</span><code>{display(params.value)}</code></div>)}</td></tr>;
              })}</tbody>
            </table>
          </div>)}
        </fieldset>}
      </section>
    </div>
  </main>;
}
