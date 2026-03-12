"use client";

import CodeMirror from "@uiw/react-codemirror";
import { python } from "@codemirror/lang-python";
import { javascript } from "@codemirror/lang-javascript";
import { go } from "@codemirror/lang-go";
import type { SupportedLanguage } from "@code-optimizer/shared";

const LANGUAGE_EXTENSIONS: Record<SupportedLanguage, () => ReturnType<typeof python>> = {
  python: () => python(),
  javascript: () => javascript(),
  typescript: () => javascript({ typescript: true }),
  go: () => go(),
};

interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  language: SupportedLanguage;
  readOnly?: boolean;
  height?: string;
}

export function CodeEditor({
  value,
  onChange,
  language,
  readOnly = false,
  height = "300px",
}: CodeEditorProps) {
  const langExtension = LANGUAGE_EXTENSIONS[language];

  return (
    <CodeMirror
      value={value}
      height={height}
      extensions={[langExtension()]}
      onChange={onChange}
      readOnly={readOnly}
      basicSetup={{
        lineNumbers: true,
        foldGutter: true,
        highlightActiveLine: !readOnly,
      }}
      className="overflow-hidden rounded-lg border border-gray-300"
    />
  );
}
