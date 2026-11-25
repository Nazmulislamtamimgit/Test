"use client";
import { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { ErrorBox, Modal, PageHeader, PageLoader, Spinner } from "@/components/ui";
import { api, errMsg } from "@/lib/api";
import { fmtDate } from "@/lib/format";
import { noteFormSchema, type NoteForm } from "@/lib/schemas";
import { useToast } from "@/lib/toast";
import type { Note } from "@/lib/types";

function NoteModal({ note, onClose, onSaved }: { note: Note | null; onClose: () => void; onSaved: () => void }) {
  const toast = useToast();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<NoteForm>({
    resolver: zodResolver(noteFormSchema),
    defaultValues: { title: note?.title ?? "", content: note?.content ?? "" },
  });
  const onSubmit = async (body: NoteForm) => {
    try {
      await api(note ? `/notes/${note.id}` : "/notes", { method: note ? "PUT" : "POST", body });
      toast.success(note ? "Note updated" : "Note created");
      onSaved();
    } catch (e) { toast.error(errMsg(e)); }
  };
  return (
    <Modal title={note ? "Edit note" : "New note"} onClose={onClose}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <div>
          <label className="label" htmlFor="title">Title</label>
          <input id="title" className="input" {...register("title")} />
          {errors.title && <p className="field-error">{errors.title.message}</p>}
        </div>
        <div>
          <label className="label" htmlFor="content">Content</label>
          <textarea id="content" rows={8} className="input" {...register("content")} />
        </div>
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="btn btn-outline">Cancel</button>
          <button className="btn btn-primary" disabled={isSubmitting}>{isSubmitting && <Spinner className="h-4 w-4" />} Save</button>
        </div>
      </form>
    </Modal>
  );
}

export default function NotesPage() {
  const toast = useToast();
  const [notes, setNotes] = useState<Note[] | null>(null);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState<Note | "new" | null>(null);

  const load = useCallback(async () => {
    try { setError(""); setNotes((await api<{ notes: Note[] }>("/notes")).notes); }
    catch (e) { setError(errMsg(e)); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const remove = async (n: Note) => {
    if (!window.confirm(`Delete "${n.title}"?`)) return;
    try { await api(`/notes/${n.id}`, { method: "DELETE" }); toast.success("Note deleted"); load(); }
    catch (e) { toast.error(errMsg(e)); }
  };

  return (
    <>
      <PageHeader title="Notes" subtitle="Keep commands, reminders and ideas."
        action={<button className="btn btn-primary" onClick={() => setEditing("new")}><Plus className="h-4 w-4" /> New note</button>} />
      {error ? <ErrorBox message={error} onRetry={load} /> : !notes ? <PageLoader /> : notes.length === 0 ? (
        <div className="card text-center text-slate-500">No notes yet.</div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {notes.map((n) => (
            <article key={n.id} className="card flex flex-col">
              <h3 className="font-semibold">{n.title}</h3>
              {/* Rendered as plain text by React (auto-escaped), so stored HTML can never execute. */}
              <p className="mt-2 line-clamp-6 flex-1 whitespace-pre-wrap text-sm text-slate-600 dark:text-slate-400">{n.content}</p>
              <div className="mt-4 flex items-center justify-between">
                <span className="text-xs text-slate-500">{fmtDate(n.updatedAt)}</span>
                <span>
                  <button className="btn btn-ghost !p-2" onClick={() => setEditing(n)} aria-label="Edit"><Pencil className="h-4 w-4" /></button>
                  <button className="btn btn-danger !p-2" onClick={() => remove(n)} aria-label="Delete"><Trash2 className="h-4 w-4" /></button>
                </span>
              </div>
            </article>
          ))}
        </div>
      )}
      {editing && (
        <NoteModal note={editing === "new" ? null : editing} onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); load(); }} />
      )}
    </>
  );
}
