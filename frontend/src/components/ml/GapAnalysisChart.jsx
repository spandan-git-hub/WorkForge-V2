import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import Badge from '../ui/Badge'
import { formatSkillLevel } from '../../utils/formatSkillLevel'

function CustomTooltip({ active, payload, label }) {
  if (active && payload && payload.length) {
    const data = payload[0].payload
    const severityVariant =
      data.severity === 'High'
        ? 'danger'
        : data.severity === 'Medium'
        ? 'warning'
        : 'success'

    return (
      <div className="bg-surface-card/95 backdrop-blur-md border border-border p-3.5 rounded-xl shadow-xl min-w-[200px]">
        <div className="flex items-center justify-between gap-3 mb-2">
          <span className="font-semibold text-text text-sm">{label}</span>
          <Badge variant={severityVariant} size="sm">
            {data.severity}
          </Badge>
        </div>
        <div className="space-y-1.5 text-xs">
          <div className="flex items-center justify-between text-text-muted">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-primary inline-block" />
              Current Level:
            </span>
            <span className="font-medium text-text">
              {data.current > 0 ? `${data.current} (${formatSkillLevel(data.current)})` : '0 (None)'}
            </span>
          </div>
          <div className="flex items-center justify-between text-text-muted">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-indigo-300 inline-block" />
              Required Level:
            </span>
            <span className="font-medium text-text">
              {data.required} ({formatSkillLevel(data.required)})
            </span>
          </div>
          <div className="flex items-center justify-between pt-1.5 border-t border-border/60 text-text-muted">
            <span>Gap Magnitude:</span>
            <span className="font-semibold text-amber-400">+{data.gap_magnitude}</span>
          </div>
        </div>
      </div>
    )
  }
  return null
}

export default function GapAnalysisChart({ gaps = [] }) {
  if (!gaps || gaps.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center bg-surface-card/50 rounded-xl border border-border/60">
        <div className="w-12 h-12 rounded-full bg-success/15 border border-success/30 flex items-center justify-center text-success mb-3 text-xl font-bold">
          ✓
        </div>
        <h4 className="text-base font-semibold text-text mb-1">No Skill Gaps Found!</h4>
        <p className="text-sm text-text-muted max-w-md">
          You currently meet or exceed all required proficiencies for this target role.
        </p>
      </div>
    )
  }

  // Reverse gaps copy for vertical bar chart so highest severity is at the top
  const chartData = [...gaps].reverse()
  const chartHeight = Math.max(340, chartData.length * 48)

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-4">
        <div className="text-xs text-text-muted">
          Proficiency Scale: 1 (Beginner) to 5 (Expert)
        </div>
      </div>
      <div style={{ height: `${chartHeight}px` }} className="w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            layout="vertical"
            data={chartData}
            margin={{ top: 10, right: 30, left: 20, bottom: 20 }}
            barGap={4}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} horizontal={false} />
            <XAxis
              type="number"
              domain={[0, 5]}
              ticks={[0, 1, 2, 3, 4, 5]}
              stroke="#94a3b8"
              fontSize={12}
              tickLine={{ stroke: '#475569' }}
            />
            <YAxis
              type="category"
              dataKey="skill"
              stroke="#94a3b8"
              fontSize={12}
              width={140}
              tickLine={false}
              tick={{ fill: '#e2e8f0' }}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255, 255, 255, 0.04)' }} />
            <Legend
              verticalAlign="top"
              align="right"
              wrapperStyle={{ paddingBottom: '16px', fontSize: '12px' }}
              formatter={(value) => <span className="text-text-muted text-xs font-medium ml-1">{value}</span>}
            />
            <Bar
              name="Current Level"
              dataKey="current"
              fill="#6366f1"
              radius={[0, 4, 4, 0]}
              barSize={12}
            />
            <Bar
              name="Required Level"
              dataKey="required"
              fill="#a5b4fc"
              radius={[0, 4, 4, 0]}
              barSize={12}
              opacity={0.85}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}


