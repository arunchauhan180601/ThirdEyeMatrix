const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const nodemailer = require("nodemailer");
const { db } = require("../../config/db");


const login = async (req, res) => {
    try {
        const { email, password } = req.body;

      
        const user = await db('users').where({ email }).first();
        if (!user) {
            return res.status(400).json({ message: "User not found" });
        }

       
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: "Password is incorrect" });
        }

        // Generate JWT
        const payload = {
            user: {
                id: user.id,
                email: user.email,
                first_name: user.first_name,
                last_name:user.last_name
            },
        };

        const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "1d" });
        return res.status(200).json({ token, message: "Logged in successfully!" });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Server Error" });
    }
};

const sendOtp = async (req, res) => {
    try {
        const { email } = req.body;

        // Check if user exists
        const user = await db('users').where({ email }).first();
        if (!user) {
            return res.status(400).json({ message: "User not found" });
        }

        // Generate OTP
        const otp = Math.floor(1000 + Math.random() * 9000); // Always 4-digit number

        const otpExpires = new Date(Date.now() + 30 * 60 * 1000); // OTP valid for 30 minutes

        // Save OTP to database
        await db('users').where({ email }).update({ otp, otp_expiry: otpExpires });

        let transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });

        let mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: "Your OTP for password reset",
            text: `Your OTP is: ${otp}. It is valid for 10 minutes.`,
        };

        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.error(error);
                return res.status(500).json({ message: "Error sending OTP email" });
            }
           return res.status(200).json({ message: "OTP sent to your email" });
        });

    } catch (error) {
        console.error(error);
         return res.status(500).json({ message: "Server Error" });
    }
};

const verifyOtp = async (req, res) => {
    try {
        const { email, otp } = req.body;

        // Check if user exists and OTP matches and is not expired
        const user = await db('users')
            .where({ email, otp })
            .andWhere('otp_expiry', '>', db.raw('NOW()'))
            .first();

        if (!user) {
            return res.status(400).json({ message: "Invalid or expired OTP" });
        }

        // Clear OTP after successful verification
        await db('users').where({ email }).update({ otp: null, otp_expiry: null });

        return res.status(200).json({ message: "OTP verified successfully" , user_Id : user.id });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Server Error" });
    }
};

const resetPassword = async (req, res) => {
    try {
        const { userId, newPassword } = req.body;

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);
    
        await db('users').where({ id: userId }).update({ password: hashedPassword });

        return  res.status(200).json({ message: "Password reset successfully" });

    } catch (error) {
        console.error(error);
        return  res.status(500).json({ message: "Server Error" });
    }
};

const googleLogin = async (req, res) => {
    try {
        const { credential } = req.body;
        const { OAuth2Client } = require('google-auth-library');
        const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

        const ticket = await client.verifyIdToken({
            idToken: credential,
            audience: process.env.GOOGLE_CLIENT_ID,
        });
        const payload = ticket.getPayload();
        const { email, name, picture } = payload;

        let user = await db('users').where({ email }).first();

        if (!user) {
            // Register new user
            const hashedPassword = await bcrypt.hash(email + Date.now(), 10);
            const [newUserId] = await db('users').insert({
                email,
                password: hashedPassword,
                first_name: name.split(' ')[0],
                last_name: name.split(' ')[1] || '',
                profile_picture: picture,
            
            }).returning('id');
            user = await db('users').where({ id: newUserId }).first();
        }

  
        const jwtPayload = {
            user: {
                id: user.id,
                email: user.email,
                first_name: user.first_name,
                last_name:user.last_name
            },
        };

        const token = jwt.sign(jwtPayload, process.env.JWT_SECRET, { expiresIn: "1d" });
        return res.status(200).json({ token, message: "Logged in successfully!" });

    } catch (error) {
        console.error('Google login error:', error);
        return res.status(500).json({ message: "Google login failed", error: error.message });
    }
};

const facebookLogin = async (req, res) => {
    try {
        const { accessToken } = req.body;

        // Verify the access token with Facebook
        const appAccessToken = `${process.env.FACEBOOK_APP_ID}|${process.env.FACEBOOK_APP_SECRET}`;
        const debugTokenResponse = await fetch(`https://graph.facebook.com/debug_token?input_token=${accessToken}&access_token=${appAccessToken}`);
        const debugTokenData = await debugTokenResponse.json();

        if (!debugTokenData.data || !debugTokenData.data.is_valid) {
            return res.status(401).json({ message: "Invalid Facebook access token" });
        }

        // Get user profile information using the valid access token
        const userProfileResponse = await fetch(`https://graph.facebook.com/me?fields=id,name,email,picture&access_token=${accessToken}`);
        const userProfile = await userProfileResponse.json();

        if (!userProfile.email) {
            return res.status(400).json({ message: "Facebook account does not have an email address." });
        }

        let user = await db('users').where({ email: userProfile.email }).first();

        if (!user) {
            // Register new user
            const hashedPassword = await bcrypt.hash(userProfile.email + Date.now(), 10); 
            const [newUserId] = await db('users').insert({
                email: userProfile.email,
                password: hashedPassword,
                first_name: userProfile.name.split(' ')[0],
                last_name: userProfile.name.split(' ')[1] || '',
                profile_picture: userProfile.picture ? userProfile.picture.data.url : null,
            }).returning('id');
            user = await db('users').where({ id: newUserId }).first();
        }

        const jwtPayload = {
            user: {
                id: user.id,
                email: user.email,
                first_name: user.first_name,
                last_name: user.last_name
            },
        };

        const token = jwt.sign(jwtPayload, process.env.JWT_SECRET, { expiresIn: "1d" });
        return res.status(200).json({ token, message: "Logged in successfully!" });

    } catch (error) {
        console.error('Facebook login error:', error);
        return res.status(500).json({ message: "Facebook login failed", error: error.message });
    }
};

module.exports = {
    login,
    sendOtp,
    verifyOtp,
    resetPassword,
    googleLogin,
    facebookLogin,
};
