import React, { useEffect, useState, useMemo } from 'react';
import { getBooks } from '../services/books';
import { db } from '../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import BookCard from '../components/BookCard';
import { Search, Plus, Target, Edit2, Check, X } from 'lucide-react';

const FILTERS = ['All', 'Reading', 'Finished', 'To Read', 'Paused', 'Wishlist'];

const CURRENT_YEAR = new Date().getFullYear();

export default function Library({ user, onOpenBook, onAddBook, onEditBook }) {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('All');
  const [langFilter, setLangFilter] = useState('All');
  const [sortBy, setSortBy] = useState('recent');

  // Reading goal state
  const [goal, setGoal] = useState(null); // { target, year }
  const [editingGoal, setEditingGoal] = useState(false);
  const [goalInput, setGoalInput] = useState('');
  const currentYear = CURRENT_YEAR;

  const load = async () => {
    setLoading(true);
    const data = await getBooks(user.uid);
    setBooks(data);
    setLoading(false);
  };

  const loadGoal = async () => {
    try {
      const ref = doc(db, 'users', user.uid, 'settings', 'readingGoal');
      const snap = await getDoc(ref);
      if (snap.exists()) setGoal(snap.data());
    } catch {}
  };

  const saveGoal = async () => {
    const target = parseInt(goalInput);
    if (!target || target < 1) return;
    const newGoal = { target, year: currentYear };
    try {
      await setDoc(doc(db, 'users', user.uid, 'settings', 'readingGoal'), newGoal);
      setGoal(newGoal);
      setEditingGoal(false);
    } catch {}
  };

  useEffect(() => { load(); loadGoal(); }, [user.uid]); // eslint-disable-line react-hooks/exhaustive-deps

  const filtered = useMemo(() => {
    let list = [...books];
    if (filter === 'Wishlist') list = list.filter(b => b.wishlist);
    else if (filter !== 'All') list = list.filter(b => b.status === filter && !b.wishlist);
    if (langFilter !== 'All') list = list.filter(b => b.language === langFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(b => b.title?.toLowerCase().includes(q) || b.author?.toLowerCase().includes(q) || b.genre?.toLowerCase().includes(q));
    }
    if (sortBy === 'title') list.sort((a, b) => (a.title||'').localeCompare(b.title||''));
    else if (sortBy === 'rating') list.sort((a, b) => (b.rating||0) - (a.rating||0));
    else if (sortBy === 'author') list.sort((a, b) => (a.author||'').localeCompare(b.author||''));
    return list;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [books, filter, langFilter, search, sortBy]);

  const stats = useMemo(() => ({
    total: books.filter(b => !b.wishlist).length,
    reading: books.filter(b => b.status === 'Reading' && !b.wishlist).length,
    finished: books.filter(b => b.status === 'Finished' && !b.wishlist).length,
    wishlist: books.filter(b => b.wishlist).length,
    finishedThisYear: books.filter(b => {
      if (b.status !== 'Finished' || b.wishlist) return false;
      if (!b.updatedAt) return false;
      const d = b.updatedAt.toDate ? b.updatedAt.toDate() : new Date(b.updatedAt);
      return d.getFullYear() === currentYear;
    }).length,
  }), [books, currentYear]);

  const goalPct = goal ? Math.min(100, Math.round((stats.finishedThisYear / goal.target) * 100)) : 0;

  return (
    <div style={{ padding:'32px 32px 48px', maxWidth:1100, margin:'0 auto' }}>
      <div style={{ marginBottom:32, animation:'fadeUp 0.4s ease' }}>
        <div style={{ fontFamily:'var(--font-display)', fontSize:11, letterSpacing:'0.14em', textTransform:'uppercase', color:'var(--sepia-light)', marginBottom:4 }}>Your collection</div>
        <h1 style={{ fontFamily:'var(--font-display)', fontSize:32, fontWeight:700, color:'var(--ink)', marginBottom:20 }}>My Library</h1>

        {/* Stats row */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:12, marginBottom:20 }}>
          {[
            { label:'Total Books', value:stats.total, color:'var(--sepia)' },
            { label:'Reading Now', value:stats.reading, color:'var(--blue)' },
            { label:'Finished', value:stats.finished, color:'var(--green)' },
            { label:'Wishlist', value:stats.wishlist, color:'var(--accent)' },
          ].map(s => (
            <div key={s.label} style={{ background:'var(--paper-card)', border:'1px solid var(--border)', borderRadius:'var(--radius-md)', padding:'16px 20px', boxShadow:'var(--shadow-sm)' }}>
              <div style={{ fontSize:28, fontWeight:700, color:s.color, fontFamily:'var(--font-display)' }}>{s.value}</div>
              <div style={{ fontSize:12, color:'var(--ink-muted)', marginTop:2 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* ── Reading Goal Card ── */}
        <div style={{ background:'var(--paper-card)', border:'1px solid var(--border)', borderRadius:'var(--radius-lg)', padding:'18px 22px', marginBottom:24, boxShadow:'var(--shadow-sm)' }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom: goal ? 12 : 0 }}>
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              <Target size={16} color="var(--sepia)" />
              <span style={{ fontSize:14, fontWeight:600, color:'var(--ink)' }}>{currentYear} Reading Goal</span>
            </div>
            <button onClick={() => { setEditingGoal(true); setGoalInput(goal?.target || ''); }}
              style={{ background:'none', border:'1px solid var(--border)', borderRadius:'var(--radius-sm)', padding:'5px 10px', fontSize:12, color:'var(--ink-muted)', cursor:'pointer', display:'flex', alignItems:'center', gap:4 }}>
              <Edit2 size={12} /> {goal ? 'Edit goal' : 'Set goal'}
            </button>
          </div>

          {/* Goal edit form */}
          {editingGoal && (
            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:12 }}>
              <span style={{ fontSize:13, color:'var(--ink-muted)' }}>I want to read</span>
              <input type="number" value={goalInput} onChange={e => setGoalInput(e.target.value)}
                onKeyDown={e => { if(e.key==='Enter') saveGoal(); if(e.key==='Escape') setEditingGoal(false); }}
                placeholder="50" min="1" max="999" autoFocus
                style={{ width:70, padding:'6px 10px', border:'1px solid var(--sepia-light)', borderRadius:'var(--radius-sm)', fontSize:14, fontWeight:600, color:'var(--ink)', outline:'none', textAlign:'center' }}
              />
              <span style={{ fontSize:13, color:'var(--ink-muted)' }}>books in {currentYear}</span>
              <button onClick={saveGoal} style={{ background:'var(--sepia)', color:'white', border:'none', borderRadius:'var(--radius-sm)', padding:'6px 12px', fontSize:13, cursor:'pointer', display:'flex', alignItems:'center', gap:4 }}>
                <Check size={13} /> Save
              </button>
              <button onClick={() => setEditingGoal(false)} style={{ background:'none', border:'1px solid var(--border)', borderRadius:'var(--radius-sm)', padding:'6px 10px', cursor:'pointer', color:'var(--ink-muted)' }}>
                <X size={13} />
              </button>
            </div>
          )}

          {/* Goal progress */}
          {goal && !editingGoal && (
            <div>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom:8 }}>
                <span style={{ fontSize:13, color:'var(--ink-muted)' }}>
                  <strong style={{ fontSize:20, color:'var(--ink)', fontFamily:'var(--font-display)' }}>{stats.finishedThisYear}</strong>
                  <span style={{ color:'var(--ink-faint)' }}> / {goal.target} books</span>
                </span>
                <span style={{ fontSize:13, fontWeight:600, color: goalPct >= 100 ? 'var(--green)' : 'var(--sepia)' }}>
                  {goalPct >= 100 ? '🎉 Goal reached!' : `${goalPct}% complete`}
                </span>
              </div>
              <div style={{ background:'var(--border-soft)', borderRadius:6, height:10, overflow:'hidden' }}>
                <div style={{ width:`${goalPct}%`, height:10, borderRadius:6, background: goalPct >= 100 ? 'var(--green)' : 'var(--sepia)', transition:'width 0.6s ease' }} />
              </div>
              <div style={{ fontSize:12, color:'var(--ink-faint)', marginTop:6 }}>
                {goal.target - stats.finishedThisYear > 0
                  ? `${goal.target - stats.finishedThisYear} more book${goal.target - stats.finishedThisYear !== 1 ? 's' : ''} to reach your goal`
                  : `You've reached your ${currentYear} goal!`}
              </div>
            </div>
          )}

          {/* No goal set */}
          {!goal && !editingGoal && (
            <div style={{ fontSize:13, color:'var(--ink-faint)', marginTop:4 }}>Set a reading goal to track your progress for {currentYear}.</div>
          )}
        </div>

        {/* Search & filters */}
        <div style={{ display:'flex', gap:12, flexWrap:'wrap', alignItems:'center' }}>
          <div style={{ flex:1, minWidth:200, position:'relative' }}>
            <Search size={15} style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', color:'var(--ink-faint)' }} />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search by title, author, genre…"
              style={{ width:'100%', padding:'10px 12px 10px 36px', border:'1px solid var(--border)', borderRadius:'var(--radius-md)', fontSize:14, background:'var(--paper-card)', color:'var(--ink)', outline:'none' }}
              onFocus={e => e.target.style.borderColor='var(--sepia-light)'}
              onBlur={e => e.target.style.borderColor='var(--border)'}
            />
          </div>
          <select value={langFilter} onChange={e => setLangFilter(e.target.value)} style={{ padding:'10px 12px', border:'1px solid var(--border)', borderRadius:'var(--radius-md)', fontSize:13, background:'var(--paper-card)', color:'var(--ink)', outline:'none' }}>
            <option value="All">All languages</option>
            <option value="বাংলা">বাংলা</option>
            <option value="English">English</option>
          </select>
          <select value={sortBy} onChange={e => setSortBy(e.target.value)} style={{ padding:'10px 12px', border:'1px solid var(--border)', borderRadius:'var(--radius-md)', fontSize:13, background:'var(--paper-card)', color:'var(--ink)', outline:'none' }}>
            <option value="recent">Recently added</option>
            <option value="title">Title A–Z</option>
            <option value="author">Author A–Z</option>
            <option value="rating">Highest rated</option>
          </select>
        </div>

        {/* Status tabs */}
        <div style={{ display:'flex', gap:6, marginTop:16, flexWrap:'wrap' }}>
          {FILTERS.map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{
              padding:'6px 14px', borderRadius:20, border:'1px solid',
              borderColor: filter===f ? 'var(--sepia)' : 'var(--border)',
              background: filter===f ? 'var(--sepia-pale)' : 'transparent',
              color: filter===f ? 'var(--sepia)' : 'var(--ink-muted)',
              fontWeight: filter===f ? 500 : 400, fontSize:13, transition:'var(--transition)', cursor:'pointer'
            }}>{f}</button>
          ))}
        </div>
      </div>

      {/* Book Grid */}
      {loading ? (
        <div style={{ display:'flex', alignItems:'center', justifyContent:'center', padding:'80px 0', flexDirection:'column', gap:12 }}>
          <div style={{ width:36, height:36, border:'2px solid var(--border)', borderTopColor:'var(--sepia)', borderRadius:'50%', animation:'spin 0.8s linear infinite' }} />
          <div style={{ fontSize:14, color:'var(--ink-muted)' }}>Loading your library…</div>
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign:'center', padding:'80px 0', animation:'fadeIn 0.4s ease' }}>
          <div style={{ fontSize:48, marginBottom:16 }}>📚</div>
          <div style={{ fontFamily:'var(--font-display)', fontSize:20, fontWeight:600, color:'var(--ink)', marginBottom:8 }}>
            {books.length === 0 ? 'Your library is empty' : 'No books found'}
          </div>
          <div style={{ fontSize:14, color:'var(--ink-muted)', marginBottom:24 }}>
            {books.length === 0 ? 'Start by adding your first book.' : 'Try adjusting your search or filters.'}
          </div>
          {books.length === 0 && (
            <button onClick={onAddBook} style={{ display:'inline-flex', alignItems:'center', gap:8, background:'var(--accent)', color:'white', border:'none', borderRadius:'var(--radius-md)', padding:'12px 24px', fontSize:15, fontWeight:500, cursor:'pointer' }}>
              <Plus size={16} /> Add your first book
            </button>
          )}
        </div>
      ) : (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(160px, 1fr))', gap:16 }}>
          {filtered.map((book, i) => (
            <div key={book.id} style={{ animation:`fadeUp 0.35s ease ${i * 0.04}s both` }}>
              <BookCard book={book} onClick={() => onOpenBook(book.id)} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
