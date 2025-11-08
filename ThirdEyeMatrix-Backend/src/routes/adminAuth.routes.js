const express = require("express");
const validate = require("../middlewares/validation.middleware");
const { loginSchema, sendOtpSchema, verifyOtpSchema, resetPasswordSchema } = require("../validations/adminAuth.validation");
const { login, sendOtp, verifyOtp, resetPassword } = require("../controllers/AdminControllers/auth.controller");
const router = express.Router();



router.post("/login", validate(loginSchema), login);

router.post("/sendOtp", validate(sendOtpSchema), sendOtp);

router.post("/verifyOtp", validate(verifyOtpSchema), verifyOtp); 

router.post('/resetPassword', validate(resetPasswordSchema), resetPassword); 



module.exports = router;
