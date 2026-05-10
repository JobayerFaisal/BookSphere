import { db } from '../firebase';
import {
  collection, doc, addDoc, updateDoc, deleteDoc,
  getDocs, getDoc, query, where, orderBy, serverTimestamp
} from 'firebase/firestore';

const booksCol = (uid) => collection(db, 'users', uid, 'books');

export async function getBooks(uid) {
  const q = query(booksCol(uid), orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function getBook(uid, bookId) {
  const ref = doc(db, 'users', uid, 'books', bookId);
  const snap = await getDoc(ref);
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

export async function addBook(uid, data) {
  return addDoc(booksCol(uid), { ...data, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
}

export async function updateBook(uid, bookId, data) {
  const ref = doc(db, 'users', uid, 'books', bookId);
  return updateDoc(ref, { ...data, updatedAt: serverTimestamp() });
}

export async function deleteBook(uid, bookId) {
  const ref = doc(db, 'users', uid, 'books', bookId);
  return deleteDoc(ref);
}

export const STATUSES = ['To Read', 'Reading', 'Finished', 'Paused', 'Dropped'];
export const LANGUAGES = ['বাংলা', 'English', 'Other'];
export const GENRES = ['Fiction', 'Non-fiction', 'Poetry', 'History', 'Science', 'Biography', 'Philosophy', 'Religion', 'Children', 'Thriller', 'Romance', 'Classic', 'Other'];
export const SHELF_COLORS = ['#c0392b','#8b6f47','#2980b9','#27ae60','#8e44ad','#e67e22','#16a085','#2c3e50'];
