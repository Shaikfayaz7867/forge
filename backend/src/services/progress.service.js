import fs from "fs";
import path from "path";
import { progressRepository } from "../repositories/progress.repository.js";
import { ApiError } from "../utils/ApiError.js";

export const progressService = {
  // Weight
  async getWeightHistory(userId, pagination) {
    return progressRepository.findWeights(userId, pagination);
  },

  async addWeight(userId, { date, weightKg }) {
    return progressRepository.upsertWeight(userId, date, weightKg);
  },

  async updateWeight(userId, id, { date, weightKg }) {
    const existing = await progressRepository.findWeightById(id, userId);
    if (!existing) throw ApiError.notFound("Weight entry not found", "WEIGHT_NOT_FOUND");
    return progressRepository.upsertWeight(userId, date ?? existing.date, weightKg ?? Number(existing.weightKg));
  },

  async deleteWeight(userId, id) {
    const deleted = await progressRepository.deleteWeight(id, userId);
    if (!deleted) {
      throw ApiError.notFound("Weight entry not found", "WEIGHT_NOT_FOUND");
    }
    return deleted;
  },

  // Measurements
  async getMeasurementHistory(userId, pagination) {
    return progressRepository.findMeasurements(userId, pagination);
  },

  async addMeasurement(userId, { date, values }) {
    return progressRepository.upsertMeasurement(userId, date, values);
  },

  async updateMeasurement(userId, id, { date, values }) {
    const existing = await progressRepository.findMeasurementById(id, userId);
    if (!existing) throw ApiError.notFound("Measurement entry not found", "MEASUREMENT_NOT_FOUND");
    return progressRepository.upsertMeasurement(userId, date ?? existing.date, values ?? {});
  },

  async deleteMeasurement(userId, id) {
    const deleted = await progressRepository.deleteMeasurement(id, userId);
    if (!deleted) {
      throw ApiError.notFound("Measurement entry not found", "MEASUREMENT_NOT_FOUND");
    }
    return deleted;
  },

  // Water
  async getWaterLogs(userId, dateRange) {
    return progressRepository.findWater(userId, dateRange);
  },

  async addWater(userId, { date, amountMl }) {
    return progressRepository.upsertWater(userId, date, amountMl);
  },

  async setWaterDate(userId, date, amountMl) {
    return progressRepository.upsertWater(userId, date, amountMl);
  },

  async deleteWater(userId, date) {
    return progressRepository.deleteWater(userId, date);
  },

  // Progress Photos
  async getPhotos(userId, filters) {
    return progressRepository.findPhotos(userId, filters);
  },

  async addPhoto(userId, { date, pose, filePath }) {
    return progressRepository.createPhoto(userId, { date, pose, filePath });
  },

  async getPhotoById(userId, id) {
    const photo = await progressRepository.findPhotoById(id, userId);
    if (!photo) {
      throw ApiError.notFound("Progress photo not found", "PHOTO_NOT_FOUND");
    }
    return photo;
  },

  async deletePhoto(userId, id) {
    const photo = await progressRepository.deletePhoto(id, userId);
    if (!photo) {
      throw ApiError.notFound("Progress photo not found", "PHOTO_NOT_FOUND");
    }
    // Delete file from filesystem if present
    if (photo.filePath) {
      try {
        const fullPath = path.isAbsolute(photo.filePath)
          ? photo.filePath
          : path.join(process.cwd(), photo.filePath);
        if (fs.existsSync(fullPath)) {
          fs.unlinkSync(fullPath);
        }
      } catch (err) {
        // Log warning but non-blocking
      }
    }
    return photo;
  },
};
