export function notFound(req, res) {
  res.status(404).json({ message: "Route not found" });
}

export function errorHandler(err, req, res, next) {
  console.error(err);
  if (err?.name === "ValidationError") {
    return res.status(400).json({
      message: "Validation error",
      errors: Object.values(err.errors).map(e => e.message)
    });
  }
  if (err?.code === 11000) {
    return res.status(409).json({ message: "A unique field already exists" });
  }
  res.status(err.statusCode || 500).json({
    message: err.message || "Internal server error"
  });
}