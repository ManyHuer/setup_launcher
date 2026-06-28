import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ProfileCard from '../components/ProfileCard';

function HomeScreen() {
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  async function loadProfiles() {
    try {
      const data = await window.electronAPI.getProfiles();
      const profilesWithApps = await Promise.all(
        data.map(async (profile) => {
          const apps = await window.electronAPI.getApplicationsByProfile(profile.id);
          return { ...profile, applications: apps };
        })
      );
      setProfiles(profilesWithApps);
    } catch (err) {
      console.error('Error loading profiles:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadProfiles(); }, []);

  async function handleDelete(profile) {
    if (!confirm(`¿Eliminar el perfil "${profile.name}"?`)) return;
    await window.electronAPI.deleteProfile(profile.id);
    loadProfiles();
  }

  async function handleLaunch(profile) {
    const results = await window.electronAPI.launchSetup(profile.id);
    const ok = results.filter(r => r.success).length;
    const fail = results.filter(r => !r.success).length;
    const apps = results.filter(r => r.type === 'app');
    const folders = results.filter(r => r.type === 'folder');
    const appsOk = apps.filter(r => r.success).length;
    const foldersOk = folders.filter(r => r.success).length;
    if (fail === 0) {
      alert(`✅ ${appsOk} aplicación(es) iniciada(s), ${foldersOk} carpeta(s) abierta(s).`);
    } else {
      alert(`✅ ${appsOk} app(s), ${foldersOk} carpeta(s) — ❌ ${fail} fallaron. Revisa las rutas.`);
    }
  }

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner" />
        <p>Cargando perfiles...</p>
      </div>
    );
  }

  return (
    <div className="home-screen">
      <header className="header">
        <h1>Setup Launcher</h1>
        <p>Selecciona un perfil para iniciar tu setup</p>
        <button className="btn-add-profile" onClick={() => navigate('/profile/new')}>
          + Nuevo Perfil
        </button>
      </header>
      <div className="profiles-grid">
        {profiles.map((profile) => (
          <ProfileCard
            key={profile.id}
            profile={profile}
            onEdit={() => navigate(`/profile/${profile.id}/edit`)}
            onDelete={() => handleDelete(profile)}
            onLaunch={() => handleLaunch(profile)}
          />
        ))}
      </div>
    </div>
  );
}

export default HomeScreen;
