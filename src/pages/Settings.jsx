import { useState } from 'react'
import Panel from '../components/Panel'
import ResultBadge from '../components/ResultBadge'
import { getCriteria, saveCriteria, resetCriteria, evaluateReading } from '../services/mockData'

export default function Settings() {
  const [criteria, setCriteria] = useState(() => getCriteria())
  const [saved, setSaved] = useState(false)

  // playground values to preview classification live
  const [testIacs, setTestIacs] = useState(22)
  const [testPhase, setTestPhase] = useState(6)

  function update(patch) {
    setCriteria(prev => ({ ...prev, ...patch }))
    setSaved(false)
  }

  function handleSave() {
    const merged = saveCriteria(criteria)
    setCriteria(merged)
    setSaved(true)
  }

  function handleReset() {
    const defaults = resetCriteria()
    setCriteria(defaults)
    setSaved(false)
  }

  const preview = evaluateReading(testIacs, testPhase, criteria)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-heading">ตั้งค่าเกณฑ์การจำแนก</h1>
        <p className="text-sm text-muted mt-1 max-w-2xl">
          เกณฑ์เหล่านี้มาจากการเก็บค่าการนำไฟฟ้าจริงของชิ้นงานอ้างอิง (โลหะฐาน / รอยเชื่อมมาตรฐาน / รอยเชื่อมดัดแปลง)
          
        </p>
        <div className="mt-2 inline-flex items-center gap-1.5 rounded-full chip-amber px-3 py-1 text-xs">
          หน้านี้จำกัดสิทธิ์การเข้าถึงเฉพาะผู้ดูแลระบบ/วิศวกร
        </div>
      </div>

      <div className="grid lg:grid-cols-[1.3fr_1fr] gap-6">
        <Panel title="พารามิเตอร์">
          <div className="space-y-5">
            <SliderField
              label="ความถี่อ้างอิงที่ใช้วัด"
              value={criteria.frequencyKHz}
              min={1}
              max={600}
              step={1}
              unit="kHz"
              onChange={v => update({ frequencyKHz: v })}
            />
            <RangeField
              label="ความหนาวัสดุอ้างอิง"
              min={criteria.thicknessMm.min}
              max={criteria.thicknessMm.max}
              unit="มม."
              onChangeMin={v => update({ thicknessMm: { ...criteria.thicknessMm, min: v } })}
              onChangeMax={v => update({ thicknessMm: { ...criteria.thicknessMm, max: v } })}
              floor={0.5}
              ceil={6}
            />

            <div className="divider" />

            <SliderField
              label="โลหะฐาน ต่ำสุด"
              value={criteria.baseMetalMinIacs}
              min={0}
              max={60}
              step={0.1}
              unit="%IACS"
              onChange={v => update({ baseMetalMinIacs: v })}
            />
            <RangeField
              label="รอยเชื่อมมาตรฐาน"
              min={criteria.standardWeldMinIacs}
              max={criteria.standardWeldMaxIacs}
              unit="%IACS"
              onChangeMin={v => update({ standardWeldMinIacs: v })}
              onChangeMax={v => update({ standardWeldMaxIacs: v })}
              floor={0}
              ceil={60}
              tone="teal"
            />
            <RangeField
              label="รอยเชื่อมดัดแปลง"
              min={criteria.modifiedWeldMinIacs}
              max={criteria.modifiedWeldMaxIacs}
              unit="%IACS"
              onChangeMin={v => update({ modifiedWeldMinIacs: v })}
              onChangeMax={v => update({ modifiedWeldMaxIacs: v })}
              floor={0}
              ceil={60}
              tone="red"
            />

            <div className="divider" />

            <SliderField
              label="ค่าเบี่ยงเบนเฟสที่ยอมรับ"
              value={criteria.phaseToleranceDeg}
              min={0}
              max={45}
              step={0.5}
              unit="องศา"
              onChange={v => update({ phaseToleranceDeg: v })}
            />
            <SliderField
              label="ค่ายอมรับ Lift-off"
              value={criteria.liftOffToleranceMm}
              min={0}
              max={2}
              step={0.05}
              unit="มม."
              onChange={v => update({ liftOffToleranceMm: v })}
            />
          </div>

          <div className="mt-6 flex items-center gap-3">
            <button
              onClick={handleSave}
              className="focus-ring rounded-xl bg-signal-teal px-5 py-2.5 text-sm font-medium text-on-signal hover:brightness-110"
            >
              บันทึกเกณฑ์
            </button>
            <button
              onClick={handleReset}
              className="focus-ring rounded-xl btn-ghost px-5 py-2.5 text-sm text-muted hover-surface"
            >
              คืนค่าเริ่มต้น
            </button>
            {saved && <span className="text-xs text-signal-teal">บันทึกแล้ว</span>}
          </div>
        </Panel>

        <Panel title="ทดลองค่าที่วัดได้">
          <div className="space-y-5">
            <SliderField
              label="ค่าการนำไฟฟ้า"
              value={testIacs}
              min={0}
              max={60}
              step={0.1}
              unit="%IACS"
              onChange={setTestIacs}
            />
            <SliderField
              label="มุมเฟส"
              value={testPhase}
              min={-45}
              max={45}
              step={0.5}
              unit="°"
              onChange={setTestPhase}
            />
          </div>

          <div className="mt-6 surface-inset rounded-xl p-4">
            <p className="text-xs text-muted mb-2">ผลจำแนกตามเกณฑ์ปัจจุบัน</p>
            <div className="flex items-center justify-between">
              <ResultBadge result={preview.result} size="lg" />
              <span className="text-xs text-muted font-mono">
                ห่างจากเกณฑ์ {preview.delta > 0 ? '+' : ''}
                {preview.delta}%
              </span>
            </div>
          </div>
        </Panel>
      </div>
    </div>
  )
}

function SliderField({ label, value, min, max, step, unit, onChange }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <label className="text-sm text-body-c">{label}</label>
        <span className="text-sm font-mono text-signal-teal">
          {value} {unit}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={e => onChange(parseFloat(e.target.value))}
        className="w-full range-teal"
      />
    </div>
  )
}

function RangeField({ label, min, max, unit, onChangeMin, onChangeMax, floor, ceil, tone = 'default' }) {
  const toneClass = tone === 'teal' ? 'text-signal-teal' : tone === 'red' ? 'text-signal-red' : 'text-heading'
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <label className="text-sm text-body-c">{label}</label>
        <span className={`text-sm font-mono ${toneClass}`}>
          {min} – {max} {unit}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <input
          type="range"
          min={floor}
          max={ceil}
          step={0.1}
          value={min}
          onChange={e => onChangeMin(parseFloat(e.target.value))}
          className="w-full range-teal"
        />
        <input
          type="range"
          min={floor}
          max={ceil}
          step={0.1}
          value={max}
          onChange={e => onChangeMax(parseFloat(e.target.value))}
          className="w-full range-teal"
        />
      </div>
      <div className="flex justify-between text-[10px] text-faint mt-1">
        <span>ต่ำสุด</span>
        <span>สูงสุด</span>
      </div>
    </div>
  )
}
