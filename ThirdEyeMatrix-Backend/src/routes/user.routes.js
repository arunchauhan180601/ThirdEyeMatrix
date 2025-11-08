const express = require('express');
const router = express.Router();
const userController = require('../controllers/UserControllers/user.controller');
const { basicAuthMiddleware } = require('../middlewares/basicAuth.middleware');
const { verifyCaptcha } = require('../middlewares/recaptcha.middleware');
const { userAuthMiddleware } = require('../middlewares/userAuth.middleware');
const upload = require('../middlewares/upload.middleware');



router.post('/signup-complete', verifyCaptcha , basicAuthMiddleware,  userController.signupUserAndStore);
router.get('/profile', userAuthMiddleware, userController.getUserProfile);
router.put('/profile', userAuthMiddleware, upload.single('avatar'), userController.updateUserProfile);
router.get("/store", userAuthMiddleware , userController.getUserStore)


module.exports = router;
