import React, { useEffect, useState } from 'react';
import { getShare } from '../services/share';

const STATUS_COLORS = {
  'Reading': { bg:'#eaf4fb', color:'#2980b9' },
  'Finished': { bg:'#eaf7f0', color:'#27ae60' },
  'To Read': { bg:'#fdf8ec', color:'#d4a017' },
  'Paused': { bg:'#f0ebe4', color:'#8b6f47' },
  'Dropped': { bg:'#fdf0ee', color:'#c0392b' },
};

const COVER_PALETTES = [
  { bg:'#f0e6d8', color:'#6b4226' }, { bg:'#e8f0f8', color:'#1a4a6b' },
  { bg:'#eaf7f0', color:'#1a5c38' }, { bg:'#fdf0ee', color:'#7a2a1e' },
  { bg:'#f5f0fb', color:'#4a2a7a' }, { bg:'#fdf8ec', color:'#6b4d0a' },
];
function getPalette(title) {
  let h = 0; for (let i=0;i<(title||'').length;i++) h=title.charCodeAt(i)+((h<<5)-h);
  return COVER_PALETTES[Math.abs(h)%COVER_PALETTES.length];
}

export default function ShareView({ shareId }) {
  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [imgErr, setImgErr] = useState(false);

  useEffect(() => {
    getShare(shareId).then(data => {
      if (!data) setNotFound(true);
      else setBook(data);
      setLoading(false);
    }).catch(() => { setNotFound(true); setLoading(false); });
  }, [shareId]);

  if (loading) return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'var(--paper)', fontFamily:'var(--font-body)' }}>
      <div style={{ width:32, height:32, border:'2px solid var(--border)', borderTopColor:'var(--sepia)', borderRadius:'50%', animation:'spin 0.8s linear infinite' }} />
    </div>
  );

  if (notFound) return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'var(--paper)', fontFamily:'var(--font-body)', flexDirection:'column', gap:12 }}>
      <div style={{ fontSize:48 }}>📚</div>
      <div style={{ fontFamily:'var(--font-display)', fontSize:22, color:'var(--ink)' }}>Review not found</div>
      <div style={{ fontSize:14, color:'var(--ink-muted)' }}>This link may have been removed.</div>
      <a href="/" style={{ marginTop:8, fontSize:14, color:'var(--sepia)' }}>Go to BookSphere →</a>
    </div>
  );

  const isBangla = book.language === 'বাংলা';
  const palette = getPalette(book.title);
  const hasCover = book.coverUrl && !imgErr;
  const statusStyle = STATUS_COLORS[book.status] || STATUS_COLORS['To Read'];

  return (
    <div style={{ minHeight:'100vh', background:'var(--paper)', fontFamily:'var(--font-body)' }}>
      {/* Top bar */}
      <div style={{ background:'var(--paper-card)', borderBottom:'1px solid var(--border)', padding:'12px 24px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div style={{ fontFamily:'var(--font-display)', fontSize:18, fontWeight:700, color:'var(--ink)' }}>BookSphere</div>
        <a href="/" style={{ fontSize:13, color:'var(--sepia)', fontWeight:500 }}>Open your library →</a>
      </div>

      <div style={{ maxWidth:640, margin:'0 auto', padding:'40px 24px 80px' }}>
        {/* Book card */}
        <div style={{ background:'var(--paper-card)', border:'1px solid var(--border)', borderRadius:'var(--radius-xl)', overflow:'hidden', boxShadow:'var(--shadow-md)', animation:'fadeUp 0.4s ease' }}>
          {/* Hero cover */}
          <div style={{ height:220, background: hasCover ? '#f0ebe4' : palette.bg, position:'relative', overflow:'hidden' }}>
            {hasCover
              ? <img src={book.coverUrl} alt={book.title} onError={()=>setImgErr(true)} style={{ width:'100%', height:'100%', objectFit:'cover' }} />
              : <div style={{ height:'100%', display:'flex', alignItems:'center', justifyContent:'center', padding:24 }}>
                  <div style={{ fontFamily: isBangla ? 'var(--font-bangla)' : 'var(--font-display)', fontSize: isBangla ? 24 : 22, fontWeight:700, color:palette.color, textAlign:'center', lineHeight:1.4 }}>{book.title}</div>
                </div>
            }
            {/* Gradient overlay at bottom */}
            <div style={{ position:'absolute', bottom:0, left:0, right:0, height:80, background:'linear-gradient(transparent, rgba(0,0,0,0.4))' }} />
            {/* Status badge */}
            <div style={{ position:'absolute', bottom:14, left:16 }}>
              <span style={{ fontSize:11, fontWeight:600, padding:'4px 10px', borderRadius:12, background:statusStyle.bg, color:statusStyle.color }}>{book.status}</span>
            </div>
            {book.language && (
              <div style={{ position:'absolute', top:14, right:14, fontSize:10, fontWeight:600, padding:'3px 8px', borderRadius:10, background:'rgba(255,255,255,0.85)', color:'#444' }}>
                {book.language}
              </div>
            )}
          </div>

          {/* Content */}
          <div style={{ padding:'24px 28px' }}>
            <h1 style={{ fontFamily: isBangla ? 'var(--font-bangla)' : 'var(--font-display)', fontSize: isBangla ? 24 : 26, fontWeight:700, color:'var(--ink)', marginBottom:6, lineHeight:1.3 }}>{book.title}</h1>
            <div style={{ fontSize:16, color:'var(--ink-muted)', marginBottom:16, fontFamily: isBangla ? 'var(--font-bangla)' : 'var(--font-body)' }}>{book.author}</div>

            {/* Meta chips */}
            <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginBottom:20 }}>
              {book.genre && <span style={{ fontSize:12, padding:'3px 10px', borderRadius:12, background:'var(--paper-warm)', border:'1px solid var(--border)', color:'var(--ink-muted)' }}>{book.genre}</span>}
              {book.year && <span style={{ fontSize:12, padding:'3px 10px', borderRadius:12, background:'var(--paper-warm)', border:'1px solid var(--border)', color:'var(--ink-muted)' }}>{book.year}</span>}
              {book.publisher && <span style={{ fontSize:12, padding:'3px 10px', borderRadius:12, background:'var(--paper-warm)', border:'1px solid var(--border)', color:'var(--ink-muted)' }}>{book.publisher}</span>}
            </div>

            {/* Rating */}
            {book.rating > 0 && (
              <div style={{ marginBottom:20 }}>
                <div style={{ fontSize:11, fontWeight:600, letterSpacing:'0.1em', textTransform:'uppercase', color:'var(--ink-muted)', marginBottom:6 }}>Rating</div>
                <div style={{ fontSize:28, color:'var(--gold)', letterSpacing:3 }}>
                  {'★'.repeat(book.rating)}{'☆'.repeat(5-book.rating)}
                  <span style={{ fontSize:14, color:'var(--ink-muted)', fontFamily:'var(--font-body)', marginLeft:8, letterSpacing:0 }}>{book.rating} / 5</span>
                </div>
              </div>
            )}

            {/* Review */}
            {book.review && (
              <div style={{ marginBottom:20 }}>
                <div style={{ fontSize:11, fontWeight:600, letterSpacing:'0.1em', textTransform:'uppercase', color:'var(--ink-muted)', marginBottom:10 }}>Review</div>
                <div style={{ fontSize:15, color:'var(--ink)', lineHeight:1.8, fontFamily: isBangla ? 'var(--font-bangla)' : 'var(--font-body)', borderLeft:'3px solid var(--sepia-light)', paddingLeft:16, fontStyle:'italic' }}>
                  {book.review}
                </div>
              </div>
            )}

            {/* Tags */}
            {book.tags?.length > 0 && (
              <div style={{ marginBottom:20 }}>
                <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
                  {book.tags.map(t => <span key={t} style={{ fontSize:11, padding:'3px 10px', borderRadius:20, background:'var(--sepia-pale)', border:'1px solid var(--sepia-light)', color:'var(--sepia)', fontWeight:500 }}>{t}</span>)}
                </div>
              </div>
            )}

            {/* Footer */}
            <div style={{ paddingTop:16, borderTop:'1px solid var(--border)', fontSize:12, color:'var(--ink-faint)' }}>
              Shared via <a href="/" style={{ color:'var(--sepia)', fontWeight:500 }}>BookSphere</a> · Track your own library at booksphere.app
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
