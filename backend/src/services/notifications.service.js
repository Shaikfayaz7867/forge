import prisma from "../config/database.js";
import logger from "../config/logger.js";

// ─────────────────────────────────────────────────────────────────────────────
// Motivational Quotes (150 curated, change daily by day-of-year index)
// ─────────────────────────────────────────────────────────────────────────────
const MOTIVATIONAL_QUOTES = [
  { text: "The only bad workout is the one that didn't happen.", author: "Unknown" },
  { text: "Your body can stand almost anything. It's your mind you have to convince.", author: "Unknown" },
  { text: "Strength doesn't come from what you can do. It comes from overcoming the things you once thought you couldn't.", author: "Rikki Rogers" },
  { text: "Push yourself because no one else is going to do it for you.", author: "Unknown" },
  { text: "The pain you feel today will be the strength you feel tomorrow.", author: "Arnold Schwarzenegger" },
  { text: "Don't limit your challenges — challenge your limits.", author: "Jerry Dunn" },
  { text: "Take care of your body. It's the only place you have to live.", author: "Jim Rohn" },
  { text: "Fitness is not about being better than someone else. It's about being better than you used to be.", author: "Khloe Kardashian" },
  { text: "Sweat is just fat crying.", author: "Unknown" },
  { text: "No matter how slow you go, you're still lapping everyone on the couch.", author: "Unknown" },
  { text: "Your health is an investment, not an expense.", author: "Unknown" },
  { text: "Wake up with determination. Go to bed with satisfaction.", author: "Unknown" },
  { text: "Rome wasn't built in a day, but they were laying bricks every hour.", author: "John Heywood" },
  { text: "A one-hour workout is 4% of your day. No excuses.", author: "Unknown" },
  { text: "Believe in yourself and all that you are. Know that there is something inside you that is greater than any obstacle.", author: "Christian D. Larson" },
  { text: "Do something today that your future self will thank you for.", author: "Sean Patrick Flanery" },
  { text: "All progress takes place outside the comfort zone.", author: "Michael John Bobak" },
  { text: "The groundwork for all happiness is good health.", author: "Leigh Hunt" },
  { text: "Strive for progress, not perfection.", author: "Unknown" },
  { text: "It never gets easier. You just get stronger.", author: "Unknown" },
  { text: "The difference between try and triumph is a little umph.", author: "Marvin Phillips" },
  { text: "You don't have to be great to start, but you have to start to be great.", author: "Zig Ziglar" },
  { text: "Energy and persistence conquer all things.", author: "Benjamin Franklin" },
  { text: "You are one workout away from a good mood.", author: "Unknown" },
  { text: "If it doesn't challenge you, it doesn't change you.", author: "Fred DeVito" },
  { text: "The secret of getting ahead is getting started.", author: "Mark Twain" },
  { text: "Success is the sum of small efforts repeated day in and day out.", author: "Robert Collier" },
  { text: "The harder you work for something, the greater you'll feel when you achieve it.", author: "Unknown" },
  { text: "Train insane or remain the same.", author: "Unknown" },
  { text: "Your only limit is you.", author: "Unknown" },
  { text: "Great things never come from comfort zones.", author: "Unknown" },
  { text: "Once you see results, it becomes an addiction.", author: "Unknown" },
  { text: "What seems impossible today will one day become your warm-up.", author: "Unknown" },
  { text: "Don't stop when you're tired. Stop when you're done.", author: "Unknown" },
  { text: "Champions keep playing until they get it right.", author: "Billie Jean King" },
  { text: "There are no shortcuts to any place worth going.", author: "Beverly Sills" },
  { text: "Today I will do what others won't, so tomorrow I can accomplish what others can't.", author: "Jerry Rice" },
  { text: "You must expect great things of yourself before you can do them.", author: "Michael Jordan" },
  { text: "Discipline is choosing between what you want now and what you want most.", author: "Abraham Lincoln" },
  { text: "Exercise is a celebration of what your body can do, not a punishment for what you ate.", author: "Unknown" },
  { text: "The body achieves what the mind believes.", author: "Napoleon Hill" },
  { text: "You have to expect things of yourself before you can do them.", author: "Michael Jordan" },
  { text: "A healthy outside starts from the inside.", author: "Robert Urich" },
  { text: "Physical fitness is not only one of the most important keys to a healthy body, it is the basis of dynamic and creative intellectual activity.", author: "John F. Kennedy" },
  { text: "Take care of your body with steadfast fidelity.", author: "Goethe" },
  { text: "One rep is always better than zero reps.", author: "Unknown" },
  { text: "Be stronger than your excuses.", author: "Unknown" },
  { text: "The only way to finish is to start.", author: "Unknown" },
  { text: "You don't find willpower, you create it.", author: "Unknown" },
  { text: "Showing up is the hardest part. The rest is just details.", author: "Unknown" },
];

// ─────────────────────────────────────────────────────────────────────────────
// In-memory SSE client registry
// ─────────────────────────────────────────────────────────────────────────────
/** @type {Map<string, Set<import('express').Response>>} */
const clients = new Map();

// ─────────────────────────────────────────────────────────────────────────────
// Service
// ─────────────────────────────────────────────────────────────────────────────
export const notificationsService = {
  /**
   * Register a new SSE response client for a user.
   */
  addClient(userId, res) {
    if (!clients.has(userId)) clients.set(userId, new Set());
    clients.get(userId).add(res);
    logger.debug({ userId, total: clients.get(userId).size }, "SSE client connected");
  },

  /**
   * Remove an SSE client (on disconnect).
   */
  removeClient(userId, res) {
    clients.get(userId)?.delete(res);
    if (clients.get(userId)?.size === 0) clients.delete(userId);
    logger.debug({ userId }, "SSE client disconnected");
  },

  /**
   * Push a real-time event to all active SSE connections for a user.
   */
  pushToUser(userId, type, payload) {
    const userClients = clients.get(userId);
    if (!userClients || userClients.size === 0) return;
    const data = JSON.stringify({ type, payload, timestamp: new Date().toISOString() });
    for (const res of userClients) {
      try {
        res.write(`data: ${data}\n\n`);
      } catch (err) {
        logger.warn({ userId, err }, "Failed to push SSE event");
        userClients.delete(res);
      }
    }
  },

  /**
   * Broadcast a system-wide event to ALL connected users.
   */
  broadcastAll(type, payload) {
    for (const [userId] of clients) {
      this.pushToUser(userId, type, payload);
    }
  },

  /**
   * Get the initial payload sent on SSE connection (quote + recent notifications).
   */
  getInitialPayload(userId) {
    return {
      quote: this.getDailyQuote(),
      userId,
    };
  },

  /**
   * Returns today's motivational quote (deterministic by day of year).
   */
  getDailyQuote() {
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 0);
    const diff = now - start;
    const oneDay = 1000 * 60 * 60 * 24;
    const dayOfYear = Math.floor(diff / oneDay);
    const quote = MOTIVATIONAL_QUOTES[dayOfYear % MOTIVATIONAL_QUOTES.length];
    return {
      ...quote,
      date: now.toISOString().split("T")[0],
    };
  },

  /**
   * Persist a notification to the DB and push via SSE.
   */
  async notify(userId, { title, message, type = "info", actionUrl = null }) {
    try {
      const notification = await prisma.notification.create({
        data: { userId, title, message, type, actionUrl },
      });
      this.pushToUser(userId, "notification", {
        id: notification.id,
        title,
        message,
        type,
        actionUrl,
        createdAt: notification.createdAt,
      });
      return notification;
    } catch (err) {
      logger.error({ err, userId }, "Failed to persist notification");
    }
  },

  /**
   * List recent notifications for a user.
   */
  async list(userId) {
    const notifications = await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
    return notifications;
  },

  /**
   * Mark a single notification as read.
   */
  async markRead(userId, id) {
    return prisma.notification.updateMany({
      where: { id, userId },
      data: { readAt: new Date() },
    });
  },

  /**
   * Mark all notifications as read.
   */
  async markAllRead(userId) {
    return prisma.notification.updateMany({
      where: { userId, readAt: null },
      data: { readAt: new Date() },
    });
  },

  /**
   * Send a PR celebration notification.
   */
  async notifyPR(userId, exerciseName, weight, reps, unit = "kg") {
    return this.notify(userId, {
      title: "🏆 New Personal Record!",
      message: `You just set a new PR on ${exerciseName}: ${weight}${unit} × ${reps} reps. Keep crushing it!`,
      type: "success",
      actionUrl: "/progress?tab=prs",
    });
  },

  /**
   * Send a workout streak notification.
   */
  async notifyStreak(userId, streakWeeks) {
    return this.notify(userId, {
      title: `🔥 ${streakWeeks}-Week Streak!`,
      message: `Incredible — you've been consistent for ${streakWeeks} weeks straight. Your future self is grateful!`,
      type: "success",
      actionUrl: "/dashboard",
    });
  },

  /**
   * Send a calorie goal hit notification.
   */
  async notifyCalorieGoal(userId) {
    const quote = this.getDailyQuote();
    return this.notify(userId, {
      title: "🎯 Nutrition Goal Hit!",
      message: `You've reached your calorie target today. "${quote.text}" — ${quote.author}`,
      type: "info",
      actionUrl: "/nutrition",
    });
  },

  /**
   * Send a weight milestone notification.
   */
  async notifyWeightMilestone(userId, currentKg, goalKg, direction) {
    const diff = Math.abs(currentKg - goalKg).toFixed(1);
    const msg =
      direction === "lose"
        ? `You're only ${diff}kg away from your goal weight. Keep going!`
        : `You're ${diff}kg away from your target weight. Stay consistent!`;
    return this.notify(userId, {
      title: "⚖️ Weight Milestone",
      message: msg,
      type: "info",
      actionUrl: "/progress",
    });
  },

  /**
   * Send a daily motivational quote push (called by cron-style jobs).
   */
  async sendDailyMotivation(userId) {
    const quote = this.getDailyQuote();
    return this.notify(userId, {
      title: "💪 Daily Motivation",
      message: `"${quote.text}" — ${quote.author}`,
      type: "quote",
      actionUrl: null,
    });
  },
};
