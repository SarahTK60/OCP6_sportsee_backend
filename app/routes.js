const express = require("express");
const jwt = require("jsonwebtoken");

const users = require("./data.json");

const SECRET_KEY = "your-secret-key-12345"; // In a real app, this would be in environment variables

const getUserById = (userId) => {
  return users.find((user) => user.id === userId);
};

const router = express.Router();

const { authenticateToken, generateToken } = require("./middleware");
const { handleNoUser, handleNoUserData } = require("./utils");

/**
 * POST /api/login
 * Returns a token for the user
 */
router.post("/api/login", (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res
      .status(400)
      .json({ message: "username and password are required" });
  }

  const user = users.find((u) => u.username === username);

  if (!user || user.password !== password) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  const token = generateToken(user.id);
  return res.json({
    token,
    userId: user.id,
  });
});

/**
 * GET /api/user-info
 * Returns user information including profile, goals, and statistics
 */
router.get("/api/user-info", authenticateToken, (req, res) => {
  const token = req.headers.authorization.split(" ")[1];
  const decodedToken = jwt.verify(token, SECRET_KEY);
  const user = getUserById(decodedToken.userId);

  if (handleNoUser(res, user)) {
    return;
  }

  const runningData = user.runningData;

  if (handleNoUserData(res, runningData)) {
    return;
  }

  const userInfos = user.userInfos;

  if (handleNoUserData(res, userInfos)) {
    return;
  }

  // Filter out future sessions
  const now = new Date();
  const pastSessions = runningData.filter(
    (session) => new Date(session.date) <= now
  );

  // Calculate overall statistics
  const totalDistance = pastSessions.reduce(
    (sum, session) => sum + session.distance,
    0
  );
  const totalSessions = pastSessions.length;
  const totalDuration = pastSessions.reduce(
    (sum, session) => sum + session.duration,
    0
  );
  const totalCaloriesBurned = pastSessions.reduce(
    (sum, session) => sum + session.caloriesBurned,
    0
  );

  // Calculate rest days (days without any session)
  const createdAt = new Date(userInfos.createdAt);
  const totalDays = Math.floor((now - createdAt) / (1000 * 60 * 60 * 24)) + 1;

  // Get unique days with sessions (only past dates, already filtered in pastSessions)
  const daysWithSessions = new Set(
    pastSessions.map((session) => session.date.split("T")[0])
  );
  const restDays = totalDays - daysWithSessions.size;

  // Extract user profile information
  const userProfile = {
    firstName: userInfos.firstName,
    lastName: userInfos.lastName,
    createdAt: userInfos.createdAt,
    age: userInfos.age,
    weight: userInfos.weight,
    height: userInfos.height,
    profilePicture: userInfos.profilePicture,
    weeklyGoal: userInfos.weeklyGoal,
    gender: userInfos.gender,
  };

  return res.json({
    profile: userProfile,
    statistics: {
      totalDistance,
      totalSessions,
      totalDuration,
      totalCaloriesBurned,
      restDays,
    },
  });
});

/**
 * GET /api/user-activity
 * Returns running sessions between startWeek and endWeek
 */
router.get("/api/user-activity", authenticateToken, (req, res) => {
  const { startWeek, endWeek } = req.query;

  if (!startWeek || !endWeek) {
    return res
      .status(400)
      .json({ message: "startWeek and endWeek are required" });
  }

  const user = getUserById(req.user.userId);
  if (handleNoUser(res, user)) {
    return;
  }

  const runningData = user.runningData;

  if (handleNoUserData(res, runningData)) {
    return;
  }

  // Convert week strings to Date objects
  const startDate = new Date(startWeek);
  const endDate = new Date(endWeek);
  const now = new Date();

  // Filter sessions between startWeek and endWeek, excluding future dates
  const filteredSessions = runningData.filter((session) => {
    const sessionDate = new Date(session.date);
    return (
      sessionDate >= startDate && sessionDate <= endDate && sessionDate <= now
    );
  });

  // Sort by date ascending
  const sortedSessions = filteredSessions.sort(
    (a, b) => new Date(a.date) - new Date(b.date)
  );

  // Calculate statistics for the filtered period
  const totalDistance = filteredSessions.reduce(
    (sum, session) => sum + session.distance,
    0
  );
  const totalSessions = filteredSessions.length;
  const totalDuration = filteredSessions.reduce(
    (sum, session) => sum + session.duration,
    0
  );

  return res.json({
    sessions: sortedSessions,
    statistics: {
      totalDistance,
      totalSessions,
      totalDuration,
    },
  });
});

module.exports = router;
