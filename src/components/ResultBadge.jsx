const COLOR_VAR = {
  standard: '--signal-teal',
  modified: '--signal-red',
  inconclusive: '--signal-amber'
}

const LABELS = {
  standard: 'มาตรฐาน',
  modified: 'ดัดแปลง',
  inconclusive: 'ไม่ชัดเจน'
}

export default function ResultBadge({ result, size = 'sm' }) {
  const varName = COLOR_VAR[result] ?? COLOR_VAR.inconclusive
  const padding = size === 'lg' ? '0.25rem 0.75rem' : '0.125rem 0.5rem'
  const fontSize = size === 'lg' ? '0.8125rem' : '0.6875rem'

  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full font-medium"
      style={{
        padding,
        fontSize,
        color: `rgb(var(${varName}))`,
        background: `rgb(var(${varName}) / 0.12)`,
        border: `1px solid rgb(var(${varName}) / 0.35)`
      }}
    >
      <span
        className="h-1.5 w-1.5 rounded-full"
        style={{ background: `rgb(var(${varName}))` }}
      />
      {LABELS[result] ?? 'ไม่ทราบ'}
    </span>
  )
}
