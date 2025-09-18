import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Document {
  id: string;
  name: string;
  content: string;
  language: string;
  isDirty: boolean;
  createdAt: number;
  updatedAt: number;
}

interface DocumentsState {
  documentsById: Record<string, Document>;
  createDocument: (name: string, options?: { content?: string; language?: string }) => string;
  getDocument: (id?: string) => Document | null;
  updateDocumentContent: (id: string, content: string) => void;
  renameDocument: (id: string, newName: string) => void;
  deleteDocument: (id: string) => void;
  markDirty: (id: string, isDirty: boolean) => void;
}

export const useDocuments = create<DocumentsState>()(
  persist(
    (set, get) => ({
      documentsById: {},

      createDocument: (name: string, options = {}) => {
        const id = Date.now().toString();
        const document: Document = {
          id,
          name,
          content: options.content || '',
          language: options.language || 'markdown',
          isDirty: false,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };

        set((state) => ({
          documentsById: {
            ...state.documentsById,
            [id]: document,
          },
        }));

        return id;
      },

      getDocument: (id) => {
        if (!id) return null;
        return get().documentsById[id] || null;
      },

      updateDocumentContent: (id: string, content: string) => {
        set((state) => {
          const document = state.documentsById[id];
          if (!document) return state;

          return {
            documentsById: {
              ...state.documentsById,
              [id]: {
                ...document,
                content,
                isDirty: content !== document.content,
                updatedAt: Date.now(),
              },
            },
          };
        });
      },

      renameDocument: (id: string, newName: string) => {
        set((state) => {
          const document = state.documentsById[id];
          if (!document) return state;

          return {
            documentsById: {
              ...state.documentsById,
              [id]: {
                ...document,
                name: newName,
                updatedAt: Date.now(),
              },
            },
          };
        });
      },

      deleteDocument: (id: string) => {
        set((state) => {
          const { [id]: _, ...rest } = state.documentsById;
          return { documentsById: rest };
        });
      },

      markDirty: (id: string, isDirty: boolean) => {
        set((state) => {
          const document = state.documentsById[id];
          if (!document) return state;

          return {
            documentsById: {
              ...state.documentsById,
              [id]: {
                ...document,
                isDirty,
                updatedAt: Date.now(),
              },
            },
          };
        });
      },
    }),
    {
      name: 'documents-storage',
    }
  )
);
