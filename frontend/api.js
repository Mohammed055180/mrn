export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      ...(options.body instanceof FormData ? {} : { "Content-Type": "application/json" }),
      ...(options.headers || {})
    }
  });

  if (!response.ok) {
    let message = "حدث خطأ في الاتصال بالخادم";
    try {
      const data = await response.json();
      message = data.message || message;
    } catch {}
    throw new Error(message);
  }
  return response;
}

function normalizeRecord(record) {
  if (!record || typeof record !== "object") return record;
  return { ...record, id: record.id || record._id };
}

export async function getProperties(filters = {}) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (value !== "" && value !== "all" && value != null) params.set(key, value);
  }
  const response = await request(`/properties?${params.toString()}`);
  const data = await response.json();
  return Array.isArray(data) ? data.map(normalizeRecord) : data;
}

export async function getProperty(id) {
  const response = await request(`/properties/${id}`);
  return normalizeRecord(await response.json());
}

export async function createRequest(data) {
  const response = await request("/requests", {
    method: "POST",
    body: JSON.stringify(data)
  });
  return response.json();
}

export async function createProperty(data) {
  const response = await request("/properties", {
    method: "POST",
    body: JSON.stringify(data)
  });
  return response.json();
}

export async function uploadImages(files) {
  const form = new FormData();
  files.forEach(file => form.append("images", file));
  const response = await request("/properties/images", {
    method: "POST",
    body: form
  });
  return response.json();
}

export async function adminLogin(identity, password) {
  const response = await request("/auth/login", {
    method: "POST",
    body: JSON.stringify({ username: identity, password })
  });
  return response.json();
}

function authHeaders() {
  const token = localStorage.getItem("adminToken");
  if (!token) throw new Error("جلسة الإدارة غير موجودة");
  return { Authorization: `Bearer ${token}` };
}

export async function getAdminRequests(status = "all") {
  const query = status && status !== "all" ? `?status=${encodeURIComponent(status)}` : "";
  const response = await request(`/admin/requests${query}`, { headers: authHeaders() });
  const data = await response.json();
  return Array.isArray(data) ? data.map(normalizeRecord) : data;
}

export async function updateAdminRequestStatus(id, status) {
  const response = await request(`/admin/requests/${id}/status`, {
    method: "PATCH",
    headers: authHeaders(),
    body: JSON.stringify({ status })
  });
  return response.json();
}

export async function getPendingProperties() {
  const response = await request("/admin/properties/pending", { headers: authHeaders() });
  const data = await response.json();
  return Array.isArray(data) ? data.map(normalizeRecord) : data;
}

export async function approveProperty(id) {
  const response = await request(`/admin/properties/${id}/approve`, {
    method: "PATCH", headers: authHeaders()
  });
  return response.json();
}

export async function toggleFeatured(id) {
  const response = await request(`/admin/properties/${id}/featured`, {
    method: "PATCH", headers: authHeaders()
  });
  return response.json();
}

export async function deleteProperty(id) {
  const response = await request(`/admin/properties/${id}`, {
    method: "DELETE", headers: authHeaders()
  });
  return response.json();
}

export async function getRequestsCsv(status = "all") {
  const suffix = status && status !== "all" ? `?status=${encodeURIComponent(status)}` : "";
  const response = await request(`/admin/requests/export-csv${suffix}`, { headers: authHeaders() });
  return response.blob();
}

export function getRequestsCsvUrl(status = "all") {
  const suffix = status && status !== "all" ? `?status=${encodeURIComponent(status)}` : "";
  return `${API_BASE_URL}/admin/requests/export-csv${suffix}`;
}

export function authFetch(path, options = {}) {
  return request(path, {
    ...options,
    headers: { ...authHeaders(), ...(options.headers || {}) }
  });
}