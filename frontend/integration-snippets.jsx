/*
  Apply these changes to real-estate-platform.jsx.

  1) Replace the React import with:
     import React, { useState, useMemo, useRef, useEffect } from "react";

  2) Add:
     import {
       getProperties, getProperty, createRequest, createProperty,
       uploadImages, adminLogin, getAdminRequests, updateAdminRequestStatus,
       getPendingProperties, approveProperty, toggleFeatured, deleteProperty,
       getRequestsCsvUrl
     } from "./api";

  3) Delete seedProperties, seedRequests and genId().
     Keep CITIES / PROPERTY_TYPES / OFFER_TYPES / AGE_OPTIONS /
     FACADE_OPTIONS / AMENITIES_LIST because they are UI options.

  4) RequestPropertyPage:
     make handleSubmit async:
*/
async function handleRequestSubmitExample(f) {
  const result = await createRequest(f);
  return result.request;
}

/*
  5) ListPropertyPage:
     Keep File objects separately. Do NOT send URL.createObjectURL() to the API.
     The correct flow is:
*/
async function submitListingExample(f, selectedFiles) {
  const { images } = selectedFiles.length
    ? await uploadImages(selectedFiles)
    : { images: [] };

  const result = await createProperty({
    ...f,
    area: Number(f.area),
    price: Number(f.price),
    images
  });

  return result.property;
}

/*
  6) Admin login:
     Replace the hard-coded:
       if (pass === "admin123") ...
     with:
*/
async function loginExample(identity, pass) {
  const result = await adminLogin(identity, pass);
  localStorage.setItem("adminToken", result.token);
  return result.user;
}

/*
  7) Admin dashboard:
     Load requests/pending properties from API after login, and call the
     mutation functions instead of setRequests/setProperties.

  8) CSV:
     The CSV endpoint requires JWT. Do not use a plain <a href> unless your
     browser already supplies authorization another way. Fetch it with the
     token and download the Blob:
*/
async function downloadAdminCsvExample(status = "all") {
  const token = localStorage.getItem("adminToken");
  const response = await fetch(getRequestsCsvUrl(status), {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!response.ok) throw new Error("فشل تصدير CSV");
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `طلبات-العقارات-${new Date().toISOString().slice(0,10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

/*
  9) Important:
     The backend returns MongoDB _id values. In JSX, using p.id/r.id will
     not work unless you map _id -> id. The easiest compatibility helper:
*/
export function normalizeProperty(p) {
  return { ...p, id: p.id || p._id };
}
export function normalizeRequest(r) {
  return { ...r, id: r.id || r._id };
}

/*
  10) Recommended App root pattern:
*/
export function usePropertiesFromApi() {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    getProperties({ sortBy: "newest" })
      .then(data => setProperties((data.properties || []).map(normalizeProperty)))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  return { properties, setProperties, loading, error };
}

/*
  IMPORTANT SECURITY NOTE:
  Do not put MONGODB_URI, JWT_SECRET, CLOUDINARY_API_SECRET, or admin
  credentials in the React/Vite environment. Only VITE_API_BASE_URL belongs
  in the frontend environment.
*/