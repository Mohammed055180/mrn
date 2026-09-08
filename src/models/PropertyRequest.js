import mongoose from "mongoose";

const requestSchema = new mongoose.Schema({
  propertyType: { type: String, required: true, trim: true },
  city: { type: String, required: true, trim: true },
  district: { type: String, default: "", trim: true },
  areaMin: { type: Number, min: 0, default: null },
  areaMax: { type: Number, min: 0, default: null },
  budgetMin: { type: Number, min: 0, default: null },
  budgetMax: { type: Number, min: 0, default: null },
  rooms: { type: String, default: "", trim: true },
  notes: { type: String, default: "", trim: true },
  contactName: { type: String, required: true, trim: true },
  contactPhone: { type: String, required: true, trim: true },
  contactEmail: { type: String, default: "", trim: true, lowercase: true },
  status: { type: String, enum: ["pending", "fulfilled", "cancelled"], default: "pending", index: true }
}, { timestamps: { createdAt: true, updatedAt: true } });

requestSchema.index({ status: 1, createdAt: -1 });

export default mongoose.model("PropertyRequest", requestSchema);