import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

export interface FileNodeData {
  id: string;
  name: string;
  type: 'file' | 'folder';
  parentId?: string;
  children?: string[]; // store ids for folders
  documentId?: string; // for files
  createdAt: number;
  updatedAt: number;
}

interface FileTreeState {
  nodesById: Record<string, FileNodeData>;
  rootId: string;
  createFolder: (parentId: string, name?: string) => string;
  createFile: (parentId: string, name?: string, documentId?: string) => string;
  renameNode: (id: string, name: string) => void;
  deleteNode: (id: string) => void;
  listChildren: (id: string) => FileNodeData[];
}

const initializeRoot = (): { rootId: string; nodesById: Record<string, FileNodeData> } => {
  const id = 'root-' + Date.now().toString(36);
  const now = Date.now();
  const root: FileNodeData = { id, name: 'Vault', type: 'folder', children: [], createdAt: now, updatedAt: now };
  return { rootId: id, nodesById: { [id]: root } };
};

export const useFileTree = create<FileTreeState>()(
  persist(
    immer((set, get) => ({
      ...initializeRoot(),

      createFolder: (parentId, name) => {
        const id = 'fld-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
        const now = Date.now();
        set((state) => {
          const parent = state.nodesById[parentId];
          if (!parent || parent.type !== 'folder') return;
          const node: FileNodeData = { id, name: name ?? '新建文件夹', type: 'folder', parentId, children: [], createdAt: now, updatedAt: now };
          state.nodesById[id] = node;
          parent.children = [...(parent.children ?? []), id];
          parent.updatedAt = now;
        });
        return id;
      },

      createFile: (parentId, name, documentId) => {
        const id = 'fil-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
        const now = Date.now();
        set((state) => {
          const parent = state.nodesById[parentId];
          if (!parent || parent.type !== 'folder') return;
          const node: FileNodeData = { id, name: name ?? '未命名.md', type: 'file', parentId, documentId, createdAt: now, updatedAt: now };
          state.nodesById[id] = node;
          parent.children = [...(parent.children ?? []), id];
          parent.updatedAt = now;
        });
        return id;
      },

      renameNode: (id, name) => {
        set((state) => {
          const node = state.nodesById[id];
          if (!node) return;
          node.name = name;
          node.updatedAt = Date.now();
        });
      },

      deleteNode: (id) => {
        set((state) => {
          const node = state.nodesById[id];
          if (!node) return;
          const removeRecursively = (nid: string) => {
            const n = state.nodesById[nid];
            if (!n) return;
            if (n.type === 'folder') {
              (n.children ?? []).forEach(removeRecursively);
            }
            delete state.nodesById[nid];
          };
          removeRecursively(id);
          if (node.parentId) {
            const parent = state.nodesById[node.parentId];
            if (parent) {
              parent.children = (parent.children ?? []).filter((cid) => cid !== id);
              parent.updatedAt = Date.now();
            }
          }
        });
      },

      listChildren: (id) => {
        const node = get().nodesById[id];
        if (!node || node.type !== 'folder') return [];
        return (node.children ?? []).map((cid) => get().nodesById[cid]).filter(Boolean) as FileNodeData[];
      },
    })),
    {
      name: 'obsidian.clone.filetree',
      partialize: (state) => ({ rootId: state.rootId, nodesById: state.nodesById })
    }
  )
);

