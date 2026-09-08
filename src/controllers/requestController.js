import PropertyRequest from "../models/PropertyRequest.js";

export async function createRequest(req, res) {
  const b = req.body || {};
  const numeric = key => b[key] === "" || b[key] == null ? null : Number(b[key]);

  const request = await PropertyRequest.create({
    propertyType: b.propertyType,
    city: b.city,
    district: b.district || "",
    areaMin: numeric("areaMin"),
    areaMax: numeric("areaMax"),
    budgetMin: numeric("budgetMin"),
    budgetMax: numeric("budgetMax"),
    rooms: b.rooms || "",
    notes: b.notes || "",
    contactName: b.contactName,
    contactPhone: b.contactPhone,
    contactEmail: b.contactEmail || "",
    status: "pending"
  });

  res.status(201).json({ message: "Request received", request });
}