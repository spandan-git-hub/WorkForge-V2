import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { AlertCircle, Award, BarChart3, BookOpen, Layers } from 'lucide-react'

import { addSkill, deleteSkill, getSkillCatalog, getUserSkills, updateSkill } from '../../api/skillsApi'
import { queryKeys } from '../../store/queryKeys'
import { useToast } from '../../hooks/useToast'
import PageWrapper from '../../components/layout/PageWrapper'
import Card from '../../components/ui/Card'
import Modal from '../../components/ui/Modal'
import Button from '../../components/ui/Button'
import Skeleton from '../../components/ui/Skeleton'
import AddSkillForm from '../../components/skills/AddSkillForm'
import SkillInventoryList from '../../components/skills/SkillInventoryList'

export default function SkillsPage() {
  const queryClient = useQueryClient()
  const { showToast } = useToast()

  const [skillToDelete, setSkillToDelete] = useState(null)
  const [updatingSkillId, setUpdatingSkillId] = useState(null)

  // Fetch user skills
  const {
    data: skills = [],
    isLoading: isSkillsLoading,
    isError: isSkillsError,
    refetch: refetchSkills,
  } = useQuery({
    queryKey: queryKeys.skills.all,
    queryFn: getUserSkills,
  })

  // Fetch skill catalog
  const { data: catalog = [] } = useQuery({
    queryKey: queryKeys.skills.catalog,
    queryFn: getSkillCatalog,
  })

  // Add Skill Mutation
  const addMutation = useMutation({
    mutationFn: addSkill,
    onSuccess: (newSkill) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.skills.all })
      showToast({
        type: 'success',
        title: 'Skill added',
        message: `${newSkill.name} has been added to your inventory.`,
      })
    },
    onError: (error) => {
      const msg =
        error.response?.data?.detail || 'Failed to add skill. Please try again.'
      showToast({
        type: 'error',
        title: 'Could not add skill',
        message: msg,
      })
    },
  })

  // Update Skill Mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, proficiency }) => updateSkill(id, { proficiency }),
    onMutate: ({ id }) => {
      setUpdatingSkillId(id)
    },
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.skills.all })
      showToast({
        type: 'success',
        title: 'Proficiency updated',
        message: `Updated ${updated.name} to level ${updated.proficiency}.`,
      })
    },
    onError: (error) => {
      const msg =
        error.response?.data?.detail || 'Failed to update skill proficiency.'
      showToast({
        type: 'error',
        title: 'Update failed',
        message: msg,
      })
    },
    onSettled: () => {
      setUpdatingSkillId(null)
    },
  })

  // Delete Skill Mutation
  const deleteMutation = useMutation({
    mutationFn: (id) => deleteSkill(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.skills.all })
      showToast({
        type: 'success',
        title: 'Skill removed',
        message: 'The skill was removed from your inventory.',
      })
      setSkillToDelete(null)
    },
    onError: (error) => {
      const msg =
        error.response?.data?.detail || 'Failed to remove skill from inventory.'
      showToast({
        type: 'error',
        title: 'Removal failed',
        message: msg,
      })
    },
  })

  const handleAddSkill = async (data) => {
    try {
      await addMutation.mutateAsync(data)
      return true
    } catch {
      return false
    }
  }

  const handleUpdateProficiency = async (skillId, proficiency) => {
    await updateMutation.mutateAsync({ id: skillId, proficiency })
  }

  const handleDeleteConfirm = async () => {
    if (!skillToDelete) return
    await deleteMutation.mutateAsync(skillToDelete.id)
  }

  // Summary Metrics calculations
  const totalSkills = skills.length
  const expertSkillsCount = skills.filter((s) => s.proficiency >= 4).length
  const avgProficiency =
    totalSkills > 0
      ? (skills.reduce((acc, s) => acc + s.proficiency, 0) / totalSkills).toFixed(1)
      : '0.0'

  return (
    <PageWrapper
      title="Skill Inventory"
      subtitle="Track, rate, and expand your technical skill stack to unlock tailored AI career insights."
    >
      <div className="space-y-8">
        {/* Quick Stats Banner */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="glass flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <Layers className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-medium text-text-muted">Total Skills</p>
              <h4 className="text-2xl font-bold text-text mt-0.5">
                {isSkillsLoading ? <Skeleton className="w-10 h-7" /> : totalSkills}
              </h4>
            </div>
          </Card>

          <Card className="glass flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-medium text-text-muted">Advanced / Expert (4-5)</p>
              <h4 className="text-2xl font-bold text-text mt-0.5">
                {isSkillsLoading ? <Skeleton className="w-10 h-7" /> : expertSkillsCount}
              </h4>
            </div>
          </Card>

          <Card className="glass flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <BarChart3 className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-medium text-text-muted">Average Proficiency</p>
              <h4 className="text-2xl font-bold text-text mt-0.5">
                {isSkillsLoading ? <Skeleton className="w-10 h-7" /> : `${avgProficiency} / 5.0`}
              </h4>
            </div>
          </Card>
        </div>

        {/* Add Skill Form Section */}
        <AddSkillForm
          catalog={catalog}
          userSkills={skills}
          onAddSkill={handleAddSkill}
          isLoading={addMutation.isPending}
        />

        {/* User Skills Inventory Section */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-text flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-primary" />
              Your Skill Stack
              <span className="text-xs font-normal text-text-muted px-2 py-0.5 rounded-full bg-white/5 border border-white/10">
                {totalSkills}
              </span>
            </h3>
          </div>

          {isSkillsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map((idx) => (
                <Card key={idx} className="p-5 glass space-y-4">
                  <div className="flex justify-between items-start">
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-5 w-3/4 rounded" />
                      <Skeleton className="h-4 w-1/3 rounded-full" />
                    </div>
                    <Skeleton className="h-6 w-12 rounded" />
                  </div>
                  <div className="pt-3 border-t border-white/5 flex justify-between">
                    <Skeleton className="h-4 w-28 rounded" />
                    <Skeleton className="h-4 w-16 rounded" />
                  </div>
                </Card>
              ))}
            </div>
          ) : isSkillsError ? (
            <div className="glass rounded-2xl p-8 text-center border border-red-500/20">
              <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-2" />
              <h4 className="text-base font-semibold text-text mb-1">
                Unable to load skills
              </h4>
              <p className="text-xs text-text-muted mb-4">
                An error occurred while communicating with the backend.
              </p>
              <Button size="sm" variant="secondary" onClick={() => refetchSkills()}>
                Try Again
              </Button>
            </div>
          ) : (
            <SkillInventoryList
              skills={skills}
              onUpdateProficiency={handleUpdateProficiency}
              onDeleteRequest={(skill) => setSkillToDelete(skill)}
              isUpdatingId={updatingSkillId}
              isDeletingId={deleteMutation.isPending ? skillToDelete?.id : null}
            />
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={Boolean(skillToDelete)}
        onClose={() => !deleteMutation.isPending && setSkillToDelete(null)}
        title="Remove Skill"
      >
        <div className="space-y-4">
          <p className="text-sm text-text-muted">
            Are you sure you want to remove{' '}
            <strong className="text-text font-semibold">
              {skillToDelete?.name}
            </strong>{' '}
            from your inventory? This action cannot be undone and will update your AI gap analysis recommendations.
          </p>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-border/60">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSkillToDelete(null)}
              disabled={deleteMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={handleDeleteConfirm}
              isLoading={deleteMutation.isPending}
            >
              Confirm Remove
            </Button>
          </div>
        </div>
      </Modal>
    </PageWrapper>
  )
}
