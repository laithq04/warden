import mongoose from "mongoose";

const opts = { versionKey: false } as const;

const eventSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },
    timestamp: { type: String, required: true, index: true },
    source: { type: String, required: true },
    host: String,
    user: String,
    action: { type: String, required: true },
    src_ip: String,
    dest_ip: String,
    dest_port: Number,
    process: String,
    parent_process: String,
    bytes_out: Number,
    outcome: String,
    raw: mongoose.Schema.Types.Mixed,
  },
  opts,
);

const alertSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },
    ruleId: { type: String, required: true },
    title: { type: String, required: true },
    severity: { type: String, required: true },
    mitre: { tactic: String, techniqueId: String },
    description: String,
    timestamp: { type: String, required: true, index: true },
    host: String,
    user: String,
    count: { type: Number, required: true },
    lastSeen: { type: String, required: true },
    event: mongoose.Schema.Types.Mixed,
  },
  opts,
);

const incidentSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    severity: { type: String, required: true },
    status: { type: String, required: true },
    host: String,
    user: String,
    alertIds: { type: [String], required: true },
    stageCount: { type: Number, required: true },
    createdAt: { type: String, required: true },
    updatedAt: { type: String, required: true, index: true },
  },
  opts,
);

export const EventModel = mongoose.model("Event", eventSchema);
export const AlertModel = mongoose.model("Alert", alertSchema);
export const IncidentModel = mongoose.model("Incident", incidentSchema);
