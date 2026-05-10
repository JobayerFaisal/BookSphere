import React, { useEffect, useState } from 'react';
import { getBooks } from '../services/books';
import { RefreshCw, BookOpen, ExternalLink } from 'lucide-react';

const COVER_PALETTES = [
  { bg:'#f0e6d8', color:'#6b4226' }, { bg:'#e8f0f8', color:'#1a4a6b' },
  { bg:'#eaf7f0', color:'#1a5c38' }, { bg:'#fdf0ee', color:'#7a2a1e' },
  { bg:'#f5f0fb', color:'#4a2a7a' }, { bg:'#fdf8ec', color:'#6b4d0a' },
];
function palette(title) {
  let h = 0; for (let i=0;i<(title||'').length;i++) h=title.charCodeAt(i)+((h<<5)-h);
  return COVER_PALETTES[Math.abs(h)%COVER_PALETTES.length];
}

export default function Recommendations({ user }) {
  const [books, setBooks] = useState([]);
  const [recs, setRecs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [profile, setProfile] = useState(null);

  useEffect(() => { getBooks(user.uid).then(b => { setBooks(b); }); }, [user.uid]);

  useEffect(() => { if (books.length > 0) buildProfile(); }, [books]); // eslint-disable-line react-hooks/exhaustive-deps

  const buildProfile = () => {
    const owned = books.filter(b => !b.wishlist);
    if (owned.length === 0) { setLoading(false); return; }

    // Build reading profile from owned books
    const genres = {}, authors = {}, langs = {};
    const topRated = owned.filter(b => b.rating >= 4).map(b => b.title);
    const finished = owned.filter(b => b.status === 'Finished');

    owned.forEach(b => {
      if (b.genre) genres[b.genre] = (genres[b.genre]||0) + (b.rating||1);
      if (b.author) b.author.split(',').forEach(a => { const t=a.trim(); if(t) authors[t]=(authors[t]||0)+(b.rating||1); });
      if (b.language) langs[b.language] = (langs[b.language]||0) + 1;
    });

    const topGenres = Object.entries(genres).sort((a,b)=>b[1]-a[1]).slice(0,3).map(([g])=>g);
    const topAuthors = Object.entries(authors).sort((a,b)=>b[1]-a[1]).slice(0,3).map(([a])=>a);
    const topLang = Object.entries(langs).sort((a,b)=>b[1]-a[1])[0]?.[0] || 'English';
    const isBanglaReader = langs['বাংলা'] > 0;

    const p = { topGenres, topAuthors, topLang, topRated, finished: finished.length, total: owned.length, isBanglaReader };
    setProfile(p);
    fetchRecs(p, owned);
  };

  const fetchRecs = async (p, owned) => {
    setLoading(true); setError(''); setRecs([]);
    const ownedTitles = owned.map(b => b.title.toLowerCase());

    try {
      const results = [];
      // Search Open Library for each top genre
      const queries = [
        ...p.topGenres.map(g => ({ q: `subject:${g}`, label: g })),
        ...p.topAuthors.slice(0,2).map(a => ({ q: `author:${a}`, label: `More by ${a}` })),
      ];

      for (const { q, label } of queries.slice(0, 4)) {
        const res = await fetch(`https://openlibrary.org/search.json?q=${encodeURIComponent(q)}&limit=10&sort=rating&fields=key,title,author_name,cover_i,first_publish_year,subject,isbn`);
        const data = await res.json();
        if (!data.docs) continue;

        data.docs
          .filter(d => d.title && !ownedTitles.includes(d.title.toLowerCase()))
          .slice(0, 3)
          .forEach(d => {
            if (!results.find(r => r.key === d.key)) {
              results.push({ ...d, reason: label });
            }
          });
      }

      // Shuffle a bit to add variety
      const shuffled = results.sort(() => Math.random() - 0.3).slice(0, 12);
      setRecs(shuffled);
    } catch { setError('Could not load recommendations. Check your connection.'); }
    setLoading(false);
  };

  const openOnGoodreads = (title, author) => {
    const q = encodeURIComponent(`${title} ${author||''}`);
    window.open(`https://www.goodreads.com/search?q=${q}`, '_blank');
  };

  const openOnOpenLibrary = (key) => {
    window.open(`https://openlibrary.org${key}`, '_blank');
  };

  if (books.length === 0 && !loading) return (
    <div style={{ padding:32, maxWidth:900, margin:'0 auto', textAlign:'center', paddingTop:80 }}>
      <div style={{ fontSize:48, marginBottom:16 }}>📚</div>
      <div style={{ fontFamily:'var(--font-display)', fontSize:20, fontWeight:600, color:'var(--ink)', marginBottom:8 }}>Add some books first</div>
      <div style={{ fontSize:14, color:'var(--ink-muted)' }}>Recommendations are based on your reading history and ratings.</div>
    </div>
  );

  return (
    <div style={{ padding:'32px 32px 48px', maxWidth:1000, margin:'0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom:28, animation:'fadeUp 0.4s ease' }}>
        <div style={{ fontFamily:'var(--font-display)', fontSize:11, letterSpacing:'0.14em', textTransform:'uppercase', color:'var(--sepia-light)', marginBottom:4 }}>Curated for you</div>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <h1 style={{ fontFamily:'var(--font-display)', fontSize:32, fontWeight:700 }}>Recommendations</h1>
          <button onClick={() => buildProfile()} disabled={loading} style={{ display:'flex', alignItems:'center', gap:6, padding:'9px 16px', background:'var(--paper-card)', border:'1px solid var(--border)', borderRadius:'var(--radius-md)', fontSize:13, color:'var(--ink-muted)', cursor:'pointer' }}>
            <RefreshCw size={14} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }}/> Refresh
          </button>
        </div>

        {/* Profile summary */}
        {profile && (
          <div style={{ marginTop:16, padding:'14px 18px', background:'var(--sepia-pale)', border:'1px solid var(--sepia-light)', borderRadius:'var(--radius-lg)', fontSize:13, color:'var(--sepia)' }}>
            <span style={{ fontWeight:600 }}>Your taste: </span>
            Based on {profile.total} books · Top genres: {profile.topGenres.join(', ')}
            {profile.isBanglaReader && ' · Includes বাংলা books'}
            {profile.topAuthors.length > 0 && ` · Favourite authors: ${profile.topAuthors.slice(0,2).join(', ')}`}
          </div>
        )}
      </div>

      {/* Loading */}
      {loading && (
        <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'80px 0', gap:16 }}>
          <div style={{ width:40, height:40, border:'3px solid var(--border)', borderTopColor:'var(--sepia)', borderRadius:'50%', animation:'spin 0.8s linear infinite' }} />
          <div style={{ fontSize:14, color:'var(--ink-muted)' }}>Finding books you'll love…</div>
        </div>
      )}

      {/* Error */}
      {error && !loading && (
        <div style={{ padding:'16px 20px', background:'var(--accent-pale)', border:'1px solid var(--accent-soft)', borderRadius:'var(--radius-lg)', fontSize:14, color:'var(--accent)', textAlign:'center' }}>
          {error}
        </div>
      )}

      {/* Results grid */}
      {!loading && recs.length > 0 && (
        <>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(180px, 1fr))', gap:16 }}>
            {recs.map((doc, i) => {
              const p = palette(doc.title);
              const hasCover = !!doc.cover_i;
              const author = doc.author_name ? doc.author_name.slice(0,2).join(', ') : '';
              return (
                <div key={doc.key || i} style={{ background:'var(--paper-card)', border:'1px solid var(--border)', borderRadius:'var(--radius-lg)', overflow:'hidden', boxShadow:'var(--shadow-sm)', animation:`fadeUp 0.35s ease ${i*0.04}s both`, display:'flex', flexDirection:'column' }}>
                  {/* Cover */}
                  <div style={{ height:140, background: hasCover ? '#f0ebe4' : p.bg, position:'relative', overflow:'hidden' }}>
                    {hasCover
                      ? <img src={`https://covers.openlibrary.org/b/id/${doc.cover_i}-M.jpg`} alt={doc.title} style={{ width:'100%', height:'100%', objectFit:'cover' }} onError={e=>e.target.style.display='none'} />
                      : <div style={{ height:'100%', display:'flex', alignItems:'center', justifyContent:'center', padding:12, fontFamily:'var(--font-display)', fontSize:12, fontWeight:600, color:p.color, textAlign:'center', lineHeight:1.4 }}>{doc.title}</div>
                    }
                    {/* Reason badge */}
                    <div style={{ position:'absolute', top:8, left:8, fontSize:9, fontWeight:600, padding:'2px 7px', borderRadius:10, background:'rgba(139,111,71,0.9)', color:'white' }}>
                      {doc.reason}
                    </div>
                  </div>

                  {/* Info */}
                  <div style={{ padding:'10px 12px', flex:1, display:'flex', flexDirection:'column' }}>
                    <div style={{ fontFamily:'var(--font-display)', fontSize:13, fontWeight:600, color:'var(--ink)', marginBottom:2, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{doc.title}</div>
                    <div style={{ fontSize:11, color:'var(--ink-muted)', marginBottom:8, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{author}</div>
                    {doc.first_publish_year && <div style={{ fontSize:10, color:'var(--ink-faint)', marginBottom:8 }}>{doc.first_publish_year}</div>}
                    <div style={{ marginTop:'auto', display:'flex', gap:6 }}>
                      <button onClick={() => openOnOpenLibrary(doc.key)} style={{ flex:1, padding:'6px 8px', background:'var(--paper-warm)', border:'1px solid var(--border)', borderRadius:'var(--radius-sm)', fontSize:11, color:'var(--ink-muted)', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:4 }}>
                        <BookOpen size={11}/> Details
                      </button>
                      <button onClick={() => openOnGoodreads(doc.title, author)} style={{ flex:1, padding:'6px 8px', background:'var(--sepia-pale)', border:'1px solid var(--sepia-light)', borderRadius:'var(--radius-sm)', fontSize:11, color:'var(--sepia)', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:4 }}>
                        <ExternalLink size={11}/> Goodreads
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <p style={{ marginTop:24, fontSize:12, color:'var(--ink-faint)', textAlign:'center' }}>
            Recommendations from Open Library · Based on your {profile?.total} books · Click Refresh for new suggestions
          </p>
        </>
      )}

      {!loading && recs.length === 0 && !error && (
        <div style={{ textAlign:'center', padding:'80px 0' }}>
          <div style={{ fontSize:40, marginBottom:12 }}>🔍</div>
          <div style={{ fontFamily:'var(--font-display)', fontSize:18, color:'var(--ink)', marginBottom:8 }}>No recommendations yet</div>
          <div style={{ fontSize:14, color:'var(--ink-muted)' }}>Rate some books (4–5 stars) to get better suggestions.</div>
        </div>
      )}
    </div>
  );
}
