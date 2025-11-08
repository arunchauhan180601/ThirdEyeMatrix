const axios = require('axios');
require('dotenv').config();

module.exports = {
    verifyCaptcha : async(req, res, next) => {
        const { captcha } = req.body;
        const captchaEnabled = process.env.RECAPTCHA_ENABLED;
        
        if(!captcha){
            return res.status(400).json({message: "Please complete the CAPTCHA."})
        }
        
        if(captchaEnabled === 'false') {
            return next();
        }
        
        else{
            const secretKey = process.env.CAPTCHA_SECRET_KEY;
            try{
                const response = await axios.post(
                    `https://www.google.com/recaptcha/api/siteverify?secret=${secretKey}&response=${captcha}`
                )
                if(response.data.success){
                
                    next();
                } else {
                     return res.status(400).json({message: "CAPTCHA verification failed."})
                }
            }catch(err){
             
                 return res.status(500).json({message: "CAPTCHA verification error."})
            }
        }
    } 
}