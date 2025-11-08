const validate = (schema) => (req, res, next) => {
  const { error } = schema.validate(req.body);
  if (error) {
    console.log("error",error.details[0].message )
    return res.status(400).json({ message: error.details[0].message });
  }
  next();
};

module.exports = validate;
