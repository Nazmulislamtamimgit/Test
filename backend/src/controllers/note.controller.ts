import { asyncHandler } from "../utils/http";
import * as notes from "../services/note.service";

export const list = asyncHandler(async (req, res) => {
  res.json({ notes: await notes.listNotes(req.userId!) });
});
export const create = asyncHandler(async (req, res) => {
  res.status(201).json({ note: await notes.createNote(req.userId!, req.body) });
});
export const update = asyncHandler(async (req, res) => {
  res.json({ note: await notes.updateNote(req.userId!, req.params.id, req.body) });
});
export const remove = asyncHandler(async (req, res) => {
  await notes.deleteNote(req.userId!, req.params.id);
  res.status(204).end();
});
