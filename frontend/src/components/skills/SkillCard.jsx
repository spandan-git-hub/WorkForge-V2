import { useState } from 'react'
import { Check, Edit2, Star, Trash2, X } from 'lucide-react'
import { formatSkillLevel } from '../../utils/formatSkillLevel'
import SkillProficiencySlider from './SkillProficiencySlider'
import Button from '../ui/Button'

export default function SkillCard({
  skill,
  onUpdateProficiency,
  onDelete,
  isUpdating = false,
  isDeleting = false,
}) {
  const [isEditing, setIsEditing] = useState(false)
  const [editedProficiency, setEditedProficiency] = useState(skill.proficiency)

  const handleSave = async () => {
    if (editedProficiency === skill.proficiency) {
      setIsEditing(false)
      return
    }
    await onUpdateProficiency?.(skill.id, editedProficiency)
    setIsEditing(false)
  }

  const handleCancel = () => {
    setEditedProficiency(skill.proficiency)
    setIsEditing(false)
  }

  const getCategoryColor = (cat) => {
    const c = (cat || '').toLowerCase()
    if (c.includes('programming') || c.includes('language'))
      return 'bg-blue-500/10 text-blue-400 border-blue-500/20'
    if (c.includes('frontend'))
      return 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20'
    if (c.includes('backend'))
      return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
    if (c.includes('database'))
      return 'bg-amber-500/10 text-amber-400 border-amber-500/20'
    if (c.includes('devops') || c.includes('cloud'))
      return 'bg-purple-500/10 text-purple-400 border-purple-500/20'
    if (c.includes('data') || c.includes('ml'))
      return 'bg-pink-500/10 text-pink-400 border-pink-500/20'
    return 'bg-white/5 text-text-muted border-white/10'
  }

  return (
    <div className="group relative rounded-2xl p-5 glass border border-white/10 hover:border-white/20 transition-all duration-300 hover:shadow-[0_8px_30px_rgb(0,0,0,0.25)] flex flex-col justify-between">
      {/* Top row: Skill Name + Category + Action buttons */}
      <div>
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="min-w-0 flex-1">
            <h4 className="text-base font-semibold text-text truncate group-hover:text-primary transition-colors">
              {skill.name}
            </h4>
            <span
              className={`inline-block mt-1 px-2.5 py-0.5 rounded-full border text-[11px] font-medium tracking-wide ${getCategoryColor(
                skill.category
              )}`}
            >
              {skill.category || 'Other'}
            </span>
          </div>

          {!isEditing && (
            <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
              <button
                type="button"
                onClick={() => {
                  setEditedProficiency(skill.proficiency)
                  setIsEditing(true)
                }}
                disabled={isUpdating || isDeleting}
                title="Edit proficiency"
                className="p-1.5 rounded-lg text-text-muted hover:text-text hover:bg-white/10 transition-colors"
                aria-label={`Edit ${skill.name} proficiency`}
              >
                <Edit2 className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => onDelete?.(skill)}
                disabled={isUpdating || isDeleting}
                title="Delete skill"
                className="p-1.5 rounded-lg text-text-muted hover:text-red-400 hover:bg-red-500/10 transition-colors"
                aria-label={`Delete ${skill.name}`}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Normal View vs Edit Mode */}
        {isEditing ? (
          <div className="mt-4 pt-3 border-t border-white/10 animate-fade-in space-y-3">
            <SkillProficiencySlider
              value={editedProficiency}
              onChange={setEditedProficiency}
              disabled={isUpdating}
            />
            <div className="flex items-center justify-end gap-2 pt-1">
              <Button
                size="sm"
                variant="ghost"
                onClick={handleCancel}
                disabled={isUpdating}
                className="text-xs"
              >
                <X className="w-3.5 h-3.5 mr-1" />
                Cancel
              </Button>
              <Button
                size="sm"
                variant="primary"
                onClick={handleSave}
                isLoading={isUpdating}
                className="text-xs"
              >
                <Check className="w-3.5 h-3.5 mr-1" />
                Save
              </Button>
            </div>
          </div>
        ) : (
          <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between">
            {/* Stars indicator */}
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((starIndex) => {
                const filled = starIndex <= skill.proficiency
                return (
                  <Star
                    key={starIndex}
                    className={`w-4 h-4 transition-colors ${
                      filled
                        ? 'fill-amber-400 text-amber-400 drop-shadow-[0_0_6px_rgba(245,158,11,0.5)]'
                        : 'fill-transparent text-white/20'
                    }`}
                  />
                )
              })}
            </div>

            <span className="text-xs font-medium text-text-muted">
              {formatSkillLevel(skill.proficiency)}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
