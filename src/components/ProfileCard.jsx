function ProfileCard({ profile, onEdit, onDelete, onLaunch }) {
  const items = profile.applications || [];

  return (
    <div className="profile-card">
      <div className="profile-card-header">
        <span className="profile-icon">{profile.icon}</span>
        <h2 className="profile-name">{profile.name}</h2>
      </div>
      <p className="profile-description">{profile.description}</p>
      {items.length > 0 && (
        <div className="profile-apps">
          <ul>
            {items.map((item) => (
              <li key={item.id}>
                {item.type === 'folder' ? '📁' : <span className="app-dot" />}
                {item.name}
              </li>
            ))}
          </ul>
        </div>
      )}
      <div className="profile-card-actions">
        <button className="btn-start" onClick={onLaunch}>Iniciar Setup</button>
        <div className="profile-card-buttons">
          <button className="btn-icon" onClick={onEdit} title="Editar perfil">✏️</button>
          <button className="btn-icon" onClick={onDelete} title="Eliminar perfil">🗑️</button>
        </div>
      </div>
    </div>
  );
}

export default ProfileCard;
