import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { User, Mail, Lock, Eye, EyeOff, Sparkles, UserPlus } from 'lucide-react'

import { useAuth } from '../../hooks/useAuth'
import useDocumentTitle from '../../hooks/useDocumentTitle'
import { useToast } from '../../hooks/useToast'
import authApi from '../../api/authApi'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'

const registerSchema = z
  .object({
    name: z
      .string()
      .min(1, 'Full name is required')
      .max(255, 'Name too long'),
    email: z
      .string()
      .min(1, 'Email is required')
      .email('Invalid email address'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters long'),
    confirmPassword: z
      .string()
      .min(1, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

export default function RegisterPage() {
  useDocumentTitle('Register')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { login } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()


  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  })

  const onSubmit = async (data) => {
    setIsSubmitting(true)
    try {
      const response = await authApi.register({
        name: data.name,
        email: data.email,
        password: data.password,
      })
      login(response.token, response.user)
      toast.success(`Account created! Welcome, ${response.user.name}!`)
      navigate('/dashboard')
    } catch (err) {
      const errorMsg =
        err.response?.data?.detail || 'Failed to create account. Please try again.'
      toast.error(errorMsg)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-surface relative overflow-hidden">
      {/* Background ambient gradient glow */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-primary/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-violet-600/20 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10 animate-fade-in my-8">
        {/* Brand header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-primary to-violet-500 shadow-xl shadow-indigo-500/25 mb-4 group">
            <Sparkles className="w-7 h-7 text-white transition-transform group-hover:rotate-12 duration-300" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-white via-slate-100 to-indigo-200 bg-clip-text text-transparent">
            Join WorkForge
          </h1>
          <p className="text-sm text-text-muted mt-2">
            Build your skill profile and unlock personalized recommendations
          </p>
        </div>

        {/* Register form card */}
        <div className="glass rounded-2xl p-8 border border-white/10 shadow-card">
          <h2 className="text-xl font-semibold text-text mb-6">Create your account</h2>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              id="name"
              label="Full Name"
              type="text"
              placeholder="Jane Doe"
              icon={User}
              error={errors.name?.message}
              {...register('name')}
            />

            <Input
              id="email"
              label="Email Address"
              type="email"
              placeholder="jane@example.com"
              icon={Mail}
              error={errors.email?.message}
              {...register('email')}
            />

            <Input
              id="password"
              label="Password"
              type={showPassword ? 'text' : 'password'}
              placeholder="At least 8 characters"
              icon={Lock}
              error={errors.password?.message}
              rightElement={
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-text-muted hover:text-text transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              }
              {...register('password')}
            />

            <Input
              id="confirmPassword"
              label="Confirm Password"
              type={showConfirmPassword ? 'text' : 'password'}
              placeholder="Re-enter password"
              icon={Lock}
              error={errors.confirmPassword?.message}
              rightElement={
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="text-text-muted hover:text-text transition-colors"
                  aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              }
              {...register('confirmPassword')}
            />

            <div className="pt-2">
              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="w-full"
                isLoading={isSubmitting}
                icon={UserPlus}
              >
                Create Account
              </Button>
            </div>
          </form>

          <div className="mt-6 pt-6 border-t border-border/60 text-center">
            <p className="text-sm text-text-muted">
              Already have an account?{' '}
              <Link
                to="/login"
                className="font-medium text-primary hover:text-primary-dark transition-colors"
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
