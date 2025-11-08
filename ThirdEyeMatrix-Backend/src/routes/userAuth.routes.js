const express = require("express");
const validate = require("../middlewares/validation.middleware");
const { loginSchema, sendOtpSchema, verifyOtpSchema, resetPasswordSchema } = require("../validations/userAuth.validation"); 
const { login, sendOtp, verifyOtp, resetPassword, googleLogin , facebookLogin } = require("../controllers/UserControllers/auth.controller"); 
const { basicAuthMiddleware } = require("../middlewares/basicAuth.middleware");
const { verifyCaptcha } = require("../middlewares/recaptcha.middleware");
const router = express.Router();

router.post("/login", verifyCaptcha , basicAuthMiddleware , validate(loginSchema), login);
router.post("/sendOtp", verifyCaptcha , basicAuthMiddleware , validate(sendOtpSchema), sendOtp);
router.post("/verifyOtp", verifyCaptcha , basicAuthMiddleware , validate(verifyOtpSchema), verifyOtp);
router.post('/resetPassword', verifyCaptcha , basicAuthMiddleware , validate(resetPasswordSchema), resetPassword);
router.post('/google-login', googleLogin);
router.post('/facebook-login', facebookLogin);


module.exports = router;
