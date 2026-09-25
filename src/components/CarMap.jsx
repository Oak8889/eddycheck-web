import ResultBadge from './ResultBadge'
import { useTheme } from '../theme.jsx'

// Simplified side-profile sedan silhouette. Pillar points (from
// mockData CAR_POINTS) are plotted at approximate x positions
// along this body; y=upper row (roofline) / lower row (sill).
const CAR_PATH =
  'M20,220 L20,190 C20,175 30,168 45,165 L95,150 C110,120 140,95 175,90 L260,90 C295,95 320,115 335,150 L385,165 C398,168 405,178 405,192 L405,220 Z'

const CAR_PALETTE = {
  light: {
    body: '#e7ebef',
    stroke: '#94a3b8',
    wheel: '#cbd5e1',
    window: '#c3ccd6',
    labelText: '#64748b',
    markerRing: '#ffffff',
    teal: '#0d9488',
    red: '#dc2626',
    amber: '#b45309'
  },
  dark: {
    body: '#12171b',
    stroke: '#2a333b',
    wheel: '#0c1013',
    window: '#07090b',
    labelText: '#475569',
    markerRing: '#0c1013',
    teal: '#2dd4bf',
    red: '#f0554a',
    amber: '#f0b429'
  }
}

export default function CarMap({ points, latestByPoint, activePointId, onSelectPoint }) {
  const { theme } = useTheme()
  const c = CAR_PALETTE[theme]

  return (
    <div className="relative w-full">
      <svg viewBox="0 0 420 300" className="w-full h-auto">
        <path d={CAR_PATH} fill={c.body} stroke={c.stroke} strokeWidth="1.5" />
        {/* wheels */}
        <circle cx="100" cy="222" r="24" fill={c.wheel} stroke={c.stroke} strokeWidth="1.5" />
        <circle cx="330" cy="222" r="24" fill={c.wheel} stroke={c.stroke} strokeWidth="1.5" />
        {/* window line */}
        <path
          d="M100,150 C112,124 138,102 175,97 L258,97 C288,102 310,120 322,148 Z"
          fill={c.window}
          stroke={c.stroke}
          strokeWidth="1"
        />

        {points.map(pt => {
          const reading = latestByPoint[pt.id]
          const isActive = activePointId === pt.id
          const color =
            reading?.result === 'modified' ? c.red : reading?.result === 'inconclusive' ? c.amber : c.teal
          return (
            <g
              key={pt.id}
              transform={`translate(${pt.x}, ${pt.y})`}
              className="cursor-pointer"
              onClick={() => onSelectPoint?.(pt.id)}
            >
              {isActive && <circle r="14" fill={color} opacity="0.18" />}
              <circle r="7" fill={c.markerRing} stroke={color} strokeWidth="2.5" />
              {reading?.result === 'modified' && <circle r="2.2" fill={color} />}
              <text
                y="-14"
                textAnchor="middle"
                fill={c.labelText}
                style={{ fontFamily: 'inherit', fontSize: '9px' }}
              >
                {pt.id}
              </text>
            </g>
          )
        })}
      </svg>

      {activePointId && (
        <PointCallout
          point={points.find(p => p.id === activePointId)}
          reading={latestByPoint[activePointId]}
        />
      )}
    </div>
  )
}

function PointCallout({ point, reading }) {
  if (!point) return null
  return (
    <div className="mt-3 flex items-center justify-between rounded-xl panel-glass px-4 py-3">
      <div>
        <p className="text-sm font-medium text-heading">{point.label}</p>
        <p className="text-xs text-muted">
          {reading ? `${reading.iacs} %IACS · เฟส ${reading.phaseDeg}°` : 'ยังไม่มีข้อมูลการสแกน'}
        </p>
      </div>
      {reading && <ResultBadge result={reading.result} />}
    </div>
  )
}
