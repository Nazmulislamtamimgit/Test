export type User = { id: string; email: string; name: string; createdAt: string; updatedAt: string };
export type TaskStatus = "TODO" | "IN_PROGRESS" | "DONE";
export type Priority = "LOW" | "MEDIUM" | "HIGH";
export type Task = {
  id: string; title: string; description: string | null; status: TaskStatus;
  priority: Priority; dueDate: string | null; createdAt: string; updatedAt: string;
};
export type Note = { id: string; title: string; content: string; createdAt: string; updatedAt: string };
export type Stats = {
  tasks: { total: number; TODO: number; IN_PROGRESS: number; DONE: number; overdue: number };
  notes: number;
  recentTasks: Task[];
};
