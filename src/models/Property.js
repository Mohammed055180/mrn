import mongoose from "mongoose";

const propertySchema = new mongoose.Schema({
  offerType: { type: String, enum: ["sale", "rent"], required: true },
  propertyType: { type: String, required: true, trim: true },
  city: { type: String, required: true, trim: true, index: true },
  district: { type: String, default: "", trim: true },
  area: { type: Number, required: true, min: 0 },
  price: { type: Number, required: true, min: 0, index: true },
  facades: { type: String, default: "", trim: true },
  age: { type: String, default: "", trim: true },
  amenities: { type: [String], default: [] },
  description: { type: String, default: "", trim: true },
  images: { type: [String], default: [] },
  status: { type: String, enum: ["pending", "published"], default: "pending", index: true },
  featured: { type: Boolean, default: false, index: true },
  contactName: { type: String, required: true, trim: true },
  contactPhone: { type: String, required: true, trim: true }
}, { timestamps: { createdAt: true, updatedAt: true } });

propertySchema.index({ status: 1, createdAt: -1 });
propertySchema.index({ status: 1, city: 1, offerType: 1, propertyType: 1, price: 1 });

export default mongoose.model("Property", propertySchema);