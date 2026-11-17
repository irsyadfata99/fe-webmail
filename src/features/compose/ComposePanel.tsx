import {
  EditorContent,
  useEditor,
  useEditorState,
  type Editor,
} from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Bold,
  Italic,
  Link2,
  List,
  ListOrdered,
  Paperclip,
  Redo2,
  Send,
  Underline,
  Undo2,
  X,
} from "lucide-react";
import {
  useRef,
  useState,
  type ChangeEvent,
  type ReactNode,
  type RefObject,
} from "react";
import { accountApi } from "@/api/account";
import { ApiError } from "@/api/client";
import { mailApi } from "@/api/mail";
import { Button } from "@/components/ui/button";
import { formatSize } from "@/lib/format";
import type { DraftAttachment, SendPayload } from "@/types/mail";
import { cn } from "@/lib/utils";
import type { ComposeInit } from "./compose-context";
import { isValidEmail, RecipientInput } from "./RecipientInput";
import "./editor.css";

const MAX_FILES = 10;

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function initialHtml(init: ComposeInit, signature: string | null): string {
  // A reopened draft already contains its own signature and quoted text.
  if (init.draft) return init.html || "<p></p>";
  const sig = signature?.trim()
    ? `<p>-- <br>${escapeHtml(signature.trim()).replace(/\r?\n/g, "<br>")}</p>`
    : "";
  // Replies and forwards: your text, then the signature, then the quoted message.
  return init.original
    ? `<p></p>${sig}${init.html ?? ""}`
    : `<p></p>${init.html ?? ""}${sig}`;
}

function ToolButton({
  label,
  active,
  disabled,
  onClick,
  children,
}: {
  label: string;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      aria-pressed={active}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "flex size-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-40",
        active && "bg-accent text-foreground",
      )}
    >
      {children}
    </button>
  );
}

function ComposeEditor({
  init,
  signature,
  onDirty,
  editorRef,
}: {
  init: ComposeInit;
  signature: string | null;
  onDirty: () => void;
  editorRef: RefObject<Editor | null>;
}) {
  const [linkOpen, setLinkOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");

  const editor = useEditor({
    extensions: [StarterKit.configure({ link: { openOnClick: false } })],
    content: initialHtml(init, signature),
    editorProps: {
      attributes: {
        class: "tiptap min-h-48 px-4 py-3 text-sm leading-relaxed outline-none",
        "aria-label": "Message body",
      },
    },
    onUpdate: onDirty,
    onCreate: ({ editor: e }) => e.commands.focus("start"),
  });
  editorRef.current = editor;

  const state = useEditorState({
    editor,
    selector: (ctx) => ({
      bold: ctx.editor?.isActive("bold") ?? false,
      italic: ctx.editor?.isActive("italic") ?? false,
      underline: ctx.editor?.isActive("underline") ?? false,
      bullet: ctx.editor?.isActive("bulletList") ?? false,
      ordered: ctx.editor?.isActive("orderedList") ?? false,
      link: ctx.editor?.isActive("link") ?? false,
      canUndo: ctx.editor?.can().undo() ?? false,
      canRedo: ctx.editor?.can().redo() ?? false,
    }),
  });

  if (!editor) return null;

  function applyLink() {
    const url = linkUrl.trim();
    if (!editor) return;
    if (!url) {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
    } else {
      const href = /^(https?:\/\/|mailto:)/i.test(url) ? url : `https://${url}`;
      editor.chain().focus().extendMarkRange("link").setLink({ href }).run();
    }
    setLinkOpen(false);
    setLinkUrl("");
  }

  return (
    <>
      <div className="flex items-center gap-0.5 border-b px-3 py-1.5">
        <ToolButton
          label="Bold"
          active={state?.bold}
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          <Bold className="size-4" />
        </ToolButton>
        <ToolButton
          label="Italic"
          active={state?.italic}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          <Italic className="size-4" />
        </ToolButton>
        <ToolButton
          label="Underline"
          active={state?.underline}
          onClick={() => editor.chain().focus().toggleUnderline().run()}
        >
          <Underline className="size-4" />
        </ToolButton>
        <ToolButton
          label="Bulleted list"
          active={state?.bullet}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        >
          <List className="size-4" />
        </ToolButton>
        <ToolButton
          label="Numbered list"
          active={state?.ordered}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        >
          <ListOrdered className="size-4" />
        </ToolButton>
        <ToolButton
          label="Link"
          active={state?.link}
          onClick={() => {
            setLinkUrl(
              (editor.getAttributes("link").href as string | undefined) ?? "",
            );
            setLinkOpen((o) => !o);
          }}
        >
          <Link2 className="size-4" />
        </ToolButton>
        <div className="flex-1" />
        <ToolButton
          label="Undo"
          disabled={!state?.canUndo}
          onClick={() => editor.chain().focus().undo().run()}
        >
          <Undo2 className="size-4" />
        </ToolButton>
        <ToolButton
          label="Redo"
          disabled={!state?.canRedo}
          onClick={() => editor.chain().focus().redo().run()}
        >
          <Redo2 className="size-4" />
        </ToolButton>
      </div>
      {linkOpen && (
        <form
          className="flex items-center gap-2 border-b px-4 py-2"
          onSubmit={(e) => {
            e.preventDefault();
            applyLink();
          }}
        >
          <input
            autoFocus
            aria-label="Link URL"
            placeholder="https://example.com (empty removes the link)"
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            className="h-8 flex-1 rounded-lg border bg-transparent px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
          <Button type="submit" size="sm">
            Apply
          </Button>
        </form>
      )}
      <div className="min-h-0 flex-1 overflow-y-auto">
        <EditorContent editor={editor} />
      </div>
    </>
  );
}

const TITLES = { reply: "Reply", forward: "Forward" } as const;

export default function ComposePanel({
  init,
  onFinish,
}: {
  init: ComposeInit;
  onFinish: (notice?: string) => void;
}) {
  const qc = useQueryClient();
  const profile = useQuery({
    queryKey: ["profile"],
    queryFn: accountApi.profile,
    staleTime: 5 * 60_000,
  });

  const [to, setTo] = useState<string[]>(init.to ?? []);
  const [cc, setCc] = useState<string[]>(init.cc ?? []);
  const [bcc, setBcc] = useState<string[]>(init.bcc ?? []);
  const [showCc, setShowCc] = useState(
    (init.cc?.length ?? 0) > 0 || (init.bcc?.length ?? 0) > 0,
  );
  const [subject, setSubject] = useState(init.subject ?? "");
  const [files, setFiles] = useState<File[]>([]);
  const [kept, setKept] = useState<DraftAttachment[]>(
    init.draft?.attachments ?? [],
  );
  const [dirty, setDirty] = useState(false);
  const [confirmClose, setConfirmClose] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<"send" | "save" | "discard" | null>(null);
  const editorRef = useRef<Editor | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  const title = init.original
    ? TITLES[init.original.kind]
    : init.draft
      ? "Draft"
      : "New message";

  function touch<T>(setter: (v: T) => void) {
    return (v: T) => {
      setter(v);
      setDirty(true);
    };
  }

  function onPickFiles(e: ChangeEvent<HTMLInputElement>) {
    const picked = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (picked.length === 0) return;
    if (kept.length + files.length + picked.length > MAX_FILES) {
      setError(`You can attach up to ${MAX_FILES} files.`);
      return;
    }
    setError(null);
    setFiles([...files, ...picked]);
    setDirty(true);
  }

  function refreshLists() {
    void qc.invalidateQueries({ queryKey: ["messages"] });
    void qc.invalidateQueries({ queryKey: ["message"] });
    void qc.invalidateQueries({ queryKey: ["folders"] });
  }

  function buildPayload(editor: Editor): SendPayload {
    return {
      to,
      cc,
      bcc,
      subject: subject.trim(),
      html: editor.getHTML(),
      text: editor.getText({ blockSeparator: "\n" }),
      ...(init.inReplyTo ? { inReplyTo: init.inReplyTo } : {}),
      ...(init.references?.length ? { references: init.references } : {}),
      ...(init.original ? { original: init.original } : {}),
    };
  }

  function requestClose() {
    if (dirty) setConfirmClose(true);
    else onFinish();
  }

  async function send() {
    const editor = editorRef.current;
    if (!editor || busy) return;
    const all = [...to, ...cc, ...bcc];
    if (to.length === 0) return setError("Add at least one recipient.");
    const bad = all.find((a) => !isValidEmail(a));
    if (bad) return setError(`"${bad}" is not a valid email address.`);
    if (editor.getText().trim() === "")
      return setError("Write a message before sending.");

    setError(null);
    setBusy("send");
    try {
      const payload: SendPayload = {
        ...buildPayload(editor),
        ...(init.forwardAttachments && !init.draft
          ? { forwardAttachments: true }
          : {}),
        ...(init.draft
          ? {
              draft: {
                uid: init.draft.uid,
                keepAttachments: kept.map((a) => a.index),
              },
            }
          : {}),
      };
      await mailApi.send(payload, files);
      refreshLists();
      onFinish("Message sent.");
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Could not send the message. Please try again.",
      );
      setBusy(null);
    }
  }

  async function saveDraft() {
    const editor = editorRef.current;
    if (!editor || busy) return;
    const bad = [...to, ...cc, ...bcc].find((a) => !isValidEmail(a));
    if (bad) {
      setConfirmClose(false);
      return setError(`"${bad}" is not a valid email address.`);
    }
    setError(null);
    setBusy("save");
    try {
      const payload: SendPayload = {
        ...buildPayload(editor),
        ...(init.forwardAttachments && !init.draft
          ? { forwardAttachments: true }
          : {}),
        ...(init.draft
          ? {
              replaceUid: init.draft.uid,
              keepAttachments: kept.map((a) => a.index),
            }
          : {}),
      };
      const result = await mailApi.saveDraft(payload, files);
      refreshLists();
      onFinish(result.saved ? "Draft saved." : undefined);
    } catch (err) {
      setConfirmClose(false);
      setError(
        err instanceof ApiError
          ? err.message
          : "Could not save the draft. Please try again.",
      );
      setBusy(null);
    }
  }

  async function discard() {
    setBusy("discard");
    try {
      if (init.draft) {
        await mailApi.deleteDraft(init.draft.uid);
        refreshLists();
      }
    } catch {
      // The draft may already be gone; closing is still the right outcome.
    }
    onFinish(init.draft ? "Draft discarded." : undefined);
  }

  return (
    <div
      role="dialog"
      aria-label={title}
      className="glass-strong glass fixed inset-0 z-50 flex flex-col overflow-hidden md:inset-auto md:bottom-0 md:right-6 md:h-[min(680px,calc(100dvh-2rem))] md:w-[620px] md:rounded-b-none md:rounded-t-2xl"
    >
      <div className="flex h-12 shrink-0 items-center gap-2 border-b px-4">
        <h2 className="flex-1 text-sm font-semibold">{title}</h2>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Close"
          onClick={requestClose}
        >
          <X className="size-4" />
        </Button>
      </div>

      {confirmClose && (
        <div
          role="alert"
          className="flex flex-wrap items-center gap-2 border-b bg-accent px-4 py-2 text-sm"
        >
          <span className="min-w-40 flex-1">Save this message as a draft?</span>
          <Button
            size="sm"
            variant="outline"
            disabled={busy !== null}
            onClick={() => setConfirmClose(false)}
          >
            Keep editing
          </Button>
          <Button
            size="sm"
            variant="destructive"
            disabled={busy !== null}
            onClick={() => void discard()}
          >
            {init.draft ? "Delete draft" : "Discard"}
          </Button>
          <Button
            size="sm"
            disabled={busy !== null}
            onClick={() => void saveDraft()}
          >
            {busy === "save" ? "Saving..." : "Save draft"}
          </Button>
        </div>
      )}

      {profile.isPending ? (
        <p className="p-6 text-sm text-muted-foreground">Loading...</p>
      ) : (
        <>
          <div className="flex items-start">
            <div className="min-w-0 flex-1">
              <RecipientInput
                label="To"
                value={to}
                onChange={touch(setTo)}
                autoFocus={!init.to?.length}
              />
            </div>
            {!showCc && (
              <button
                type="button"
                className="px-4 py-3 text-xs text-muted-foreground hover:text-foreground"
                onClick={() => setShowCc(true)}
              >
                Cc / Bcc
              </button>
            )}
          </div>
          {showCc && (
            <>
              <RecipientInput label="Cc" value={cc} onChange={touch(setCc)} />
              <RecipientInput
                label="Bcc"
                value={bcc}
                onChange={touch(setBcc)}
              />
            </>
          )}
          <div className="flex items-center gap-2 border-b px-4">
            <input
              aria-label="Subject"
              placeholder="Subject"
              value={subject}
              maxLength={255}
              onChange={(e) => touch(setSubject)(e.target.value)}
              className="h-11 flex-1 bg-transparent text-sm outline-none"
            />
          </div>

          <ComposeEditor
            init={init}
            signature={profile.data?.signature ?? null}
            onDirty={() => setDirty(true)}
            editorRef={editorRef}
          />

          {(kept.length > 0 || files.length > 0) && (
            <ul className="flex flex-wrap gap-2 border-t px-4 py-2">
              {kept.map((a) => (
                <li
                  key={`kept-${a.index}`}
                  className="flex max-w-full items-center gap-2 rounded-full border py-1 pl-3 pr-1 text-xs"
                >
                  <span className="truncate">{a.filename || "attachment"}</span>
                  <span className="text-muted-foreground">
                    {formatSize(a.size)}
                  </span>
                  <button
                    type="button"
                    aria-label={`Remove ${a.filename}`}
                    className="flex size-5 items-center justify-center rounded-full hover:bg-muted"
                    onClick={() => {
                      setKept(kept.filter((k) => k.index !== a.index));
                      setDirty(true);
                    }}
                  >
                    <X className="size-3" />
                  </button>
                </li>
              ))}
              {files.map((f, i) => (
                <li
                  key={`${f.name}-${i}`}
                  className="flex max-w-full items-center gap-2 rounded-full border py-1 pl-3 pr-1 text-xs"
                >
                  <span className="truncate">{f.name}</span>
                  <span className="text-muted-foreground">
                    {formatSize(f.size)}
                  </span>
                  <button
                    type="button"
                    aria-label={`Remove ${f.name}`}
                    className="flex size-5 items-center justify-center rounded-full hover:bg-muted"
                    onClick={() => setFiles(files.filter((_, j) => j !== i))}
                  >
                    <X className="size-3" />
                  </button>
                </li>
              ))}
            </ul>
          )}

          {init.forwardAttachments && !init.draft && (
            <p className="border-t px-4 py-2 text-xs text-muted-foreground">
              The original attachments will be included.
            </p>
          )}

          {error && (
            <p
              role="alert"
              className="border-t px-4 py-2 text-sm text-destructive"
            >
              {error}
            </p>
          )}

          <div className="flex shrink-0 items-center gap-2 border-t px-4 py-3">
            <Button
              onClick={() => void send()}
              disabled={busy !== null}
              className="gap-2 rounded-full px-5 font-semibold"
            >
              <Send className="size-4" />
              {busy === "send" ? "Sending..." : "Send"}
            </Button>
            <input
              ref={fileInput}
              type="file"
              multiple
              className="hidden"
              onChange={onPickFiles}
            />
            <Button
              variant="ghost"
              size="icon"
              aria-label="Attach files"
              title="Attach files"
              onClick={() => fileInput.current?.click()}
            >
              <Paperclip className="size-4" />
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
