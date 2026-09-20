const clean = (obj) => {
  if (!obj || typeof obj !== 'object') return obj;

  if (Array.isArray(obj)) {
    return obj.map(clean);
  }

  const cleaned = {};
  for (const key of Object.keys(obj)) {
    if (key.startsWith('$') || key.includes('.')) {
      continue;
    }
    cleaned[key] = clean(obj[key]);
  }
  return cleaned;
};

export const sanitizeNoSQL = (req, res, next) => {
  if (req.body) req.body = clean(req.body);
  if (req.query) req.query = clean(req.query);
  if (req.params) req.params = clean(req.params);
  next();
};
