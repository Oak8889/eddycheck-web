// =============================================================
// EddyCheck data layer
// -------------------------------------------------------------
// This file is the ONLY place that should know whether data is
// mocked or real. Every page imports functions from here, never
// generates random numbers itself. When the Hantek 6022BE +
// Python pipeline is ready, replace the bodies of these
// functions with real HTTP/WebSocket calls to your backend and
// nothing else in the app needs to change.
//
// Expected real API shape (for when you build the backend):
//   GET  /api/points                -> Point[]
//   GET  /api/history?filter=       -> Reading[]
//   POST /api/scan { pointId }      -> Reading
//   GET  /api/criteria              -> Criteria
//   PUT  /api/criteria              -> Criteria
//   WS   /ws/live                   -> stream of { t, vrms }
// =============================================================

const STORAGE_KEYS = {
  history: 'eddycheck.history',
  criteria: 'eddycheck.criteria'
}

// ---- Reference points on the car (Scope: pillars / reinforcement joints) ----
export const CAR_POINTS = [
  { id: 'A1', label: 'เสา A ซ้าย', x: 96, y: 150 },
  { id: 'A2', label: 'เสา A ขวา', x: 96, y: 250 },
  { id: 'B1', label: 'เสา B ซ้าย', x: 210, y: 140 },
  { id: 'B2', label: 'เสา B ขวา', x: 210, y: 260 },
  { id: 'C1', label: 'เสา C ซ้าย', x: 320, y: 150 },
  { id: 'C2', label: 'เสา C ขวา', x: 320, y: 250 }
]

const DEFAULT_CRITERIA = {
  frequencyKHz: 100,           // อ้างอิงความถี่ที่ใช้วัด
  thicknessMm: { min: 1.2, max: 3.0 }, // ช่วงความหนาวัสดุอ้างอิง
  baseMetalMinIacs: 28,
  standardWeldMinIacs: 18,
  standardWeldMaxIacs: 27.9,
  modifiedWeldMinIacs: 5,      // ช่วงที่ถือว่าเป็นรอยดัดแปลงชัดเจน (ต่ำกว่านี้)
  modifiedWeldMaxIacs: 17.9,
  phaseToleranceDeg: 12,
  liftOffToleranceMm: 0.3
}

function loadCriteria() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.criteria)
    return raw ? { ...DEFAULT_CRITERIA, ...JSON.parse(raw) } : DEFAULT_CRITERIA
  } catch {
    return DEFAULT_CRITERIA
  }
}

function saveCriteriaToStorage(criteria) {
  localStorage.setItem(STORAGE_KEYS.criteria, JSON.stringify(criteria))
}

function loadHistory() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.history)
    return raw ? JSON.parse(raw) : seedHistory()
  } catch {
    return seedHistory()
  }
}

function saveHistoryToStorage(rows) {
  localStorage.setItem(STORAGE_KEYS.history, JSON.stringify(rows))
}

function seedHistory() {
  const now = Date.now()
  const rows = [
    mkReading('A1', -3.7, 22.57, -4.3, now - 3000),
    mkReading('B1', -6.5, 14.67, 16.2, now - 1000, true),
    mkReading('A2', -1.2, 23.54, 4.4, now)
  ]
  saveHistoryToStorage(rows)
  return rows
}

function mkReading(pointId, deltaHint, iacsOverride, phaseOverride, ts, forceModified = false) {
  const point = CAR_POINTS.find(p => p.id === pointId)
  const criteria = loadCriteria()
  const iacs = iacsOverride ?? randomInRange(criteria.standardWeldMinIacs, criteria.standardWeldMaxIacs)
  const phase = phaseOverride ?? randomInRange(-criteria.phaseToleranceDeg, criteria.phaseToleranceDeg)
  const evalResult = evaluateReading(iacs, phase, criteria)
  return {
    id: `${pointId}-${ts}`,
    timestamp: ts ?? Date.now(),
    pointId,
    pointLabel: point?.label ?? pointId,
    iacs: round1(iacs),
    phaseDeg: round1(phase),
    frequencyKHz: criteria.frequencyKHz,
    result: forceModified ? 'modified' : evalResult.result,
    deltaFromThreshold: evalResult.delta
  }
}

function randomInRange(min, max) {
  return min + Math.random() * (max - min)
}
function round1(n) {
  return Math.round(n * 10) / 10
}

// ---- Core evaluation logic (mirrors what the Python backend will do) ----
export function evaluateReading(iacs, phaseDeg, criteria) {
  const c = criteria ?? loadCriteria()
  const inStandardRange = iacs >= c.standardWeldMinIacs && iacs <= c.standardWeldMaxIacs
  const inModifiedRange = iacs >= c.modifiedWeldMinIacs && iacs <= c.modifiedWeldMaxIacs
  const phaseOk = Math.abs(phaseDeg) <= c.phaseToleranceDeg

  if (inStandardRange && phaseOk) {
    const delta = iacs - c.standardWeldMinIacs
    return { result: 'standard', delta: round1(delta) }
  }
  if (inModifiedRange || !phaseOk) {
    const delta = iacs - c.standardWeldMinIacs
    return { result: 'modified', delta: round1(delta) }
  }
  // falls in the gap between modified-max and standard-min -> inconclusive
  const delta = iacs - c.standardWeldMinIacs
  return { result: 'inconclusive', delta: round1(delta) }
}

// ---- Public API ----

export function getPoints() {
  return CAR_POINTS
}

export function getCriteria() {
  return loadCriteria()
}

export function saveCriteria(partial) {
  const merged = { ...loadCriteria(), ...partial }
  saveCriteriaToStorage(merged)
  return merged
}

export function resetCriteria() {
  saveCriteriaToStorage(DEFAULT_CRITERIA)
  return DEFAULT_CRITERIA
}

export function getHistory({ filter = 'all' } = {}) {
  const rows = loadHistory().sort((a, b) => b.timestamp - a.timestamp)
  if (filter === 'modified') return rows.filter(r => r.result === 'modified')
  if (filter === 'standard') return rows.filter(r => r.result === 'standard')
  return rows
}

export function clearHistory() {
  saveHistoryToStorage([])
}

// Simulates one "Chack" (scan) button press for a given point.
// Returns the new reading and appends it to history.
export function runScan(pointId) {
  const reading = mkReading(pointId, null, null, null, Date.now())
  const rows = loadHistory()
  rows.push(reading)
  saveHistoryToStorage(rows)
  return reading
}

export function getSummary() {
  const rows = loadHistory()
  const standard = rows.filter(r => r.result === 'standard').length
  const modified = rows.filter(r => r.result === 'modified').length
  const inconclusive = rows.filter(r => r.result === 'inconclusive').length
  return { total: rows.length, standard, modified, inconclusive }
}

// ---- Live monitor stream simulation ----
// In production this becomes a WebSocket subscription to the
// Python process reading Hantek6022API samples. The callback
// signature (t, vrms) stays the same either way.
export function subscribeLiveVrms(onSample, { baseline = 1.6, noise = 0.05 } = {}) {
  let t = 0
  let anomalyTimer = 0
  const interval = setInterval(() => {
    t += 0.2
    anomalyTimer -= 1
    let vrms = baseline + (Math.random() - 0.5) * noise

    // occasionally simulate passing over a modified weld
    if (anomalyTimer <= 0 && Math.random() < 0.02) {
      anomalyTimer = 15
    }
    if (anomalyTimer > 0) {
      vrms += 0.35 * Math.sin((15 - anomalyTimer) / 15 * Math.PI)
    }

    onSample({ t: round1(t), vrms: Math.round(vrms * 1000) / 1000 })
  }, 200)

  return () => clearInterval(interval)
}

export function exportHistoryCsv(rows) {
  const header = ['เวลา', 'จุด', 'ตำแหน่ง', 'ความถี่ (kHz)', '%IACS', 'เฟส (deg)', 'ห่างจากเกณฑ์', 'ผลจำแนก']
  const lines = rows.map(r => [
    new Date(r.timestamp).toLocaleString('th-TH'),
    r.pointId,
    r.pointLabel,
    r.frequencyKHz,
    r.iacs,
    r.phaseDeg,
    r.deltaFromThreshold,
    resultLabel(r.result)
  ].join(','))
  return [header.join(','), ...lines].join('\n')
}

export function resultLabel(result) {
  if (result === 'standard') return 'มาตรฐาน'
  if (result === 'modified') return 'ดัดแปลง'
  return 'ไม่ชัดเจน'
}
