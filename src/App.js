import React, { useState, useEffect } from 'react';
import { auth } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { ThemeProvider } from './context/ThemeContext';
import Login from './pages/Login';
import Layout from './components/Layout';
import Library from './pages/Library';
import BookDetail from './pages/BookDetail';
import AddBook from './pages/AddBook';
import Shelves from './pages/Shelves';
import Wishlist from './pages/Wishlist';
import Analytics from './pages/Analytics';
import Recommendations from './pages/Recommendations';
import ShareView from './pages/ShareView';
import ExportModal from './components/ExportModal';
import PrintView from './components/PrintView';
import { getBooks } from './services/books';

// Check if we're on a share URL: /share/:id
function getShareId() {
  const match = window.location.pathname.match(/^\/share\/(.+)$/);
  return match ? match[1] : null;
}

export default function App() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [page, setPage] = useState('library');
  const [selectedBookId, setSelectedBookId] = useState(null);
  const [addBookOpen, setAddBookOpen] = useState(false);
  const [editBook, setEditBook] = useState(null);
  const [exportOpen, setExportOpen] = useState(false);
  const [printOpen, setPrintOpen] = useState(false);
  const [allBooks, setAllBooks] = useState([]);

  const shareId = getShareId();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, u => { setUser(u); setAuthLoading(false); });
    return unsub;
  }, []);

  useEffect(() => {
    if (user) getBooks(user.uid).then(setAllBooks);
  }, [user]);

  // If on a share URL, show public share page (no auth needed)
  if (shareId) {
    return (
      <ThemeProvider>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } } @keyframes fadeUp { from { opacity:0; transform:translateY(14px); } to { opacity:1; transform:translateY(0); } }`}</style>
        <ShareView shareId={shareId} />
      </ThemeProvider>
    );
  }

  if (authLoading) return (
    <ThemeProvider>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', background:'var(--paper)' }}>
        <div style={{ textAlign:'center' }}>
          <div style={{ fontFamily:'Georgia, serif', fontSize:28, color:'var(--sepia)', marginBottom:16 }}>BookSphere</div>
          <div style={{ width:32, height:32, border:'2px solid var(--border)', borderTopColor:'var(--sepia)', borderRadius:'50%', animation:'spin 0.8s linear infinite', margin:'0 auto' }} />
        </div>
      </div>
    </ThemeProvider>
  );

  if (!user) return <ThemeProvider><Login setUser={setUser} /></ThemeProvider>;

  const navigate = (pg, bookId = null) => { setPage(pg); setSelectedBookId(bookId); setAddBookOpen(false); setEditBook(null); };
  const openBook = (id) => navigate('book', id);
  const openAdd = (book = null) => { setEditBook(book); setAddBookOpen(true); };
  const closeAdd = () => { setAddBookOpen(false); setEditBook(null); getBooks(user.uid).then(setAllBooks); };
  const handleExport = () => { getBooks(user.uid).then(b => { setAllBooks(b); setExportOpen(true); }); };
  const handlePrint = () => { getBooks(user.uid).then(b => { setAllBooks(b); setPrintOpen(true); }); };

  return (
    <ThemeProvider>
      <Layout user={user} page={page} navigate={navigate} onAddBook={() => openAdd()} onExport={handleExport} onPrint={handlePrint}>
        {addBookOpen && <AddBook onClose={closeAdd} editBook={editBook} user={user} allBooks={allBooks} />}
        {exportOpen && <ExportModal books={allBooks} onClose={() => setExportOpen(false)} />}
        {printOpen && <PrintView books={allBooks} user={user} onClose={() => setPrintOpen(false)} />}

        {!addBookOpen && page === 'library' && <Library user={user} onOpenBook={openBook} onAddBook={() => openAdd()} onEditBook={openAdd} />}
        {!addBookOpen && page === 'book' && <BookDetail user={user} bookId={selectedBookId} onBack={() => navigate('library')} onEdit={openAdd} />}
        {!addBookOpen && page === 'shelves' && <Shelves user={user} onOpenBook={openBook} />}
        {!addBookOpen && page === 'wishlist' && <Wishlist user={user} onOpenBook={openBook} onAddBook={() => openAdd()} />}
        {!addBookOpen && page === 'analytics' && <Analytics user={user} />}
        {!addBookOpen && page === 'recommendations' && <Recommendations user={user} />}
      </Layout>
    </ThemeProvider>
  );
}
