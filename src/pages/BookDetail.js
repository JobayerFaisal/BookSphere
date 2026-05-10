import React, { useEffect, useState } from 'react';
import { getBook, updateBook, deleteBook } from '../services/books';
import { getSessions, addSession, deleteSession } from '../services/sessions';
import { ArrowLeft, Edit2, Trash2, Plus, Trash, BookMarked } from 'lucide-react';
import StoriesTracker from '../components/StoriesTracker';
import { db } from '../firebase';
import { doc, setDoc, deleteDoc, getDoc, serverTimestamp } from 'firebase/firestore'; // eslint-disable-line no-unused-vars

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

export default function BookDetail({ user, bookId, onBack, onEdit }) {
  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pageInput, setPageInput] = useState('');
  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [sessions, setSessions] = useState([]);
  const [sessionDate, setSessionDate] = useState(new Date().toISOString().slice(0,10));
  const [sessionPages, setSessionPages] = useState('');
  const [sessionNotes, setSessionNotes] = useState('');
  const [addingSession, setAddingSession] = useState(false);
  const [sessionFormOpen, setSessionFormOpen] = useState(false);
  const [shareId, setShareId] = useState(null); // eslint-disable-line no-unused-vars

  const [seriesMode, setSeriesMode] = useState(false);

  const load = async () => {
    setLoading(true);
    const b = await getBook(user.uid, bookId);
    setBook(b);
    setPageInput(b?.currentPage || '');
    const s = await getSessions(user.uid, bookId);
    setSessions(s);
    try {
      const sid = `${user.uid}_${bookId}`;
      const snap = await getDoc(doc(db, 'shares', sid));
      setShareId(snap.exists() ? sid : null);
    } catch {}
    setLoading(false);
  };
  useEffect(() => { load(); }, [bookId]); // eslint-disable-line react-hooks/exhaustive-deps

  const updatePage = async () => {
    const pg = parseInt(pageInput);
    if (!pg || pg < 0) return;
    setUpdating(true);
    const updates = { currentPage: pg };
    if (book.totalPages && pg >= book.totalPages) updates.status = 'Finished';
    else if (book.status === 'To Read') updates.status = 'Reading';
    await updateBook(user.uid, bookId, updates);
    await load();
    setUpdating(false);
  };

  const handleAddSession = async () => {
    if (!sessionPages || parseInt(sessionPages) < 1) return;
    setAddingSession(true);
    await addSession(user.uid, bookId, { date: sessionDate, pagesRead: parseInt(sessionPages), notes: sessionNotes });
    setSessionPages(''); setSessionNotes(''); setSessionFormOpen(false);
    const s = await getSessions(user.uid, bookId);
    setSessions(s);
    setAddingSession(false);
  };

  const handleDeleteSession = async (sessionId) => {
    await deleteSession(user.uid, bookId, sessionId);
    setSessions(prev => prev.filter(s => s.id !== sessionId));
  };

  const handleDelete = async () => {
    setDeleting(true);
    await deleteBook(user.uid, bookId);
    onBack();
  };

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'60vh' }}>
      <div style={{ width:32, height:32, border:'2px solid var(--border)', borderTopColor:'var(--sepia)', borderRadius:'50%', animation:'spin 0.8s linear infinite' }} />
    </div>
  );
  if (!book) return <div style={{ padding:32 }}>Book not found.</div>;

  const isBangla = book.language === 'বাংলা';
  const palette = getCoverPalette(book.title);
  const pct = book.totalPages && book.currentPage ? Math.round((book.currentPage/book.totalPages)*100) : null;
  const statusStyle = STATUS_COLORS[book.status] || STATUS_COLORS['To Read'];

  const Section = ({ title, children }) => (
    <div style={{ background:'var(--paper-card)', border:'1px solid var(--border)', borderRadius:'var(--radius-lg)', padding:'20px 24px', marginBottom:16 }}>
      <div style={{ fontSize:11, fontWeight:600, letterSpacing:'0.12em', textTransform:'uppercase', color:'var(--ink-muted)', marginBottom:14 }}>{title}</div>
      {children}
    </div>
  );

  return (
    <div style={{ padding:'32px', maxWidth:780, margin:'0 auto', animation:'fadeIn 0.3s ease' }}>
      {/* Back */}
      <button onClick={onBack} style={{ display:'flex', alignItems:'center', gap:6, background:'none', border:'none', color:'var(--sepia)', fontSize:14, cursor:'pointer', marginBottom:24, fontFamily:'var(--font-body)' }}>
        <ArrowLeft size={16} /> Back to Library
      </button>

      {/* Hero */}
      <div style={{ display:'flex', gap:24, marginBottom:24, background:'var(--paper-card)', border:'1px solid var(--border)', borderRadius:'var(--radius-lg)', padding:24 }}>
        <div style={{ width:110, height:150, borderRadius:8, background:palette.bg, display:'flex', alignItems:'center', justifyContent:'center', padding:12, flexShrink:0 }}>
          <div style={{ fontFamily: isBangla ? 'var(--font-bangla)' : 'var(--font-display)', fontSize: isBangla ? 14 : 12, fontWeight:600, color:palette.color, textAlign:'center', lineHeight:1.4 }}>{book.title}</div>
        </div>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginBottom:10 }}>
            {book.wishlist && <span style={{ fontSize:11, fontWeight:600, padding:'3px 9px', borderRadius:12, background:'var(--accent-pale)', color:'var(--accent)' }}>♥ Wishlist</span>}
            <span style={{ fontSize:11, fontWeight:500, padding:'3px 9px', borderRadius:12, background:statusStyle.bg, color:statusStyle.color }}>{book.status}</span>
            {book.language && <span style={{ fontSize:11, padding:'3px 9px', borderRadius:12, background:'var(--sepia-pale)', color:'var(--sepia)', fontFamily: isBangla ? 'var(--font-bangla)' : 'var(--font-body)' }}>{book.language}</span>}
            {(() => {
              const gs = book.genres?.length ? book.genres : (book.genre ? [book.genre] : []);
              return gs.map(g => (
                <span key={g} style={{ fontSize:11, padding:'3px 9px', borderRadius:12, background:'var(--paper-warm)', color:'var(--ink-muted)', border:'1px solid var(--border)' }}>{g}</span>
              ));
            })()}
            {book.shelf && <span style={{ fontSize:11, padding:'3px 9px', borderRadius:12, background:'var(--blue-pale)', color:'var(--blue)' }}>📚 {book.shelf}</span>}
          </div>

          <h1 style={{ fontFamily: isBangla ? 'var(--font-bangla)' : 'var(--font-display)', fontSize: isBangla ? 22 : 26, fontWeight:700, color:'var(--ink)', marginBottom:4, lineHeight:1.3 }}>{book.title}</h1>
          <div style={{ fontSize:15, color:'var(--ink-muted)', marginBottom:12, fontFamily: isBangla ? 'var(--font-bangla)' : 'var(--font-body)' }}>{book.author}</div>

          {book.rating > 0 && (
            <div style={{ fontSize:20, color:'var(--gold)', letterSpacing:2, marginBottom:12 }}>
              {'★'.repeat(book.rating)}{'☆'.repeat(5-book.rating)}
              <span style={{ fontSize:13, color:'var(--ink-muted)', fontFamily:'var(--font-body)', marginLeft:8 }}>{book.rating} / 5</span>
            </div>
          )}

          <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
            <button onClick={() => onEdit(book)} style={{ display:'flex', alignItems:'center', gap:6, padding:'8px 16px', background:'var(--sepia-pale)', border:'none', borderRadius:'var(--radius-md)', color:'var(--sepia)', fontSize:13, fontWeight:500, cursor:'pointer' }}>
              <Edit2 size={14} /> Edit
            </button>
            <button onClick={() => setConfirmDelete(true)} style={{ display:'flex', alignItems:'center', gap:6, padding:'8px 16px', background:'var(--accent-pale)', border:'none', borderRadius:'var(--radius-md)', color:'var(--accent)', fontSize:13, cursor:'pointer' }}>
              <Trash2 size={14} /> Delete
            </button>
          </div>
        </div>
      </div>

      {/* Progress */}
      {!book.wishlist && (
        <Section title="Reading Progress">
          {pct !== null ? (
            <>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom:8 }}>
                <span style={{ fontFamily:'var(--font-display)', fontSize:28, fontWeight:700, color:'var(--ink)' }}>Page {book.currentPage}</span>
                <span style={{ fontSize:14, color:'var(--ink-muted)' }}>of {book.totalPages} · <strong style={{ color:'var(--sepia)' }}>{pct}%</strong></span>
              </div>
              <div style={{ background:'var(--border-soft)', borderRadius:6, height:10, marginBottom:8 }}>
                <div style={{ width:`${pct}%`, height:10, borderRadius:6, background:'var(--sepia)', transition:'width 0.5s ease' }} />
              </div>
              {book.status === 'Finished' && <div style={{ fontSize:13, color:'var(--green)', fontWeight:500 }}>✓ Finished reading</div>}
            </>
          ) : (
            <div style={{ fontSize:14, color:'var(--ink-muted)', marginBottom:12 }}>Track your progress by updating your current page.</div>
          )}
          {book.status !== 'Finished' && book.totalPages && (
            <div style={{ display:'flex', gap:8, marginTop:12 }}>
              <input type="number" value={pageInput} onChange={e=>setPageInput(e.target.value)} placeholder="Current page"
                style={{ width:140, padding:'9px 12px', border:'1px solid var(--border)', borderRadius:'var(--radius-sm)', fontSize:14, outline:'none' }}
                onFocus={e=>e.target.style.borderColor='var(--sepia-light)'}
                onBlur={e=>e.target.style.borderColor='var(--border)'}
                onKeyDown={e=>{ if(e.key==='Enter') updatePage(); }}
              />
              <button onClick={updatePage} disabled={updating} style={{ padding:'9px 18px', background:'var(--sepia)', color:'white', border:'none', borderRadius:'var(--radius-sm)', fontSize:14, cursor:'pointer', fontWeight:500 }}>
                {updating ? 'Saving…' : 'Update'}
              </button>
            </div>
          )}
        </Section>
      )}

      {/* Book details */}
      <Section title="Book Details">
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px 24px' }}>
          {[
            ['Publisher', book.publisher],
            ['Year', book.year],
            ['ISBN', book.isbn],
            ['Edition', book.edition],
            ['Pages', book.totalPages],
            ['Acquired from', book.acquired],
          ].filter(([,v])=>v).map(([k,v]) => (
            <div key={k} style={{ borderBottom:'1px solid var(--border-soft)', paddingBottom:8 }}>
              <div style={{ fontSize:11, color:'var(--ink-faint)', marginBottom:2 }}>{k}</div>
              <div style={{ fontSize:14, color:'var(--ink)', fontWeight:500 }}>{v}</div>
            </div>
          ))}
        </div>
        {Object.values([book.publisher,book.year,book.isbn,book.edition,book.totalPages,book.acquired]).every(v=>!v) && (
          <div style={{ fontSize:14, color:'var(--ink-muted)' }}>No details added yet. Click Edit to add more info.</div>
        )}
      </Section>

      {/* Review */}
      {book.review && (
        <Section title="Your Review">
          <div style={{ fontSize:15, color:'var(--ink)', lineHeight:1.8, fontFamily: isBangla ? 'var(--font-bangla)' : 'var(--font-body)', borderLeft:'3px solid var(--sepia-light)', paddingLeft:16 }}>{book.review}</div>
        </Section>
      )}

      {/* Notes */}
      {book.notes && (
        <Section title="Notes">
          <div style={{ fontSize:14, color:'var(--ink-soft)', lineHeight:1.8, whiteSpace:'pre-wrap', fontFamily: isBangla ? 'var(--font-bangla)' : 'var(--font-body)' }}>{book.notes}</div>
        </Section>
      )}

      {/* Stories / Parts tracker */}
      <div style={{ background:'var(--paper-card)', border:'1px solid var(--border)', borderRadius:'var(--radius-lg)', padding:'20px 24px', marginBottom:16 }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom: seriesMode ? 16 : 0 }}>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <BookMarked size={15} color="var(--sepia)" />
            <span style={{ fontSize:11, fontWeight:600, letterSpacing:'0.12em', textTransform:'uppercase', color:'var(--ink-muted)' }}>Stories / Parts</span>
          </div>
          <button onClick={() => setSeriesMode(m => !m)} style={{
            fontSize:12, padding:'5px 12px', borderRadius:20, border:'1px solid',
            borderColor: seriesMode ? 'var(--sepia)' : 'var(--border)',
            background: seriesMode ? 'var(--sepia-pale)' : 'transparent',
            color: seriesMode ? 'var(--sepia)' : 'var(--ink-muted)',
            cursor:'pointer', fontWeight: seriesMode ? 500 : 400, transition:'var(--transition)'
          }}>
            {seriesMode ? 'Hide' : 'Track stories & chapters'}
          </button>
        </div>
        {!seriesMode && (
          <div style={{ marginTop:8, fontSize:13, color:'var(--ink-faint)' }}>
            Use this for collected works, omnibus editions, or any book with multiple stories inside.
          </div>
        )}
        {seriesMode && <StoriesTracker user={user} bookId={bookId} />}
      </div>

      {/* Tags */}
      {book.tags?.length > 0 && (
        <Section title="Tags">
          <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
            {book.tags.map(t => (
              <span key={t} style={{ padding:'4px 12px', background:'var(--sepia-pale)', border:'1px solid var(--sepia-light)', borderRadius:20, fontSize:12, color:'var(--sepia)', fontWeight:500 }}>{t}</span>
            ))}
          </div>
        </Section>
      )}

      {/* Reading Sessions */}
      <Section title="Reading Sessions">
        <div style={{ marginBottom:12 }}>
          {sessions.length === 0 && !sessionFormOpen && (
            <div style={{ fontSize:13, color:'var(--ink-muted)', marginBottom:12 }}>No sessions logged yet. Track each time you sit down to read.</div>
          )}
          {sessions.length > 0 && (
            <div style={{ marginBottom:12 }}>
              {/* Mini pace chart */}
              <div style={{ display:'flex', alignItems:'flex-end', gap:4, height:48, marginBottom:10 }}>
                {sessions.slice(0,14).reverse().map((s,i) => {
                  const max = Math.max(...sessions.map(x=>x.pagesRead||1));
                  const h = Math.max(4, Math.round(((s.pagesRead||0)/max)*44));
                  return <div key={s.id} title={`${s.pagesRead} pages · ${s.date}`} style={{ flex:1, height:h, background:'var(--sepia)', borderRadius:'3px 3px 0 0', opacity:0.7+i*0.02, minWidth:8 }} />;
                })}
              </div>
              <div style={{ fontSize:11, color:'var(--ink-faint)', marginBottom:10 }}>
                {sessions.length} session{sessions.length!==1?'s':''} · {sessions.reduce((a,s)=>a+(s.pagesRead||0),0)} pages total
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:6, maxHeight:200, overflowY:'auto' }}>
                {sessions.map(s => (
                  <div key={s.id} style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 12px', background:'var(--paper-warm)', borderRadius:'var(--radius-sm)', border:'1px solid var(--border)' }}>
                    <div style={{ flex:1 }}>
                      <span style={{ fontSize:13, fontWeight:500, color:'var(--ink)' }}>{s.pagesRead} pages</span>
                      <span style={{ fontSize:12, color:'var(--ink-muted)', marginLeft:8 }}>{s.date}</span>
                      {s.notes && <div style={{ fontSize:11, color:'var(--ink-faint)', marginTop:2 }}>{s.notes}</div>}
                    </div>
                    <button onClick={()=>handleDeleteSession(s.id)} style={{ background:'none', border:'none', color:'var(--ink-faint)', cursor:'pointer', padding:4 }}><Trash size={13}/></button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {sessionFormOpen ? (
            <div style={{ background:'var(--paper-warm)', border:'1px solid var(--border)', borderRadius:'var(--radius-md)', padding:14 }}>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:10 }}>
                <div>
                  <label style={{ fontSize:11, fontWeight:500, color:'var(--ink-muted)', display:'block', marginBottom:4 }}>Date</label>
                  <input type="date" value={sessionDate} onChange={e=>setSessionDate(e.target.value)}
                    style={{ width:'100%', padding:'8px 10px', border:'1px solid var(--border)', borderRadius:'var(--radius-sm)', fontSize:13, background:'var(--paper-card)', color:'var(--ink)', outline:'none' }}/>
                </div>
                <div>
                  <label style={{ fontSize:11, fontWeight:500, color:'var(--ink-muted)', display:'block', marginBottom:4 }}>Pages read</label>
                  <input type="number" value={sessionPages} onChange={e=>setSessionPages(e.target.value)} placeholder="30" min="1"
                    style={{ width:'100%', padding:'8px 10px', border:'1px solid var(--border)', borderRadius:'var(--radius-sm)', fontSize:13, background:'var(--paper-card)', color:'var(--ink)', outline:'none' }}/>
                </div>
              </div>
              <input value={sessionNotes} onChange={e=>setSessionNotes(e.target.value)} placeholder="Notes (optional)"
                style={{ width:'100%', padding:'8px 10px', border:'1px solid var(--border)', borderRadius:'var(--radius-sm)', fontSize:13, background:'var(--paper-card)', color:'var(--ink)', outline:'none', marginBottom:10 }}/>
              <div style={{ display:'flex', gap:8 }}>
                <button onClick={handleAddSession} disabled={addingSession} style={{ padding:'8px 16px', background:'var(--sepia)', color:'white', border:'none', borderRadius:'var(--radius-sm)', fontSize:13, fontWeight:500, cursor:'pointer' }}>
                  {addingSession ? 'Saving…' : 'Log session'}
                </button>
                <button onClick={()=>setSessionFormOpen(false)} style={{ padding:'8px 12px', background:'transparent', border:'1px solid var(--border)', borderRadius:'var(--radius-sm)', fontSize:13, cursor:'pointer', color:'var(--ink-muted)' }}>Cancel</button>
              </div>
            </div>
          ) : (
            <button onClick={()=>setSessionFormOpen(true)} style={{ display:'flex', alignItems:'center', gap:6, padding:'8px 14px', background:'transparent', border:'1px solid var(--border)', borderRadius:'var(--radius-md)', fontSize:13, color:'var(--ink-muted)', cursor:'pointer' }}>
              <Plus size={13}/> Log reading session
            </button>
          )}
        </div>
      </Section>

      {/* Delete confirm */}
      {confirmDelete && (
        <div style={{ position:'fixed', inset:0, zIndex:500, display:'flex', alignItems:'center', justifyContent:'center', background:'rgba(0,0,0,0.4)' }}>
          <div style={{ background:'var(--paper-card)', borderRadius:'var(--radius-xl)', padding:32, maxWidth:360, width:'90%', textAlign:'center', boxShadow:'var(--shadow-lg)' }}>
            <div style={{ fontSize:32, marginBottom:12 }}>🗑️</div>
            <h3 style={{ fontFamily:'var(--font-display)', fontSize:20, marginBottom:8 }}>Delete this book?</h3>
            <p style={{ fontSize:14, color:'var(--ink-muted)', marginBottom:24 }}>"{book.title}" will be permanently removed from your library.</p>
            <div style={{ display:'flex', gap:10, justifyContent:'center' }}>
              <button onClick={() => setConfirmDelete(false)} style={{ padding:'10px 20px', border:'1px solid var(--border)', borderRadius:'var(--radius-md)', background:'transparent', fontSize:14, cursor:'pointer' }}>Cancel</button>
              <button onClick={handleDelete} disabled={deleting} style={{ padding:'10px 20px', border:'none', borderRadius:'var(--radius-md)', background:'var(--accent)', color:'white', fontSize:14, fontWeight:500, cursor:'pointer' }}>
                {deleting ? 'Deleting…' : 'Yes, delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
