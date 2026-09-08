import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { config } from "../config.js";

export async function login(req, res) {
  const { username, email, password } = req.body || {};
  const identity = String(username || email || "").trim().toLowerCase();

  if (!identity || !password) {
    return res.status(400).json({ message: "Username/email and password are required" });
  }

  const user = await User.findOne({
    $or: [{ username: identity }, { email: identity }]
  }).select("+password");

  if (!user || user.role !== "admin" || !(await bcrypt.compare(password, user.password))) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  const token = jwt.sign(
    { sub: user._id.toString(), username: user.username, role: user.role },
    config.jwtSecret,
    { expiresIn: config.jwtExpiresIn }
  );

  res.json({
    token,
    user: { id: user._id, username: user.username, email: user.email, role: user.role }
  });
}