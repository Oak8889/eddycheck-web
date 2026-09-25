import { useEffect, useMemo, useState } from 'react'
import Panel from '../components/Panel'
import ResultBadge from '../components/ResultBadge'
import { getPoints, getHistory, getSummary, runScan } from '../services/mockData'
import CarMap3D from '../components/CarMap3D'

export default function Dashboard() {
  const points = useMemo(() => getPoints(), [])
  const [history, setHistory] = useState(() => getHistory())
  const [summary, setSummary] = useState(() => getSummary())
  const [activePointId, setActivePointId] = useState(points[0]?.id ?? null)
  const [scanning, setScanning] = useState(false)

  useEffect(() => {
    refresh()
  }, [])

  function refresh() {
    setHistory(getHistory())
    setSummary(getSummary())
  }

  const latestByPoint = useMemo(() => {
    const map = {}
    for (const row of history) {
      if (!map[row.pointId]) map[row.pointId] = row
    }
    return map
  }, [history])

  const overallResult =
    summary.modified > 0 ? 'modified' : summary.total > 0 ? 'standard' : null

  function handleScan() {
    if (!activePointId) return
    setScanning(true)
    setTimeout(() => {
      runScan(activePointId)
      refresh()
      setScanning(false)
    }, 500)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-semibold text-heading">ภาพรวมการตรวจสอบ</h1>
          <p className="text-sm text-muted mt-1">
            คลิกจุดตรวจบนแผนผังรถ แล้วกด "สแกนจุดนี้" เพื่อจำลองการอ่านค่า
          </p>
        </div>
        {overallResult && (
          <div className="flex items-center gap-2 rounded-full panel-glass px-4 py-2">
            <span className="text-xs text-muted">ผลรวมล่าสุด</span>
            <ResultBadge result={overallResult} size="lg" />
          </div>
        )}
      </div>

      <div className="grid lg:grid-cols-[1.3fr_1fr] gap-6">
        <Panel title="แผนผังตำแหน่งตรวจสอบ">
          <CarMap3D
            points={points}
            latestByPoint={latestByPoint}
            activePointId={activePointId}
            onSelectPoint={setActivePointId}
          />
          <button
            onClick={handleScan}
            disabled={scanning}
            className="focus-ring mt-4 w-full rounded-xl bg-signal-teal py-2.5 text-sm font-medium text-on-signal transition hover:brightness-110 disabled:opacity-50"
          >
            {scanning ? 'กำลังสแกน…' : `สแกนจุดนี้ (${activePointId ?? '-'})`}
          </button>
        </Panel>

        <div className="space-y-6">
          <Panel title="สรุปผล">
            <div className="grid grid-cols-3 gap-3 text-center">
              <SummaryStat label="ทั้งหมด" value={summary.total} />
              <SummaryStat label="มาตรฐาน" value={summary.standard} tone="teal" />
              <SummaryStat label="ดัดแปลง" value={summary.modified} tone="red" />
            </div>
          </Panel>

          <Panel title="ข้อมูลล่าสุดรายจุด">
            <ul className="space-y-2">
              {points.map(pt => {
                const reading = latestByPoint[pt.id]
                return (
                  <li
                    key={pt.id}
                    className="flex items-center justify-between rounded-lg px-2 py-1.5 hover-surface cursor-pointer"
                    onClick={() => setActivePointId(pt.id)}
                  >
                    <span className="text-sm text-body-c">
                      {pt.id} <span className="text-muted">· {pt.label}</span>
                    </span>
                    {reading ? (
                      <ResultBadge result={reading.result} />
                    ) : (
                      <span className="text-xs text-faint">ยังไม่ได้สแกน</span>
                    )}
                  </li>
                )
              })}
            </ul>
          </Panel>
        </div>
      </div>
    </div>
  )
}

function SummaryStat({ label, value, tone }) {
  const toneClass =
    tone === 'teal' ? 'text-signal-teal' : tone === 'red' ? 'text-signal-red' : 'text-heading'
  return (
    <div className="surface-inset rounded-xl py-3">
      <p className={`text-2xl font-semibold ${toneClass}`}>{value}</p>
      <p className="text-xs text-muted mt-0.5">{label}</p>
    </div>
  )
}
