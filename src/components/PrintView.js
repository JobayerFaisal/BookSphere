import React, { useEffect } from 'react';
import { X, Printer } from 'lucide-react';

const STATUS_COLORS = { 'Reading':'#2980b9', 'Finished':'#27ae60', 'To Read':'#d4a017', 'Paused':'#8b6f47', 'Dropped':'#c0392b' };

export default function PrintView({ books, user, onClose }) {
  const nonWishlist = books.filter(b => !b.wishlist);
  const wishlist = books.filter(b => b.wishlist);

  const doPrint = () => window.print();

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => document.body.style.overflow = '';
  }, []);

  const BookRow = ({ book, index }) => {
    const pct = book.totalPages && book.currentPage ? Math.round(book.currentPage / book.totalPages * 100) : null;
    return (
      <div style={{ display:'flex', gap:12, padding:'10px 0', borderBottom:'1px solid #e8e0d5', pageBreakInside:'avoid' }}>
        <div style={{ width:24, fontSize:12, color:'#9e9088', flexShrink:0, paddingTop:2 }}>{index + 1}</div>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:8, marginBottom:2 }}>
            <div style={{ fontFamily:'Georgia, serif', fontSize:14, fontWeight:600, color:'#1a1612' }}>{book.title}</div>
            <span style={{ fontSize:10, fontWeight:600, padding:'2px 7px', borderRadius:10, background: STATUS_COLORS[book.status] || '#888', color:'white', flexShrink:0, whiteSpace:'nowrap' }}>
              {book.wishlist ? 'Wishlist' : book.status}
            </span>
          </div>
          <div style={{ fontSize:12, color:'#7a6f68', marginBottom:3 }}>{book.author}{book.year ? ` · ${book.year}` : ''}{book.genre ? ` · ${book.genre}` : ''}{book.language ? ` · ${book.language}` : ''}</div>
          {book.shelf && <div style={{ fontSize:11, color:'#9e9088' }}>📚 {book.shelf}</div>}
          {book.rating > 0 && <div style={{ fontSize:11, color:'#d4a017' }}>{'★'.repeat(book.rating)}{'☆'.repeat(5-book.rating)}</div>}
          {pct !== null && book.status === 'Reading' && (
            <div style={{ fontSize:11, color:'#9e9088' }}>Progress: {book.currentPage}/{book.totalPages} pages ({pct}%)</div>
          )}
          {book.tags?.length > 0 && <div style={{ fontSize:11, color:'#8b6f47' }}>Tags: {book.tags.join(', ')}</div>}
          {book.review && <div style={{ fontSize:11, color:'#7a6f68', fontStyle:'italic', marginTop:2 }}>"{book.review.slice(0,120)}{book.review.length>120?'…':''}"</div>}
        </div>
      </div>
    );
  };

  return (
    <>
      {/* Print styles */}
      <style>{`
        @media print {
          .print-controls { display: none !important; }
          .print-frame { position: static !important; border-radius: 0 !important; max-height: none !important; box-shadow: none !important; }
          body { overflow: visible !important; }
        }
      `}</style>

      <div style={{ position:'fixed', inset:0, zIndex:700, background:'rgba(0,0,0,0.5)', display:'flex', alignItems:'center', justifyContent:'center' }}>
        {/* Controls */}
        <div className="print-controls" style={{ position:'fixed', top:16, right:16, display:'flex', gap:8, zIndex:800 }}>
          <button onClick={doPrint} style={{ display:'flex', alignItems:'center', gap:8, padding:'10px 20px', background:'var(--sepia)', color:'white', border:'none', borderRadius:'var(--radius-md)', fontSize:14, fontWeight:500, cursor:'pointer' }}>
            <Printer size={16}/> Print
          </button>
          <button onClick={onClose} style={{ display:'flex', alignItems:'center', gap:6, padding:'10px 16px', background:'var(--paper-card)', border:'1px solid var(--border)', borderRadius:'var(--radius-md)', fontSize:14, cursor:'pointer', color:'var(--ink)' }}>
            <X size={16}/> Close
          </button>
        </div>

        {/* Print content */}
        <div className="print-frame" style={{ background:'white', borderRadius:12, maxWidth:760, width:'95%', maxHeight:'90vh', overflowY:'auto', boxShadow:'0 20px 60px rgba(0,0,0,0.3)', padding:'40px 48px', fontFamily:'Georgia, serif', color:'#1a1612' }}>
          {/* Header */}
          <div style={{ borderBottom:'3px solid #8b6f47', paddingBottom:16, marginBottom:24 }}>
            <div style={{ fontSize:26, fontWeight:700, color:'#1a1612', marginBottom:4 }}>BookSphere — My Library</div>
            <div style={{ fontSize:13, color:'#7a6f68' }}>
              {user.displayName || user.email} · {new Date().toLocaleDateString('en-GB', { day:'numeric', month:'long', year:'numeric' })} · {books.length} total books
            </div>
          </div>

          {/* Summary */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:28 }}>
            {[
              ['Total Books', nonWishlist.length, '#8b6f47'],
              ['Finished', books.filter(b=>b.status==='Finished'&&!b.wishlist).length, '#27ae60'],
              ['Reading', books.filter(b=>b.status==='Reading'&&!b.wishlist).length, '#2980b9'],
              ['Wishlist', wishlist.length, '#c0392b'],
            ].map(([l,v,c]) => (
              <div key={l} style={{ textAlign:'center', padding:'12px 8px', border:'1px solid #e8e0d5', borderRadius:8 }}>
                <div style={{ fontSize:24, fontWeight:700, color:c }}>{v}</div>
                <div style={{ fontSize:11, color:'#9e9088' }}>{l}</div>
              </div>
            ))}
          </div>

          {/* Books */}
          {nonWishlist.length > 0 && (
            <div style={{ marginBottom:32 }}>
              <div style={{ fontSize:16, fontWeight:700, color:'#8b6f47', marginBottom:12, textTransform:'uppercase', letterSpacing:'0.08em', fontSize:12 }}>My Books ({nonWishlist.length})</div>
              {nonWishlist.map((b,i) => <BookRow key={b.id} book={b} index={i}/>)}
            </div>
          )}

          {wishlist.length > 0 && (
            <div>
              <div style={{ fontSize:12, fontWeight:700, color:'#c0392b', marginBottom:12, textTransform:'uppercase', letterSpacing:'0.08em' }}>Wishlist ({wishlist.length})</div>
              {wishlist.map((b,i) => <BookRow key={b.id} book={b} index={i}/>)}
            </div>
          )}

          <div style={{ marginTop:32, paddingTop:16, borderTop:'1px solid #e8e0d5', fontSize:11, color:'#b8aea8', textAlign:'center' }}>
            Printed from BookSphere · {new Date().toLocaleDateString()}
          </div>
        </div>
      </div>
    </>
  );
}
