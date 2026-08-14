import { create } from "zustand";
import { dbService } from "../firebase/config";

export interface Note {
  id: string;
  title: string;
  content: string;
  assets: string[];  // asset symbols tagged
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface NotesState {
  notes: Note[];
  loading: boolean;
  activeSubscription: (() => void) | null;
  fetchNotes: (uid: string) => Promise<void>;
  addNote: (uid: string, note: Omit<Note, "id" | "createdAt" | "updatedAt">) => Promise<void>;
  updateNote: (uid: string, id: string, updates: Partial<Note>) => Promise<void>;
  deleteNote: (uid: string, id: string) => Promise<void>;
}

export const useNotesStore = create<NotesState>((set, get) => ({
  notes: [],
  loading: false,
  activeSubscription: null,

  fetchNotes: async (uid) => {
    set({ loading: true });

    if (get().activeSubscription) {
      get().activeSubscription!();
    }

    try {
      const notes = await dbService.getNotes(uid);
      set({ notes, loading: false });

      // Continuous Firestore Realtime Synchronization
      const unsub = dbService.subscribeNotes(uid, (newNotes) => {
        set({ notes: newNotes });
      });
      set({ activeSubscription: unsub });
    } catch {
      set({ loading: false });
    }
  },

  addNote: async (uid, noteData) => {
    const newNote: Note = {
      id: `note-${Date.now()}`,
      ...noteData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    // Instant optimistic update
    set({ notes: [newNote, ...get().notes] });
    // Continuous persistence
    await dbService.saveNote(uid, newNote);
  },

  updateNote: async (uid, id, updates) => {
    const existing = get().notes.find((n) => n.id === id);
    if (!existing) return;
    const updated = { ...existing, ...updates, updatedAt: new Date().toISOString() };
    // Instant optimistic update
    set({ notes: get().notes.map((n) => (n.id === id ? updated : n)) });
    // Continuous persistence
    await dbService.saveNote(uid, updated);
  },

  deleteNote: async (uid, id) => {
    // Instant optimistic update
    set({ notes: get().notes.filter((n) => n.id !== id) });
    // Continuous persistence
    await dbService.deleteNote(uid, id);
  },
}));
