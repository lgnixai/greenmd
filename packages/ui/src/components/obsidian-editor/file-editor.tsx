import React, { useEffect, useRef, useState, useCallback } from 'react';
import { cn } from '../../lib/utils';
import { FileEditorProps } from '../../types/obsidian-editor';
import { debounce } from '../../utils/obsidian-editor-utils';

// 简单的语法高亮器（基于正则表达式）
const highlightSyntax = (code: string, language: string): string => {
  if (!code) return '';

  let highlighted = code;

  switch (language) {
    case 'javascript':
    case 'typescript':
      // 关键字
      highlighted = highlighted.replace(
        /\b(const|let|var|function|class|if|else|for|while|return|import|export|from|default|async|await|try|catch|finally|throw|new|this|super|extends|implements|interface|type|enum|namespace|public|private|protected|static|readonly)\b/g,
        '<span class="text-blue-600 dark:text-blue-400 font-semibold">$1</span>'
      );
      
      // 字符串
      highlighted = highlighted.replace(
        /(["'`])((?:\\.|(?!\1)[^\\])*?)\1/g,
        '<span class="text-green-600 dark:text-green-400">$1$2$1</span>'
      );
      
      // 注释
      highlighted = highlighted.replace(
        /\/\/.*$/gm,
        '<span class="text-gray-500 dark:text-gray-400 italic">$&</span>'
      );
      highlighted = highlighted.replace(
        /\/\*[\s\S]*?\*\//g,
        '<span class="text-gray-500 dark:text-gray-400 italic">$&</span>'
      );
      
      // 数字
      highlighted = highlighted.replace(
        /\b\d+\.?\d*\b/g,
        '<span class="text-purple-600 dark:text-purple-400">$&</span>'
      );
      break;

    case 'json':
      // 字符串键和值
      highlighted = highlighted.replace(
        /"([^"\\]|\\.)*"/g,
        '<span class="text-green-600 dark:text-green-400">$&</span>'
      );
      
      // 数字
      highlighted = highlighted.replace(
        /:\s*(-?\d+\.?\d*)/g,
        ': <span class="text-purple-600 dark:text-purple-400">$1</span>'
      );
      
      // 布尔值和null
      highlighted = highlighted.replace(
        /\b(true|false|null)\b/g,
        '<span class="text-blue-600 dark:text-blue-400 font-semibold">$1</span>'
      );
      break;

    case 'html':
      // 标签
      highlighted = highlighted.replace(
        /<\/?([a-zA-Z][a-zA-Z0-9]*)\b[^>]*>/g,
        '<span class="text-blue-600 dark:text-blue-400">$&</span>'
      );
      
      // 属性
      highlighted = highlighted.replace(
        /(\w+)=("[^"]*"|'[^']*')/g,
        '<span class="text-orange-600 dark:text-orange-400">$1</span>=<span class="text-green-600 dark:text-green-400">$2</span>'
      );
      break;

    case 'css':
      // 选择器
      highlighted = highlighted.replace(
        /^[^{]+(?=\s*{)/gm,
        '<span class="text-blue-600 dark:text-blue-400">$&</span>'
      );
      
      // 属性名
      highlighted = highlighted.replace(
        /([a-zA-Z-]+)(?=\s*:)/g,
        '<span class="text-orange-600 dark:text-orange-400">$1</span>'
      );
      
      // 属性值
      highlighted = highlighted.replace(
        /:\s*([^;]+)/g,
        ': <span class="text-green-600 dark:text-green-400">$1</span>'
      );
      break;

    case 'markdown':
      // 标题
      highlighted = highlighted.replace(
        /^(#{1,6})\s+(.+)$/gm,
        '<span class="text-blue-600 dark:text-blue-400 font-bold">$1</span> <span class="font-bold">$2</span>'
      );
      
      // 粗体
      highlighted = highlighted.replace(
        /\*\*(.*?)\*\*/g,
        '<span class="font-bold">**$1**</span>'
      );
      
      // 斜体
      highlighted = highlighted.replace(
        /\*(.*?)\*/g,
        '<span class="italic">*$1*</span>'
      );
      
      // 代码块
      highlighted = highlighted.replace(
        /`([^`]+)`/g,
        '<span class="bg-gray-100 dark:bg-gray-800 px-1 rounded font-mono text-sm">$&</span>'
      );
      
      // 链接
      highlighted = highlighted.replace(
        /\[([^\]]+)\]\(([^)]+)\)/g,
        '<span class="text-blue-600 dark:text-blue-400 underline">$&</span>'
      );
      break;
  }

  return highlighted;
};

export const FileEditor: React.FC<FileEditorProps> = ({
  tab,
  onContentChange,
  readOnly = false,
  settings
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const preRef = useRef<HTMLPreElement>(null);
  const [content, setContent] = useState(tab.content);
  const [cursorPosition, setCursorPosition] = useState({ line: 1, column: 1 });
  const [selection, setSelection] = useState({ start: 0, end: 0 });

  // 防抖的内容更新
  const debouncedContentChange = useCallback(
    debounce((newContent: string) => {
      onContentChange(newContent);
    }, settings.autoSaveDelay || 1000),
    [onContentChange, settings.autoSaveDelay]
  );

  // 同步外部内容变化
  useEffect(() => {
    if (tab.content !== content) {
      setContent(tab.content);
    }
  }, [tab.content]);

  // 处理内容变化
  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    setContent(newContent);
    debouncedContentChange(newContent);
    updateCursorPosition(e.target);
  };

  // 更新光标位置
  const updateCursorPosition = (textarea: HTMLTextAreaElement) => {
    const { selectionStart, selectionEnd, value } = textarea;
    const lines = value.substring(0, selectionStart).split('\n');
    const line = lines.length;
    const column = lines[lines.length - 1].length + 1;
    
    setCursorPosition({ line, column });
    setSelection({ start: selectionStart, end: selectionEnd });
  };

  // 处理键盘快捷键
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const textarea = e.currentTarget;
    
    if (e.ctrlKey || e.metaKey) {
      switch (e.key) {
        case 's':
          e.preventDefault();
          // 触发保存
          onContentChange(content);
          break;
        case 'a':
          e.preventDefault();
          textarea.select();
          break;
        case 'z':
          if (e.shiftKey) {
            e.preventDefault();
            // 重做 (Ctrl+Shift+Z)
            document.execCommand('redo');
          } else {
            e.preventDefault();
            // 撤销 (Ctrl+Z)
            document.execCommand('undo');
          }
          break;
      }
    }

    // Tab 键处理
    if (e.key === 'Tab') {
      e.preventDefault();
      const { selectionStart, selectionEnd, value } = textarea;
      const tabChar = ' '.repeat(settings.tabSize || 2);
      
      if (e.shiftKey) {
        // Shift+Tab: 减少缩进
        const lines = value.split('\n');
        const startLine = value.substring(0, selectionStart).split('\n').length - 1;
        const endLine = value.substring(0, selectionEnd).split('\n').length - 1;
        
        for (let i = startLine; i <= endLine; i++) {
          if (lines[i].startsWith(tabChar)) {
            lines[i] = lines[i].substring(tabChar.length);
          }
        }
        
        const newValue = lines.join('\n');
        setContent(newValue);
        debouncedContentChange(newValue);
      } else {
        // Tab: 增加缩进或插入Tab
        if (selectionStart === selectionEnd) {
          // 插入Tab
          const newValue = value.substring(0, selectionStart) + tabChar + value.substring(selectionEnd);
          setContent(newValue);
          debouncedContentChange(newValue);
          
          setTimeout(() => {
            textarea.setSelectionRange(selectionStart + tabChar.length, selectionStart + tabChar.length);
          }, 0);
        } else {
          // 多行缩进
          const lines = value.split('\n');
          const startLine = value.substring(0, selectionStart).split('\n').length - 1;
          const endLine = value.substring(0, selectionEnd).split('\n').length - 1;
          
          for (let i = startLine; i <= endLine; i++) {
            lines[i] = tabChar + lines[i];
          }
          
          const newValue = lines.join('\n');
          setContent(newValue);
          debouncedContentChange(newValue);
        }
      }
    }

    // Enter 键自动缩进
    if (e.key === 'Enter') {
      const { selectionStart, value } = textarea;
      const lines = value.substring(0, selectionStart).split('\n');
      const currentLine = lines[lines.length - 1];
      const indent = currentLine.match(/^\s*/)?.[0] || '';
      
      setTimeout(() => {
        const newSelectionStart = selectionStart + 1 + indent.length;
        textarea.setSelectionRange(newSelectionStart, newSelectionStart);
      }, 0);
      
      const newValue = value.substring(0, selectionStart) + '\n' + indent + value.substring(selectionStart);
      setContent(newValue);
      debouncedContentChange(newValue);
    }
  };

  // 同步滚动
  const handleScroll = (e: React.UIEvent<HTMLTextAreaElement>) => {
    if (preRef.current) {
      preRef.current.scrollTop = e.currentTarget.scrollTop;
      preRef.current.scrollLeft = e.currentTarget.scrollLeft;
    }
  };

  // 获取行号
  const getLineNumbers = () => {
    const lines = content.split('\n');
    return lines.map((_, index) => index + 1);
  };

  // 语法高亮的内容
  const highlightedContent = tab.language 
    ? highlightSyntax(content, tab.language)
    : content.replace(/</g, '&lt;').replace(/>/g, '&gt;');

  return (
    <div className="flex flex-col h-full bg-background">
      {/* 编辑器工具栏 */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-muted/30">
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span>行 {cursorPosition.line}, 列 {cursorPosition.column}</span>
          {selection.start !== selection.end && (
            <span>已选择 {selection.end - selection.start} 个字符</span>
          )}
          {tab.language && (
            <span className="px-2 py-1 bg-accent rounded text-xs">
              {tab.language.toUpperCase()}
            </span>
          )}
          {tab.encoding && (
            <span className="text-xs">{tab.encoding}</span>
          )}
        </div>
        
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          {readOnly && (
            <span className="px-2 py-1 bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200 rounded text-xs">
              只读
            </span>
          )}
          {tab.isDirty && (
            <span className="px-2 py-1 bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200 rounded text-xs">
              未保存
            </span>
          )}
        </div>
      </div>

      {/* 编辑器主体 */}
      <div className="flex-1 relative overflow-hidden">
        <div className="flex h-full">
          {/* 行号 */}
          {settings.showLineNumbers && (
            <div className="flex-shrink-0 bg-muted/50 border-r border-border px-2 py-4 text-right text-sm text-muted-foreground font-mono select-none">
              {getLineNumbers().map(lineNum => (
                <div key={lineNum} className="leading-6">
                  {lineNum}
                </div>
              ))}
            </div>
          )}

          {/* 编辑器内容区 */}
          <div className="flex-1 relative">
            {/* 语法高亮背景 */}
            <pre
              ref={preRef}
              className={cn(
                "absolute inset-0 p-4 font-mono text-sm leading-6 pointer-events-none overflow-auto whitespace-pre-wrap break-words",
                "scrollbar-none"
              )}
              style={{
                fontSize: `${settings.fontSize}px`,
                fontFamily: settings.fontFamily,
                wordWrap: settings.wordWrap ? 'break-word' : 'normal',
                whiteSpace: settings.wordWrap ? 'pre-wrap' : 'pre'
              }}
              dangerouslySetInnerHTML={{ __html: highlightedContent }}
            />

            {/* 文本输入区 */}
            <textarea
              ref={textareaRef}
              value={content}
              onChange={handleContentChange}
              onKeyDown={handleKeyDown}
              onScroll={handleScroll}
              onSelect={(e) => updateCursorPosition(e.currentTarget)}
              onClick={(e) => updateCursorPosition(e.currentTarget)}
              readOnly={readOnly}
              className={cn(
                "absolute inset-0 p-4 bg-transparent text-transparent caret-foreground resize-none outline-none font-mono text-sm leading-6 overflow-auto",
                "scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent"
              )}
              style={{
                fontSize: `${settings.fontSize}px`,
                fontFamily: settings.fontFamily,
                wordWrap: settings.wordWrap ? 'break-word' : 'normal',
                whiteSpace: settings.wordWrap ? 'pre-wrap' : 'pre'
              }}
              spellCheck={false}
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              placeholder={tab.type === 'file' ? '开始编写代码...' : ''}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

// 编辑器骨架加载组件
export const FileEditorSkeleton: React.FC = () => {
  return (
    <div className="flex flex-col h-full bg-background">
      <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-muted/30">
        <div className="flex items-center gap-4">
          <div className="w-20 h-4 bg-muted rounded animate-pulse" />
          <div className="w-16 h-4 bg-muted rounded animate-pulse" />
        </div>
        <div className="w-12 h-4 bg-muted rounded animate-pulse" />
      </div>
      
      <div className="flex-1 flex">
        <div className="w-12 bg-muted/50 border-r border-border">
          {Array.from({ length: 20 }).map((_, i) => (
            <div key={i} className="h-6 px-2 py-0.5">
              <div className="w-full h-4 bg-muted rounded animate-pulse" />
            </div>
          ))}
        </div>
        
        <div className="flex-1 p-4 space-y-2">
          {Array.from({ length: 15 }).map((_, i) => (
            <div key={i} className="flex gap-2">
              <div className={cn(
                "h-4 bg-muted rounded animate-pulse",
                Math.random() > 0.7 ? "w-1/4" : Math.random() > 0.4 ? "w-1/2" : "w-3/4"
              )} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};