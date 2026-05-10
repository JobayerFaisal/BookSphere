import { db } from '../firebase';
import { collection, addDoc, getDocs, query, orderBy, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';

const sessionsCol = (uid, bookId) => collection(db, 'users', uid, 'books', bookId, 'sessions');

export async function getSessions(uid, bookId) {
  const q = query(sessionsCol(uid, bookId), orderBy('date', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function addSession(uid, bookId, { date, pagesRead, notes }) {
  return addDoc(sessionsCol(uid, bookId), { date, pagesRead, notes: notes || '', createdAt: serverTimestamp() });
}

export async function deleteSession(uid, bookId, sessionId) {
  return deleteDoc(doc(db, 'users', uid, 'books', bookId, 'sessions', sessionId));
}

// Get all sessions across all books for analytics
export async function getAllSessions(uid, books) {
  const results = [];
  for (const book of books) {
    try {
      const sessions = await getSessions(uid, book.id);
      sessions.forEach(s => results.push({ ...s, bookId: book.id, bookTitle: book.title }));
    } catch {}
  }
  return results;
}
