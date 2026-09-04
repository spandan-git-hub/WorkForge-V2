import { useEffect, useRef, useState } from 'react'
import { Plus, Search, Sparkles, X } from 'lucide-react'
import { useDebounce } from '../../hooks/useDebounce'
import SkillProficiencySlider from './SkillProficiencySlider'
import Button from '../ui/Button'

export default function AddSkillForm({
  catalog = [],
  userSkills = [],
  onAddSkill,
  isLoading = false,
}) {
  const [skillName, setSkillName] = useState('')
  const [proficiency, setProficiency] = useState(3)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const dropdownRef = useRef(null)

  const debouncedQuery = useDebounce(skillName, 250)

  // Map user skill names for quick duplicate detection (case-insensitive)
  const userSkillNames = new Set(
    (userSkills || []).map((s) => s.name.trim().toLowerCase())
  )

  // Filter catalog items based on debounced search
  const filteredCatalog = (catalog || []).filter((item) => {
    if (!debouncedQuery || debouncedQuery.trim().length === 0) return false
    const q = debouncedQuery.trim().toLowerCase()
    return (
      item.name.toLowerCase().includes(q) ||
      item.category.toLowerCase().includes(q)
    )
  }).slice(0, 8) // Limit to top 8 suggestions

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleOutsideClick)
    return () => document.removeEventListener('mousedown', handleOutsideClick)
  }, [])

  const handleSelectCatalogItem = (item) => {
    if (userSkillNames.has(item.name.toLowerCase())) return
    setSkillName(item.name)
    setIsDropdownOpen(false)
  }

  const isDuplicate = userSkillNames.has(skillName.trim().toLowerCase())
  const canSubmit = skillName.trim().length > 0 && !isDuplicate && !isLoading

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!canSubmit) return

    const success = await onAddSkill?.({
      name: skillName.trim(),
      proficiency,
    })

    if (success !== false) {
      setSkillName('')
      setProficiency(3)
      setIsDropdownOpen(false)
    }
  }

  return (
    <div className="glass rounded-2xl p-6 border border-white/10 shadow-card">
      <div className="flex items-center gap-2 mb-4">
        <div className="p-2 rounded-xl bg-primary/10 text-primary border border-primary/20">
          <Sparkles className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-text">Add New Skill</h3>
          <p className="text-xs text-text-muted">
            Search our curated 90+ skill catalog or type any custom tech skill.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* Autocomplete Input */}
          <div className="lg:col-span-6 relative" ref={dropdownRef}>
            <label
              htmlFor="skill-search-input"
              className="block text-xs font-medium text-text-muted mb-2"
            >
              Skill Name
            </label>
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
              <input
                id="skill-search-input"
                type="text"
                value={skillName}
                onChange={(e) => {
                  setSkillName(e.target.value)
                  setIsDropdownOpen(true)
                }}
                onFocus={() => setIsDropdownOpen(true)}
                placeholder="e.g. React, Python, PostgreSQL, Docker..."
                autoComplete="off"
                disabled={isLoading}
                className="w-full pl-10 pr-9 py-2.5 bg-surface-card rounded-xl border border-white/10 text-text placeholder-text-muted/60 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
              />
              {skillName && (
                <button
                  type="button"
                  onClick={() => {
                    setSkillName('')
                    setIsDropdownOpen(false)
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Validation warning */}
            {isDuplicate && (
              <p className="text-xs text-amber-400 mt-1.5 flex items-center gap-1">
                You already have &quot;{skillName.trim()}&quot; in your inventory.
              </p>
            )}

            {/* Autocomplete Dropdown */}
            {isDropdownOpen && skillName.trim().length > 0 && (
              <div className="absolute z-20 top-full left-0 right-0 mt-1.5 bg-surface-card rounded-xl border border-white/10 shadow-2xl overflow-hidden max-h-64 overflow-y-auto divide-y divide-white/5 animate-fade-in">
                {filteredCatalog.length > 0 ? (
                  filteredCatalog.map((item) => {
                    const alreadyAdded = userSkillNames.has(
                      item.name.toLowerCase()
                    )
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => handleSelectCatalogItem(item)}
                        disabled={alreadyAdded}
                        className={`w-full text-left px-4 py-2.5 flex items-center justify-between text-sm transition-colors ${
                          alreadyAdded
                            ? 'opacity-40 cursor-not-allowed bg-white/5'
                            : 'hover:bg-white/10 cursor-pointer'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="font-medium text-text truncate">
                            {item.name}
                          </span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-text-muted truncate">
                            {item.category}
                          </span>
                        </div>
                        {alreadyAdded && (
                          <span className="text-[11px] text-amber-400">
                            Added
                          </span>
                        )}
                      </button>
                    )
                  })
                ) : (
                  <div className="px-4 py-3 text-xs text-text-muted flex items-center justify-between">
                    <span>
                      Not found in catalog. Press <strong>Add Skill</strong> to
                      create as custom skill.
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Proficiency selector */}
          <div className="lg:col-span-6">
            <SkillProficiencySlider
              value={proficiency}
              onChange={setProficiency}
              disabled={isLoading}
            />
          </div>
        </div>

        {/* Submit row */}
        <div className="flex items-center justify-end pt-2 border-t border-white/5">
          <Button
            type="submit"
            variant="primary"
            disabled={!canSubmit}
            isLoading={isLoading}
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Add to Inventory
          </Button>
        </div>
      </form>
    </div>
  )
}
