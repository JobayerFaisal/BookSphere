import { db } from '../firebase';
import {
  collection, doc, addDoc, updateDoc, deleteDoc,
  getDocs, query, orderBy, serverTimestamp
} from 'firebase/firestore';

const storiesCol = (uid, bookId) =>
  collection(db, 'users', uid, 'books', bookId, 'stories');

export async function getStories(uid, bookId) {
  const q = query(storiesCol(uid, bookId), orderBy('order', 'asc'));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function addStory(uid, bookId, data) {
  return addDoc(storiesCol(uid, bookId), {
    ...data,
    createdAt: serverTimestamp(),
  });
}

export async function updateStory(uid, bookId, storyId, data) {
  const ref = doc(db, 'users', uid, 'books', bookId, 'stories', storyId);
  return updateDoc(ref, data);
}

export async function deleteStory(uid, bookId, storyId) {
  const ref = doc(db, 'users', uid, 'books', bookId, 'stories', storyId);
  return deleteDoc(ref);
}

export async function reorderStories(uid, bookId, stories) {
  for (let i = 0; i < stories.length; i++) {
    const ref = doc(db, 'users', uid, 'books', bookId, 'stories', stories[i].id);
    await updateDoc(ref, { order: i });
  }
}

export const STORY_STATUSES = ['To Read', 'Reading', 'Finished', 'Skipped'];
