import { useState } from 'react'
import { PROFICIENCY_LEVELS } from '../../utils/constants'
import { formatSkillLevel } from '../../utils/formatSkillLevel'

export default function SkillProficiencySlider({
  value = 3,
  onChange,
  disabled = false,
}) {
  const [hoveredLevel, setHoveredLevel] = useState(null)
  const activeLevel = hoveredLevel || value

  const getLevelColor = (lvl) => {
    switch (lvl) {
      case 1:
        return 'bg-blue-500/20 text-blue-300 border-blue-500/30'
      case 2:
        return 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30'
      case 3:
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
      case 4:
        return 'bg-violet-500/20 text-violet-300 border-violet-500/30'
      case 5:
        return 'bg-amber-500/20 text-amber-300 border-amber-500/30 shadow-[0_0_12px_rgba(245,158,11,0.25)]'
      default:
        return 'bg-primary/20 text-primary-300 border-primary/30'
    }
  }

  const getLevelDot = (lvl) => {
    if (lvl <= value) {
      if (value === 5) return 'bg-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.6)]'
      if (value === 4) return 'bg-violet-400 shadow-[0_0_8px_rgba(167,139,250,0.5)]'
      if (value === 3) return 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]'
      if (value === 2) return 'bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.5)]'
      return 'bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.5)]'
    }
    return 'bg-white/10'
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs">
        <span className="text-text-muted font-medium">Proficiency Level</span>
        <span
          className={`px-2 py-0.5 rounded-full border text-[11px] font-semibold transition-all duration-200 ${getLevelColor(
            activeLevel
          )}`}
        >
          {activeLevel}/5 — {formatSkillLevel(activeLevel)}
        </span>
      </div>

      {/* Segmented rating buttons */}
      <div
        className="grid grid-cols-5 gap-1.5 p-1 bg-surface-card/80 rounded-xl border border-white/5"
        role="radiogroup"
        aria-label="Skill proficiency level"
      >
        {PROFICIENCY_LEVELS.map((level) => {
          const isSelected = value === level.value
          const isFilled = activeLevel >= level.value

          return (
            <button
              key={level.value}
              type="button"
              role="radio"
              aria-checked={isSelected}
              disabled={disabled}
              onClick={() => onChange?.(level.value)}
              onMouseEnter={() => !disabled && setHoveredLevel(level.value)}
              onMouseLeave={() => !disabled && setHoveredLevel(null)}
              className={`group relative flex flex-col items-center justify-center py-2 px-1 rounded-lg transition-all duration-200 ${
                isSelected
                  ? 'bg-white/10 shadow-sm border border-white/20'
                  : 'hover:bg-white/5 border border-transparent'
              } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              <div
                className={`w-3.5 h-3.5 rounded-full transition-all duration-200 mb-1 ${getLevelDot(
                  level.value
                )}`}
              />
              <span
                className={`text-[11px] font-semibold transition-colors ${
                  isSelected
                    ? 'text-white'
                    : isFilled
                    ? 'text-text'
                    : 'text-text-muted group-hover:text-text'
                }`}
              >
                {level.value}
              </span>
              <span className="hidden sm:block text-[9px] text-text-muted truncate max-w-full group-hover:text-text transition-colors">
                {level.label}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
