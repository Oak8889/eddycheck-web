import { useEffect, useRef, useState } from 'react'
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ReferenceLine,
  Tooltip
} from 'recharts'
import Panel from '../components/Panel'
import { subscribeLiveVrms, getCriteria } from '../services/mockData'
import { useTheme } from '../theme.jsx'

const WINDOW_SIZE = 60 // number of points kept on screen

// Chart colors mirror the CSS variables in index.css for each theme.
// Recharts needs literal color strings (not every prop resolves CSS
// vars reliably across versions), so we keep this tiny palette in
// sync with :root / .dark by hand.
const PALETTE = {
  light: {
    grid: '#e2e8f0',
    axis: '#94a3b8',
    tooltipBg: '#ffffff',
    tooltipBorder: '#e2e8f0',
    tooltipText: '#334155',
    teal: '#0d9488',
    red: '#dc2626'
  },
  dark: {
    grid: '#1b2228',
    axis: '#3d4952',
    tooltipBg: '#0c1013',
    tooltipBorder: '#2a333b',
    tooltipText: '#cbd5e1',
    teal: '#2dd4bf',
    red: '#f0554a'
  }
}

export default function Monitor() {
  const { theme } = useTheme()
  const c = PALETTE[theme]
  const [running, setRunning] = useState(false)
  const [samples, setSamples] = useState([])
  const [current, setCurrent] = useState(null)
  const unsubscribeRef = useRef(null)
  const criteria = getCriteria()

  useEffect(() => {
    return () => unsubscribeRef.current?.()
  }, [])

  function start() {
    setRunning(true)
    unsubscribeRef.current = subscribeLiveVrms(sample => {
      setCurrent(sample)
      setSamples(prev => {
        const next = [...prev, sample]
        return next.length > WINDOW_SIZE ? next.slice(next.length - WINDOW_SIZE) : next
      })
    })
  }

  function stop() {
    unsubscribeRef.current?.()
    unsubscribeRef.current = null
    setRunning(false)
  }

  function clear() {
    setSamples([])
    setCurrent(null)
  }

  const thresholdHigh = 1.6 + 0.35
  const thresholdLow = 1.6 - 0.1

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-heading">มอนิเตอร์สด</h1>
        <p className="text-sm text-muted mt-1">
          จำลองข้อมูลจาก Hantek 6022BE แบบ Time-domain (Vrms ตามเวลา) — ยังไม่เชื่อมฮาร์ดแวร์จริง
        </p>
      </div>

      <div className="grid lg:grid-cols-[1fr_260px] gap-6">
        <Panel title="กราฟ Vrms แบบเรียลไทม์">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={samples} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}>
                <CartesianGrid stroke={c.grid} strokeDasharray="3 3" />
                <XAxis
                  dataKey="t"
                  stroke={c.axis}
                  tick={{ fontSize: 11, fill: c.axis }}
                  tickFormatter={v => `${v}s`}
                />
                <YAxis
                  stroke={c.axis}
                  tick={{ fontSize: 11, fill: c.axis }}
                  domain={[1.0, 2.2]}
                  width={40}
                />
                <Tooltip
                  contentStyle={{
                    background: c.tooltipBg,
                    border: `1px solid ${c.tooltipBorder}`,
                    borderRadius: 8,
                    fontSize: 12,
                    color: c.tooltipText
                  }}
                  labelFormatter={v => `t = ${v}s`}
                  formatter={v => [`${v} V`, 'Vrms']}
                />
                <ReferenceLine
                  y={thresholdHigh}
                  stroke={c.red}
                  strokeDasharray="4 4"
                  label={{ value: 'ขอบบน', fill: c.red, fontSize: 10, position: 'insideTopRight' }}
                />
                <ReferenceLine
                  y={thresholdLow}
                  stroke={c.teal}
                  strokeDasharray="4 4"
                  label={{ value: 'ขอบล่าง', fill: c.teal, fontSize: 10, position: 'insideBottomRight' }}
                />
                <Line
                  type="monotone"
                  dataKey="vrms"
                  stroke={c.teal}
                  strokeWidth={2}
                  dot={false}
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-4 flex gap-2">
            {!running ? (
              <button
                onClick={start}
                className="focus-ring flex-1 rounded-xl bg-signal-teal py-2.5 text-sm font-medium text-on-signal hover:brightness-110"
              >
                เริ่มสแกน
              </button>
            ) : (
              <button
                onClick={stop}
                className="focus-ring flex-1 rounded-xl bg-signal-red py-2.5 text-sm font-medium text-white hover:brightness-110"
              >
                หยุดสแกน
              </button>
            )}
            <button
              onClick={clear}
              className="focus-ring rounded-xl btn-ghost px-4 py-2.5 text-sm text-muted hover-surface"
            >
              ล้างกราฟ
            </button>
          </div>
        </Panel>

        <div className="space-y-6">
          <Panel title="ค่าปัจจุบัน">
            <p className="text-4xl font-semibold text-heading font-mono">
              {current ? current.vrms.toFixed(3) : '—'}
            </p>
            <p className="text-xs text-muted mt-1">Volt RMS</p>
            <div className="mt-4 divider" />
            <dl className="mt-4 space-y-2 text-sm">
              <Row label="ความถี่" value={`${criteria.frequencyKHz} kHz`} />
              <Row label="ขอบบน (Threshold)" value={`${thresholdHigh.toFixed(2)} V`} />
              <Row label="ขอบล่าง (Threshold)" value={`${thresholdLow.toFixed(2)} V`} />
              <Row label="สถานะ" value={running ? 'กำลังสแกน' : 'หยุดอยู่'} />
            </dl>
          </Panel>

          <Panel title="หมายเหตุ">
            <p className="text-xs text-muted leading-relaxed">
              เส้นประสีแดง/เขียวคือขอบเขตที่คาดว่าจะปรับจากหน้าตั้งค่าเกณฑ์ในอนาคต
              ตอนนี้ตรึงไว้ชั่วคราวเพื่อสาธิต UI เท่านั้น
            </p>
          </Panel>
        </div>
      </div>
    </div>
  )
}

function Row({ label, value }) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-muted">{label}</dt>
      <dd className="text-heading font-mono">{value}</dd>
    </div>
  )
}
