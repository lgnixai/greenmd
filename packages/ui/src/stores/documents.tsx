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
}

interface DocumentsActions {
  createDocument: (name: string, options?: { content?: string; language?: string; path?: string }) => string;
  updateDocumentContent: (id: string, content: string) => void;
  renameDocument: (id: string, name: string) => void;
  setDocumentLanguage: (id: string, language: string) => void;
  setDocumentPath: (id: string, path: string) => void;
  getDocument: (id?: string) => DocumentData | undefined;
}

export type DocumentsStore = DocumentsState & DocumentsActions;

export const useDocuments = create<DocumentsStore>()(
  persist(
    immer((set, get) => ({
      documentsById: {},

      createDocument: (name: string, options?: { content?: string; language?: string; path?: string }) => {
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

      updateDocumentContent: (id: string, content: string) => {
        set((state) => {
          const existing = state.documentsById[id];
          if (existing) {
            existing.content = content;
            existing.updatedAt = Date.now();
            existing.isDirty = true;
          }
        });
      },

      renameDocument: (id: string, name: string) => {
        set((state) => {
          const existing = state.documentsById[id];
          if (existing) {
            existing.name = name;
            existing.updatedAt = Date.now();
          }
        });
      },

      setDocumentLanguage: (id: string, language: string) => {
        set((state) => {
          const existing = state.documentsById[id];
          if (existing) {
            existing.language = language;
            existing.updatedAt = Date.now();
          }
        });
      },

      setDocumentPath: (id: string, path: string) => {
        set((state) => {
          const existing = state.documentsById[id];
          if (existing) {
            existing.path = path;
            existing.updatedAt = Date.now();
          }
        });
      },

      getDocument: (id?: string) => {
        if (!id) return undefined;
        return get().documentsById[id];
      },
    })),
    {
      name: 'greenmd-documents',
      version: 1,
    }
  )
);

