const express = require("express");
const session = require('express-session');
const bodyParser = require("body-parser");
const app = express();
const { db, connectDB } = require("./config/db");
const dotenv = require("dotenv");
const authRoutes = require("./routes/adminAuth.routes");
const adminUserRoutes = require("./routes/adminUser.routes");
const userRoutes = require("./routes/user.routes");
const userAuthRoutes = require("./routes/userAuth.routes");
const shopifyRoutes = require("./routes/shopify.routes");
const woocommerceRoutes = require("./routes/woocommerce.routes");
const magentoRoutes = require("./routes/magento.routes");
const metaRoutes = require("./routes/meta.routes");
const googleAdsRoutes = require("./routes/googleads.routes");
const klaviyoRoutes = require("./routes/klaviyo.routes");
const reportRoutes = require("./routes/report.routes");
const pixelRoutes = require("./routes/pixel.routes");
const cookieParser = require("cookie-parser");
const cors = require("cors");



dotenv.config({ debug: false });
const corsOriginsEnv = process.env.CORS_ORIGINS;
const allowedOrigins = corsOriginsEnv
  ? corsOriginsEnv.split(",").map((origin) => origin.trim()).filter(Boolean)
  : ["*"];



connectDB();

// Serve static files from the 'public' directory
app.use(express.static('public'));

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) {
        return callback(null, true);
      }

      if (allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(null, false);
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  })
); 

// Increase payload size limit for PDF attachments (50MB)
app.use(express.json({ limit: '120mb' }));
app.use(express.urlencoded({ extended: true, limit: '120mb' }));
app.use(bodyParser.json({ limit: '120mb' }));
app.use(cookieParser());

// Add session middleware configuration
app.use(session({
  secret: process.env.SESSION_SECRET || '4f8a3d1c9e2b0f7a5d6e1c8b3f0a9d7e6c1b0a5f8d2e7c9b3a0f1d5e6c7b9a2d',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false }
}));

// Use session to store request token secret temporarily
app.use(session({ secret: "magento-secret", resave: false, saveUninitialized: true }));



app.get("/", (req, res)=> {
    res.send("Welcome from Express");
})

// Routes
app.use("/api/admin/auth" , authRoutes);
app.use("/api/adminUsers" , adminUserRoutes);
app.use("/api/user" , userRoutes);
app.use("/api/user/auth" , userAuthRoutes);
app.use("/api/shopify",  shopifyRoutes);
app.use("/api/woocommerce", woocommerceRoutes);
app.use("/api/magento", magentoRoutes);
app.use("/api/meta", metaRoutes);
app.use("/api/google-ads", googleAdsRoutes);
app.use("/api/klaviyo", klaviyoRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/pixel", pixelRoutes);


const PORT = process.env.PORT || 5000;

app.listen(PORT, ()=> {
    console.log(`Server is running on port ${PORT}`);
})