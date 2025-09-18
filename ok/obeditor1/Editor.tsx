import React, { useMemo, useState, useImperativeHandle, forwardRef, useRef } from 'react';
import { cn } from '../../packages/ui/src/lib/utils';
import { usePerformanceMonitor, globalPerformanceMonitor } from './hooks/usePerformanceMonitor';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $getRoot, KEY_DOWN_COMMAND, COMMAND_PRIORITY_LOW, LexicalEditor } from 'lexical';
import { $convertToMarkdownString, $convertFromMarkdownString, TRANSFORMERS } from '@lexical/markdown';
import { $generateHtmlFromNodes, $generateNodesFromDOM } from '@lexical/html';
import { HeadingNode, QuoteNode, $createHeadingNode } from '@lexical/rich-text';
import { ListNode, ListItemNode } from '@lexical/list';
import { INSERT_UNORDERED_LIST_COMMAND } from '@lexical/list';
import { CodeNode } from '@lexical/code';
import { LinkNode } from '@lexical/link';

export interface EditorHandle {
  setContentFromMarkdown: (markdown: string) => void;
  setContentFromHTML: (html: string) => void;
  getContentAsMarkdown: () => string;
  getContentAsHTML: () => string;
  getContentAsText: () => string;
  registerSlashItems: (items: SlashItem[]) => void;
  focus: () => void;
  blur: () => void;
}

interface SlashItem {
  id: string;
  label: string;
  action: () => void;
  keywords?: string[];
}

interface EditorProps {
  className?: string;
  onChange?: (payload: { markdown: string; html: string; text: string }) => void;
}

function onError(error: unknown) {
  console.error(error);
}

const theme = {} as any;

const Editor = forwardRef<EditorHandle, EditorProps>(({ className, onChange }, ref) => {
  // 性能监控
  usePerformanceMonitor('ObsidianEditor', {
    threshold: 20, // 20ms 阈值
    onMetrics: (metrics) => {
      globalPerformanceMonitor.addMetric(metrics);
    }
  });

  const initialConfig = useMemo(() => ({
    namespace: 'MoleculeObeditor',
    theme,
    onError,
    nodes: [HeadingNode, QuoteNode, ListNode, ListItemNode, CodeNode, LinkNode]
  }), []);

  const [placeholder] = useState('在此输入内容...');
  const editorRef = useRef<LexicalEditor | null>(null);
  const slashItemsRef = useRef<SlashItem[]>([]);

  useImperativeHandle(ref, () => ({
    setContentFromMarkdown: (markdown: string) => {
      const editor = editorRef.current;
      if (!editor) {
        console.warn('Editor not initialized');
        return;
      }
      try {
        editor.update(() => {
          $getRoot().clear();
          $convertFromMarkdownString(markdown, TRANSFORMERS);
        });
      } catch (error) {
        console.error('Error setting markdown content:', error);
      }
    },
    setContentFromHTML: (html: string) => {
      const editor = editorRef.current;
      if (!editor) {
        console.warn('Editor not initialized');
        return;
      }
      try {
        editor.update(() => {
          const parser = new DOMParser();
          const dom = parser.parseFromString(html, 'text/html');
          const nodes = $generateNodesFromDOM(editor, dom);
          const root = $getRoot();
          root.clear();
          nodes.forEach((n) => root.append(n));
        });
      } catch (error) {
        console.error('Error setting HTML content:', error);
      }
    },
    getContentAsMarkdown: () => {
      const editor = editorRef.current;
      if (!editor) {
        console.warn('Editor not initialized');
        return '';
      }
      let md = '';
      try {
        editor.getEditorState().read(() => {
          md = $convertToMarkdownString(TRANSFORMERS);
        });
      } catch (error) {
        console.error('Error getting markdown content:', error);
      }
      return md;
    },
    getContentAsHTML: () => {
      const editor = editorRef.current;
      if (!editor) {
        console.warn('Editor not initialized');
        return '';
      }
      let html = '';
      try {
        editor.getEditorState().read(() => {
          html = $generateHtmlFromNodes(editor, null);
        });
      } catch (error) {
        console.error('Error getting HTML content:', error);
      }
      return html;
    },
    getContentAsText: () => {
      const editor = editorRef.current;
      if (!editor) {
        console.warn('Editor not initialized');
        return '';
      }
      let text = '';
      try {
        editor.getEditorState().read(() => {
          text = $getRoot().getTextContent();
        });
      } catch (error) {
        console.error('Error getting text content:', error);
      }
      return text;
    },
    registerSlashItems: (items: SlashItem[]) => {
      slashItemsRef.current = items || [];
    },
    focus: () => {
      editorRef.current?.focus();
    },
    blur: () => {
      editorRef.current?.blur();
    }
  }), []);

  const containerRef = useRef<HTMLDivElement>(null);

  const SlashMenuPlugin: React.FC<{ containerRef: React.RefObject<HTMLDivElement> }> = ({ containerRef }) => {
    const [editor] = useLexicalComposerContext();
    const [open, setOpen] = useState(false);
    const [activeIndex, setActiveIndex] = useState(0);
    const [pos, setPos] = useState<{x:number;y:number}>({x: 12, y: 12});

    // 将编辑器实例保存到 ref
    React.useEffect(() => {
      editorRef.current = editor;
    }, [editor]);

    const items = React.useMemo(() => {
      if (slashItemsRef.current.length) return slashItemsRef.current;
      return [
        {
          id: 'h1',
          label: 'Heading 1',
          action: () => editor.update(() => {
            const node = $createHeadingNode('h1');
            $getRoot().append(node);
          })
        },
        {
          id: 'bullet',
          label: 'Bullet List',
          action: () => editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined)
        },
        {
          id: 'code',
          label: 'Code Block',
          action: () => editor.update(() => {
            const code = new CodeNode('');
            $getRoot().append(code);
          })
        },
        {
          id: 'quote',
          label: 'Quote',
          action: () => editor.update(() => {
            const q = new QuoteNode('');
            $getRoot().append(q);
          })
        },
      ];
    }, [editor]);

    React.useEffect(() => {
      return editor.registerCommand(
        KEY_DOWN_COMMAND,
        (e: KeyboardEvent) => {
          if (e.key === '/' && !open) {
            const sel = window.getSelection();
            if (sel && sel.rangeCount > 0) {
              const rect = sel.getRangeAt(0).getBoundingClientRect();
              const crect = containerRef.current?.getBoundingClientRect();
              const left = crect ? rect.left - crect.left : rect.left;
              const top = crect ? rect.bottom - crect.top : rect.bottom;
              setPos({ x: left + 8, y: top + 8 });
            }
            setActiveIndex(0);
            setOpen(true);
            return true;
          }
          if (!open) return false;
          if (e.key === 'Escape') { setOpen(false); return true; }
          if (e.key === 'ArrowDown') { setActiveIndex((i)=> (i+1)%items.length); return true; }
          if (e.key === 'ArrowUp') { setActiveIndex((i)=> (i-1+items.length)%items.length); return true; }
          if (e.key === 'Enter') {
            const item = items[activeIndex];
            if (item) { e.preventDefault(); setOpen(false); item.action(); return true; }
          }
          return false;
        },
        COMMAND_PRIORITY_LOW
      );
    }, [editor, open, activeIndex, items]);

    if (!open) return null;
    return (
      <div style={{ position: 'absolute', left: pos.x, top: pos.y, zIndex: 50 }} className="rounded border bg-popover text-popover-foreground shadow-md">
        <ul className="py-1 min-w-[160px]">
          {items.map((it, idx) => (
            <li key={it.id} className={"px-3 py-1 cursor-pointer text-sm " + (idx===activeIndex? 'bg-accent text-accent-foreground':'')}>
              {it.label}
            </li>
          ))}
        </ul>
      </div>
    );
  };

  return (
    <div className={cn('flex h-full w-full min-w-0 flex-col bg-card p-2', className)}>
      <LexicalComposer initialConfig={initialConfig}>
        <div ref={containerRef} className="flex-1 min-h-0 relative">
          <RichTextPlugin
            contentEditable={<ContentEditable className="h-full w-full outline-none" />}
            placeholder={<div className="text-sm text-muted-foreground select-none">{placeholder}</div>}
            ErrorBoundary={LexicalErrorBoundary}
          />
          <HistoryPlugin />
          <OnChangePlugin
            onChange={(editorState, editor) => {
              ;(window as any).__lexicalEditor = editor;
              if (!onChange) return;
              let markdown = '';
              let html = '';
              let text = '';
              editorState.read(() => {
                markdown = $convertToMarkdownString(TRANSFORMERS);
                html = $generateHtmlFromNodes(editor, null);
                text = $getRoot().getTextContent();
              });
              onChange({ markdown, html, text });
            }}
          />
          <SlashMenuPlugin containerRef={containerRef} />
        </div>
      </LexicalComposer>
    </div>
  );
});

export default Editor;