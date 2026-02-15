'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import '@uiw/react-md-editor/markdown-editor.css';
import '@uiw/react-markdown-preview/markdown.css';

const MDEditor = dynamic(
  () => import('@uiw/react-md-editor').then((mod) => mod.default),
  { ssr: false }
);

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  height?: number;
  className?: string;
}

export function MarkdownEditor({ 
  value, 
  onChange, 
  height = 400,
  className = '' 
}: MarkdownEditorProps) {
  return (
    <div className={className} data-color-mode="light">
      <MDEditor
        value={value}
        onChange={(val) => onChange(val || '')}
        height={height}
        preview="live"
        highlightEnable
      />
    </div>
  );
}
