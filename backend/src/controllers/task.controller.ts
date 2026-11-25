import { asyncHandler } from "../utils/http";
import * as tasks from "../services/task.service";
import { taskQuerySchema } from "../utils/schemas";

export const list = asyncHandler(async (req, res) => {
  const filters = taskQuerySchema.parse(req.query);
  res.json({ tasks: await tasks.listTasks(req.userId!, filters) });
});
export const get = asyncHandler(async (req, res) => {
  res.json({ task: await tasks.getTask(req.userId!, req.params.id) });
});
export const create = asyncHandler(async (req, res) => {
  res.status(201).json({ task: await tasks.createTask(req.userId!, req.body) });
});
export const update = asyncHandler(async (req, res) => {
  res.json({ task: await tasks.updateTask(req.userId!, req.params.id, req.body) });
});
export const remove = asyncHandler(async (req, res) => {
  await tasks.deleteTask(req.userId!, req.params.id);
  res.status(204).end();
});
