export const validateBody = (schema) => (req, res, next) => {
  try {
    req.body = schema.parse(req.body);
    next();
  } catch (error) {
    const issues = error.errors?.map((err) => ({
      field: err.path.join('.'),
      message: err.message
    })) || [{ message: error.message }];

    return res.status(400).json({
      success: false,
      message: issues[0]?.message || 'Validation error',
      errors: issues
    });
  }
};

export const validateQuery = (schema) => (req, res, next) => {
  try {
    req.query = schema.parse(req.query);
    next();
  } catch (error) {
    const issues = error.errors?.map((err) => ({
      field: err.path.join('.'),
      message: err.message
    })) || [{ message: error.message }];

    return res.status(400).json({
      success: false,
      message: issues[0]?.message || 'Query validation error',
      errors: issues
    });
  }
};
