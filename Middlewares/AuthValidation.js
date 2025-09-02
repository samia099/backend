const Joi = require("joi");

const signupValidation = (req, res, next) => {
  const schema = Joi.object({
    name: Joi.string().min(3).max(100).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(4).max(100).required(),
    photo: Joi.string().uri().allow(null, "").optional(),
    role: Joi.string().valid("admin", "employer", "jobseeker").default("jobseeker")
  });

  const { error } = schema.validate(req.body);
  if (error) {
    console.log(error);
    return res.status(400).json({
      success: false,
      message: "Validation error",
      error: error.details.map((detail) => detail.message),
    });
  }
  next();
};

const signinValidation = (req, res, next) => {
  const schema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(4).max(100).required(),
  });

  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({
      success: false,
      message: "Validation error",
      error: error.details.map((detail) => detail.message),
    });
  }
  next();
};

module.exports = {
  signupValidation,
  signinValidation,
};