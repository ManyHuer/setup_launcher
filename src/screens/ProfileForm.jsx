import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import AppModal from '../components/AppModal';

function ProfileForm() {
  const { id } = useParams();
  const isEditing = Boolean(id);
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [icon, setIcon] = useState('📁');
  const [description, setDescription] = useState('');
  const [applications, setApplications] = useState([]);
  const [appModal, setAppModal] = useState(null);

  useEffect(() => {
    if (isEditing) {
      window.electronAPI.getProfileById(Number(id)).then((profile) => {
        if (profile) {
          setName(profile.name);
          setIcon(profile.icon);
          setDescription(profile.description);
        }
      });
      window.electronAPI.getApplicationsByProfile(Number(id)).then(setApplications);
    }
  }, [id]);

  async function handleSave(e) {
    e.preventDefault();
    if (!name.trim()) return;

    if (isEditing) {
      await window.electronAPI.updateProfile(Number(id), { name, icon, description });
    } else {
      const newId = await window.electronAPI.createProfile({ name, icon, description });
      for (const app of applications) {
        await window.electronAPI.createApplication({ profile_id: newId, name: app.name, path: app.path, type: app.type || 'app' });
      }
    }
    navigate('/');
  }

  async function handleAddApp(data) {
    if (isEditing) {
      await window.electronAPI.createApplication({ profile_id: Number(id), ...data });
      const apps = await window.electronAPI.getApplicationsByProfile(Number(id));
      setApplications(apps);
    } else {
      setApplications([...applications, { ...data, id: Date.now(), profile_id: 0 }]);
    }
    setAppModal(null);
  }

  async function handleUpdateTabGroup(appId, tabGroup) {
    if (isEditing) {
      const app = applications.find(a => a.id === appId);
      if (!app) return;
      await window.electronAPI.updateApplication(appId, { name: app.name, path: app.path, type: app.type, tab_group: tabGroup || null });
      const apps = await window.electronAPI.getApplicationsByProfile(Number(id));
      setApplications(apps);
    } else {
      setApplications(applications.map(a => a.id === appId ? { ...a, tab_group: tabGroup } : a));
    }
  }

  async function handleDeleteApp(appId) {
    if (isEditing) {
      await window.electronAPI.deleteApplication(appId);
      const apps = await window.electronAPI.getApplicationsByProfile(Number(id));
      setApplications(apps);
    } else {
      setApplications(applications.filter(a => a.id !== appId));
    }
  }

  const iconOptions = ['🎮', '💼', '🎬', '📚', '🎨', '🔧', '🌐', '📁', '⚙️', '🎵', '📷', '💻'];

  const apps = applications.filter((a) => a.type === 'app' || !a.type);
  const folders = applications.filter((a) => a.type === 'folder');

  return (
    <div className="form-screen">
      <div className="form-container">
        <button className="btn-back" onClick={() => navigate('/')}>← Volver</button>
        <h1>{isEditing ? 'Editar Perfil' : 'Nuevo Perfil'}</h1>

        <form onSubmit={handleSave}>
          <div className="form-group">
            <label>Nombre del perfil</label>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="Ej: Gamer" required />
          </div>

          <div className="form-group">
            <label>Icono</label>
            <div className="icon-picker">
              {iconOptions.map((ico) => (
                <button key={ico} type="button" className={`icon-option ${icon === ico ? 'selected' : ''}`} onClick={() => setIcon(ico)}>
                  {ico}
                </button>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label>Descripción</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Describe este perfil..." rows={3} />
          </div>

          <div className="form-section">
            <div className="form-section-header">
              <h2>Elementos del Setup</h2>
              <button type="button" className="btn-small" onClick={() => setAppModal({})}>+ Agregar</button>
            </div>
            {applications.length === 0 && <p className="empty-text">No hay elementos agregados aún.</p>}

            {apps.length > 0 && (
              <>
                <h3 className="item-subtitle">⚙️ Aplicaciones</h3>
                <ul className="app-list">
                  {apps.map((app) => (
                    <li key={app.id} className="app-list-item">
                      <div className="app-list-info">
                        <strong>{app.name}</strong>
                        {app.path && <span className="app-path">{app.path}</span>}
                      </div>
                      <button type="button" className="btn-icon-small" onClick={() => handleDeleteApp(app.id)} title="Eliminar">✕</button>
                    </li>
                  ))}
                </ul>
              </>
            )}

            {folders.length > 0 && (
              <>
                <h3 className="item-subtitle" style={{ marginTop: '1rem' }}>📁 Carpetas</h3>
                <ul className="app-list">
                  {folders.map((f) => (
                    <li key={f.id} className="app-list-item">
                      <div className="app-list-info">
                        <strong>{f.name}</strong>
                        {f.path && <span className="app-path">{f.path}</span>}
                        {f.tab_group && <span className="tab-group-badge">{f.tab_group}</span>}
                      </div>
                      <div className="app-list-actions">
                        <input
                          type="text"
                          value={f.tab_group || ''}
                          onChange={(e) => handleUpdateTabGroup(f.id, e.target.value)}
                          placeholder="Grupo"
                          className="tab-group-input"
                        />
                        <button type="button" className="btn-icon-small" onClick={() => handleDeleteApp(f.id)} title="Eliminar">✕</button>
                      </div>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>

          <div className="form-actions">
            <button type="button" className="btn-secondary" onClick={() => navigate('/')}>Cancelar</button>
            <button type="submit" className="btn-primary">{isEditing ? 'Guardar Cambios' : 'Crear Perfil'}</button>
          </div>
        </form>
      </div>

      {appModal && (
        <AppModal
          initial={appModal}
          onSave={handleAddApp}
          onClose={() => setAppModal(null)}
        />
      )}
    </div>
  );
}

export default ProfileForm;
