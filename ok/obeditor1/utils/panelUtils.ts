import type { Tab as TabType } from '../Tab';

export interface PanelNode {
  id: string;
  type: 'leaf' | 'split';
  direction?: 'horizontal' | 'vertical';
  tabs?: TabType[];
  children?: PanelNode[];
  size?: number;
  minSize?: number;
}

// 类型守卫函数
export function isPanelNode(obj: any): obj is PanelNode {
  return obj && 
    typeof obj.id === 'string' && 
    (obj.type === 'leaf' || obj.type === 'split') &&
    (!obj.direction || ['horizontal', 'vertical'].includes(obj.direction));
}

// 递归查找面板节点
export function findPanelById(tree: PanelNode | null, id: string): PanelNode | null {
  if (!tree || !isPanelNode(tree)) return null;
  if (tree.id === id) return tree;
  if (tree.children) {
    for (const child of tree.children) {
      const result = findPanelById(child, id);
      if (result) return result;
    }
  }
  return null;
}

// 查找活动的叶子节点
export function findActiveLeaf(tree: PanelNode | null): PanelNode | null {
  if (!tree || !isPanelNode(tree)) return null;
  
  if (tree.type === 'leaf' && tree.tabs?.some(t => t.isActive)) {
    return tree;
  }
  
  if (tree.children) {
    for (const child of tree.children) {
      const result = findActiveLeaf(child);
      if (result) return result;
    }
  }
  
  return null;
}

// 查找第一个叶子节点
export function findFirstLeaf(tree: PanelNode | null): PanelNode | null {
  if (!tree || !isPanelNode(tree)) return null;
  
  if (tree.type === 'leaf') return tree;
  
  if (tree.children) {
    for (const child of tree.children) {
      const result = findFirstLeaf(child);
      if (result) return result;
    }
  }
  
  return null;
}

// 验证面板树的有效性
export function validatePanelTree(tree: any): tree is PanelNode {
  if (!isPanelNode(tree)) return false;
  
  if (tree.type === 'split') {
    if (!tree.children || tree.children.length === 0) return false;
    return tree.children.every(child => validatePanelTree(child));
  }
  
  if (tree.type === 'leaf') {
    if (tree.children) return false; // 叶子节点不应该有子节点
    return true;
  }
  
  return false;
}

// 生成唯一的面板ID
export function generatePanelId(prefix = 'panel'): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// 生成唯一的标签ID
export function generateTabId(prefix = 'tab'): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// 克隆面板节点（深拷贝）
export function clonePanelNode(node: PanelNode): PanelNode {
  const cloned: PanelNode = {
    id: node.id,
    type: node.type,
    direction: node.direction,
    size: node.size,
    minSize: node.minSize
  };
  
  if (node.tabs) {
    cloned.tabs = node.tabs.map(tab => ({ ...tab }));
  }
  
  if (node.children) {
    cloned.children = node.children.map(child => clonePanelNode(child));
  }
  
  return cloned;
}

// 统计面板树中的标签数量
export function countTabs(tree: PanelNode | null): number {
  if (!tree || !isPanelNode(tree)) return 0;
  
  if (tree.type === 'leaf') {
    return tree.tabs?.length || 0;
  }
  
  if (tree.children) {
    return tree.children.reduce((count, child) => count + countTabs(child), 0);
  }
  
  return 0;
}

// 获取所有叶子节点
export function getAllLeafNodes(tree: PanelNode | null): PanelNode[] {
  if (!tree || !isPanelNode(tree)) return [];
  
  if (tree.type === 'leaf') {
    return [tree];
  }
  
  if (tree.children) {
    return tree.children.reduce<PanelNode[]>((leaves, child) => {
      return leaves.concat(getAllLeafNodes(child));
    }, []);
  }
  
  return [];
}

// 检查面板是否为空（没有标签或只有空标签）
export function isPanelEmpty(panel: PanelNode): boolean {
  if (panel.type !== 'leaf') return false;
  return !panel.tabs || panel.tabs.length === 0;
}

// 清理空的面板
export function cleanupEmptyPanels(tree: PanelNode | null): PanelNode | null {
  if (!tree || !isPanelNode(tree)) return null;
  
  if (tree.type === 'leaf') {
    return isPanelEmpty(tree) ? null : tree;
  }
  
  if (tree.children) {
    const cleanedChildren = tree.children
      .map(child => cleanupEmptyPanels(child))
      .filter(child => child !== null) as PanelNode[];
    
    if (cleanedChildren.length === 0) {
      return null;
    }
    
    if (cleanedChildren.length === 1) {
      return cleanedChildren[0];
    }
    
    return {
      ...tree,
      children: cleanedChildren
    };
  }
  
  return tree;
}

// 创建默认的面板树
export function createDefaultPanelTree(): PanelNode {
  return {
    id: generatePanelId('root'),
    type: 'split',
    direction: 'horizontal',
    children: [
      {
        id: generatePanelId('left'),
        type: 'leaf',
        tabs: [
          { 
            id: generateTabId(), 
            title: '新标签页', 
            isActive: true 
          }
        ],
        size: 100,
        minSize: 20,
      },
    ],
  };
}

// 面板树的序列化和反序列化
export function serializePanelTree(tree: PanelNode): string {
  try {
    return JSON.stringify(tree);
  } catch (error) {
    console.error('Error serializing panel tree:', error);
    return '';
  }
}

export function deserializePanelTree(serialized: string): PanelNode | null {
  try {
    const parsed = JSON.parse(serialized);
    return validatePanelTree(parsed) ? parsed : null;
  } catch (error) {
    console.error('Error deserializing panel tree:', error);
    return null;
  }
}
