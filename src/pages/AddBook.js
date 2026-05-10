import React, { useState, useEffect, useRef, useCallback } from 'react';
import { addBook, updateBook, STATUSES, LANGUAGES, GENRES } from '../services/books';
import { X, Search, CheckCircle, AlertCircle, Camera, CameraOff, BookOpen } from 'lucide-react';
import { BrowserMultiFormatReader } from '@zxing/library';

const FIELDS = [
  { label:'Title *', key:'title', type:'text', full:true },
  { label:'Author *', key:'author', type:'text', full:false },
  { label:'Language *', key:'language', type:'select', opts:LANGUAGES, full:false },
  { label:'Status', key:'status', type:'select', opts:STATUSES, full:false },
  { label:'Shelf / Collection', key:'shelf', type:'text', full:false },
  { label:'Publisher', key:'publisher', type:'text', full:false },
  { label:'Year published', key:'year', type:'number', full:false },
  { label:'Edition', key:'edition', type:'text', full:false },
  { label:'Total pages', key:'totalPages', type:'number', full:false },
  { label:'Current page', key:'currentPage', type:'number', full:false },
  { label:'Where acquired', key:'acquired', type:'text', full:false },
];

const EMPTY = {
  title:'', author:'', language:'English', genres:[], status:'To Read',
  shelf:'', publisher:'', year:'', isbn:'', edition:'', totalPages:'', currentPage:'',
  acquired:'', rating:0, review:'', wishlist:false, notes:'', coverUrl:'',
};

function guessGenres(subjects = []) {
  const s = subjects.join(' ').toLowerCase();
  const found = [];
  if (s.includes('fiction')) found.push('Fiction');
  if (s.includes('history')) found.push('History');
  if (s.includes('science')) found.push('Science');
  if (s.includes('biograph')) found.push('Biography');
  if (s.includes('philosoph')) found.push('Philosophy');
  if (s.includes('poetry') || s.includes('poem')) found.push('Poetry');
  if (s.includes('religion') || s.includes('islam') || s.includes('quran')) found.push('Religion');
  if (s.includes('children')) found.push('Children');
  if (s.includes('thriller') || s.includes('mystery')) found.push('Thriller');
  if (s.includes('romance')) found.push('Romance');
  return found.length ? found.slice(0,3) : [];
}

function mapBookData(book, isbn = '') {
  const subjects = book.subjects ? book.subjects.map(s => s.name || s) : [];
  return {
    title: book.title || '',
    author: book.authors ? book.authors.map(a => a.name).join(', ') : '',
    publisher: book.publishers ? book.publishers.map(p => p.name).join(', ') : '',
    year: book.publish_date ? (book.publish_date.match(/\d{4}/)?.[0] || '') : '',
    totalPages: book.number_of_pages ? String(book.number_of_pages) : '',
    coverUrl: book.cover ? (book.cover.large || book.cover.medium || book.cover.small || '') : '',
    genres: guessGenres(subjects),
    isbn,
  };
}

export default function AddBook({ onClose, editBook, user, allBooks = [] }) {
  const isEdit = !!editBook;
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [duplicate, setDuplicate] = useState(null);
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState([]);
  const [genres, setGenres] = useState([]);

  // Tab: 'title' | 'isbn'
  const [searchTab, setSearchTab] = useState('title');

  // Title/author search
  const [titleQuery, setTitleQuery] = useState('');
  const [titleResults, setTitleResults] = useState([]);
  const [titleSearching, setTitleSearching] = useState(false);
  const [titleError, setTitleError] = useState('');

  // ISBN lookup
  const [isbnInput, setIsbnInput] = useState('');
  const [lookupState, setLookupState] = useState('idle');
  const [lookupMsg, setLookupMsg] = useState('');
  const isbnRef = useRef(null);

  // Camera
  const [scannerOpen, setScannerOpen] = useState(false);
  const [scannerStatus, setScannerStatus] = useState('idle');
  const [scannerError, setScannerError] = useState('');
  const [cameras, setCameras] = useState([]);
  const [selectedCamera, setSelectedCamera] = useState('');
  const videoRef = useRef(null);
  const readerRef = useRef(null);
  const scanningRef = useRef(false);

  useEffect(() => {
    if (editBook) {
      setForm({ ...EMPTY, ...editBook });
      setIsbnInput(editBook.isbn || '');
      setTags(editBook.tags || []);
      // Support both old single genre and new array
      const g = editBook.genres || (editBook.genre ? [editBook.genre] : []);
      setGenres(g);
    }
  }, [editBook]);

  useEffect(() => { return () => stopScanner(); }, []);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  // ── Title/Author Search ──
  const searchByTitle = async () => {
    if (!titleQuery.trim()) return;
    setTitleSearching(true); setTitleError(''); setTitleResults([]);
    try {
      const q = encodeURIComponent(titleQuery.trim());
      const res = await fetch(`https://openlibrary.org/search.json?q=${q}&limit=8&fields=key,title,author_name,isbn,cover_i,publisher,first_publish_year,number_of_pages_median,subject`);
      const data = await res.json();
      if (!data.docs || data.docs.length === 0) { setTitleError('No books found. Try a different search.'); }
      else setTitleResults(data.docs);
    } catch { setTitleError('Network error. Check your connection.'); }
    setTitleSearching(false);
  };

  const selectSearchResult = (doc) => {
    const isbn = doc.isbn ? doc.isbn[0] : '';
    const coverUrl = doc.cover_i ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-L.jpg` : '';
    const subjects = doc.subject || [];
    setForm(f => ({
      ...f,
      title: doc.title || f.title,
      author: doc.author_name ? doc.author_name.join(', ') : f.author,
      publisher: doc.publisher ? doc.publisher[0] : f.publisher,
      year: doc.first_publish_year ? String(doc.first_publish_year) : f.year,
      totalPages: doc.number_of_pages_median ? String(doc.number_of_pages_median) : f.totalPages,
      coverUrl: coverUrl || f.coverUrl,
      isbn: isbn || f.isbn,
      genres: guessGenres(subjects).length ? guessGenres(subjects) : f.genres,
    }));
    setIsbnInput(isbn);
    setTitleResults([]);
    setTitleQuery('');
    setLookupState('success');
    setLookupMsg(`Selected: "${doc.title}" — review details below.`);
  };

  // ── ISBN Lookup ──
  const lookupISBN = async (rawIsbn) => {
    const isbn = rawIsbn.replace(/[\s-]/g, '');
    if (isbn.length !== 10 && isbn.length !== 13) { setLookupState('error'); setLookupMsg('ISBN must be 10 or 13 digits.'); return; }
    setLookupState('loading'); setLookupMsg('');
    try {
      const res = await fetch(`https://openlibrary.org/api/books?bibkeys=ISBN:${isbn}&format=json&jscmd=data`);
      const data = await res.json();
      const key = `ISBN:${isbn}`;
      if (!data[key]) { setLookupState('notfound'); setLookupMsg('Book not found. Try a different ISBN or fill in manually.'); return; }
      const mapped = mapBookData(data[key], isbn);
      setForm(f => ({ ...f, ...Object.fromEntries(Object.entries(mapped).filter(([,v]) => v)) }));
      setIsbnInput(isbn);
      setLookupState('success');
      setLookupMsg(`Found: "${mapped.title}" — review and save below.`);
    } catch { setLookupState('error'); setLookupMsg('Network error. Check your connection.'); }
  };

  const clearLookup = () => {
    setIsbnInput(''); setLookupState('idle'); setLookupMsg('');
    setForm(f => ({ ...f, isbn:'' })); isbnRef.current?.focus();
  };

  // ── Camera ──
  const stopScanner = useCallback(() => {
    scanningRef.current = false;
    if (readerRef.current) { try { readerRef.current.reset(); } catch {} readerRef.current = null; }
  }, []);

  const openScanner = async () => {
    setScannerOpen(true); setScannerStatus('starting'); setScannerError('');
    try {
      // First try environment-facing camera directly (better mobile support)
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } }
          });
          stream.getTracks().forEach(t => t.stop()); // Just checking permission
        } catch {}
      }
      const reader = new BrowserMultiFormatReader();
      readerRef.current = reader;
      const devices = await BrowserMultiFormatReader.listVideoInputDevices();
      setCameras(devices);
      // Prefer back/environment camera
      const backCam = devices.find(d => /back|rear|environment/i.test(d.label));
      const camId = backCam ? backCam.deviceId : (devices[0]?.deviceId || undefined);
      setSelectedCamera(camId || '');
      startDecoding(reader, camId);
    } catch (e) {
      setScannerStatus('error');
      setScannerError(e.name === 'NotAllowedError'
        ? 'Camera permission denied. Please allow camera access in your browser settings.'
        : 'Could not access camera. Make sure you are on HTTPS and have a camera connected.');
    }
  };

  const startDecoding = (reader, deviceId) => {
    scanningRef.current = true; setScannerStatus('scanning');
    // Use environment constraints when no specific deviceId (better on mobile)
    const constraints = deviceId
      ? { deviceId: { exact: deviceId } }
      : { facingMode: 'environment' };
    reader.decodeFromConstraints({ video: constraints }, videoRef.current, (result, err) => {
      if (!scanningRef.current) return;
      if (result) {
        const text = result.getText();
        if (/^\d{8,13}$/.test(text)) handleScannedCode(text);
      }
    });
  };

  const handleScannedCode = (code) => {
    stopScanner(); setScannerOpen(false);
    setIsbnInput(code); setLookupState('idle'); setLookupMsg('');
    setSearchTab('isbn');
    setTimeout(() => lookupISBN(code), 100);
  };

  const closeScanner = () => { stopScanner(); setScannerOpen(false); setScannerStatus('idle'); setScannerError(''); };

  const switchCamera = (deviceId) => {
    setSelectedCamera(deviceId);
    if (readerRef.current) { try { readerRef.current.reset(); } catch {} startDecoding(readerRef.current, deviceId); }
  };

  // ── Duplicate check ──
  const checkDuplicate = (title) => {
    if (!title.trim() || isEdit) return;
    const q = title.trim().toLowerCase();
    const found = allBooks.find(b => b.id !== editBook?.id && (
      b.title?.toLowerCase() === q ||
      (b.isbn && form.isbn && b.isbn === form.isbn.replace(/[\s-]/g,''))
    ));
    setDuplicate(found || null);
  };

  // ── Tag helpers ──
  const addTag = () => {
    const t = tagInput.trim();
    if (t && !tags.includes(t) && tags.length < 10) { setTags(prev => [...prev, t]); setTagInput(''); }
  };
  const removeTag = (t) => setTags(prev => prev.filter(x => x !== t));

  // ── Save ──
  const save = async () => {
    if (!form.title.trim() || !form.author.trim()) { setError('Title and author are required.'); return; }
    setSaving(true); setError('');
    try {
      const data = {
        ...form,
        isbn: isbnInput.replace(/[\s-]/g, '') || form.isbn,
        year: form.year ? parseInt(form.year) : null,
        totalPages: form.totalPages ? parseInt(form.totalPages) : null,
        currentPage: form.currentPage ? parseInt(form.currentPage) : null,
        rating: form.rating || 0,
        tags,
        genres,
        genre: genres[0] || '',  // keep for backwards compat
      };
      if (isEdit) await updateBook(user.uid, editBook.id, data);
      else await addBook(user.uid, data);
      onClose();
    } catch { setError('Failed to save. Please try again.'); setSaving(false); }
  };

  const inputStyle = {
    width:'100%', padding:'10px 12px', border:'1px solid var(--border)', borderRadius:'var(--radius-sm)',
    fontSize:14, background:'var(--paper-card)', color:'var(--ink)', outline:'none',
    fontFamily: form.language === 'বাংলা' ? 'var(--font-bangla), var(--font-body)' : 'var(--font-body)',
    transition:'border-color 0.15s'
  };

  return (
    <>
      {/* Camera overlay */}
      {scannerOpen && (
        <div style={{ position:'fixed', inset:0, zIndex:600, background:'rgba(0,0,0,0.92)', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center' }}>
          <div style={{ width:'100%', maxWidth:480, padding:20 }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
              <div>
                <div style={{ color:'white', fontWeight:600, fontSize:16 }}>Scan ISBN Barcode</div>
                <div style={{ color:'rgba(255,255,255,0.6)', fontSize:13, marginTop:2 }}>Point camera at the barcode on the back of the book</div>
              </div>
              <button onClick={closeScanner} style={{ background:'rgba(255,255,255,0.15)', border:'none', borderRadius:'50%', width:36, height:36, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', color:'white' }}>
                <X size={18} />
              </button>
            </div>
            <div style={{ position:'relative', borderRadius:16, overflow:'hidden', background:'#111', aspectRatio:'4/3' }}>
              <video ref={videoRef} style={{ width:'100%', height:'100%', objectFit:'cover', display: scannerStatus==='scanning' ? 'block' : 'none' }} />
              {scannerStatus === 'scanning' && (
                <div style={{ position:'absolute', inset:0, pointerEvents:'none' }}>
                  <div style={{ position:'absolute', left:'15%', right:'15%', height:2, background:'rgba(192,57,43,0.85)', animation:'scanLine 2s ease-in-out infinite', boxShadow:'0 0 8px rgba(192,57,43,0.5)' }} />
                  <style>{`@keyframes scanLine { 0%,100%{top:20%} 50%{top:80%} }`}</style>
                </div>
              )}
              {scannerStatus === 'starting' && (
                <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:12 }}>
                  <div style={{ width:36, height:36, border:'3px solid rgba(255,255,255,0.2)', borderTopColor:'white', borderRadius:'50%', animation:'spin 0.8s linear infinite' }} />
                  <div style={{ color:'white', fontSize:14 }}>Starting camera…</div>
                </div>
              )}
              {scannerStatus === 'error' && (
                <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:12, padding:24, textAlign:'center' }}>
                  <CameraOff size={40} color="rgba(255,255,255,0.5)" />
                  <div style={{ color:'white', fontSize:14 }}>{scannerError}</div>
                </div>
              )}
            </div>
            {cameras.length > 1 && scannerStatus === 'scanning' && (
              <select value={selectedCamera} onChange={e => switchCamera(e.target.value)} style={{ width:'100%', marginTop:12, padding:'9px 12px', borderRadius:8, border:'1px solid rgba(255,255,255,0.2)', background:'rgba(255,255,255,0.1)', color:'white', fontSize:13, outline:'none' }}>
                {cameras.map(c => <option key={c.deviceId} value={c.deviceId} style={{ background:'#222' }}>{c.label || `Camera ${c.deviceId.slice(0,6)}`}</option>)}
              </select>
            )}
            <div style={{ marginTop:14, textAlign:'center', color:'rgba(255,255,255,0.4)', fontSize:12 }}>Scanning automatically — no button needed</div>
          </div>
        </div>
      )}

      {/* Main modal */}
      <div style={{ position:'fixed', inset:0, zIndex:500, display:'flex', alignItems:'flex-end', justifyContent:'center', background:'rgba(26,22,18,0.45)' }}
        onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
        <div style={{ background:'var(--paper-card)', width:'100%', maxWidth:660, borderRadius:'var(--radius-xl) var(--radius-xl) 0 0', maxHeight:'94vh', display:'flex', flexDirection:'column', boxShadow:'var(--shadow-lg)', animation:'fadeUp 0.3s ease' }}>

          {/* Header */}
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'20px 24px 16px', borderBottom:'1px solid var(--border)', flexShrink:0 }}>
            <div>
              <div style={{ fontFamily:'var(--font-display)', fontSize:20, fontWeight:700 }}>{isEdit ? 'Edit Book' : 'Add New Book'}</div>
              <div style={{ fontSize:13, color:'var(--ink-muted)', marginTop:2 }}>Search by title, scan/enter ISBN, or fill in manually</div>
            </div>
            <button onClick={onClose} style={{ background:'transparent', border:'none', color:'var(--ink-muted)', padding:4, cursor:'pointer' }}><X size={20} /></button>
          </div>

          {/* Body */}
          <div style={{ overflowY:'auto', padding:'20px 24px', flex:1 }}>

            {/* ── Auto-fill section ── */}
            <div style={{ background:'var(--sepia-pale)', border:'1px solid var(--sepia-light)', borderRadius:'var(--radius-lg)', padding:'16px 18px', marginBottom:24 }}>

              {/* Tabs */}
              <div style={{ display:'flex', gap:4, marginBottom:14 }}>
                {[['title', <BookOpen size={13}/>, 'Search by title'], ['isbn', <Search size={13}/>, 'Search by ISBN']].map(([tab, icon, label]) => (
                  <button key={tab} onClick={() => setSearchTab(tab)} style={{
                    display:'flex', alignItems:'center', gap:5, padding:'6px 14px',
                    borderRadius:20, border:'1px solid', fontSize:13, cursor:'pointer',
                    borderColor: searchTab===tab ? 'var(--sepia)' : 'var(--border)',
                    background: searchTab===tab ? 'var(--sepia)' : 'transparent',
                    color: searchTab===tab ? 'white' : 'var(--ink-muted)',
                    fontWeight: searchTab===tab ? 500 : 400, transition:'var(--transition)'
                  }}>{icon} {label}</button>
                ))}
              </div>

              {/* Title search tab */}
              {searchTab === 'title' && (
                <>
                  <div style={{ display:'flex', gap:8 }}>
                    <input value={titleQuery} onChange={e => setTitleQuery(e.target.value)}
                      onKeyDown={e => { if(e.key==='Enter') searchByTitle(); }}
                      placeholder="Enter book title or author name…"
                      style={{ ...inputStyle, flex:1, fontFamily:'var(--font-body)' }}
                      onFocus={e => e.target.style.borderColor='var(--sepia-light)'}
                      onBlur={e => e.target.style.borderColor='var(--border)'}
                    />
                    <button onClick={searchByTitle} disabled={titleSearching || !titleQuery.trim()} style={{
                      padding:'10px 16px', background:'var(--sepia)', color:'white', border:'none',
                      borderRadius:'var(--radius-sm)', fontSize:13, fontWeight:500, cursor:'pointer',
                      display:'flex', alignItems:'center', gap:6, flexShrink:0,
                      opacity: (!titleQuery.trim() || titleSearching) ? 0.6 : 1
                    }}>
                      {titleSearching
                        ? <><div style={{ width:13, height:13, border:'2px solid rgba(255,255,255,0.3)', borderTopColor:'white', borderRadius:'50%', animation:'spin 0.8s linear infinite' }} /> Searching…</>
                        : <><Search size={13}/> Search</>}
                    </button>
                  </div>

                  {titleError && (
                    <div style={{ marginTop:10, fontSize:13, color:'var(--accent)', display:'flex', alignItems:'center', gap:6 }}>
                      <AlertCircle size={14}/> {titleError}
                    </div>
                  )}

                  {/* Search results */}
                  {titleResults.length > 0 && (
                    <div style={{ marginTop:12, display:'flex', flexDirection:'column', gap:6 }}>
                      <div style={{ fontSize:11, fontWeight:600, color:'var(--ink-muted)', letterSpacing:'0.08em', textTransform:'uppercase', marginBottom:4 }}>Select a book</div>
                      {titleResults.map((doc, i) => {
                        const coverId = doc.cover_i;
                        return (
                          <div key={i} onClick={() => selectSearchResult(doc)} style={{
                            display:'flex', gap:12, alignItems:'center', padding:'10px 12px',
                            background:'var(--paper-card)', border:'1px solid var(--border)',
                            borderRadius:'var(--radius-md)', cursor:'pointer', transition:'var(--transition)'
                          }}
                          onMouseEnter={e => { e.currentTarget.style.borderColor='var(--sepia-light)'; e.currentTarget.style.background='var(--sepia-pale)'; }}
                          onMouseLeave={e => { e.currentTarget.style.borderColor='var(--border)'; e.currentTarget.style.background='var(--paper-card)'; }}
                          >
                            {coverId
                              ? <img src={`https://covers.openlibrary.org/b/id/${coverId}-S.jpg`} alt="" style={{ width:36, height:50, objectFit:'cover', borderRadius:3, flexShrink:0, border:'1px solid var(--border)' }} />
                              : <div style={{ width:36, height:50, background:'var(--sepia-pale)', borderRadius:3, flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center', fontSize:16 }}>📖</div>
                            }
                            <div style={{ flex:1, minWidth:0 }}>
                              <div style={{ fontSize:14, fontWeight:500, color:'var(--ink)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{doc.title}</div>
                              <div style={{ fontSize:12, color:'var(--ink-muted)' }}>{doc.author_name ? doc.author_name.slice(0,2).join(', ') : '—'}</div>
                              <div style={{ fontSize:11, color:'var(--ink-faint)' }}>{doc.first_publish_year || ''}{doc.publisher ? ` · ${doc.publisher[0]}` : ''}</div>
                            </div>
                            <div style={{ fontSize:11, color:'var(--sepia)', fontWeight:500, flexShrink:0 }}>Select →</div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </>
              )}

              {/* ISBN tab */}
              {searchTab === 'isbn' && (
                <>
                  <div style={{ display:'flex', gap:8 }}>
                    <button onClick={openScanner} style={{ padding:'10px 14px', background:'var(--ink)', color:'white', border:'none', borderRadius:'var(--radius-sm)', cursor:'pointer', display:'flex', alignItems:'center', gap:6, fontSize:13, fontWeight:500, flexShrink:0 }}
                      onMouseEnter={e => e.currentTarget.style.background='var(--ink-soft)'}
                      onMouseLeave={e => e.currentTarget.style.background='var(--ink)'}
                    >
                      <Camera size={15}/> Scan
                    </button>
                    <input ref={isbnRef} type="text" value={isbnInput}
                      onChange={e => { setIsbnInput(e.target.value); setLookupState('idle'); setLookupMsg(''); }}
                      onKeyDown={e => { if(e.key==='Enter') lookupISBN(isbnInput); }}
                      placeholder="e.g. 9780140449266"
                      maxLength={17}
                      style={{ ...inputStyle, flex:1, fontFamily:'var(--font-body)' }}
                      onFocus={e => e.target.style.borderColor='var(--sepia-light)'}
                      onBlur={e => e.target.style.borderColor='var(--border)'}
                    />
                    <button onClick={() => lookupISBN(isbnInput)} disabled={lookupState==='loading' || !isbnInput.trim()} style={{ padding:'10px 16px', background:'var(--sepia)', color:'white', border:'none', borderRadius:'var(--radius-sm)', fontSize:13, fontWeight:500, cursor:'pointer', display:'flex', alignItems:'center', gap:6, flexShrink:0, opacity:(!isbnInput.trim()||lookupState==='loading')?0.6:1 }}>
                      {lookupState==='loading'
                        ? <><div style={{ width:13, height:13, border:'2px solid rgba(255,255,255,0.3)', borderTopColor:'white', borderRadius:'50%', animation:'spin 0.8s linear infinite' }}/> Looking…</>
                        : <><Search size={13}/> Lookup</>}
                    </button>
                    {isbnInput && lookupState !== 'idle' && (
                      <button onClick={clearLookup} style={{ padding:'10px 12px', background:'transparent', border:'1px solid var(--border)', borderRadius:'var(--radius-sm)', cursor:'pointer', color:'var(--ink-muted)', flexShrink:0 }}><X size={14}/></button>
                    )}
                  </div>
                </>
              )}

              {/* Shared status message */}
              {lookupMsg && (
                <div style={{ marginTop:10, display:'flex', alignItems:'flex-start', gap:8, fontSize:13,
                  color: lookupState==='success' ? 'var(--green)' : 'var(--accent)',
                  padding:'8px 12px', borderRadius:'var(--radius-sm)',
                  background: lookupState==='success' ? 'var(--green-pale)' : 'var(--accent-pale)'
                }}>
                  {lookupState==='success' ? <CheckCircle size={15} style={{ flexShrink:0, marginTop:1 }}/> : <AlertCircle size={15} style={{ flexShrink:0, marginTop:1 }}/>}
                  {lookupMsg}
                </div>
              )}

              {/* Cover preview */}
              {form.coverUrl && lookupState === 'success' && (
                <div style={{ marginTop:12, display:'flex', alignItems:'center', gap:12 }}>
                  <img src={form.coverUrl} alt="Book cover" style={{ width:48, height:66, objectFit:'cover', borderRadius:4, border:'1px solid var(--border)' }} />
                  <div style={{ fontSize:12, color:'var(--ink-muted)' }}>Cover fetched automatically from Open Library</div>
                </div>
              )}
            </div>

            {/* Wishlist toggle */}
            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:20, padding:'12px 16px', background:'var(--accent-pale)', borderRadius:'var(--radius-md)', border:'1px solid var(--accent-soft)' }}>
              <input type="checkbox" id="wishlist" checked={form.wishlist} onChange={e => set('wishlist', e.target.checked)} style={{ width:16, height:16, accentColor:'var(--accent)' }} />
              <label htmlFor="wishlist" style={{ fontSize:14, color:'var(--accent)', fontWeight:500, cursor:'pointer' }}>♥ Add to Wishlist (I don't own this yet)</label>
            </div>

            {/* Genre multi-select */}
            <div style={{ marginBottom:20 }}>
              <label style={{ fontSize:12, fontWeight:500, color:'var(--ink-soft)', display:'block', marginBottom:8 }}>
                Genres <span style={{ fontSize:11, color:'var(--ink-faint)', fontWeight:400 }}>(select all that apply)</span>
              </label>
              <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
                {GENRES.map(g => {
                  const selected = genres.includes(g);
                  return (
                    <button key={g} type="button" onClick={() => setGenres(prev => selected ? prev.filter(x=>x!==g) : [...prev, g])}
                      style={{
                        padding:'5px 12px', borderRadius:20, border:'1px solid', fontSize:12, cursor:'pointer',
                        borderColor: selected ? 'var(--sepia)' : 'var(--border)',
                        background: selected ? 'var(--sepia)' : 'transparent',
                        color: selected ? 'white' : 'var(--ink-muted)',
                        fontWeight: selected ? 500 : 400, transition:'var(--transition)'
                      }}
                    >{selected ? '✓ ' : ''}{g}</button>
                  );
                })}
              </div>
              {genres.length === 0 && <div style={{ fontSize:11, color:'var(--ink-faint)', marginTop:6 }}>No genre selected — pick at least one.</div>}
            </div>

            {/* Fields grid */}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'16px 20px' }}>
              {FIELDS.map(({ label, key, type, opts, full }) => (
                <div key={key} style={{ gridColumn: full ? '1/-1' : 'auto' }}>
                  <label style={{ fontSize:12, fontWeight:500, color:'var(--ink-soft)', display:'block', marginBottom:5 }}>{label}</label>
                  {opts ? (
                    <select value={form[key]} onChange={e => set(key, e.target.value)} style={{ ...inputStyle, fontFamily:'var(--font-body)' }}>
                      {opts.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  ) : (
                    <input type={type} value={form[key]} onChange={e => set(key, e.target.value)}
                      placeholder={key==='title' ? (form.language==='বাংলা' ? 'বইয়ের নাম' : 'Book title') : ''}
                      style={inputStyle}
                      onFocus={e => e.target.style.borderColor='var(--sepia-light)'}
                      onBlur={e => { e.target.style.borderColor='var(--border)'; if(key==='title') checkDuplicate(e.target.value); }}
                    />
                  )}
                </div>
              ))}
            </div>

            {/* Rating */}
            <div style={{ marginTop:20 }}>
              <label style={{ fontSize:12, fontWeight:500, color:'var(--ink-soft)', display:'block', marginBottom:8 }}>Your Rating</label>
              <div style={{ display:'flex', gap:6 }}>
                {[1,2,3,4,5].map(n => (
                  <button key={n} onClick={() => set('rating', form.rating===n ? 0 : n)} style={{ background:'none', border:'none', fontSize:28, cursor:'pointer', color: n<=form.rating ? 'var(--gold)' : 'var(--border)', transition:'var(--transition)', transform: n<=form.rating ? 'scale(1.1)' : 'scale(1)' }}>★</button>
                ))}
                {form.rating > 0 && <span style={{ fontSize:13, color:'var(--ink-muted)', alignSelf:'center', marginLeft:4 }}>{form.rating}/5</span>}
              </div>
            </div>

            {/* Review */}
            <div style={{ marginTop:20 }}>
              <label style={{ fontSize:12, fontWeight:500, color:'var(--ink-soft)', display:'block', marginBottom:5 }}>Your Review</label>
              <textarea value={form.review} onChange={e => set('review', e.target.value)}
                placeholder={form.language==='বাংলা' ? 'বইটি সম্পর্কে আপনার মতামত লিখুন…' : 'Write your review or thoughts…'}
                rows={4} style={{ ...inputStyle, resize:'vertical', fontFamily: form.language==='বাংলা' ? 'var(--font-bangla), var(--font-body)' : 'var(--font-body)' }}
                onFocus={e => e.target.style.borderColor='var(--sepia-light)'}
                onBlur={e => e.target.style.borderColor='var(--border)'}
              />
            </div>

            {/* Notes */}
            <div style={{ marginTop:16 }}>
              <label style={{ fontSize:12, fontWeight:500, color:'var(--ink-soft)', display:'block', marginBottom:5 }}>Notes</label>
              <textarea value={form.notes} onChange={e => set('notes', e.target.value)}
                placeholder="Personal notes, quotes, highlights…"
                rows={3} style={{ ...inputStyle, resize:'vertical' }}
                onFocus={e => e.target.style.borderColor='var(--sepia-light)'}
                onBlur={e => e.target.style.borderColor='var(--border)'}
              />
            </div>

            {/* Duplicate warning */}
            {duplicate && !isEdit && (
              <div style={{ marginTop:16, padding:'12px 14px', background:'var(--gold-pale)', border:'1px solid var(--gold)', borderRadius:'var(--radius-md)', display:'flex', alignItems:'flex-start', gap:8 }}>
                <span style={{ fontSize:16 }}>⚠️</span>
                <div>
                  <div style={{ fontSize:13, fontWeight:600, color:'var(--ink)' }}>Possible duplicate detected</div>
                  <div style={{ fontSize:12, color:'var(--ink-muted)', marginTop:2 }}>"{duplicate.title}" by {duplicate.author} is already in your library. You can still save if it's a different edition.</div>
                </div>
              </div>
            )}

            {/* Tags */}
            <div style={{ marginTop:20 }}>
              <label style={{ fontSize:12, fontWeight:500, color:'var(--ink-soft)', display:'block', marginBottom:8 }}>Tags <span style={{ fontSize:11, color:'var(--ink-faint)', fontWeight:400 }}>(press Enter to add)</span></label>
              <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginBottom:8 }}>
                {tags.map(t => (
                  <span key={t} style={{ display:'inline-flex', alignItems:'center', gap:4, padding:'4px 10px', background:'var(--sepia-pale)', border:'1px solid var(--sepia-light)', borderRadius:20, fontSize:12, color:'var(--sepia)', fontWeight:500 }}>
                    {t}
                    <button onClick={()=>removeTag(t)} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--sepia-light)', padding:0, display:'flex', alignItems:'center' }}>×</button>
                  </span>
                ))}
              </div>
              <div style={{ display:'flex', gap:8 }}>
                <input value={tagInput} onChange={e=>setTagInput(e.target.value)}
                  onKeyDown={e=>{ if(e.key==='Enter'){e.preventDefault();addTag();} }}
                  placeholder="e.g. favorite, gift, reread…"
                  style={{ ...inputStyle, flex:1, fontFamily:'var(--font-body)' }}
                  onFocus={e=>e.target.style.borderColor='var(--sepia-light)'}
                  onBlur={e=>e.target.style.borderColor='var(--border)'}
                />
                <button onClick={addTag} style={{ padding:'10px 14px', background:'var(--paper-warm)', border:'1px solid var(--border)', borderRadius:'var(--radius-sm)', fontSize:13, cursor:'pointer', color:'var(--ink-muted)' }}>Add</button>
              </div>
            </div>

            {error && <div style={{ marginTop:12, fontSize:13, color:'var(--accent)', padding:'10px 12px', background:'var(--accent-pale)', borderRadius:'var(--radius-sm)' }}>{error}</div>}
          </div>

          {/* Footer */}
          <div style={{ padding:'16px 24px', borderTop:'1px solid var(--border)', display:'flex', gap:10, justifyContent:'flex-end', flexShrink:0 }}>
            <button onClick={onClose} style={{ padding:'11px 20px', border:'1px solid var(--border)', borderRadius:'var(--radius-md)', background:'transparent', color:'var(--ink-muted)', fontSize:14, cursor:'pointer' }}>Cancel</button>
            <button onClick={save} disabled={saving} style={{ padding:'11px 28px', border:'none', borderRadius:'var(--radius-md)', background: saving ? 'var(--sepia-light)' : 'var(--accent)', color:'white', fontSize:14, fontWeight:500, cursor: saving ? 'not-allowed' : 'pointer', display:'flex', alignItems:'center', gap:8 }}>
              {saving && <div style={{ width:14, height:14, border:'2px solid rgba(255,255,255,0.4)', borderTopColor:'white', borderRadius:'50%', animation:'spin 0.8s linear infinite' }} />}
              {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Add to Library'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
