import { useState, useEffect, useRef, useMemo } from 'react';
import Fuse from 'fuse.js';

function AppModal({ initial, onSave, onClose }) {
  const [mode, setMode] = useState('app');
  const [name, setName] = useState(initial.name || '');
  const [path, setPath] = useState(initial.path || '');
  const [tabGroup, setTabGroup] = useState(initial.tab_group || '');
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [apps, setApps] = useState([]);
  const [page, setPage] = useState(1);
  const [scanReady, setScanReady] = useState(false);
  const inputRef = useRef(null);
  const PAGE_SIZE = 30;

  useEffect(() => {
    window.electronAPI.scanStartMenu().then((list) => {
      setApps(list);
      setScanReady(true);
    });
  }, []);

  useEffect(() => {
    if (scanReady && !initial.name) {
      inputRef.current?.focus();
    }
  }, [scanReady]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  const filtered = useMemo(() => {
    if (debouncedQuery.length < 2) return [];
    const fuse = new Fuse(apps, {
      keys: ['name', 'executable_path'],
      threshold: 0.3,
      minMatchCharLength: 2,
    });
    return fuse.search(debouncedQuery).map((r) => r.item);
  }, [apps, debouncedQuery]);

  const visibleItems = useMemo(() => {
    return filtered.slice(0, page * PAGE_SIZE);
  }, [filtered, page]);

  const hasMore = visibleItems.length < filtered.length;

  function handleQueryChange(e) {
    setQuery(e.target.value);
    setPage(1);
  }

  function selectApp(app) {
    setName(app.name);
    setPath(app.executable_path);
    setQuery('');
    setDebouncedQuery('');
  }

  async function handleBrowseExe() {
    try {
      const p = await window.electronAPI.pickExecutable();
      if (p) {
        const nameGuess = p.split('\\').pop().replace(/\.exe$/i, '');
        setName(nameGuess);
        setPath(p);
      }
    } catch (err) {
      console.error('Error picking executable:', err);
    }
  }

  async function handleBrowseFolder() {
    try {
      const p = await window.electronAPI.pickFolder();
      if (p) {
        const nameGuess = p.split('\\').pop();
        setName(nameGuess);
        setPath(p);
        localStorage.setItem('lastFolderPath', p);
      }
    } catch (err) {
      console.error('Error picking folder:', err);
    }
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim()) return;
    onSave({ name: name.trim(), path: path.trim(), type: mode, tab_group: tabGroup.trim() || null });
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-app" onClick={(e) => e.stopPropagation()}>
        <h2>Agregar Elemento</h2>

        <div className="type-toggle">
          <button
            type="button"
            className={`type-toggle-btn ${mode === 'app' ? 'active' : ''}`}
            onClick={() => setMode('app')}
          >
            ⚙️ Aplicación
          </button>
          <button
            type="button"
            className={`type-toggle-btn ${mode === 'folder' ? 'active' : ''}`}
            onClick={() => setMode('folder')}
          >
            📁 Carpeta
          </button>
        </div>

        {mode === 'app' && (
          <>
            <div className="form-group">
              <label>Buscar aplicación instalada</label>
              <div className="input-with-button">
                <input
                  ref={inputRef}
                  value={query}
                  onChange={handleQueryChange}
                  placeholder="Escribí al menos 2 letras..."
                />
                <button
                  type="button"
                  className="btn-browse"
                  onClick={async () => {
                    setScanReady(false);
                    const list = await window.electronAPI.refreshScan();
                    setApps(list);
                    setScanReady(true);
                  }}
                  title="Refrescar lista de aplicaciones"
                >
                  ↻
                </button>
              </div>
            </div>

            {!scanReady ? (
              <div className="modal-loading">
                <div className="spinner" />
                <p>Cargando lista de aplicaciones...</p>
              </div>
            ) : query.length >= 2 ? (
              <div className="app-search-list">
                {filtered.length === 0 ? (
                  <p className="empty-text">No se encontraron aplicaciones</p>
                ) : (
                  <>
                    {visibleItems.map((app, i) => (
                      <button
                        key={i}
                        type="button"
                        className={`app-search-item ${path === app.executable_path ? 'selected' : ''}`}
                        onClick={() => selectApp(app)}
                      >
                        <strong>{app.name}</strong>
                        <span className="app-path">{app.executable_path}</span>
                      </button>
                    ))}
                    {hasMore && (
                      <button
                        type="button"
                        className="btn-load-more"
                        onClick={() => setPage((p) => p + 1)}
                      >
                        Cargar más ({filtered.length - visibleItems.length} restantes)
                      </button>
                    )}
                  </>
                )}
              </div>
            ) : (
              <p className="empty-text" style={{ marginBottom: '1rem' }}>
                Escribí al menos 2 caracteres para buscar aplicaciones.
              </p>
            )}

            <div className="form-divider">
              <span>o especifica manualmente</span>
            </div>
          </>
        )}

        {mode === 'folder' && (
          <>
            <p className="mode-hint">Selecciona una carpeta para que se abra en el Explorador de Windows al iniciar el setup.</p>
            <div className="form-group">
              <label>Grupo de pestañas (Windows 11)</label>
              <input
                value={tabGroup}
                onChange={(e) => setTabGroup(e.target.value)}
                placeholder="Ej: Adobe, Videos, ... (dejá vacío para ventana individual)"
              />
            </div>
          </>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Nombre</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={mode === 'app' ? 'Ej: Discord' : 'Ej: Mis documentos'}
              required
            />
          </div>
          <div className="form-group">
            <label>{mode === 'app' ? 'Ruta del ejecutable (.exe)' : 'Ruta de la carpeta'}</label>
            <div className="input-with-button">
              <input
                value={path}
                onChange={(e) => setPath(e.target.value)}
                placeholder={mode === 'app' ? 'Ej: C:\\Program Files\\...' : 'Ej: C:\\Users\\...'}
              />
              <button
                type="button"
                className="btn-browse"
                onClick={mode === 'app' ? handleBrowseExe : handleBrowseFolder}
              >
                Examinar
              </button>
            </div>
          </div>
          <div className="form-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="btn-primary">Agregar</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AppModal;
