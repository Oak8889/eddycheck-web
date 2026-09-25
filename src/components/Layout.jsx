import { NavLink, Outlet } from 'react-router-dom'
import ThemeToggle from './ThemeToggle'

const NAV_ITEMS = [
  { to: '/', label: 'หน้าหลัก', end: true },
  { to: '/monitor', label: 'มอนิเตอร์สด' },
  { to: '/history', label: 'ประวัติการตรวจ' },
  { to: '/settings', label: 'ตั้งค่าเกณฑ์' }
]

export default function Layout() {
  return (
    <div className="min-h-full flex flex-col">
      <header className="sticky top-0 z-20 surface-header">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-1.5 font-semibold text-lg tracking-tight">
            <span className="text-heading">Eddy</span>
            <span style={{ color: 'rgb(var(--signal-teal))' }}>Check</span>
          </div>
          <nav className="flex items-center gap-1">
            {NAV_ITEMS.map(item => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `focus-ring nav-link ${isActive ? 'nav-link-active' : ''}`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
          <ThemeToggle />
        </div>
      </header>
      <main className="flex-1 mx-auto w-full max-w-6xl px-4 sm:px-6 py-6">
        <Outlet />
      </main>
      <footer className="divider">
        <p className="mx-auto max-w-6xl px-4 sm:px-6 py-4 text-xs text-faint">
          EddyCheck — ข้อมูลจำลองสำหรับการพัฒนา (Mock data) ยังไม่เชื่อมต่อฮาร์ดแวร์จริง
        </p>
      </footer>
    </div>
  )
}
