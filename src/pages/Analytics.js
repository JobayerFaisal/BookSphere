import React, { useEffect, useState, useMemo } from 'react';
import { getBooks } from '../services/books';

function Bar({ label, value, max, color }) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:10 }}>
      <div style={{ width:90, fontSize:13, color:'var(--ink-soft)', textAlign:'right', flexShrink:0, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{label}</div>
      <div style={{ flex:1, background:'var(--border-soft)', borderRadius:4, height:14, overflow:'hidden' }}>
        <div style={{ width:`${pct}%`, height:14, borderRadius:4, background:color, transition:'width 0.6s ease' }} />
      </div>
      <div style={{ width:28, fontSize:13, fontWeight:600, color:'var(--ink)', textAlign:'right', flexShrink:0 }}>{value}</div>
    </div>
  );
}

function StatCard({ label, value, sub, color }) {
  return (
    <div style={{ background:'var(--paper-card)', border:'1px solid var(--border)', borderRadius:'var(--radius-lg)', padding:'20px 22px', boxShadow:'var(--shadow-sm)' }}>
      <div style={{ fontFamily:'var(--font-display)', fontSize:34, fontWeight:700, color: color || 'var(--ink)' }}>{value}</div>
      <div style={{ fontSize:13, color:'var(--ink-muted)', marginTop:2 }}>{label}</div>
      {sub && <div style={{ fontSize:12, color:'var(--ink-faint)', marginTop:4 }}>{sub}</div>}
    </div>
  );
}

export default function Analytics({ user }) {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getBooks(user.uid).then(data => { setBooks(data.filter(b=>!b.wishlist)); setLoading(false); });
  }, [user.uid]);

  const stats = useMemo(() => {
    if (!books.length) return null;
    const total = books.length;
    const finished = books.filter(b=>b.status==='Finished').length;
    const reading = books.filter(b=>b.status==='Reading').length;
    const rated = books.filter(b=>b.rating>0);
    const avgRating = rated.length ? (rated.reduce((s,b)=>s+b.rating,0)/rated.length).toFixed(1) : '—';

    // Genre breakdown
    const genres = {};
    books.forEach(b => { const g = b.genre||'Other'; genres[g]=(genres[g]||0)+1; });
    const genreArr = Object.entries(genres).sort((a,b)=>b[1]-a[1]);

    // Language
    const langs = {};
    books.forEach(b => { const l=b.language||'Other'; langs[l]=(langs[l]||0)+1; });

    // Status breakdown
    const statuses = {};
    books.forEach(b => { statuses[b.status]=(statuses[b.status]||0)+1; });

    // Rating distribution
    const ratings = {1:0,2:0,3:0,4:0,5:0};
    rated.forEach(b => ratings[b.rating]++);

    // Shelves
    const shelves = {};
    books.forEach(b => { const s=b.shelf||'Unshelved'; shelves[s]=(shelves[s]||0)+1; });
    const shelfArr = Object.entries(shelves).sort((a,b)=>b[1]-a[1]).slice(0,6);

    // Top rated books
    const topRated = [...books].filter(b=>b.rating===5).slice(0,5);

    const pagesRead = books.filter(b=>b.status==='Finished'&&b.totalPages).reduce((s,b)=>s+b.totalPages,0);

    return { total, finished, reading, avgRating, genreArr, langs, statuses, ratings, shelfArr, topRated, pagesRead, rated: rated.length };
  }, [books]);

  const COLORS = { genre:'var(--sepia)', lang:'var(--blue)', rating:'var(--gold)', shelf:'var(--green)' };
  const GENRE_COLORS = ['#8b6f47','#c0392b','#2980b9','#27ae60','#8e44ad','#e67e22','#16a085'];

  return (
    <div style={{ padding:'32px', maxWidth:1000, margin:'0 auto' }}>
      <div style={{ marginBottom:28, animation:'fadeUp 0.4s ease' }}>
        <div style={{ fontFamily:'var(--font-display)', fontSize:11, letterSpacing:'0.14em', textTransform:'uppercase', color:'var(--sepia-light)', marginBottom:4 }}>Insights</div>
        <h1 style={{ fontFamily:'var(--font-display)', fontSize:32, fontWeight:700 }}>Reading Analytics</h1>
      </div>

      {loading ? (
        <div style={{ display:'flex', justifyContent:'center', paddingTop:80 }}>
          <div style={{ width:32, height:32, border:'2px solid var(--border)', borderTopColor:'var(--sepia)', borderRadius:'50%', animation:'spin 0.8s linear infinite' }} />
        </div>
      ) : !stats ? (
        <div style={{ textAlign:'center', padding:'80px 0' }}>
          <div style={{ fontSize:48, marginBottom:12 }}>📊</div>
          <div style={{ fontFamily:'var(--font-display)', fontSize:18, color:'var(--ink)' }}>Add some books to see your analytics</div>
        </div>
      ) : (
        <>
          {/* Key stats */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(180px, 1fr))', gap:14, marginBottom:28 }}>
            <StatCard label="Books in library" value={stats.total} color="var(--sepia)" />
            <StatCard label="Finished reading" value={stats.finished} sub={`${Math.round(stats.finished/stats.total*100)}% completion rate`} color="var(--green)" />
            <StatCard label="Currently reading" value={stats.reading} color="var(--blue)" />
            <StatCard label="Average rating" value={stats.avgRating} sub={`from ${stats.rated} rated books`} color="var(--gold)" />
            <StatCard label="Pages read" value={stats.pagesRead.toLocaleString()} sub="from finished books" color="var(--sepia)" />
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20, marginBottom:20 }}>
            {/* Genre chart */}
            <div style={{ background:'var(--paper-card)', border:'1px solid var(--border)', borderRadius:'var(--radius-lg)', padding:'20px 22px' }}>
              <div style={{ fontSize:11, fontWeight:600, letterSpacing:'0.12em', textTransform:'uppercase', color:'var(--ink-muted)', marginBottom:16 }}>Books by genre</div>
              {stats.genreArr.slice(0,8).map(([g, n], i) => (
                <Bar key={g} label={g} value={n} max={stats.genreArr[0][1]} color={GENRE_COLORS[i % GENRE_COLORS.length]} />
              ))}
            </div>

            {/* Language + Status */}
            <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
              <div style={{ background:'var(--paper-card)', border:'1px solid var(--border)', borderRadius:'var(--radius-lg)', padding:'20px 22px' }}>
                <div style={{ fontSize:11, fontWeight:600, letterSpacing:'0.12em', textTransform:'uppercase', color:'var(--ink-muted)', marginBottom:14 }}>Language split</div>
                <div style={{ display:'flex', gap:12, flexWrap:'wrap' }}>
                  {Object.entries(stats.langs).map(([l,n]) => (
                    <div key={l} style={{ textAlign:'center', flex:1, minWidth:60 }}>
                      <div style={{ fontFamily:'var(--font-display)', fontSize:28, fontWeight:700, color:'var(--sepia)' }}>{n}</div>
                      <div style={{ fontSize:12, color:'var(--ink-muted)', fontFamily: l==='বাংলা' ? 'var(--font-bangla)' : 'var(--font-body)' }}>{l}</div>
                      <div style={{ fontSize:11, color:'var(--ink-faint)' }}>{Math.round(n/stats.total*100)}%</div>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ background:'var(--paper-card)', border:'1px solid var(--border)', borderRadius:'var(--radius-lg)', padding:'20px 22px' }}>
                <div style={{ fontSize:11, fontWeight:600, letterSpacing:'0.12em', textTransform:'uppercase', color:'var(--ink-muted)', marginBottom:14 }}>Reading status</div>
                {Object.entries(stats.statuses).map(([s,n]) => (
                  <Bar key={s} label={s} value={n} max={stats.total} color="var(--sepia-light)" />
                ))}
              </div>
            </div>
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20 }}>
            {/* Rating distribution */}
            <div style={{ background:'var(--paper-card)', border:'1px solid var(--border)', borderRadius:'var(--radius-lg)', padding:'20px 22px' }}>
              <div style={{ fontSize:11, fontWeight:600, letterSpacing:'0.12em', textTransform:'uppercase', color:'var(--ink-muted)', marginBottom:16 }}>Rating distribution</div>
              {[5,4,3,2,1].map(r => (
                <Bar key={r} label={'★'.repeat(r)} value={stats.ratings[r]} max={Math.max(...Object.values(stats.ratings))} color="var(--gold)" />
              ))}
            </div>

            {/* Top shelves */}
            <div style={{ background:'var(--paper-card)', border:'1px solid var(--border)', borderRadius:'var(--radius-lg)', padding:'20px 22px' }}>
              <div style={{ fontSize:11, fontWeight:600, letterSpacing:'0.12em', textTransform:'uppercase', color:'var(--ink-muted)', marginBottom:16 }}>Top shelves</div>
              {stats.shelfArr.length > 0 ? stats.shelfArr.map(([s,n]) => (
                <Bar key={s} label={s} value={n} max={stats.shelfArr[0][1]} color="#27ae60" />
              )) : <div style={{ fontSize:14, color:'var(--ink-muted)' }}>No shelves created yet.</div>}
            </div>
          </div>

          {/* 5-star books */}
          {stats.topRated.length > 0 && (
            <div style={{ background:'var(--paper-card)', border:'1px solid var(--border)', borderRadius:'var(--radius-lg)', padding:'20px 22px', marginTop:20 }}>
              <div style={{ fontSize:11, fontWeight:600, letterSpacing:'0.12em', textTransform:'uppercase', color:'var(--ink-muted)', marginBottom:14 }}>Your 5-star books ★★★★★</div>
              <div style={{ display:'flex', flexWrap:'wrap', gap:10 }}>
                {stats.topRated.map(b => (
                  <div key={b.id} style={{ padding:'8px 14px', background:'var(--gold-pale)', border:'1px solid #f0d080', borderRadius:'var(--radius-md)' }}>
                    <div style={{ fontSize:13, fontWeight:600, color:'var(--ink)', fontFamily: b.language==='বাংলা' ? 'var(--font-bangla)' : 'var(--font-body)' }}>{b.title}</div>
                    <div style={{ fontSize:11, color:'var(--ink-muted)' }}>{b.author}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
