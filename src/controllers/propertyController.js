import Property from "../models/Property.js";
import { uploadImage } from "../utils/cloudinary.js";

export async function listPublished(req, res) {
  const { city, offerType, propertyType, minPrice, maxPrice, sortBy = "newest" } = req.query;
  const filter = { status: "published" };

  if (city && city !== "all") filter.city = city;
  if (offerType && offerType !== "all") filter.offerType = offerType;
  if (propertyType && propertyType !== "all") filter.propertyType = propertyType;

  if (minPrice !== undefined && minPrice !== "") filter.price = { ...(filter.price || {}), $gte: Number(minPrice) };
  if (maxPrice !== undefined && maxPrice !== "") filter.price = { ...(filter.price || {}), $lte: Number(maxPrice) };

  const sort = sortBy === "price_asc" ? { price: 1 } :
    sortBy === "price_desc" ? { price: -1 } :
    sortBy === "area_desc" ? { area: -1 } :
    { createdAt: -1 };

  const properties = await Property.find(filter).sort(sort).lean();
  res.json({ properties });
}

export async function getProperty(req, res) {
  const property = await Property.findOne({ _id: req.params.id, status: "published" }).lean();
  if (!property) return res.status(404).json({ message: "Property not found" });
  res.json({ property });
}

export async function createProperty(req, res) {
  const body = req.body || {};
  const property = await Property.create({
    offerType: body.offerType,
    propertyType: body.propertyType,
    city: body.city,
    district: body.district || "",
    area: Number(body.area),
    price: Number(body.price),
    facades: body.facades || "",
    age: body.age || "",
    amenities: Array.isArray(body.amenities) ? body.amenities : [],
    description: body.description || "",
    images: Array.isArray(body.images) ? body.images : [],
    status: "pending",
    featured: false,
    contactName: body.contactName,
    contactPhone: body.contactPhone
  });

  res.status(201).json({ message: "Property submitted for review", property });
}

export async function uploadPropertyImages(req, res) {
  const files = req.files || [];
  if (!files.length) return res.status(400).json({ message: "No images uploaded" });
  if (files.length > 10) return res.status(400).json({ message: "Maximum 10 images per request" });

  const results = await Promise.all(files.map(file => uploadImage(file.buffer)));
  res.status(201).json({ images: results.map(r => r.secure_url) });
}