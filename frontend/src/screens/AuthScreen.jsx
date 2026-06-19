import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useStore } from '../store'

/* ── password strength ───────────────────────────────────────────────── */
function PasswordStrength({ value }) {
  const score = (() => {
    if (!value) return 0
    let s = 0
    if (value.length >= 6)          s++
    if (value.length >= 10)         s++
    if (/[A-Z]/.test(value))        s++
    if (/[0-9]/.test(value))        s++
    if (/[^A-Za-z0-9]/.test(value)) s++
    return s
  })()
  const labels = ['', 'Very weak', 'Weak', 'Fair', 'Strong', 'Very strong']
  const colors = ['', '#ef4444', '#f97316', '#eab308', '#16a34a', '#4f46e5']
  if (!value) return null
  return (
    <div className="mt-2">
      <div className="flex gap-1 mb-1">
        {[1,2,3,4,5].map((n) => (
          <div key={n} className="h-1 flex-1 rounded-full transition-all duration-300"
               style={{ background: n <= score ? colors[score] : 'rgba(15,23,42,0.08)' }} />
        ))}
      </div>
      <p className="text-xs" style={{ color: colors[score] }}>{labels[score]}</p>
    </div>
  )
}

/* ── field ───────────────────────────────────────────────────────────── */
function Field({ label, type = 'text', value, onChange, placeholder, autoFocus }) {
  const [focused, setFocused] = useState(false)
  const [showPwd, setShowPwd] = useState(false)
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold text-text-muted uppercase tracking-wide">{label}</label>
      <div className="relative">
        <input
          type={type === 'password' ? (showPwd ? 'text' : 'password') : type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          autoFocus={autoFocus}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all duration-200 text-text-primary placeholder-text-muted"
          style={{
            background: focused ? 'rgba(255,255,255,1)' : 'rgba(248,250,252,1)',
            border: `1.5px solid ${focused ? 'rgba(79,70,229,0.55)' : 'rgba(15,23,42,0.10)'}`,
            boxShadow: focused ? '0 0 0 3px rgba(79,70,229,0.10)' : 'none',
          }}
        />
        {type === 'password' && (
          <button type="button" tabIndex={-1} onClick={() => setShowPwd(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary transition-colors">
            {showPwd
              ? <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
              : <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
            }
          </button>
        )}
      </div>
    </div>
  )
}

/* ── main ────────────────────────────────────────────────────────────── */
// tab: 'login' | 'signup' | 'forgot'
export default function AuthScreen({ defaultTab = 'login', onClose }) {
  const [tab, setTab]         = useState(defaultTab)
  const [name, setName]       = useState('')
  const [email, setEmail]     = useState(defaultTab === 'login' ? 'demo@injurylens.com' : '')
  const [password, setPass]   = useState(defaultTab === 'login' ? 'demo1234' : '')
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')
  const [success, setSuccess] = useState('')

  const { loginUser, registerUser, forgotPassword } = useStore()

  const switchTab = (t) => {
    setTab(t); setError(''); setSuccess('')
    if (t === 'login') { setEmail('demo@injurylens.com'); setPass('demo1234') }
    else { setEmail(''); setPass('') }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(''); setSuccess(''); setLoading(true)
    try {
      if (tab === 'login')  await loginUser(email, password)
      else if (tab === 'signup') await registerUser(name, email, password)
      else { const r = await forgotPassword(email); setSuccess(r.message) }
    } catch (err) { setError(err.message) }
    finally { setLoading(false) }
  }

  const btnLabel = { login: 'Sign in', signup: 'Create account', forgot: 'Send reset link' }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97, y: 16 }}
      animate={{ opacity: 1, scale: 1,    y: 0  }}
      exit={{    opacity: 0, scale: 0.97, y: 16 }}
      transition={{ duration: 0.28, ease: [0.16,1,0.3,1] }}
      className="w-full max-w-sm mx-auto"
    >
      <div
        className="rounded-2xl shadow-card-xl border border-border-subtle overflow-hidden"
        style={{ background: 'rgba(255,255,255,0.96)', backdropFilter: 'blur(24px)' }}
      >
        {/* tab bar */}
        <div className="flex border-b border-border-subtle">
          {['login', 'signup'].map((t) => (
            <button
              key={t}
              onClick={() => switchTab(t)}
              className="flex-1 py-3.5 text-sm font-semibold transition-all relative"
              style={{ color: tab === t ? '#4f46e5' : '#64748b' }}
            >
              {t === 'login' ? 'Sign in' : 'Sign up'}
              {tab === t && (
                <motion.div
                  layoutId="auth-tab-line"
                  className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full bg-gradient-to-r from-accent-primary to-accent-secondary"
                />
              )}
            </button>
          ))}
        </div>

        {/* form */}
        <div className="p-6">
          <AnimatePresence mode="wait">
            <motion.form
              key={tab}
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0  }}
              exit={{    opacity: 0, x: -12 }}
              transition={{ duration: 0.2 }}
              onSubmit={handleSubmit}
              className="flex flex-col gap-4"
            >
              {tab === 'signup' && (
                <Field label="Full name" value={name}
                  onChange={(e) => setName(e.target.value)} placeholder="Alex Johnson" autoFocus />
              )}

              {tab === 'forgot'
                ? <Field label="Email address" type="email" value={email}
                    onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" autoFocus />
                : <>
                    <Field label="Email address" type="email" value={email}
                      onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com"
                      autoFocus={tab === 'login'} />
                    <div>
                      <Field label="Password" type="password" value={password}
                        onChange={(e) => setPass(e.target.value)} placeholder="••••••••" />
                      {tab === 'signup' && <PasswordStrength value={password} />}
                    </div>
                    {tab === 'login' && (
                      <button type="button" onClick={() => switchTab('forgot')}
                        className="self-end text-xs text-text-muted hover:text-accent-primary transition-colors font-medium -mt-1">
                        Forgot password?
                      </button>
                    )}
                  </>
              }

              {/* feedback */}
              <AnimatePresence>
                {error && (
                  <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                    className="text-xs px-3 py-2 rounded-lg"
                    style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.20)', color: '#dc2626' }}>
                    {error}
                  </motion.p>
                )}
                {success && (
                  <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                    className="text-xs px-3 py-2 rounded-lg"
                    style={{ background: 'rgba(22,163,74,0.08)', border: '1px solid rgba(22,163,74,0.20)', color: '#16a34a' }}>
                    {success}
                  </motion.p>
                )}
              </AnimatePresence>

              {/* submit */}
              <motion.button
                type="submit"
                disabled={loading}
                whileTap={{ scale: 0.97 }}
                className="w-full py-3 rounded-xl font-bold text-white text-sm transition-all mt-1"
                style={{
                  background: loading ? 'rgba(79,70,229,0.5)' : 'linear-gradient(135deg, #4f46e5, #7c3aed)',
                  boxShadow: loading ? 'none' : '0 2px 12px rgba(79,70,229,0.30)',
                }}
              >
                {loading
                  ? <span className="flex items-center justify-center gap-2">
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="white" strokeWidth="4"/>
                        <path className="opacity-75" fill="white" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                      </svg>
                      Processing…
                    </span>
                  : btnLabel[tab]
                }
              </motion.button>

              {tab === 'forgot' && (
                <button type="button" onClick={() => switchTab('login')}
                        className="text-center text-xs text-text-muted hover:text-accent-primary transition-colors">
                  ← Back to sign in
                </button>
              )}
            </motion.form>
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  )
}
