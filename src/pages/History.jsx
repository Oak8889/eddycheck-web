import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Panel from '../components/Panel'
import ResultBadge from '../components/ResultBadge'
import { getHistory, clearHistory, exportHistoryCsv } from '../services/mockData'

const FILTERS = [
  { id: 'all', label: 'ทั้งหมด' },
  { id: 'modified', label: 'เฉพาะรอยเชื่อมดัดแปลง' }
]

export default function History() {
  const [filter, setFilter] = useState('all')
  const [rows, setRows] = useState(() => getHistory())
  const [sortDesc, setSortDesc] = useState(true)
  const navigate = useNavigate()

  const filtered = useMemo(() => {
    const base = getHistory({ filter })
    return [...base].sort((a, b) => (sortDesc ? b.iacs - a.iacs : a.iacs - b.iacs))
  }, [filter, sortDesc, rows])

  function handleClear() {
    if (!confirm('ล้างประวัติการตรวจทั้งหมด?')) return
    clearHistory()
    setRows(getHistory())
  }

  function handleExport() {
    const csv = exportHistoryCsv(filtered)
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `eddycheck-history-${Date.now()}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-semibold text-heading">ประวัติการตรวจ</h1>
          <p className="text-sm text-muted mt-1">บันทึก {filtered.length} รายการ</p>
        </div>
        <div className="flex items-center gap-2">
          {FILTERS.map(f => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`focus-ring rounded-full px-3 py-1.5 text-xs font-medium transition ${
                filter === f.id
                  ? 'chip-active'
                  : 'text-muted btn-ghost hover:text-body-c'
              }`}
            >
              {f.label}
            </button>
          ))}
          <button
            onClick={handleExport}
            className="focus-ring rounded-full btn-ghost px-3 py-1.5 text-xs font-medium text-body-c hover-surface"
          >
            ส่งออก CSV
          </button>
          <button
            onClick={handleClear}
            className="focus-ring rounded-full btn-ghost px-3 py-1.5 text-xs font-medium chip-red-outline"
          >
            ล้างบันทึก
          </button>
        </div>
      </div>

      <Panel>
        <div className="overflow-x-auto -mx-5">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-muted border-b border-subtle">
                <Th>เวลา</Th>
                <Th>จุด</Th>
                <Th>ตำแหน่ง</Th>
                <Th>ความถี่</Th>
                <Th sortable onClick={() => setSortDesc(s => !s)}>
                  %IACS {sortDesc ? '↓' : '↑'}
                </Th>
                <Th>เฟส</Th>
                <Th>ห่างจากเกณฑ์</Th>
                <Th>ผลจำแนก</Th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(row => (
                <tr
                  key={row.id}
                  onClick={() => navigate(`/?point=${row.pointId}`)}
                  className="border-b border-subtle last:border-0 hover-surface cursor-pointer transition"
                >
                  <Td className="text-muted font-mono text-xs">
                    {new Date(row.timestamp).toLocaleString('th-TH')}
                  </Td>
                  <Td className="font-mono font-medium text-heading">{row.pointId}</Td>
                  <Td className="text-muted">{row.pointLabel}</Td>
                  <Td className="text-muted font-mono text-xs">{row.frequencyKHz} kHz</Td>
                  <Td className="font-mono text-heading">{row.iacs}</Td>
                  <Td className="font-mono text-muted">{row.phaseDeg}°</Td>
                  <Td className={`font-mono text-xs ${deltaColor(row)}`}>
                    {row.deltaFromThreshold > 0 ? '+' : ''}
                    {row.deltaFromThreshold}%
                  </Td>
                  <Td>
                    <ResultBadge result={row.result} />
                  </Td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-sm text-faint">
                    ยังไม่มีรายการในหมวดนี้
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  )
}

function deltaColor(row) {
  if (row.result === 'modified') return 'text-signal-red'
  if (row.result === 'inconclusive') return 'text-signal-amber'
  return 'text-muted'
}

function Th({ children, sortable, onClick }) {
  return (
    <th
      className={`px-3 py-2 font-medium whitespace-nowrap ${sortable ? 'cursor-pointer select-none hover:text-body-c' : ''}`}
      onClick={onClick}
    >
      {children}
    </th>
  )
}

function Td({ children, className = '' }) {
  return <td className={`px-3 py-2.5 whitespace-nowrap ${className}`}>{children}</td>
}
