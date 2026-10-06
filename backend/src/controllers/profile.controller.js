import { profileService, settingsService } from "../services/profile.service.js";
import { asyncHandler } from "../utils/async-handler.js";
import { sendSuccess } from "../utils/response.js";

export const profileController = {
  getProfile: asyncHandler(async (req, res) => {
    const profile = await profileService.get(req.user.id);
    return sendSuccess(res, profile);
  }),

  updateProfile: asyncHandler(async (req, res) => {
    // Upsert replaces/creates, patch updates existing
    // We'll use patch if we just want to update, but onboarding might need upsert
    // Let's use upsert so onboarding works correctly.
    const updated = await profileService.upsert(req.user.id, req.body);
    return sendSuccess(res, updated, "Profile updated successfully");
  }),

  getSettings: asyncHandler(async (req, res) => {
    const settings = await settingsService.get(req.user.id);
    return sendSuccess(res, settings);
  }),

  updateSettings: asyncHandler(async (req, res) => {
    const updated = await settingsService.upsert(req.user.id, req.body);
    return sendSuccess(res, updated, "Settings updated successfully");
  }),
};
