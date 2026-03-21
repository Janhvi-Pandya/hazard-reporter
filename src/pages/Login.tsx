import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AlertTriangle, LogIn, User, Lock, Loader2 } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [loginMode, setLoginMode] = useState<'user' | 'admin'>('user')

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(username, password)
      navigate('/dashboard')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-md liquid-glass rounded-[2rem] ghost-border p-8">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-on-primary-fixed-variant flex items-center justify-center mb-4">
            <AlertTriangle className="w-7 h-7 text-on-primary" />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-blue-100 font-headline">
            Hazard Reporter
          </h1>
          <p className="text-[10px] text-slate-400 uppercase tracking-[0.2em] mt-1">
            Incident Management
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        )}

        {/* Login Mode Toggle */}
        <div className="flex p-1 bg-surface-container-highest/40 rounded-xl mb-6 border border-outline-variant/20">
          <button
            type="button"
            onClick={() => { setLoginMode('user'); setUsername(''); setPassword(''); setError(''); }}
            className={`flex-1 py-2.5 text-xs font-bold uppercase tracking-wider rounded-lg transition-all ${
              loginMode === 'user'
                ? 'bg-primary/20 text-primary shadow-sm'
                : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            User Sign In
          </button>
          <button
            type="button"
            onClick={() => { setLoginMode('admin'); setUsername('admin'); setPassword(''); setError(''); }}
            className={`flex-1 py-2.5 text-xs font-bold uppercase tracking-wider rounded-lg transition-all ${
              loginMode === 'admin'
                ? 'bg-primary/20 text-primary shadow-sm'
                : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            Admin Sign In
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Username */}
          <div>
            <label className="font-label text-[10px] uppercase tracking-widest text-primary font-bold block mb-2">
              Username
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username"
                required
                className="w-full bg-surface-container-highest/40 border border-outline-variant/20 rounded-xl pl-10 pr-4 py-3 text-sm text-on-surface placeholder:text-slate-600 focus:ring-1 focus:ring-primary/50 focus:border-primary/30 transition-all outline-none"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="font-label text-[10px] uppercase tracking-widest text-primary font-bold block mb-2">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                className="w-full bg-surface-container-highest/40 border border-outline-variant/20 rounded-xl pl-10 pr-4 py-3 text-sm text-on-surface placeholder:text-slate-600 focus:ring-1 focus:ring-primary/50 focus:border-primary/30 transition-all outline-none"
              />
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-gradient-to-br from-primary to-on-primary-fixed-variant rounded-xl text-on-primary font-bold uppercase tracking-[0.2em] text-sm flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <LogIn className="w-4 h-4" />
                {loginMode === 'admin' ? 'Sign In as Admin' : 'Sign In as User'}
              </>
            )}
          </button>
        </form>

        {/* Register link */}
        <p className="text-center text-sm text-slate-400 mt-6">
          Don&apos;t have an account?{' '}
          <Link to="/register" className="text-primary hover:underline font-semibold">
            Register
          </Link>
        </p>
      </div>
    </div>
  )
}
