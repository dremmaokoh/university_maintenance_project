export default function EmptyState({ title, message, action }) {
  return (
    <div className="empty-state">
      {title && <p className="empty-state__title">{title}</p>}
      {message && <p className="empty-state__message">{message}</p>}
      {action}
    </div>
  );
}
