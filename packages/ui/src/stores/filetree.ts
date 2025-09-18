import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface FileNode {
  id: string;
  name: string;
  type: 'file' | 'folder';
  parentId: string | null;
  documentId?: string; // For files, reference to document
  isExpanded?: boolean; // For folders
  createdAt: number;
  updatedAt: number;
}

interface FileTreeState {
  nodesById: Record<string, FileNode>;
  rootId: string;
  
  // Actions
  createFile: (parentId: string, name: string, documentId?: string) => string;
  createFolder: (parentId: string, name?: string) => string;
  deleteNode: (nodeId: string) => void;
  renameNode: (nodeId: string, newName: string) => void;
  moveNode: (nodeId: string, newParentId: string) => void;
  toggleFolder: (folderId: string) => void;
  
  // Queries
  getNode: (nodeId: string) => FileNode | null;
  listChildren: (parentId: string) => FileNode[];
  getNodePath: (nodeId: string) => string[];
  findNodeByName: (name: string, parentId?: string) => FileNode | null;
}

export const useFileTree = create<FileTreeState>()(
  persist(
    (set, get) => {
      // Initialize root folder if it doesn't exist
      const initializeRoot = () => {
        const rootId = 'root';
        const existingRoot = get().nodesById[rootId];
        
        if (!existingRoot) {
          const rootNode: FileNode = {
            id: rootId,
            name: '根目录',
            type: 'folder',
            parentId: null,
            isExpanded: true,
            createdAt: Date.now(),
            updatedAt: Date.now(),
          };
          
          set((state) => ({
            nodesById: {
              ...state.nodesById,
              [rootId]: rootNode,
            },
            rootId,
          }));
        }
      };

      // Initialize root on store creation
      setTimeout(initializeRoot, 0);

      return {
        nodesById: {},
        rootId: 'root',

        createFile: (parentId: string, name: string, documentId?: string) => {
          const id = Date.now().toString();
          const fileNode: FileNode = {
            id,
            name,
            type: 'file',
            parentId,
            documentId,
            createdAt: Date.now(),
            updatedAt: Date.now(),
          };

          set((state) => ({
            nodesById: {
              ...state.nodesById,
              [id]: fileNode,
            },
          }));

          return id;
        },

        createFolder: (parentId: string, name?: string) => {
          const id = Date.now().toString();
          const folderName = name || `新建文件夹${Object.keys(get().nodesById).length}`;
          
          const folderNode: FileNode = {
            id,
            name: folderName,
            type: 'folder',
            parentId,
            isExpanded: false,
            createdAt: Date.now(),
            updatedAt: Date.now(),
          };

          set((state) => ({
            nodesById: {
              ...state.nodesById,
              [id]: folderNode,
            },
          }));

          return id;
        },

        deleteNode: (nodeId: string) => {
          const deleteRecursively = (id: string, nodes: Record<string, FileNode>) => {
            // Find all children
            const children = Object.values(nodes).filter(node => node.parentId === id);
            
            // Delete children first
            children.forEach(child => {
              deleteRecursively(child.id, nodes);
            });
            
            // Delete the node itself
            delete nodes[id];
          };

          set((state) => {
            const newNodes = { ...state.nodesById };
            deleteRecursively(nodeId, newNodes);
            return { nodesById: newNodes };
          });
        },

        renameNode: (nodeId: string, newName: string) => {
          set((state) => {
            const node = state.nodesById[nodeId];
            if (!node) return state;

            return {
              nodesById: {
                ...state.nodesById,
                [nodeId]: {
                  ...node,
                  name: newName,
                  updatedAt: Date.now(),
                },
              },
            };
          });
        },

        moveNode: (nodeId: string, newParentId: string) => {
          set((state) => {
            const node = state.nodesById[nodeId];
            if (!node) return state;

            // Prevent moving to self or descendant
            const isDescendant = (checkId: string, ancestorId: string): boolean => {
              const checkNode = state.nodesById[checkId];
              if (!checkNode || !checkNode.parentId) return false;
              if (checkNode.parentId === ancestorId) return true;
              return isDescendant(checkNode.parentId, ancestorId);
            };

            if (nodeId === newParentId || isDescendant(newParentId, nodeId)) {
              return state;
            }

            return {
              nodesById: {
                ...state.nodesById,
                [nodeId]: {
                  ...node,
                  parentId: newParentId,
                  updatedAt: Date.now(),
                },
              },
            };
          });
        },

        toggleFolder: (folderId: string) => {
          set((state) => {
            const folder = state.nodesById[folderId];
            if (!folder || folder.type !== 'folder') return state;

            return {
              nodesById: {
                ...state.nodesById,
                [folderId]: {
                  ...folder,
                  isExpanded: !folder.isExpanded,
                  updatedAt: Date.now(),
                },
              },
            };
          });
        },

        // Queries
        getNode: (nodeId: string) => {
          return get().nodesById[nodeId] || null;
        },

        listChildren: (parentId: string) => {
          const nodes = get().nodesById;
          return Object.values(nodes)
            .filter(node => node.parentId === parentId)
            .sort((a, b) => {
              // Folders first, then files
              if (a.type !== b.type) {
                return a.type === 'folder' ? -1 : 1;
              }
              // Then by name
              return a.name.localeCompare(b.name, 'zh-CN');
            });
        },

        getNodePath: (nodeId: string) => {
          const path: string[] = [];
          let currentId: string | null = nodeId;
          const nodes = get().nodesById;

          while (currentId && nodes[currentId]) {
            const node: FileNode = nodes[currentId];
            path.unshift(node.name);
            currentId = node.parentId;
          }

          return path;
        },

        findNodeByName: (name: string, parentId?: string) => {
          const nodes = get().nodesById;
          const searchNodes = parentId 
            ? Object.values(nodes).filter(node => node.parentId === parentId)
            : Object.values(nodes);

          return searchNodes.find(node => node.name === name) || null;
        },
      };
    },
    {
      name: 'file-tree-storage',
    }
  )
);
