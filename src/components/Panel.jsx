export default function Panel({ title, action, children, className = '' }) {
  return (
    <section className={`panel-glass rounded-2xl ${className}`}>
      {(title || action) && (
        <div className="flex items-center justify-between px-5 pt-4 pb-2">
          {title && <h2 className="text-sm font-medium text-muted">{title}</h2>}
          {action}
        </div>
      )}
      <div className="px-5 pb-5">{children}</div>
    </section>
  )
}
