import { db } from '../firebase';
import { doc, setDoc, getDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';

// Create or update a public share for a book
export async function createShare(uid, book) {
  const shareId = `${uid}_${book.id}`;
  const shareData = {
    shareId,
    uid,
    bookId: book.id,
    title: book.title || '',
    author: book.author || '',
    language: book.language || '',
    genre: book.genre || '',
    status: book.status || '',
    rating: book.rating || 0,
    review: book.review || '',
    coverUrl: book.coverUrl || '',
    year: book.year || '',
    publisher: book.publisher || '',
    tags: book.tags || [],
    sharedAt: serverTimestamp(),
  };
  await setDoc(doc(db, 'shares', shareId), shareData);
  return shareId;
}

export async function getShare(shareId) {
  const snap = await getDoc(doc(db, 'shares', shareId));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

export async function deleteShare(uid, bookId) {
  const shareId = `${uid}_${bookId}`;
  await deleteDoc(doc(db, 'shares', shareId));
}

export async function getShareId(uid, bookId) {
  const shareId = `${uid}_${bookId}`;
  const snap = await getDoc(doc(db, 'shares', shareId));
  return snap.exists() ? shareId : null;
}
