import React, { useState } from 'react';
import { auth } from '../firebase';
import { signOut } from 'firebase/auth';
import { LayoutGrid, Heart, BarChart2, LogOut, Menu, X, Plus, Library, Moon, Sun, Download, Printer, Sparkles } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const NAV = [
  { id:'library', label:'My Library', icon: Library },
  { id:'shelves', label:'Shelves', icon: LayoutGrid },
  { id:'wishlist', label:'Wishlist', icon: Heart },
  { id:'analytics', label:'Analytics', icon: BarChart2 },
  { id:'recommendations', label:'For You', icon: Sparkles },
];

export default function Layout({ user, page, navigate, onAddBook, onExport, onPrint, children }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { dark, toggle } = useTheme();

  const handleNav = (id) => { navigate(id); setMobileOpen(false); };
  const handleSignOut = () => signOut(auth);

  const Sidebar = () => (
    <aside style={{
      width:240, flexShrink:0, background:'var(--paper-card)',
      borderRight:'1px solid var(--border)', display:'flex', flexDirection:'column',
      height:'100vh', position:'sticky', top:0
    }}>
      <div style={{ padding:'28px 24px 20px' }}>
        <div style={{ fontFamily:'var(--font-display)', fontSize:11, letterSpacing:'0.14em', textTransform:'uppercase', color:'var(--sepia-light)', marginBottom:4 }}>Your Library</div>
        <div style={{ fontFamily:'var(--font-display)', fontSize:20, fontWeight:700, color:'var(--ink)' }}>BookSphere</div>
      </div>

      <div style={{ padding:'0 16px', marginBottom:16 }}>
        <button onClick={onAddBook} style={{
          width:'100%', display:'flex', alignItems:'center', justifyContent:'center', gap:8,
          background:'var(--accent)', color:'white', border:'none',
          borderRadius:'var(--radius-md)', padding:'11px 16px', fontSize:14, fontWeight:500,
          transition:'var(--transition)', boxShadow:'0 2px 8px rgba(192,57,43,0.2)', cursor:'pointer'
        }}
        onMouseEnter={e=>e.currentTarget.style.background='#a93226'}
        onMouseLeave={e=>e.currentTarget.style.background='var(--accent)'}
        >
          <Plus size={16}/> Add Book
        </button>
      </div>

      <nav style={{ flex:1, padding:'0 12px' }}>
        {NAV.map(({ id, label, icon: Icon }) => {
          const active = page === id;
          return (
            <button key={id} onClick={()=>handleNav(id)} style={{
              width:'100%', display:'flex', alignItems:'center', gap:12, padding:'10px 12px',
              borderRadius:'var(--radius-md)', border:'none', textAlign:'left',
              background: active ? 'var(--sepia-pale)' : 'transparent',
              color: active ? 'var(--sepia)' : 'var(--ink-muted)',
              fontWeight: active ? 500 : 400, fontSize:14,
              transition:'var(--transition)', marginBottom:2, cursor:'pointer'
            }}
            onMouseEnter={e=>{ if(!active) e.currentTarget.style.background='var(--paper-warm)'; }}
            onMouseLeave={e=>{ if(!active) e.currentTarget.style.background='transparent'; }}
            >
              <Icon size={17}/> {label}
            </button>
          );
        })}

        {/* Divider */}
        <div style={{ height:'1px', background:'var(--border)', margin:'10px 4px' }} />

        {/* Export */}
        <button onClick={onExport} style={{ width:'100%', display:'flex', alignItems:'center', gap:12, padding:'10px 12px', borderRadius:'var(--radius-md)', border:'none', textAlign:'left', background:'transparent', color:'var(--ink-muted)', fontSize:14, transition:'var(--transition)', marginBottom:2, cursor:'pointer' }}
          onMouseEnter={e=>e.currentTarget.style.background='var(--paper-warm)'}
          onMouseLeave={e=>e.currentTarget.style.background='transparent'}
        >
          <Download size={17}/> Export Library
        </button>

        {/* Print */}
        <button onClick={onPrint} style={{ width:'100%', display:'flex', alignItems:'center', gap:12, padding:'10px 12px', borderRadius:'var(--radius-md)', border:'none', textAlign:'left', background:'transparent', color:'var(--ink-muted)', fontSize:14, transition:'var(--transition)', marginBottom:2, cursor:'pointer' }}
          onMouseEnter={e=>e.currentTarget.style.background='var(--paper-warm)'}
          onMouseLeave={e=>e.currentTarget.style.background='transparent'}
        >
          <Printer size={17}/> Print Library
        </button>
      </nav>

      <div style={{ padding:'16px 16px 24px', borderTop:'1px solid var(--border)' }}>
        {/* Dark mode toggle */}
        <button onClick={toggle} style={{
          width:'100%', display:'flex', alignItems:'center', justifyContent:'space-between',
          padding:'8px 12px', borderRadius:'var(--radius-md)', border:'1px solid var(--border)',
          background:'transparent', color:'var(--ink-muted)', fontSize:13, cursor:'pointer', marginBottom:12
        }}>
          <span style={{ display:'flex', alignItems:'center', gap:8 }}>
            {dark ? <Sun size={14}/> : <Moon size={14}/>}
            {dark ? 'Light mode' : 'Dark mode'}
          </span>
          <div style={{ width:34, height:18, borderRadius:9, background: dark ? 'var(--sepia)' : 'var(--border)', position:'relative', transition:'background 0.2s' }}>
            <div style={{ width:14, height:14, borderRadius:'50%', background:'white', position:'absolute', top:2, left: dark ? 18 : 2, transition:'left 0.2s' }} />
          </div>
        </button>

        {/* User */}
        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:12 }}>
          {user.photoURL
            ? <img src={user.photoURL} alt="" style={{ width:32, height:32, borderRadius:'50%' }}/>
            : <div style={{ width:32, height:32, borderRadius:'50%', background:'var(--sepia-pale)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:14, fontWeight:600, color:'var(--sepia)' }}>{user.displayName?.[0]||user.email?.[0]}</div>
          }
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ fontSize:13, fontWeight:500, color:'var(--ink)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{user.displayName || 'User'}</div>
            <div style={{ fontSize:11, color:'var(--ink-faint)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{user.email}</div>
          </div>
        </div>
        <button onClick={handleSignOut} style={{ width:'100%', display:'flex', alignItems:'center', gap:8, padding:'8px 12px', borderRadius:'var(--radius-md)', border:'1px solid var(--border)', background:'transparent', color:'var(--ink-muted)', fontSize:13, cursor:'pointer' }}>
          <LogOut size={14}/> Sign out
        </button>
      </div>
    </aside>
  );

  return (
    <div style={{ display:'flex', minHeight:'100vh', background:'var(--paper)' }}>
      <div style={{ display:'none' }} className="desktop-sidebar"><Sidebar /></div>
      <style>{`
        @media (min-width: 768px) { .desktop-sidebar { display: block !important; } .mobile-header { display: none !important; } }
        @media (max-width: 767px) { .desktop-sidebar { display: none !important; } }
      `}</style>

      {/* Mobile header */}
      <div className="mobile-header no-print" style={{ position:'fixed', top:0, left:0, right:0, zIndex:100, background:'var(--paper-card)', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 16px', height:56 }}>
        <div style={{ fontFamily:'var(--font-display)', fontSize:18, fontWeight:700, color:'var(--ink)' }}>BookSphere</div>
        <div style={{ display:'flex', gap:8 }}>
          <button onClick={toggle} style={{ background:'transparent', border:'1px solid var(--border)', borderRadius:'var(--radius-sm)', padding:'7px 10px', display:'flex', alignItems:'center', color:'var(--ink-muted)', cursor:'pointer' }}>
            {dark ? <Sun size={15}/> : <Moon size={15}/>}
          </button>
          <button onClick={onAddBook} style={{ background:'var(--accent)', color:'white', border:'none', borderRadius:'var(--radius-sm)', padding:'7px 12px', fontSize:13, display:'flex', alignItems:'center', gap:4, cursor:'pointer' }}>
            <Plus size={14}/> Add
          </button>
          <button onClick={()=>setMobileOpen(o=>!o)} style={{ background:'transparent', border:'1px solid var(--border)', borderRadius:'var(--radius-sm)', padding:'7px 10px', display:'flex', alignItems:'center', cursor:'pointer', color:'var(--ink)' }}>
            {mobileOpen ? <X size={16}/> : <Menu size={16}/>}
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div style={{ position:'fixed', inset:0, zIndex:200 }}>
          <div onClick={()=>setMobileOpen(false)} style={{ position:'absolute', inset:0, background:'rgba(0,0,0,0.4)' }}/>
          <div style={{ position:'absolute', top:0, left:0, bottom:0, width:260, background:'var(--paper-card)', boxShadow:'var(--shadow-lg)', display:'flex', flexDirection:'column' }}>
            <Sidebar />
          </div>
        </div>
      )}

      <main style={{ flex:1, minWidth:0 }}>
        <style>{`@media (max-width: 767px) { main { padding-top: 56px !important; } }`}</style>
        {children}
      </main>
    </div>
  );
}
