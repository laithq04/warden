import mongoose from "mongoose";
import { config } from "./config.js";

export async function connectDatabase(): Promise<void> {
  if (!config.mongodbUri) {
    console.warn("[db] MONGODB_URI not set, skipping MongoDB connection (persistence lands in Phase 2)");
    return;
  }
  try {
    await mongoose.connect(config.mongodbUri);
    console.log("[db] connected to MongoDB");
  } catch (err) {
    console.warn("[db] MongoDB connection failed, continuing without persistence:", (err as Error).message);
  }
}
