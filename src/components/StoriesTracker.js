import React, { useState, useEffect } from 'react';
import {
  getStories, addStory, updateStory, deleteStory, reorderStories, STORY_STATUSES
} from '../services/stories';
import { Plus, Trash2, ChevronUp, ChevronDown, Edit2, Check, X } from 'lucide-react';

const STATUS_CONFIG = {
  'To Read':  { icon:'○', color:'var(--ink-faint)',  bg:'var(--paper-warm)',  border:'var(--border)' },
  'Reading':  { icon:'◑', color:'var(--blue)',       bg:'var(--blue-pale)',   border:'var(--blue)' },
  'Finished': { icon:'●', color:'var(--green)',      bg:'var(--green-pale)',  border:'var(--green)' },
  'Skipped':  { icon:'⊘', color:'var(--ink-faint)',  bg:'var(--paper-warm)',  border:'var(--border)' },
};

function StoryRow({ story, index, total, onUpdate, onDelete, onMoveUp, onMoveDown }) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(story.title);
  const [notes, setNotes] = useState(story.notes || '');
  const [rating, setRating] = useState(story.rating || 0);
  const [showNotes, setShowNotes] = useState(false);
  const cfg = STATUS_CONFIG[story.status] || STATUS_CONFIG['To Read'];

  const cycleStatus = () => {
    const idx = STORY_STATUSES.indexOf(story.status);
    const next = STORY_STATUSES[(idx + 1) % STORY_STATUSES.length];
    onUpdate({ status: next });
  };

  const saveEdit = () => {
    if (!title.trim()) return;
    onUpdate({ title: title.trim(), notes, rating });
    setEditing(false);
  };

  const cancelEdit = () => {
    setTitle(story.title); setNotes(story.notes || ''); setRating(story.rating || 0);
    setEditing(false);
  };

  return (
    <div style={{ marginBottom:6 }}>
      <div style={{
        display:'flex', alignItems:'center', gap:10, padding:'10px 14px',
        background:'var(--paper-card)', border:'1px solid var(--border)',
        borderRadius:'var(--radius-md)', transition:'var(--transition)',
        borderLeft: `3px solid ${cfg.border}`
      }}>
        {/* Order number */}
        <div style={{ width:22, fontSize:12, color:'var(--ink-faint)', textAlign:'center', flexShrink:0, fontWeight:500 }}>{index + 1}</div>

        {/* Status toggle button */}
        <button onClick={cycleStatus} title={`Status: ${story.status} — click to change`} style={{
          width:28, height:28, borderRadius:'50%', border:`2px solid ${cfg.border}`,
          background:cfg.bg, color:cfg.color, fontSize:14, cursor:'pointer',
          display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0,
          transition:'var(--transition)', fontWeight:600
        }}>{cfg.icon}</button>

        {/* Title */}
        <div style={{ flex:1, minWidth:0 }}>
          {editing ? (
            <input value={title} onChange={e => setTitle(e.target.value)}
              onKeyDown={e => { if(e.key==='Enter') saveEdit(); if(e.key==='Escape') cancelEdit(); }}
              autoFocus
              style={{ width:'100%', padding:'4px 8px', border:'1px solid var(--sepia-light)', borderRadius:'var(--radius-sm)', fontSize:14, fontFamily:'var(--font-body)', background:'var(--paper-card)', color:'var(--ink)', outline:'none' }}
            />
          ) : (
            <div
              onClick={() => setShowNotes(n => !n)}
              style={{
                fontSize:14, color: story.status === 'Finished' ? 'var(--ink-muted)' : 'var(--ink)',
                fontWeight: story.status === 'Reading' ? 500 : 400,
                textDecoration: story.status === 'Skipped' ? 'line-through' : 'none',
                cursor:'pointer', fontFamily:'var(--font-body)'
              }}
            >{story.title}</div>
          )}
          {/* Per-story rating */}
          {!editing && story.rating > 0 && (
            <div style={{ fontSize:10, color:'var(--gold)', marginTop:2, letterSpacing:1 }}>{'★'.repeat(story.rating)}{'☆'.repeat(5-story.rating)}</div>
          )}
          {!editing && story.notes && showNotes && (
            <div style={{ fontSize:12, color:'var(--ink-muted)', marginTop:4, fontStyle:'italic', lineHeight:1.5 }}>{story.notes}</div>
          )}
        </div>

        {/* Edit mode controls */}
        {editing ? (
          <div style={{ display:'flex', gap:4, flexShrink:0 }}>
            {/* Inline rating */}
            <div style={{ display:'flex', alignItems:'center', gap:2, marginRight:4 }}>
              {[1,2,3,4,5].map(n => (
                <button key={n} onClick={() => setRating(r => r===n ? 0 : n)} style={{ background:'none', border:'none', fontSize:14, cursor:'pointer', color: n<=rating ? 'var(--gold)' : 'var(--border)', padding:1 }}>★</button>
              ))}
            </div>
            <button onClick={saveEdit} style={{ background:'var(--green)', border:'none', borderRadius:'var(--radius-sm)', color:'white', cursor:'pointer', padding:'4px 8px', display:'flex', alignItems:'center' }}><Check size={13}/></button>
            <button onClick={cancelEdit} style={{ background:'var(--paper-warm)', border:'1px solid var(--border)', borderRadius:'var(--radius-sm)', color:'var(--ink-muted)', cursor:'pointer', padding:'4px 8px', display:'flex', alignItems:'center' }}><X size={13}/></button>
          </div>
        ) : (
          <div style={{ display:'flex', gap:2, flexShrink:0 }}>
            <button onClick={() => setEditing(true)} style={{ background:'none', border:'none', color:'var(--ink-faint)', cursor:'pointer', padding:'4px 6px', display:'flex', alignItems:'center', borderRadius:'var(--radius-sm)' }} title="Edit">
              <Edit2 size={13}/>
            </button>
            <button onClick={onMoveUp} disabled={index===0} style={{ background:'none', border:'none', color: index===0 ? 'var(--border)' : 'var(--ink-faint)', cursor: index===0 ? 'default' : 'pointer', padding:'4px 4px', display:'flex', alignItems:'center' }} title="Move up">
              <ChevronUp size={14}/>
            </button>
            <button onClick={onMoveDown} disabled={index===total-1} style={{ background:'none', border:'none', color: index===total-1 ? 'var(--border)' : 'var(--ink-faint)', cursor: index===total-1 ? 'default' : 'pointer', padding:'4px 4px', display:'flex', alignItems:'center' }} title="Move down">
              <ChevronDown size={14}/>
            </button>
            <button onClick={onDelete} style={{ background:'none', border:'none', color:'var(--ink-faint)', cursor:'pointer', padding:'4px 6px', display:'flex', alignItems:'center', borderRadius:'var(--radius-sm)' }} title="Delete">
              <Trash2 size={13}/>
            </button>
          </div>
        )}
      </div>

      {/* Notes editor in edit mode */}
      {editing && (
        <div style={{ marginTop:4, marginLeft:60 }}>
          <textarea value={notes} onChange={e => setNotes(e.target.value)}
            placeholder="Notes about this story (optional)…"
            rows={2} style={{ width:'100%', padding:'8px 10px', border:'1px solid var(--border)', borderRadius:'var(--radius-sm)', fontSize:12, fontFamily:'var(--font-body)', background:'var(--paper-card)', color:'var(--ink)', outline:'none', resize:'vertical' }}
          />
        </div>
      )}
    </div>
  );
}

export default function StoriesTracker({ user, bookId }) {
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addFormOpen, setAddFormOpen] = useState(false);
  const [bulkMode, setBulkMode] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [bulkText, setBulkText] = useState('');
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    const s = await getStories(user.uid, bookId);
    setStories(s);
    setLoading(false);
  };

  useEffect(() => { load(); }, [bookId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Stats
  const total = stories.length;
  const finished = stories.filter(s => s.status === 'Finished').length;
  const reading = stories.filter(s => s.status === 'Reading').length;
  const pct = total > 0 ? Math.round((finished / total) * 100) : 0;

  const handleAdd = async () => {
    if (!newTitle.trim()) return;
    setSaving(true);
    await addStory(user.uid, bookId, { title: newTitle.trim(), status: 'To Read', rating: 0, notes: '', order: stories.length });
    setNewTitle('');
    setAddFormOpen(false);
    await load();
    setSaving(false);
  };

  const handleBulkAdd = async () => {
    const lines = bulkText.split('\n').map(l => l.trim()).filter(Boolean);
    if (!lines.length) return;
    setSaving(true);
    for (let i = 0; i < lines.length; i++) {
      await addStory(user.uid, bookId, { title: lines[i], status: 'To Read', rating: 0, notes: '', order: stories.length + i });
    }
    setBulkText(''); setBulkMode(false);
    await load();
    setSaving(false);
  };

  const handleUpdate = async (storyId, data) => {
    await updateStory(user.uid, bookId, storyId, data);
    setStories(prev => prev.map(s => s.id === storyId ? { ...s, ...data } : s));
  };

  const handleDelete = async (storyId) => {
    await deleteStory(user.uid, bookId, storyId);
    setStories(prev => prev.filter(s => s.id !== storyId));
  };

  const handleMove = async (index, dir) => {
    const newList = [...stories];
    const swapIdx = index + dir;
    if (swapIdx < 0 || swapIdx >= newList.length) return;
    [newList[index], newList[swapIdx]] = [newList[swapIdx], newList[index]];
    setStories(newList);
    await reorderStories(user.uid, bookId, newList);
  };

  const statusColors = {
    'To Read': 'var(--ink-faint)', 'Reading': 'var(--blue)',
    'Finished': 'var(--green)', 'Skipped': 'var(--border)'
  };

  return (
    <div>
      {/* Header with progress */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
        <div>
          {total > 0 && (
            <div style={{ fontSize:13, color:'var(--ink-muted)', marginBottom:6 }}>
              <strong style={{ color:'var(--green)', fontFamily:'var(--font-display)', fontSize:18 }}>{finished}</strong>
              <span style={{ color:'var(--ink-faint)' }}> / {total} completed</span>
              {reading > 0 && <span style={{ color:'var(--blue)', marginLeft:8 }}>· {reading} in progress</span>}
            </div>
          )}
          {total > 0 && (
            <div style={{ width:200, background:'var(--border-soft)', borderRadius:4, height:6 }}>
              <div style={{ width:`${pct}%`, height:6, borderRadius:4, background:'var(--green)', transition:'width 0.5s ease' }} />
            </div>
          )}
        </div>
        <div style={{ display:'flex', gap:6 }}>
          <button onClick={() => { setBulkMode(true); setAddFormOpen(false); }} style={{ fontSize:12, padding:'6px 12px', background:'var(--paper-warm)', border:'1px solid var(--border)', borderRadius:'var(--radius-sm)', color:'var(--ink-muted)', cursor:'pointer' }}>
            Bulk add
          </button>
          <button onClick={() => { setAddFormOpen(true); setBulkMode(false); }} style={{ display:'flex', alignItems:'center', gap:5, fontSize:13, padding:'6px 14px', background:'var(--sepia)', border:'none', borderRadius:'var(--radius-sm)', color:'white', cursor:'pointer', fontWeight:500 }}>
            <Plus size={13}/> Add
          </button>
        </div>
      </div>

      {/* Status legend */}
      {total > 0 && (
        <div style={{ display:'flex', gap:12, marginBottom:14, flexWrap:'wrap' }}>
          {STORY_STATUSES.map(s => {
            const count = stories.filter(st => st.status === s).length;
            if (!count) return null;
            return (
              <span key={s} style={{ fontSize:11, color:statusColors[s], display:'flex', alignItems:'center', gap:4 }}>
                {STATUS_CONFIG[s].icon} {s}: {count}
              </span>
            );
          })}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div style={{ display:'flex', justifyContent:'center', padding:'24px 0' }}>
          <div style={{ width:24, height:24, border:'2px solid var(--border)', borderTopColor:'var(--sepia)', borderRadius:'50%', animation:'spin 0.8s linear infinite' }} />
        </div>
      )}

      {/* Empty state */}
      {!loading && total === 0 && !addFormOpen && !bulkMode && (
        <div style={{ textAlign:'center', padding:'24px 0', color:'var(--ink-muted)', fontSize:13 }}>
          No stories added yet. Click <strong>Add</strong> to add individual stories, or <strong>Bulk add</strong> to paste a full list at once.
        </div>
      )}

      {/* Stories list */}
      {!loading && stories.map((story, i) => (
        <StoryRow
          key={story.id}
          story={story}
          index={i}
          total={total}
          onUpdate={data => handleUpdate(story.id, data)}
          onDelete={() => handleDelete(story.id)}
          onMoveUp={() => handleMove(i, -1)}
          onMoveDown={() => handleMove(i, 1)}
        />
      ))}

      {/* Add single form */}
      {addFormOpen && (
        <div style={{ marginTop:8, display:'flex', gap:8 }}>
          <input
            autoFocus value={newTitle} onChange={e => setNewTitle(e.target.value)}
            onKeyDown={e => { if(e.key==='Enter') handleAdd(); if(e.key==='Escape') setAddFormOpen(false); }}
            placeholder="Story or chapter title…"
            style={{ flex:1, padding:'10px 12px', border:'1px solid var(--sepia-light)', borderRadius:'var(--radius-sm)', fontSize:14, fontFamily:'var(--font-body)', background:'var(--paper-card)', color:'var(--ink)', outline:'none' }}
          />
          <button onClick={handleAdd} disabled={saving || !newTitle.trim()} style={{ padding:'10px 16px', background:'var(--sepia)', color:'white', border:'none', borderRadius:'var(--radius-sm)', fontSize:13, fontWeight:500, cursor:'pointer', display:'flex', alignItems:'center', gap:6 }}>
            {saving ? <div style={{ width:13, height:13, border:'2px solid rgba(255,255,255,0.3)', borderTopColor:'white', borderRadius:'50%', animation:'spin 0.8s linear infinite' }}/> : <Plus size={13}/>}
            Add
          </button>
          <button onClick={() => { setAddFormOpen(false); setNewTitle(''); }} style={{ padding:'10px 12px', background:'transparent', border:'1px solid var(--border)', borderRadius:'var(--radius-sm)', color:'var(--ink-muted)', cursor:'pointer' }}><X size={14}/></button>
        </div>
      )}

      {/* Bulk add form */}
      {bulkMode && (
        <div style={{ marginTop:8, background:'var(--paper-warm)', border:'1px solid var(--border)', borderRadius:'var(--radius-md)', padding:14 }}>
          <div style={{ fontSize:12, color:'var(--ink-muted)', marginBottom:8 }}>
            Paste or type one story/chapter per line. They'll all be added at once.
          </div>
          <textarea
            autoFocus value={bulkText} onChange={e => setBulkText(e.target.value)}
            placeholder={"A Study in Scarlet\nThe Sign of Four\nThe Hound of the Baskervilles\nThe Valley of Fear\n…"}
            rows={8}
            style={{ width:'100%', padding:'10px 12px', border:'1px solid var(--border)', borderRadius:'var(--radius-sm)', fontSize:13, fontFamily:'var(--font-body)', background:'var(--paper-card)', color:'var(--ink)', outline:'none', resize:'vertical', lineHeight:1.7 }}
          />
          <div style={{ display:'flex', gap:8, marginTop:10, alignItems:'center' }}>
            <button onClick={handleBulkAdd} disabled={saving || !bulkText.trim()} style={{ padding:'9px 18px', background:'var(--sepia)', color:'white', border:'none', borderRadius:'var(--radius-sm)', fontSize:13, fontWeight:500, cursor:'pointer', display:'flex', alignItems:'center', gap:6 }}>
              {saving
                ? <div style={{ width:13, height:13, border:'2px solid rgba(255,255,255,0.3)', borderTopColor:'white', borderRadius:'50%', animation:'spin 0.8s linear infinite' }}/>
                : <Plus size={13}/>}
              Add {bulkText.split('\n').filter(l=>l.trim()).length || 0} stories
            </button>
            <button onClick={() => { setBulkMode(false); setBulkText(''); }} style={{ padding:'9px 14px', background:'transparent', border:'1px solid var(--border)', borderRadius:'var(--radius-sm)', color:'var(--ink-muted)', cursor:'pointer', fontSize:13 }}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}
