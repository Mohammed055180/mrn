import Property from "../models/Property.js";
import PropertyRequest from "../models/PropertyRequest.js";

export async function listRequests(req, res) {
  const { status, sortBy = "newest" } = req.query;
  const filter = status && status !== "all" ? { status } : {};
  const sort = sortBy === "oldest" ? { createdAt: 1 } : { createdAt: -1 };

  const requests = await PropertyRequest.find(filter).sort(sort).lean();
  res.json({ requests });
}

export async function updateRequestStatus(req, res) {
  const allowed = ["pending", "fulfilled", "cancelled"];
  if (!allowed.includes(req.body?.status)) {
    return res.status(400).json({ message: "Invalid request status" });
  }

  const request = await PropertyRequest.findByIdAndUpdate(
    req.params.id,
    { status: req.body.status },
    { new: true, runValidators: true }
  );

  if (!request) return res.status(404).json({ message: "Request not found" });
  res.json({ request });
}

export async function pendingProperties(req, res) {
  const properties = await Property.find({ status: "pending" }).sort({ createdAt: -1 }).lean();
  res.json({ properties });
}

export async function approveProperty(req, res) {
  const property = await Property.findByIdAndUpdate(
    req.params.id,
    { status: "published" },
    { new: true, runValidators: true }
  );
  if (!property) return res.status(404).json({ message: "Property not found" });
  res.json({ property });
}

export async function toggleFeatured(req, res) {
  const property = await Property.findById(req.params.id);
  if (!property) return res.status(404).json({ message: "Property not found" });
  property.featured = !property.featured;
  await property.save();
  res.json({ property });
}

export async function deleteProperty(req, res) {
  const property = await Property.findByIdAndDelete(req.params.id);
  if (!property) return res.status(404).json({ message: "Property not found" });
  res.json({ message: "Property deleted" });
}

function csvEscape(value) {
  return `"${String(value ?? "").replace(/"/g, '""')}"`;
}

export async function exportRequestsCsv(req, res) {
  const { status } = req.query;
  const filter = status && status !== "all" ? { status } : {};
  const requests = await PropertyRequest.find(filter).sort({ createdAt: -1 }).lean();

  const headers = [
    "المعرف","نوع العقار","المدينة","الحي","المساحة من","المساحة إلى",
    "الميزانية من","الميزانية إلى","الغرف/الدور","الملاحظات","اسم المتواصل",
    "الجوال","البريد","الحالة","تاريخ الطلب"
  ];

  const statusLabels = {
    pending: "قيد المتابعة",
    fulfilled: "تم التوفير",
    cancelled: "ملغى"
  };

  const rows = requests.map(r => [
    r._id, r.propertyType, r.city, r.district, r.areaMin, r.areaMax,
    r.budgetMin, r.budgetMax, r.rooms, (r.notes || "").replace(/\n/g, " "),
    r.contactName, r.contactPhone, r.contactEmail,
    statusLabels[r.status] || r.status,
    new Date(r.createdAt).toLocaleDateString("ar-SA")
  ]);

  const csv = "\uFEFF" + [headers, ...rows]
    .map(row => row.map(csvEscape).join(","))
    .join("\r\n");

  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="property-requests-${new Date().toISOString().slice(0,10)}.csv"`);
  res.send(csv);
}