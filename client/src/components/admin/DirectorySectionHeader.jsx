export default function DirectorySectionHeader({ title, description, actions }) {
  return (
    <div className="directory-section-header">
      <div className="directory-section-header__text">
        <h2 className="admin-section__title">{title}</h2>
        {description && <p className="admin-section__lead">{description}</p>}
      </div>
      {actions && <div className="directory-section-header__actions">{actions}</div>}
    </div>
  );
}
