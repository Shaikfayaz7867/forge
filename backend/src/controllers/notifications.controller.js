import { notificationsService } from "../services/notifications.service.js";
import { asyncHandler } from "../utils/async-handler.js";
import { sendSuccess } from "../utils/response.js";

export const notificationsController = {
  /**
   * SSE endpoint — keeps connection open and streams events to the client.
   * GET /notifications/stream
   */
  stream(req, res) {
    const userId = req.user.id;

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache, no-transform");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no"); // nginx passthrough
    res.flushHeaders();

    // Send an initial "connected" event
    const initial = notificationsService.getInitialPayload(userId);
    res.write(`data: ${JSON.stringify({ type: "connected", payload: initial })}\n\n`);

    // Register this client
    notificationsService.addClient(userId, res);

    // Heartbeat every 25 seconds to prevent proxy timeouts
    const heartbeat = setInterval(() => {
      res.write(`: heartbeat\n\n`);
    }, 25000);

    req.on("close", () => {
      clearInterval(heartbeat);
      notificationsService.removeClient(userId, res);
    });
  },

  /**
   * Get list of recent notifications for the user.
   * GET /notifications
   */
  list: asyncHandler(async (req, res) => {
    const notifications = await notificationsService.list(req.user.id);
    return sendSuccess(res, notifications);
  }),

  /**
   * Mark a notification as read.
   * PATCH /notifications/:id/read
   */
  markRead: asyncHandler(async (req, res) => {
    await notificationsService.markRead(req.user.id, req.params.id);
    return sendSuccess(res, null, "Notification marked as read");
  }),

  /**
   * Mark all notifications as read.
   * PATCH /notifications/read-all
   */
  markAllRead: asyncHandler(async (req, res) => {
    await notificationsService.markAllRead(req.user.id);
    return sendSuccess(res, null, "All notifications marked as read");
  }),

  /**
   * Get a daily motivational quote (changes every day).
   * GET /notifications/quote
   */
  getQuote: asyncHandler(async (req, res) => {
    const quote = notificationsService.getDailyQuote();
    return sendSuccess(res, quote);
  }),
};
