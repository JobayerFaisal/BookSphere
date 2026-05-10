import React, { useEffect, useState } from 'react';
import { getBooks } from '../services/books';
import BookCard from '../components/BookCard';
import { Heart, Plus } from 'lucide-react';

export default function Wishlist({ user, onOpenBook, onAddBook }) {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getBooks(user.uid).then(data => { setBooks(data.filter(b=>b.wishlist)); setLoading(false); });
  }, [user.uid]);

  return (
    <div style={{ padding:'32px', maxWidth:1100, margin:'0 auto' }}>
      <div style={{ marginBottom:28, animation:'fadeUp 0.4s ease' }}>
        <div style={{ fontFamily:'var(--font-display)', fontSize:11, letterSpacing:'0.14em', textTransform:'uppercase', color:'var(--accent)', marginBottom:4 }}>Books I want</div>
        <h1 style={{ fontFamily:'var(--font-display)', fontSize:32, fontWeight:700, display:'flex', alignItems:'center', gap:12 }}>
          Wishlist
          <span style={{ fontSize:16, fontWeight:400, color:'var(--ink-muted)', fontFamily:'var(--font-body)' }}>{books.length} book{books.length!==1?'s':''}</span>
        </h1>
        <p style={{ fontSize:14, color:'var(--ink-muted)', marginTop:6 }}>Books you want to read or buy. When adding a book, tick "Add to Wishlist".</p>
      </div>

      {loading ? (
        <div style={{ display:'flex', justifyContent:'center', paddingTop:60 }}>
          <div style={{ width:32, height:32, border:'2px solid var(--border)', borderTopColor:'var(--accent)', borderRadius:'50%', animation:'spin 0.8s linear infinite' }} />
        </div>
      ) : books.length === 0 ? (
        <div style={{ textAlign:'center', padding:'80px 0' }}>
          <div style={{ fontSize:48, marginBottom:16 }}>♥</div>
          <div style={{ fontFamily:'var(--font-display)', fontSize:20, fontWeight:600, marginBottom:8 }}>Your wishlist is empty</div>
          <div style={{ fontSize:14, color:'var(--ink-muted)', marginBottom:24 }}>Add books you want to read by checking "Add to Wishlist" when adding a book.</div>
          <button onClick={onAddBook} style={{ display:'inline-flex', alignItems:'center', gap:8, background:'var(--accent)', color:'white', border:'none', borderRadius:'var(--radius-md)', padding:'12px 24px', fontSize:15, fontWeight:500, cursor:'pointer' }}>
            <Plus size={16} /> Add to wishlist
          </button>
        </div>
      ) : (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(160px, 1fr))', gap:16 }}>
          {books.map((book, i) => (
            <div key={book.id} style={{ animation:`fadeUp 0.35s ease ${i*0.04}s both` }}>
              <BookCard book={book} onClick={() => onOpenBook(book.id)} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
