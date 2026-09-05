import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  User,
  Mail,
  Briefcase,
  Image as ImageIcon,
  Save,
  RotateCcw,
  Sparkles,
  Calendar,
  Clock,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react'

import PageWrapper from '../../components/layout/PageWrapper'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Badge from '../../components/ui/Badge'
import Skeleton from '../../components/ui/Skeleton'
import { useAuth } from '../../hooks/useAuth'
import { useToast } from '../../hooks/useToast'
import useDocumentTitle from '../../hooks/useDocumentTitle'
import profileApi from '../../api/profileApi'
import { queryKeys } from '../../store/queryKeys'
import { formatDate } from '../../utils/formatDate'

const POPULAR_ROLES = [
  'Frontend Developer',
  'Backend Developer',
  'Full Stack Developer',
  'Data Scientist',
  'ML Engineer',
  'DevOps Engineer',
  'Cloud Architect',
  'Mobile Developer',
  'QA Engineer',
  'Data Analyst',
  'Data Engineer',
  'Cybersecurity Engineer',
  'Site Reliability Engineer',
  'Product Manager (tech)',
]

const profileSchema = z.object({
  name: z
    .string()
    .min(1, 'Full name is required')
    .max(255, 'Name cannot exceed 255 characters'),
  target_role: z.string().max(255, 'Role name cannot exceed 255 characters').optional(),
  avatar_url: z
    .string()
    .url('Must be a valid URL (e.g. https://...)')
    .max(512, 'URL cannot exceed 512 characters')
    .or(z.literal(''))
    .optional(),
  bio: z.string().max(1000, 'Bio cannot exceed 1000 characters').optional(),
})

export default function ProfilePage() {
  useDocumentTitle('Profile')

  const { updateUser } = useAuth()
  const toast = useToast()
  const queryClient = useQueryClient()
  const [avatarLoadError, setAvatarLoadError] = useState(false)

  const {
    data: profile,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: queryKeys.profile.detail,
    queryFn: profileApi.getProfile,
  })

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isDirty },
  } = useForm({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: '',
      target_role: '',
      avatar_url: '',
      bio: '',
    },
  })

  // Watch fields for live preview and character counting
  const watchedAvatarUrl = watch('avatar_url')
  const watchedBio = watch('bio') || ''
  const watchedName = watch('name') || ''
  const watchedRole = watch('target_role') || ''

  // Sync loaded profile into form state
  useEffect(() => {
    if (profile) {
      reset({
        name: profile.name || '',
        target_role: profile.target_role || '',
        avatar_url: profile.avatar_url || '',
        bio: profile.bio || '',
      })
      setAvatarLoadError(false)
    }
  }, [profile, reset])

  // Reset image error on URL change
  useEffect(() => {
    setAvatarLoadError(false)
  }, [watchedAvatarUrl])

  const updateMutation = useMutation({
    mutationFn: profileApi.updateProfile,
    onSuccess: (updatedData) => {
      queryClient.setQueryData(queryKeys.profile.detail, updatedData)
      queryClient.invalidateQueries({ queryKey: queryKeys.profile.detail })
      updateUser(updatedData)
      reset({
        name: updatedData.name,
        target_role: updatedData.target_role || '',
        avatar_url: updatedData.avatar_url || '',
        bio: updatedData.bio || '',
      })
      toast.success('Profile updated successfully!')
    },
    onError: (err) => {
      const errorMsg =
        err?.response?.data?.detail || 'Failed to update profile. Please try again.'
      toast.error(errorMsg)
    },
  })

  const onSubmit = (formData) => {
    const payload = {
      name: formData.name.trim(),
      target_role: formData.target_role ? formData.target_role.trim() : null,
      avatar_url: formData.avatar_url ? formData.avatar_url.trim() : null,
      bio: formData.bio ? formData.bio.trim() : null,
    }
    updateMutation.mutate(payload)
  }

  const handleRoleSelect = (roleName) => {
    setValue('target_role', roleName, { shouldValidate: true, shouldDirty: true })
  }

  // Calculate profile completeness percentage
  const computeCompleteness = () => {
    if (!profile) return 0
    let score = 20 // Account created + email verified
    if (watchedName?.trim()) score += 20
    if (watchedRole?.trim()) score += 25
    if (watchedBio?.trim()) score += 20
    if (watchedAvatarUrl?.trim() && !avatarLoadError) score += 15
    return Math.min(score, 100)
  }

  const completeness = computeCompleteness()

  // Initials for avatar fallback
  const displayName = watchedName || profile?.name || 'Developer'
  const initials = displayName
    .split(' ')
    .filter(Boolean)
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'WF'

  return (
    <PageWrapper
      title="Profile Settings"
      subtitle="Manage your public developer profile, target career role, and personal summary."
    >
      {isLoading ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-1 p-6 space-y-4">
            <div className="flex flex-col items-center">
              <Skeleton className="w-28 h-28 rounded-2xl mb-4" />
              <Skeleton className="w-36 h-6 rounded-md mb-2" />
              <Skeleton className="w-24 h-4 rounded-md mb-4" />
              <Skeleton className="w-full h-10 rounded-lg" />
            </div>
            <div className="pt-4 border-t border-border/60 space-y-3">
              <Skeleton className="w-full h-5 rounded" />
              <Skeleton className="w-3/4 h-5 rounded" />
            </div>
          </Card>
          <Card className="lg:col-span-2 p-6 space-y-5">
            <Skeleton className="w-48 h-6 rounded-md mb-6" />
            <Skeleton className="w-full h-12 rounded-lg" />
            <Skeleton className="w-full h-12 rounded-lg" />
            <Skeleton className="w-full h-12 rounded-lg" />
            <Skeleton className="w-full h-24 rounded-lg" />
            <Skeleton className="w-32 h-10 rounded-lg" />
          </Card>
        </div>
      ) : isError ? (
        <Card className="p-8 text-center max-w-lg mx-auto">
          <div className="w-12 h-12 rounded-full bg-danger/10 border border-danger/20 text-danger flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-semibold text-text mb-2">Failed to load profile</h3>
          <p className="text-sm text-text-muted mb-6">
            {error?.message || 'Unable to communicate with the server.'}
          </p>
          <Button onClick={() => refetch()} variant="primary">
            Try Again
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* Left Column: Profile Card & Summary */}
          <div className="space-y-6">
            <Card className="p-6">
              <div className="flex flex-col items-center text-center">
                {/* Avatar with Live Preview */}
                <div className="relative group mb-4">
                  <div className="w-28 h-28 rounded-2xl overflow-hidden border-2 border-primary/30 shadow-lg shadow-indigo-500/10 bg-surface flex items-center justify-center">
                    {watchedAvatarUrl && !avatarLoadError ? (
                      <img
                        src={watchedAvatarUrl}
                        alt={displayName}
                        onError={() => setAvatarLoadError(true)}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-tr from-primary via-indigo-600 to-violet-500 flex items-center justify-center text-white text-3xl font-bold tracking-tight">
                        {initials}
                      </div>
                    )}
                  </div>
                  {watchedRole && (
                    <div className="absolute -bottom-2 -right-2 p-1.5 rounded-lg bg-surface-card border border-border shadow-sm text-primary">
                      <Sparkles className="w-4 h-4" />
                    </div>
                  )}
                </div>

                <h3 className="text-lg font-bold text-text tracking-tight">
                  {displayName}
                </h3>
                <p className="text-xs text-text-muted mb-2">{profile.email}</p>

                {watchedRole ? (
                  <Badge variant="primary" size="md" className="mb-4">
                    {watchedRole}
                  </Badge>
                ) : (
                  <Badge variant="neutral" size="sm" className="mb-4">
                    Role Not Set
                  </Badge>
                )}

                {/* Profile Completeness Bar */}
                <div className="w-full pt-4 border-t border-border/60">
                  <div className="flex justify-between items-center text-xs mb-1.5">
                    <span className="font-medium text-text-muted">Profile Strength</span>
                    <span
                      className={`font-semibold ${
                        completeness === 100
                          ? 'text-emerald-400'
                          : completeness >= 70
                          ? 'text-indigo-400'
                          : 'text-amber-400'
                      }`}
                    >
                      {completeness}%
                    </span>
                  </div>
                  <div className="w-full h-2 bg-surface rounded-full overflow-hidden border border-border/50">
                    <div
                      className={`h-full transition-all duration-500 rounded-full ${
                        completeness === 100
                          ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                          : completeness >= 70
                          ? 'bg-gradient-to-r from-primary to-indigo-400'
                          : 'bg-gradient-to-r from-amber-500 to-amber-300'
                      }`}
                      style={{ width: `${completeness}%` }}
                    />
                  </div>
                  {completeness < 100 && (
                    <p className="text-[11px] text-text-muted mt-2 text-left flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-primary flex-shrink-0" />
                      <span>
                        Complete your bio and role to get optimal ML career insights.
                      </span>
                    </p>
                  )}
                </div>
              </div>

              {/* Account Metadata */}
              <div className="mt-6 pt-5 border-t border-border/60 space-y-2.5 text-xs text-text-muted">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-text-muted/70" />
                    Member Since
                  </span>
                  <span className="text-text font-medium">
                    {formatDate(profile.created_at)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-text-muted/70" />
                    Last Updated
                  </span>
                  <span className="text-text font-medium">
                    {formatDate(profile.updated_at)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    Authentication
                  </span>
                  <span className="text-emerald-400 font-medium">Verified User</span>
                </div>
              </div>
            </Card>

            {/* Quick Tips Card */}
            <Card className="p-5 bg-gradient-to-br from-surface-card/60 to-surface-card/30 border border-primary/20">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center text-primary flex-shrink-0">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-text mb-1">
                    Role-Driven Recommendations
                  </h4>
                  <p className="text-xs text-text-muted leading-relaxed">
                    Setting your <strong>Target Role</strong> powers WorkForge&apos;s ML Gap Analysis and skill recommender engine to customize your career growth trajectory.
                  </p>
                </div>
              </div>
            </Card>
          </div>

          {/* Right Column: Edit Profile Form */}
          <div className="lg:col-span-2">
            <Card
              title="Edit Profile"
              subtitle="Update your personal information and career preferences."
              className="p-6"
            >
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                {/* Full Name */}
                <Input
                  label="Full Name"
                  id="name"
                  icon={User}
                  placeholder="e.g. Jane Developer"
                  error={errors.name?.message}
                  {...register('name')}
                />

                {/* Email Address (Read-only) */}
                <Input
                  label="Email Address"
                  id="email"
                  icon={Mail}
                  value={profile.email}
                  disabled
                  helperText="Your email is your permanent unique identifier and cannot be changed."
                  className="opacity-75 cursor-not-allowed bg-surface/50"
                />

                {/* Target Role */}
                <div>
                  <Input
                    label="Target Career Role"
                    id="target_role"
                    icon={Briefcase}
                    placeholder="e.g. Full Stack Developer"
                    error={errors.target_role?.message}
                    helperText="Select from popular suggestions below or type your custom role."
                    {...register('target_role')}
                  />
                  {/* Role suggestion pills */}
                  <div className="mt-2.5 flex flex-wrap gap-1.5">
                    {POPULAR_ROLES.map((role) => {
                      const isSelected = watchedRole.toLowerCase() === role.toLowerCase()
                      return (
                        <button
                          key={role}
                          type="button"
                          onClick={() => handleRoleSelect(role)}
                          className={`text-xs px-2.5 py-1 rounded-lg border transition-all duration-150 ${
                            isSelected
                              ? 'bg-primary text-white border-primary shadow-sm shadow-indigo-500/20'
                              : 'bg-surface-card hover:bg-surface-hover text-text-muted hover:text-text border-border'
                          }`}
                        >
                          {role}
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Avatar URL */}
                <Input
                  label="Avatar Image URL"
                  id="avatar_url"
                  icon={ImageIcon}
                  placeholder="https://images.unsplash.com/photo-... or your GitHub avatar"
                  error={errors.avatar_url?.message}
                  helperText="Paste a direct image link (PNG, JPG, WebP) to display as your profile picture."
                  {...register('avatar_url')}
                />

                {/* Bio / Summary */}
                <div className="w-full">
                  <div className="flex justify-between items-center mb-1.5">
                    <label
                      htmlFor="bio"
                      className="block text-xs font-semibold uppercase tracking-wider text-text-muted"
                    >
                      Bio / Summary
                    </label>
                    <span
                      className={`text-[11px] ${
                        watchedBio.length > 900
                          ? 'text-warning font-semibold'
                          : 'text-text-muted'
                      }`}
                    >
                      {watchedBio.length} / 1000
                    </span>
                  </div>
                  <textarea
                    id="bio"
                    rows={4}
                    placeholder="Tell us about your background, current focus areas, technical passions, and what you're working toward..."
                    className={`w-full rounded-lg bg-surface-card border text-text placeholder-text-muted/60 transition-all duration-200 text-sm p-3 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary resize-y ${
                      errors.bio ? 'border-danger focus:border-danger' : 'border-border'
                    }`}
                    {...register('bio')}
                  />
                  {errors.bio && (
                    <p className="mt-1 text-xs text-danger flex items-center gap-1 animate-fade-in">
                      {errors.bio.message}
                    </p>
                  )}
                </div>

                {/* Form Action Buttons */}
                <div className="pt-4 border-t border-border/60 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Button
                      type="submit"
                      variant="primary"
                      icon={Save}
                      isLoading={updateMutation.isPending}
                      disabled={!isDirty || updateMutation.isPending}
                    >
                      Save Changes
                    </Button>

                    <Button
                      type="button"
                      variant="ghost"
                      icon={RotateCcw}
                      disabled={!isDirty || updateMutation.isPending}
                      onClick={() => {
                        reset({
                          name: profile.name,
                          target_role: profile.target_role || '',
                          avatar_url: profile.avatar_url || '',
                          bio: profile.bio || '',
                        })
                        setAvatarLoadError(false)
                      }}
                    >
                      Reset
                    </Button>
                  </div>

                  {isDirty && (
                    <span className="text-xs text-amber-400 flex items-center gap-1 animate-fade-in">
                      <AlertCircle className="w-3.5 h-3.5" />
                      Unsaved changes
                    </span>
                  )}
                  {!isDirty && !updateMutation.isPending && (
                    <span className="text-xs text-text-muted flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      Up to date
                    </span>
                  )}
                </div>
              </form>
            </Card>
          </div>
        </div>
      )}
    </PageWrapper>
  )
}
