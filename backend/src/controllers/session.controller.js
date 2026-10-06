import { sessionService } from "../services/session.service.js";
import { asyncHandler } from "../utils/async-handler.js";
import { sendSuccess, sendCreated } from "../utils/response.js";

export const sessionController = {
  getActiveSession: asyncHandler(async (req, res) => {
    const session = await sessionService.getActive(req.user.id);
    return sendSuccess(res, session);
  }),

  startSession: asyncHandler(async (req, res) => {
    const session = await sessionService.start(req.user.id, req.body);
    return sendCreated(res, session, "Active workout session started");
  }),

  updateActiveSession: asyncHandler(async (req, res) => {
    const session = await sessionService.updateActive(req.user.id, req.body);
    return sendSuccess(res, session, "Active workout session updated");
  }),

  finishSession: asyncHandler(async (req, res) => {
    const completedSession = await sessionService.complete(req.user.id);
    return sendCreated(res, completedSession, "Workout session completed!");
  }),

  cancelSession: asyncHandler(async (req, res) => {
    await sessionService.cancel(req.user.id);
    return sendSuccess(res, null, "Active workout session cancelled");
  }),
};
