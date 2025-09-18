import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

export interface DocumentData {
  id: string;
  name: string;
  content: string;
  language: string;
  path?: string;
  createdAt: number;
  updatedAt: number;
  isDirty: boolean;
}

interface DocumentsState {
  documentsById: Record<string, DocumentData>;
  createDocument: (name: string, options?: { content?: string; language?: string; path?: string }) => string;
  updateDocumentContent: (id: string, content: string) => void;
  renameDocument: (id: string, name: string) => void;
  setDocumentLanguage: (id: string, language: string) => void;
  setDocumentPath: (id: string, path: string) => void;
  getDocument: (id?: string) => DocumentData | undefined;
}

export const useDocuments = create<DocumentsState>()(
  persist(
    immer((set, get) => ({
      documentsById: {},

      createDocument: (name, options) => {
        const id = Date.now().toString() + Math.random().toString(36).slice(2);
        const now = Date.now();
        const doc: DocumentData = {
          id,
          name,
          content: options?.content ?? '',
          language: options?.language ?? 'markdown',
          path: options?.path,
          createdAt: now,
          updatedAt: now,
          isDirty: Boolean(options?.content && options?.content.length > 0)
        };
        set((state) => {
          state.documentsById[id] = doc;
        });
        return id;
      },

      updateDocumentContent: (id, content) => {
        set((state) => {
          const existing = state.documentsById[id];
          if (!existing) return;
          existing.content = content;
          existing.updatedAt = Date.now();
          existing.isDirty = true;
        });
      },

      renameDocument: (id, name) => {
        set((state) => {
          const existing = state.documentsById[id];
          if (!existing) return;
          existing.name = name;
          existing.updatedAt = Date.now();
        });
      },

      setDocumentLanguage: (id, language) => {
        set((state) => {
          const existing = state.documentsById[id];
          if (!existing) return;
          existing.language = language;
          existing.updatedAt = Date.now();
        });
      },

      setDocumentPath: (id, path) => {
        set((state) => {
          const existing = state.documentsById[id];
          if (!existing) return;
          existing.path = path;
          existing.updatedAt = Date.now();
        });
      },

      getDocument: (id) => {
        if (!id) return undefined;
        return get().documentsById[id];
      }
    })),
    {
      name: 'obsidian.clone.documents',
      partialize: (state) => ({ documentsById: state.documentsById })
    }
  )
);

