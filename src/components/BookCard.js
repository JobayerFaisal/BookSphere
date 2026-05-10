import React, { useState } from 'react';

const STATUS_COLORS = {
  'Reading': { bg:'#eaf4fb', color:'#2980b9' },
  'Finished': { bg:'#eaf7f0', color:'#27ae60' },
  'To Read': { bg:'#fdf8ec', color:'#d4a017' },
  'Paused': { bg:'#f0ebe4', color:'#8b6f47' },
  'Dropped': { bg:'#fdf0ee', color:'#c0392b' },
};

const COVER_PALETTES = [
  { bg:'#f0e6d8', color:'#6b4226' },
  { bg:'#e8f0f8', color:'#1a4a6b' },
  { bg:'#eaf7f0', color:'#1a5c38' },
  { bg:'#fdf0ee', color:'#7a2a1e' },
  { bg:'#f5f0fb', color:'#4a2a7a' },
  { bg:'#fdf8ec', color:'#6b4d0a' },
];

function getCoverPalette(title) {
  let hash = 0;
  for (let i = 0; i < (title||'').length; i++) hash = title.charCodeAt(i) + ((hash << 5) - hash);
  return COVER_PALETTES[Math.abs(hash) % COVER_PALETTES.length];
}

export default function BookCard({ book, onClick }) {
  const palette = getCoverPalette(book.title);
  const isBangla = book.language === 'বাংলা';
  const statusStyle = STATUS_COLORS[book.status] || STATUS_COLORS['To Read'];
  const pct = book.totalPages && book.currentPage ? Math.round((book.currentPage / book.totalPages) * 100) : null;
  const [imgError, setImgError] = useState(false);
  const hasCover = book.coverUrl && !imgError;

  return (
    <div onClick={onClick} style={{
      background:'var(--paper-card)', border:'1px solid var(--border)',
      borderRadius:'var(--radius-lg)', overflow:'hidden', cursor:'pointer',
      transition:'var(--transition)', boxShadow:'var(--shadow-sm)'
    }}
    onMouseEnter={e => { e.currentTarget.style.boxShadow='var(--shadow-md)'; e.currentTarget.style.transform='translateY(-2px)'; }}
    onMouseLeave={e => { e.currentTarget.style.boxShadow='var(--shadow-sm)'; e.currentTarget.style.transform='translateY(0)'; }}
    >
      {/* Cover — real image or fallback */}
      <div style={{ height:140, position:'relative', overflow:'hidden', background: hasCover ? '#f0ebe4' : palette.bg }}>
        {hasCover ? (
          <img
            src={book.coverUrl}
            alt={book.title}
            onError={() => setImgError(true)}
            style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }}
          />
        ) : (
          <div style={{ height:'100%', display:'flex', alignItems:'center', justifyContent:'center', padding:12 }}>
            <div style={{
              fontFamily: isBangla ? 'var(--font-bangla)' : 'var(--font-display)',
              fontSize: isBangla ? 13 : 12, fontWeight:600, color:palette.color,
              textAlign:'center', lineHeight:1.4,
              display:'-webkit-box', WebkitLineClamp:4, WebkitBoxOrient:'vertical', overflow:'hidden'
            }}>{book.title}</div>
          </div>
        )}

        {/* Language badge */}
        <div style={{ position:'absolute', top:8, right:8, fontSize:9, fontWeight:600, padding:'2px 6px', borderRadius:10, background:'rgba(255,255,255,0.88)', color: hasCover ? '#444' : palette.color, fontFamily: isBangla ? 'var(--font-bangla)' : 'var(--font-body)', backdropFilter:'blur(4px)' }}>
          {book.language === 'বাংলা' ? 'বাং' : book.language === 'English' ? 'EN' : book.language?.[0] || '?'}
        </div>

        {/* Wishlist heart */}
        {book.wishlist && (
          <div style={{ position:'absolute', top:8, left:8, fontSize:12, background:'rgba(255,255,255,0.88)', borderRadius:10, padding:'2px 6px', color:'#c0392b' }}>♥</div>
        )}
      </div>

      {/* Info */}
      <div style={{ padding:'10px 12px' }}>
        <div style={{ fontFamily: isBangla ? 'var(--font-bangla)' : 'var(--font-display)', fontSize:13, fontWeight:600, color:'var(--ink)', marginBottom:2, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{book.title}</div>
        <div style={{ fontSize:11, color:'var(--ink-muted)', marginBottom:6, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', fontFamily: isBangla ? 'var(--font-bangla)' : 'var(--font-body)' }}>{book.author}</div>

        {/* Genres */}
        {(() => {
          const gs = book.genres?.length ? book.genres : (book.genre ? [book.genre] : []);
          return gs.length > 0 ? (
            <div style={{ display:'flex', flexWrap:'wrap', gap:3, marginBottom:5 }}>
              {gs.slice(0,2).map(g => (
                <span key={g} style={{ fontSize:9, padding:'2px 6px', borderRadius:8, background:'var(--sepia-pale)', color:'var(--sepia)', fontWeight:500, border:'0.5px solid var(--sepia-light)' }}>{g}</span>
              ))}
              {gs.length > 2 && <span style={{ fontSize:9, padding:'2px 6px', borderRadius:8, background:'var(--paper-warm)', color:'var(--ink-faint)' }}>+{gs.length-2}</span>}
            </div>
          ) : null;
        })()}

        {/* Stars */}
        {book.rating > 0 && (
          <div style={{ fontSize:11, color:'var(--gold)', marginBottom:6, letterSpacing:1 }}>
            {'★'.repeat(book.rating)}{'☆'.repeat(5 - book.rating)}
          </div>
        )}

        {/* Status */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <span style={{ fontSize:10, fontWeight:500, padding:'2px 7px', borderRadius:10, background:statusStyle.bg, color:statusStyle.color }}>{book.status}</span>
        </div>

        {/* Progress bar */}
        {pct !== null && book.status === 'Reading' && (
          <div style={{ marginTop:8 }}>
            <div style={{ background:'var(--border-soft)', borderRadius:3, height:4 }}>
              <div style={{ width:`${pct}%`, height:4, borderRadius:3, background:'var(--sepia)' }} />
            </div>
            <div style={{ fontSize:10, color:'var(--ink-faint)', marginTop:2 }}>{pct}% · p.{book.currentPage}/{book.totalPages}</div>
          </div>
        )}
      </div>
    </div>
  );
}
