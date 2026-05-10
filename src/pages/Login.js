import React, { useState } from 'react';
import { auth, googleProvider } from '../firebase';
import {
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  updateProfile
} from 'firebase/auth';

const INPUT = {
  width:'100%', padding:'11px 14px', border:'1px solid var(--border)',
  borderRadius:'var(--radius-md)', fontSize:14, background:'var(--paper-card)',
  color:'var(--ink)', outline:'none', transition:'border-color 0.15s',
  fontFamily:'var(--font-body)'
};

export default function Login() {
  const [mode, setMode] = useState('signin'); // 'signin' | 'signup' | 'reset'
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');
  const [resetSent, setResetSent] = useState(false);

  const clearError = () => setError('');

  const friendlyError = (code) => {
    const map = {
      'auth/user-not-found': 'No account found with this email.',
      'auth/wrong-password': 'Incorrect password. Try again.',
      'auth/email-already-in-use': 'An account with this email already exists.',
      'auth/weak-password': 'Password should be at least 6 characters.',
      'auth/invalid-email': 'Please enter a valid email address.',
      'auth/too-many-requests': 'Too many attempts. Please try again later.',
      'auth/invalid-credential': 'Incorrect email or password.',
      'auth/network-request-failed': 'Network error. Check your connection.',
    };
    return map[code] || 'Something went wrong. Please try again.';
  };

  const handleGoogle = async () => {
    setGoogleLoading(true); clearError();
    try { await signInWithPopup(auth, googleProvider); }
    catch (e) { setError(friendlyError(e.code)); setGoogleLoading(false); }
  };

  const handleSubmit = async () => {
    clearError();
    if (!email.trim()) { setError('Please enter your email.'); return; }
    if (mode !== 'reset' && !password) { setError('Please enter your password.'); return; }
    if (mode === 'signup' && !name.trim()) { setError('Please enter your name.'); return; }

    setLoading(true);
    try {
      if (mode === 'signin') {
        await signInWithEmailAndPassword(auth, email.trim(), password);
      } else if (mode === 'signup') {
        const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
        await updateProfile(cred.user, { displayName: name.trim() });
      } else if (mode === 'reset') {
        await sendPasswordResetEmail(auth, email.trim());
        setResetSent(true);
        setLoading(false);
        return;
      }
    } catch (e) {
      setError(friendlyError(e.code));
      setLoading(false);
    }
  };

  const switchMode = (m) => { setMode(m); clearError(); setResetSent(false); };

  const titles = { signin:'Welcome back', signup:'Create your account', reset:'Reset password' };
  const subs = {
    signin:'Sign in to access your personal library.',
    signup:'Start tracking your books in Bengali and English.',
    reset:"Enter your email and we'll send you a reset link."
  };

  return (
    <div style={{ minHeight:'100vh', background:'var(--paper)', display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}>
      <div style={{ position:'absolute', inset:0, backgroundImage:'radial-gradient(circle at 20% 50%, rgba(192,57,43,0.05) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(139,111,71,0.08) 0%, transparent 50%)', pointerEvents:'none' }} />

      <div style={{ textAlign:'center', maxWidth:420, width:'100%', animation:'fadeUp 0.5s ease' }}>
        <div style={{ marginBottom:8, fontFamily:'var(--font-display)', fontSize:13, letterSpacing:'0.15em', textTransform:'uppercase', color:'var(--sepia-light)' }}>Your Personal Library</div>
        <h1 style={{ fontFamily:'var(--font-display)', fontSize:48, fontWeight:700, color:'var(--ink)', lineHeight:1.1, marginBottom:6 }}>BookSphere</h1>
        <div style={{ fontSize:14, color:'var(--ink-muted)', marginBottom:36 }}>Track, review & discover your books</div>

        <div style={{ background:'var(--paper-card)', border:'1px solid var(--border)', borderRadius:'var(--radius-xl)', padding:'36px 40px', boxShadow:'var(--shadow-lg)', textAlign:'left' }}>

          {/* Header */}
          <div style={{ marginBottom:24, textAlign:'center' }}>
            <div style={{ width:56, height:56, background:'var(--sepia-pale)', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 16px', fontSize:24 }}>📚</div>
            <h2 style={{ fontFamily:'var(--font-display)', fontSize:22, fontWeight:600, marginBottom:6 }}>{titles[mode]}</h2>
            <p style={{ fontSize:13, color:'var(--ink-muted)', lineHeight:1.6 }}>{subs[mode]}</p>
          </div>

          {/* Reset sent confirmation */}
          {resetSent ? (
            <div style={{ textAlign:'center', padding:'16px 0' }}>
              <div style={{ fontSize:36, marginBottom:12 }}>📧</div>
              <div style={{ fontSize:15, fontWeight:500, color:'var(--ink)', marginBottom:8 }}>Check your inbox</div>
              <div style={{ fontSize:13, color:'var(--ink-muted)', marginBottom:20 }}>A password reset link has been sent to <strong>{email}</strong>.</div>
              <button onClick={() => switchMode('signin')} style={{ fontSize:13, color:'var(--sepia)', background:'none', border:'none', cursor:'pointer', textDecoration:'underline' }}>Back to sign in</button>
            </div>
          ) : (
            <>
              {/* Google button */}
              {mode !== 'reset' && (
                <>
                  <button onClick={handleGoogle} disabled={googleLoading || loading} style={{
                    width:'100%', display:'flex', alignItems:'center', justifyContent:'center', gap:10,
                    background:'var(--paper-warm)', border:'1px solid var(--border)',
                    borderRadius:'var(--radius-md)', padding:'12px 20px',
                    fontSize:14, fontWeight:500, color:'var(--ink)',
                    cursor: googleLoading ? 'not-allowed' : 'pointer', transition:'var(--transition)',
                    marginBottom:20, opacity: googleLoading ? 0.7 : 1
                  }}
                  onMouseEnter={e=>{ if(!googleLoading) e.currentTarget.style.background='var(--sepia-pale)'; }}
                  onMouseLeave={e=>e.currentTarget.style.background='var(--paper-warm)'}
                  >
                    {googleLoading
                      ? <div style={{ width:16, height:16, border:'2px solid var(--border)', borderTopColor:'var(--sepia)', borderRadius:'50%', animation:'spin 0.8s linear infinite' }} />
                      : <svg width="17" height="17" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                    }
                    {googleLoading ? 'Signing in…' : 'Continue with Google'}
                  </button>

                  {/* Divider */}
                  <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:20 }}>
                    <div style={{ flex:1, height:'1px', background:'var(--border)' }} />
                    <span style={{ fontSize:12, color:'var(--ink-faint)' }}>or continue with email</span>
                    <div style={{ flex:1, height:'1px', background:'var(--border)' }} />
                  </div>
                </>
              )}

              {/* Name field (signup only) */}
              {mode === 'signup' && (
                <div style={{ marginBottom:14 }}>
                  <label style={{ fontSize:12, fontWeight:500, color:'var(--ink-soft)', display:'block', marginBottom:5 }}>Full name</label>
                  <input type="text" value={name} onChange={e=>{setName(e.target.value); clearError();}}
                    placeholder="Your name" style={INPUT}
                    onFocus={e=>e.target.style.borderColor='var(--sepia-light)'}
                    onBlur={e=>e.target.style.borderColor='var(--border)'}
                    onKeyDown={e=>{ if(e.key==='Enter') handleSubmit(); }}
                  />
                </div>
              )}

              {/* Email */}
              <div style={{ marginBottom:14 }}>
                <label style={{ fontSize:12, fontWeight:500, color:'var(--ink-soft)', display:'block', marginBottom:5 }}>Email address</label>
                <input type="email" value={email} onChange={e=>{setEmail(e.target.value); clearError();}}
                  placeholder="you@example.com" style={INPUT}
                  onFocus={e=>e.target.style.borderColor='var(--sepia-light)'}
                  onBlur={e=>e.target.style.borderColor='var(--border)'}
                  onKeyDown={e=>{ if(e.key==='Enter') handleSubmit(); }}
                />
              </div>

              {/* Password */}
              {mode !== 'reset' && (
                <div style={{ marginBottom: mode === 'signin' ? 8 : 20 }}>
                  <label style={{ fontSize:12, fontWeight:500, color:'var(--ink-soft)', display:'block', marginBottom:5 }}>Password</label>
                  <div style={{ position:'relative' }}>
                    <input type={showPass ? 'text' : 'password'} value={password}
                      onChange={e=>{setPassword(e.target.value); clearError();}}
                      placeholder={mode === 'signup' ? 'At least 6 characters' : 'Your password'}
                      style={{ ...INPUT, paddingRight:44 }}
                      onFocus={e=>e.target.style.borderColor='var(--sepia-light)'}
                      onBlur={e=>e.target.style.borderColor='var(--border)'}
                      onKeyDown={e=>{ if(e.key==='Enter') handleSubmit(); }}
                    />
                    <button onClick={()=>setShowPass(p=>!p)} style={{
                      position:'absolute', right:12, top:'50%', transform:'translateY(-50%)',
                      background:'none', border:'none', color:'var(--ink-faint)', cursor:'pointer', padding:2, fontSize:13
                    }}>{showPass ? '🙈' : '👁️'}</button>
                  </div>
                </div>
              )}

              {/* Forgot password */}
              {mode === 'signin' && (
                <div style={{ textAlign:'right', marginBottom:20 }}>
                  <button onClick={()=>switchMode('reset')} style={{ fontSize:12, color:'var(--sepia)', background:'none', border:'none', cursor:'pointer' }}>Forgot password?</button>
                </div>
              )}

              {/* Error */}
              {error && (
                <div style={{ marginBottom:16, padding:'10px 12px', background:'var(--accent-pale)', border:'1px solid var(--accent-soft)', borderRadius:'var(--radius-sm)', fontSize:13, color:'var(--accent)' }}>
                  {error}
                </div>
              )}

              {/* Submit */}
              <button onClick={handleSubmit} disabled={loading || googleLoading} style={{
                width:'100%', display:'flex', alignItems:'center', justifyContent:'center', gap:8,
                background: loading ? 'var(--sepia-light)' : 'var(--accent)', color:'white',
                border:'none', borderRadius:'var(--radius-md)', padding:'13px 20px',
                fontSize:15, fontWeight:500, cursor: loading ? 'not-allowed' : 'pointer',
                transition:'var(--transition)', opacity: loading ? 0.8 : 1, marginBottom:20
              }}
              onMouseEnter={e=>{ if(!loading) e.currentTarget.style.background='#a93226'; }}
              onMouseLeave={e=>e.currentTarget.style.background=loading?'var(--sepia-light)':'var(--accent)'}
              >
                {loading && <div style={{ width:15, height:15, border:'2px solid rgba(255,255,255,0.4)', borderTopColor:'white', borderRadius:'50%', animation:'spin 0.8s linear infinite' }} />}
                {loading ? 'Please wait…' : mode === 'signin' ? 'Sign in' : mode === 'signup' ? 'Create account' : 'Send reset link'}
              </button>

              {/* Mode switch */}
              <div style={{ textAlign:'center', fontSize:13, color:'var(--ink-muted)' }}>
                {mode === 'signin' ? (
                  <>Don't have an account?{' '}
                    <button onClick={()=>switchMode('signup')} style={{ color:'var(--sepia)', background:'none', border:'none', cursor:'pointer', fontWeight:500, fontSize:13 }}>Sign up free</button>
                  </>
                ) : mode === 'signup' ? (
                  <>Already have an account?{' '}
                    <button onClick={()=>switchMode('signin')} style={{ color:'var(--sepia)', background:'none', border:'none', cursor:'pointer', fontWeight:500, fontSize:13 }}>Sign in</button>
                  </>
                ) : (
                  <button onClick={()=>switchMode('signin')} style={{ color:'var(--sepia)', background:'none', border:'none', cursor:'pointer', fontSize:13 }}>← Back to sign in</button>
                )}
              </div>
            </>
          )}
        </div>

        <p style={{ marginTop:20, fontSize:12, color:'var(--ink-faint)' }}>Your library is private and synced across all your devices.</p>
      </div>
    </div>
  );
}
