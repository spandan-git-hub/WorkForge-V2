import { useMemo, useState } from 'react'
import { ArrowUpDown, BookOpen, Filter, Search, X } from 'lucide-react'
import SkillCard from './SkillCard'
import Button from '../ui/Button'

export default function SkillInventoryList({
  skills = [],
  onUpdateProficiency,
  onDeleteRequest,
  isUpdatingId = null,
  isDeletingId = null,
}) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [sortBy, setSortBy] = useState('proficiency-desc') // 'proficiency-desc' | 'proficiency-asc' | 'name-asc'

  // Extract unique categories from user's current inventory
  const categories = useMemo(() => {
    const cats = new Set()
    skills.forEach((s) => {
      if (s.category) cats.add(s.category)
    })
    return ['All', ...Array.from(cats).sort()]
  }, [skills])

  // Filtered & Sorted skills
  const filteredSkills = useMemo(() => {
    return skills
      .filter((skill) => {
        // Search filter
        if (searchQuery.trim().length > 0) {
          const q = searchQuery.trim().toLowerCase()
          const matchesName = skill.name.toLowerCase().includes(q)
          const matchesCategory = (skill.category || '').toLowerCase().includes(q)
          if (!matchesName && !matchesCategory) return false
        }
        // Category filter
        if (selectedCategory !== 'All' && skill.category !== selectedCategory) {
          return false
        }
        return true
      })
      .sort((a, b) => {
        if (sortBy === 'proficiency-desc') {
          if (b.proficiency !== a.proficiency) return b.proficiency - a.proficiency
          return a.name.localeCompare(b.name)
        }
        if (sortBy === 'proficiency-asc') {
          if (a.proficiency !== b.proficiency) return a.proficiency - b.proficiency
          return a.name.localeCompare(b.name)
        }
        if (sortBy === 'name-asc') {
          return a.name.localeCompare(b.name)
        }
        return 0
      })
  }, [skills, searchQuery, selectedCategory, sortBy])

  const clearFilters = () => {
    setSearchQuery('')
    setSelectedCategory('All')
  }

  const hasActiveFilters = searchQuery.trim().length > 0 || selectedCategory !== 'All'

  if (skills.length === 0) {
    return (
      <div className="glass rounded-2xl p-12 text-center border border-white/10 shadow-card">
        <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto mb-4 border border-primary/20">
          <BookOpen className="w-7 h-7" />
        </div>
        <h3 className="text-lg font-semibold text-text mb-1">Your Inventory is Empty</h3>
        <p className="text-sm text-text-muted max-w-md mx-auto mb-6">
          Start building your technical profile by adding your first skill above. Our AI uses this to calculate skill gaps and recommend high-impact career resources.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {/* Controls Bar: Search, Category Chips, Sort */}
      <div className="glass rounded-2xl p-4 border border-white/10 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Real-time search filter */}
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search your skills..."
              className="w-full pl-10 pr-9 py-2 bg-surface-card rounded-xl border border-white/10 text-text placeholder-text-muted/60 text-sm focus:outline-none focus:border-primary transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Sort Selector */}
          <div className="flex items-center gap-2">
            <ArrowUpDown className="w-4 h-4 text-text-muted shrink-0" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-surface-card border border-white/10 text-text text-sm rounded-xl px-3 py-2 focus:outline-none focus:border-primary transition-all cursor-pointer"
            >
              <option value="proficiency-desc">Highest Proficiency</option>
              <option value="proficiency-asc">Lowest Proficiency</option>
              <option value="name-asc">Alphabetical (A-Z)</option>
            </select>
          </div>
        </div>

        {/* Category Pills */}
        {categories.length > 2 && (
          <div className="flex items-center gap-2 overflow-x-auto pt-1 pb-1 scrollbar-none">
            <Filter className="w-3.5 h-3.5 text-text-muted shrink-0 ml-0.5" />
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-all whitespace-nowrap cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-primary text-white shadow-sm'
                    : 'bg-white/5 text-text-muted hover:text-text hover:bg-white/10'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Skills Grid */}
      {filteredSkills.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSkills.map((skill) => (
            <SkillCard
              key={skill.id}
              skill={skill}
              onUpdateProficiency={onUpdateProficiency}
              onDelete={onDeleteRequest}
              isUpdating={isUpdatingId === skill.id}
              isDeleting={isDeletingId === skill.id}
            />
          ))}
        </div>
      ) : (
        <div className="glass rounded-2xl p-10 text-center border border-white/10">
          <p className="text-text-muted text-sm mb-3">
            No skills match your current search and filters.
          </p>
          {hasActiveFilters && (
            <Button size="sm" variant="ghost" onClick={clearFilters}>
              Clear Filters
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
