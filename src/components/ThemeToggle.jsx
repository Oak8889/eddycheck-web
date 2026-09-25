import { useTheme } from '../theme.jsx'

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()
  const isDark = theme === 'dark'

  return (
    <button
      onClick={toggleTheme}
      aria-label={isDark ? 'สลับเป็นโหมดสว่าง' : 'สลับเป็นโหมดมืด'}
      className="focus-ring btn-ghost relative inline-flex h-8 w-14 items-center rounded-full transition-colors"
    >
      <span
        className="absolute left-0.5 flex h-6 w-6 items-center justify-center rounded-full transition-transform duration-200"
        style={{
          transform: isDark ? 'translateX(24px)' : 'translateX(0)',
          background: isDark ? 'rgb(45 212 191)' : 'rgb(180 83 9)'
        }}
      >
        {isDark ? <MoonIcon /> : <SunIcon />}
      </span>
    </button>
  )
}

function SunIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round">
      <circle cx="12" cy="12" r="4.2" />
      <path d="M12 2.5v2.2M12 19.3v2.2M4.2 4.2l1.6 1.6M18.2 18.2l1.6 1.6M2.5 12h2.2M19.3 12h2.2M4.2 19.8l1.6-1.6M18.2 5.8l1.6-1.6" />
    </svg>
  )
}

function MoonIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="rgb(4 8 10)" stroke="none">
      <path d="M20.8 14.6a8.6 8.6 0 1 1-9.4-11.8 7.2 7.2 0 0 0 9.4 11.8Z" />
    </svg>
  )
}
