"use client";

import React, { useCallback, useMemo } from "react";
import {
  createEditor,
  Descendant,
  Editor,
  Transforms,
  Element as SlateElement,
  BaseEditor,
} from "slate";
import { Slate, Editable, withReact, useSlate, ReactEditor } from "slate-react";
import { withHistory } from "slate-history";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Bold,
  Italic,
  Underline,
  Code,
  Quote,
  List,
  ListOrdered,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Heading1,
  Heading2,
  Heading3,
  Type,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Types
type CustomElement = {
  type:
    | "paragraph"
    | "heading-one"
    | "heading-two"
    | "heading-three"
    | "block-quote"
    | "bulleted-list"
    | "numbered-list"
    | "list-item"
    | "link"
    | "image";
  align?: "left" | "center" | "right";
  url?: string;
  children: CustomText[];
};

type CustomText = {
  text: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  code?: boolean;
};

declare module "slate" {
  interface CustomTypes {
    Editor: BaseEditor & ReactEditor;
    Element: CustomElement;
    Text: CustomText;
  }
}

interface RichTextEditorProps {
  value?: Descendant[];
  onChange?: (value: Descendant[]) => void;
  placeholder?: string;
  className?: string;
  readOnly?: boolean;
  autoFocus?: boolean;
}

const HOTKEYS: Record<string, string> = {
  "mod+b": "bold",
  "mod+i": "italic",
  "mod+u": "underline",
  "mod+`": "code",
};

const LIST_TYPES = ["numbered-list", "bulleted-list"];
const TEXT_ALIGN_TYPES = ["left", "center", "right"];

export function RichTextEditor({
  value,
  onChange,
  placeholder = "Enter some text...",
  className,
  readOnly = false,
  autoFocus = false,
}: RichTextEditorProps) {
  const editor = useMemo(() => withHistory(withReact(createEditor())), []);

  const initialValue: Descendant[] = useMemo(
    () =>
      value || [
        {
          type: "paragraph",
          children: [{ text: "" }],
        },
      ],
    [value],
  );

  const renderElement = useCallback((props: any) => <Element {...props} />, []);
  const renderLeaf = useCallback((props: any) => <Leaf {...props} />, []);

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      for (const hotkey in HOTKEYS) {
        if (isHotkey(hotkey, event)) {
          event.preventDefault();
          const mark = HOTKEYS[hotkey];
          toggleMark(editor, mark);
        }
      }
    },
    [editor],
  );

  return (
    <div className={cn("border rounded-md", className)}>
      <Slate
        editor={editor}
        initialValue={initialValue}
        onChange={(value) => onChange?.(value)}
      >
        {!readOnly && <Toolbar />}
        <div className="p-4">
          <Editable
            renderElement={renderElement}
            renderLeaf={renderLeaf}
            placeholder={placeholder}
            spellCheck
            autoFocus={autoFocus}
            onKeyDown={handleKeyDown}
            className="min-h-[200px] outline-none"
            readOnly={readOnly}
          />
        </div>
      </Slate>
    </div>
  );
}

// Toolbar Component
function Toolbar() {
  return (
    <div className="border-b p-2 flex flex-wrap items-center gap-1">
      <MarkButton format="bold" icon={<Bold className="h-4 w-4" />} />
      <MarkButton format="italic" icon={<Italic className="h-4 w-4" />} />
      <MarkButton format="underline" icon={<Underline className="h-4 w-4" />} />
      <MarkButton format="code" icon={<Code className="h-4 w-4" />} />

      <Separator orientation="vertical" className="h-6 mx-1" />

      <BlockButton
        format="heading-one"
        icon={<Heading1 className="h-4 w-4" />}
      />
      <BlockButton
        format="heading-two"
        icon={<Heading2 className="h-4 w-4" />}
      />
      <BlockButton
        format="heading-three"
        icon={<Heading3 className="h-4 w-4" />}
      />
      <BlockButton format="paragraph" icon={<Type className="h-4 w-4" />} />

      <Separator orientation="vertical" className="h-6 mx-1" />

      <BlockButton format="block-quote" icon={<Quote className="h-4 w-4" />} />
      <BlockButton
        format="numbered-list"
        icon={<ListOrdered className="h-4 w-4" />}
      />
      <BlockButton format="bulleted-list" icon={<List className="h-4 w-4" />} />

      <Separator orientation="vertical" className="h-6 mx-1" />

      <AlignButton format="left" icon={<AlignLeft className="h-4 w-4" />} />
      <AlignButton format="center" icon={<AlignCenter className="h-4 w-4" />} />
      <AlignButton format="right" icon={<AlignRight className="h-4 w-4" />} />
    </div>
  );
}

// Mark Button (Bold, Italic, etc.)
function MarkButton({
  format,
  icon,
}: {
  format: string;
  icon: React.ReactNode;
}) {
  const editor = useSlate();
  const isActive = isMarkActive(editor, format);

  return (
    <Button
      variant={isActive ? "default" : "ghost"}
      size="sm"
      onMouseDown={(event) => {
        event.preventDefault();
        toggleMark(editor, format);
      }}
    >
      {icon}
    </Button>
  );
}

// Block Button (Headings, Lists, etc.)
function BlockButton({
  format,
  icon,
}: {
  format: string;
  icon: React.ReactNode;
}) {
  const editor = useSlate();
  const isActive = isBlockActive(
    editor,
    format,
    TEXT_ALIGN_TYPES.includes(format) ? "align" : "type",
  );

  return (
    <Button
      variant={isActive ? "default" : "ghost"}
      size="sm"
      onMouseDown={(event) => {
        event.preventDefault();
        toggleBlock(editor, format);
      }}
    >
      {icon}
    </Button>
  );
}

// Align Button
function AlignButton({
  format,
  icon,
}: {
  format: string;
  icon: React.ReactNode;
}) {
  const editor = useSlate();
  const isActive = isBlockActive(editor, format, "align");

  return (
    <Button
      variant={isActive ? "default" : "ghost"}
      size="sm"
      onMouseDown={(event) => {
        event.preventDefault();
        toggleAlign(editor, format);
      }}
    >
      {icon}
    </Button>
  );
}

// Element Renderer
function Element({ attributes, children, element }: any) {
  const style = { textAlign: element.align };

  switch (element.type) {
    case "block-quote":
      return (
        <blockquote
          style={style}
          {...attributes}
          className="border-l-4 border-muted-foreground pl-4 italic"
        >
          {children}
        </blockquote>
      );
    case "bulleted-list":
      return (
        <ul style={style} {...attributes} className="list-disc pl-6">
          {children}
        </ul>
      );
    case "heading-one":
      return (
        <h1 style={style} {...attributes} className="text-3xl font-bold">
          {children}
        </h1>
      );
    case "heading-two":
      return (
        <h2 style={style} {...attributes} className="text-2xl font-semibold">
          {children}
        </h2>
      );
    case "heading-three":
      return (
        <h3 style={style} {...attributes} className="text-xl font-medium">
          {children}
        </h3>
      );
    case "list-item":
      return (
        <li style={style} {...attributes}>
          {children}
        </li>
      );
    case "numbered-list":
      return (
        <ol style={style} {...attributes} className="list-decimal pl-6">
          {children}
        </ol>
      );
    case "link":
      return (
        <a
          {...attributes}
          href={element.url}
          className="text-primary underline"
          target="_blank"
          rel="noopener noreferrer"
        >
          {children}
        </a>
      );
    default:
      return (
        <p style={style} {...attributes}>
          {children}
        </p>
      );
  }
}

// Leaf Renderer
function Leaf({ attributes, children, leaf }: any) {
  if (leaf.bold) {
    children = <strong>{children}</strong>;
  }

  if (leaf.code) {
    children = (
      <code className="bg-muted px-1 py-0.5 rounded text-sm font-mono">
        {children}
      </code>
    );
  }

  if (leaf.italic) {
    children = <em>{children}</em>;
  }

  if (leaf.underline) {
    children = <u>{children}</u>;
  }

  return <span {...attributes}>{children}</span>;
}

// Helper Functions
function isMarkActive(editor: Editor, format: string) {
  const marks = Editor.marks(editor);
  return marks ? (marks as any)[format] === true : false;
}

function isBlockActive(editor: Editor, format: string, blockType = "type") {
  const { selection } = editor;
  if (!selection) return false;

  const [match] = Array.from(
    Editor.nodes(editor, {
      at: Editor.unhangRange(editor, selection),
      match: (n) =>
        !Editor.isEditor(n) &&
        SlateElement.isElement(n) &&
        (n as any)[blockType] === format,
    }),
  );

  return !!match;
}

function toggleMark(editor: Editor, format: string) {
  const isActive = isMarkActive(editor, format);

  if (isActive) {
    Editor.removeMark(editor, format);
  } else {
    Editor.addMark(editor, format, true);
  }
}

function toggleBlock(editor: Editor, format: string) {
  const isActive = isBlockActive(
    editor,
    format,
    TEXT_ALIGN_TYPES.includes(format) ? "align" : "type",
  );
  const isList = LIST_TYPES.includes(format);

  Transforms.unwrapNodes(editor, {
    match: (n) =>
      !Editor.isEditor(n) &&
      SlateElement.isElement(n) &&
      LIST_TYPES.includes((n as any).type) &&
      !TEXT_ALIGN_TYPES.includes(format),
    split: true,
  });

  let newProperties: Partial<SlateElement>;
  if (TEXT_ALIGN_TYPES.includes(format)) {
    newProperties = {
      align: isActive ? undefined : (format as any),
    };
  } else {
    newProperties = {
      type: isActive ? "paragraph" : (format as any),
    };
  }

  Transforms.setNodes<SlateElement>(editor, newProperties);

  if (!isActive && isList) {
    const block = { type: format as any, children: [] };
    Transforms.wrapNodes(editor, block);
  }
}

function toggleAlign(editor: Editor, format: string) {
  const isActive = isBlockActive(editor, format, "align");
  Transforms.setNodes(
    editor,
    {
      align: isActive ? undefined : (format as any),
    },
    { match: (n) => !Editor.isEditor(n) && SlateElement.isElement(n) },
  );
}

function isHotkey(hotkey: string, event: React.KeyboardEvent): boolean {
  const keys = hotkey.split("+");
  const modKey = keys.includes("mod");
  const ctrlKey = keys.includes("ctrl");
  const altKey = keys.includes("alt");
  const shiftKey = keys.includes("shift");
  const key = keys[keys.length - 1];

  const isModPressed = modKey ? event.ctrlKey || event.metaKey : true;
  const isCtrlPressed = ctrlKey ? event.ctrlKey : true;
  const isAltPressed = altKey ? event.altKey : true;
  const isShiftPressed = shiftKey ? event.shiftKey : true;

  return (
    isModPressed &&
    isCtrlPressed &&
    isAltPressed &&
    isShiftPressed &&
    event.key.toLowerCase() === key.toLowerCase()
  );
}
