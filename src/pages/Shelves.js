import React, { useEffect, useState, useMemo } from 'react';
import { getBooks } from '../services/books';
import BookCard from '../components/BookCard';


export default function Shelves({ user, onOpenBook }) {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeShelf, setActiveShelf] = useState(null);

  useEffect(() => {
    getBooks(user.uid).then(data => { setBooks(data.filter(b=>!b.wishlist)); setLoading(false); });
  }, [user.uid]);

  const shelves = useMemo(() => {
    const map = {};
    books.forEach(b => {
      const s = b.shelf || 'Unshelved';
      if (!map[s]) map[s] = [];
      map[s].push(b);
    });
    return Object.entries(map).sort((a,b) => b[1].length - a[1].length);
  }, [books]);

  const displayed = activeShelf ? books.filter(b => (b.shelf || 'Unshelved') === activeShelf) : [];

  return (
    <div style={{ padding:'32px', maxWidth:1100, margin:'0 auto' }}>
      <div style={{ marginBottom:28, animation:'fadeUp 0.4s ease' }}>
        <div style={{ fontFamily:'var(--font-display)', fontSize:11, letterSpacing:'0.14em', textTransform:'uppercase', color:'var(--sepia-light)', marginBottom:4 }}>Organize</div>
        <h1 style={{ fontFamily:'var(--font-display)', fontSize:32, fontWeight:700 }}>Shelves</h1>
      </div>

      {loading ? (
        <div style={{ display:'flex', justifyContent:'center', paddingTop:60 }}>
          <div style={{ width:32, height:32, border:'2px solid var(--border)', borderTopColor:'var(--sepia)', borderRadius:'50%', animation:'spin 0.8s linear infinite' }} />
        </div>
      ) : shelves.length === 0 ? (
        <div style={{ textAlign:'center', padding:'80px 0' }}>
          <div style={{ fontSize:40, marginBottom:12 }}>🗂️</div>
          <div style={{ fontFamily:'var(--font-display)', fontSize:18, color:'var(--ink)', marginBottom:8 }}>No shelves yet</div>
          <div style={{ fontSize:14, color:'var(--ink-muted)' }}>Add a "Shelf / Collection" name when adding books to organize them here.</div>
        </div>
      ) : (
        <div style={{ display:'grid', gridTemplateColumns: activeShelf ? '240px 1fr' : 'repeat(auto-fill, minmax(220px, 1fr))', gap:20, alignItems:'start' }}>
          {!activeShelf ? shelves.map(([name, bks]) => (
            <div key={name} onClick={()=>setActiveShelf(name)} style={{ background:'var(--paper-card)', border:'1px solid var(--border)', borderRadius:'var(--radius-lg)', padding:'20px 22px', cursor:'pointer', transition:'var(--transition)', boxShadow:'var(--shadow-sm)' }}
              onMouseEnter={e=>{ e.currentTarget.style.boxShadow='var(--shadow-md)'; e.currentTarget.style.transform='translateY(-2px)'; }}
              onMouseLeave={e=>{ e.currentTarget.style.boxShadow='var(--shadow-sm)'; e.currentTarget.style.transform='translateY(0)'; }}
            >
              <div style={{ fontSize:32, marginBottom:10 }}>📚</div>
              <div style={{ fontFamily:'var(--font-display)', fontSize:17, fontWeight:700, color:'var(--ink)', marginBottom:4 }}>{name}</div>
              <div style={{ fontSize:13, color:'var(--ink-muted)' }}>{bks.length} book{bks.length!==1?'s':''}</div>
              <div style={{ display:'flex', gap:4, marginTop:12, flexWrap:'wrap' }}>
                {bks.slice(0,3).map(b => (
                  <div key={b.id} style={{ fontSize:11, padding:'2px 8px', background:'var(--paper-warm)', borderRadius:10, color:'var(--ink-muted)', maxWidth:80, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{b.title}</div>
                ))}
                {bks.length>3 && <div style={{ fontSize:11, padding:'2px 8px', background:'var(--sepia-pale)', borderRadius:10, color:'var(--sepia)' }}>+{bks.length-3}</div>}
              </div>
            </div>
          )) : (
            <>
              <div>
                <button onClick={()=>setActiveShelf(null)} style={{ background:'none', border:'none', color:'var(--sepia)', fontSize:13, cursor:'pointer', marginBottom:16, display:'flex', alignItems:'center', gap:4 }}>← All shelves</button>
                {shelves.map(([name, bks]) => (
                  <div key={name} onClick={()=>setActiveShelf(name)} style={{
                    padding:'12px 14px', borderRadius:'var(--radius-md)', cursor:'pointer', marginBottom:4,
                    background: activeShelf===name ? 'var(--sepia-pale)' : 'transparent',
                    color: activeShelf===name ? 'var(--sepia)' : 'var(--ink-soft)',
                    fontWeight: activeShelf===name ? 500 : 400, fontSize:14,
                    border: activeShelf===name ? '1px solid var(--sepia-light)' : '1px solid transparent',
                    transition:'var(--transition)'
                  }}>
                    📚 {name} <span style={{ float:'right', fontSize:12, color:'var(--ink-faint)' }}>{bks.length}</span>
                  </div>
                ))}
              </div>
              <div>
                <h2 style={{ fontFamily:'var(--font-display)', fontSize:22, fontWeight:700, marginBottom:20 }}>{activeShelf} <span style={{ fontSize:14, color:'var(--ink-muted)', fontFamily:'var(--font-body)', fontWeight:400 }}>({displayed.length} books)</span></h2>
                <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(155px, 1fr))', gap:14 }}>
                  {displayed.map(b => <BookCard key={b.id} book={b} onClick={()=>onOpenBook(b.id)} />)}
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
