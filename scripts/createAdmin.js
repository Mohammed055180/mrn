import "dotenv/config";
import User from "../src/models/User.js";
import { connectDB } from "../src/db.js";

await connectDB();

const username = (process.env.ADMIN_USERNAME || "admin").toLowerCase();
const email = (process.env.ADMIN_EMAIL || "admin@example.com").toLowerCase();
const password = process.env.ADMIN_PASSWORD;

if (!password || password.length < 12) {
  throw new Error("Set ADMIN_PASSWORD to a password of at least 12 characters.");
}

let user = await User.findOne({ $or: [{ username }, { email }] }).select("+password");

if (user) {
  user.username = username;
  user.email = email;
  user.password = password;
  user.role = "admin";
  await user.save();
  console.log("Admin updated:", username);
} else {
  user = await User.create({ username, email, password, role: "admin" });
  console.log("Admin created:", username);
}

process.exit(0);