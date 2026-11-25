"use client";
import { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Pencil, Plus, Search, Trash2 } from "lucide-react";
import { ErrorBox, Modal, PageHeader, PageLoader, PRIORITY_STYLE, Spinner, STATUS_LABEL, STATUS_STYLE } from "@/components/ui";
import { api, errMsg } from "@/lib/api";
import { fmtDate, fromDateInput, toDateInput } from "@/lib/format";
import { taskFormSchema, type TaskForm } from "@/lib/schemas";
import { useToast } from "@/lib/toast";
import type { Task, TaskStatus } from "@/lib/types";

function TaskModal({ task, onClose, onSaved }: { task: Task | null; onClose: () => void; onSaved: () => void }) {
  const toast = useToast();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<TaskForm>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: {
      title: task?.title ?? "", description: task?.description ?? "",
      status: task?.status ?? "TODO", priority: task?.priority ?? "MEDIUM", dueDate: toDateInput(task?.dueDate ?? null),
    },
  });

  const onSubmit = async (v: TaskForm) => {
    const body = { title: v.title, description: v.description?.trim() || null, status: v.status, priority: v.priority, dueDate: fromDateInput(v.dueDate) };
    try {
      await api(task ? `/tasks/${task.id}` : "/tasks", { method: task ? "PUT" : "POST", body });
      toast.success(task ? "Task updated" : "Task created");
      onSaved();
    } catch (e) { toast.error(errMsg(e)); }
  };

  return (
    <Modal title={task ? "Edit task" : "New task"} onClose={onClose}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <div>
          <label className="label" htmlFor="title">Title</label>
          <input id="title" className="input" {...register("title")} />
          {errors.title && <p className="field-error">{errors.title.message}</p>}
        </div>
        <div>
          <label className="label" htmlFor="description">Description</label>
          <textarea id="description" rows={3} className="input" {...register("description")} />
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="label" htmlFor="status">Status</label>
            <select id="status" className="input" {...register("status")}>
              {Object.entries(STATUS_LABEL).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="priority">Priority</label>
            <select id="priority" className="input" {...register("priority")}>
              {["LOW", "MEDIUM", "HIGH"].map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="dueDate">Due</label>
            <input id="dueDate" type="date" className="input" {...register("dueDate")} />
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="btn btn-outline">Cancel</button>
          <button className="btn btn-primary" disabled={isSubmitting}>{isSubmitting && <Spinner className="h-4 w-4" />} Save</button>
        </div>
      </form>
    </Modal>
  );
}

export default function TasksPage() {
  const toast = useToast();
  const [tasks, setTasks] = useState<Task[] | null>(null);
  const [error, setError] = useState("");
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [editing, setEditing] = useState<Task | "new" | null>(null);

  const load = useCallback(async () => {
    try {
      setError("");
      const params = new URLSearchParams();
      if (q.trim()) params.set("q", q.trim());
      if (status) params.set("status", status);
      setTasks((await api<{ tasks: Task[] }>(`/tasks?${params}`)).tasks);
    } catch (e) { setError(errMsg(e)); }
  }, [q, status]);

  // Debounce search typing.
  useEffect(() => { const t = setTimeout(load, 250); return () => clearTimeout(t); }, [load]);

  const changeStatus = async (t: Task, next: TaskStatus) => {
    try { await api(`/tasks/${t.id}`, { method: "PUT", body: { status: next } }); load(); }
    catch (e) { toast.error(errMsg(e)); }
  };
  const remove = async (t: Task) => {
    if (!window.confirm(`Delete "${t.title}"?`)) return;
    try { await api(`/tasks/${t.id}`, { method: "DELETE" }); toast.success("Task deleted"); load(); }
    catch (e) { toast.error(errMsg(e)); }
  };

  return (
    <>
      <PageHeader title="Tasks" subtitle="Plan and track your work."
        action={<button className="btn btn-primary" onClick={() => setEditing("new")}><Plus className="h-4 w-4" /> New task</button>} />

      <div className="mb-4 flex flex-wrap gap-3">
        <div className="relative min-w-[200px] flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input className="input !pl-9" placeholder="Search tasks..." value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search tasks" />
        </div>
        <select className="input !w-auto" value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Filter by status">
          <option value="">All statuses</option>
          {Object.entries(STATUS_LABEL).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
        </select>
      </div>

      {error ? <ErrorBox message={error} onRetry={load} /> : !tasks ? <PageLoader /> : tasks.length === 0 ? (
        <div className="card text-center text-slate-500">No tasks found.</div>
      ) : (
        <div className="card overflow-x-auto !p-0">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="border-b border-slate-200 text-left text-xs uppercase text-slate-500 dark:border-slate-800">
              <tr><th className="px-4 py-3">Task</th><th className="px-4 py-3">Priority</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Due</th><th className="px-4 py-3" /></tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {tasks.map((t) => (
                <tr key={t.id}>
                  <td className="px-4 py-3">
                    <p className="font-medium">{t.title}</p>
                    {t.description && <p className="line-clamp-1 text-xs text-slate-500">{t.description}</p>}
                  </td>
                  <td className="px-4 py-3"><span className={`badge ${PRIORITY_STYLE[t.priority]}`}>{t.priority}</span></td>
                  <td className="px-4 py-3">
                    <select value={t.status} onChange={(e) => changeStatus(t, e.target.value as TaskStatus)}
                      className={`badge cursor-pointer border-0 ${STATUS_STYLE[t.status]}`} aria-label="Change status">
                      {Object.entries(STATUS_LABEL).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
                    </select>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">{fmtDate(t.dueDate)}</td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    <button className="btn btn-ghost !p-2" onClick={() => setEditing(t)} aria-label="Edit"><Pencil className="h-4 w-4" /></button>
                    <button className="btn btn-danger !p-2" onClick={() => remove(t)} aria-label="Delete"><Trash2 className="h-4 w-4" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {editing && (
        <TaskModal task={editing === "new" ? null : editing} onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); load(); }} />
      )}
    </>
  );
}
