const knex = require("knex")(require("../../../knexfile").development);
const bcrypt = require("bcrypt");

exports.signupUserAndStore = async (req, res) => {
  const {
    firstName,
    lastName,
    email,
    password,
    phoneNumber,
    howDidYouHear,
    storeName,
    storeUrl,
    annualRevenue,
    storeCurrency,
    storeTimezone,
    industryCategory,
    platform,
    magentoConsumerKey,
    magentoConsumerSecret,
    magentoAccessToken,
    magentoAccessTokenSecret,
  } = req.body;

  try {
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Check if user already exists
    const existingUser = await knex("users").where({ email }).first();
    if (existingUser) {
      return res.status(409).json({ message: "Email already registered" });
    }

    // Insert user into users table
    const result = await knex("users")
      .insert({
        first_name: firstName,
        last_name: lastName,
        email,
        password: hashedPassword,
        phone_number: phoneNumber,
        how_did_you_hear_about_us: howDidYouHear,
      })
      .returning("id");
    const userId = result[0].id;

    // Insert store into stores table
    await knex("stores").insert({
      user_id: userId,
      store_name: storeName,
      store_URL: storeUrl,
      store_annual_revenue: annualRevenue,
      store_currency: storeCurrency,
      store_timezone: storeTimezone,
      store_industry_category: industryCategory,
      platform: platform,
      magento_consumer_key: magentoConsumerKey || null,
      magento_consumer_secret: magentoConsumerSecret || null,
      magento_access_token: magentoAccessToken || null,
      magento_access_token_secret: magentoAccessTokenSecret || null,
    });

    return res
      .status(201)
      .json({ message: "User and store created successfully" });
  } catch (error) {
    console.error("Error during signup:", error);
    if (error.code === "SQLITE_CONSTRAINT") {
      return res.status(409).json({ message: "Email already registered" });
    }
    res.status(500).json({ message: "Server error during signup" });
  }
};

exports.getUserProfile = async (req, res) => {
  try {
    const user = await knex("users")
      .select(
        "id",
        "first_name",
        "last_name",
        "email",
        "phone_number",
        "avatar"
      )
      .where({ id: req.user.id })
      .first();

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Prepend base URL to avatar if it exists
    if (user.avatar) {
      user.avatar = `http://localhost:5000${user.avatar}`;
    }

    res.status(200).json(user);
  } catch (error) {
    console.error("Error fetching user profile:", error);
    res.status(500).json({ message: "Server error fetching user profile" });
  }
};

exports.updateUserProfile = async (req, res) => {
  const { first_name, last_name, email, password, phone_number } = req.body;
  const avatarPath = req.file
    ? `/images/avatars/${req.file.filename}`
    : undefined; // Get avatar path if file uploaded

  try {
    const updateData = {
      first_name,
      last_name,
      email,
      phone_number,
    };

    if (password) {
      updateData.password = await bcrypt.hash(password, 10);
    }

    if (avatarPath) {
      updateData.avatar = avatarPath;
    }

    await knex("users").where({ id: req.user.id }).update(updateData);

    res.status(200).json({ message: "Profile updated successfully" });
  } catch (error) {
    console.error("Error updating user profile:", error);
    if (error.code === "SQLITE_CONSTRAINT") {
      return res.status(409).json({ message: "Email already registered" });
    }
    res.status(500).json({ message: "Server error updating user profile" });
  }
};

exports.getUserStore = async (req, res) => {
  try {
    const userId = req.user.id;
    const store = await knex("stores")
      .select("id", "user_id", "store_name", "store_URL", "platform", "meta_ad_account_id", "store_currency")
      .where({ user_id: userId })
      .first();
    if (!store) {
      return res.status(404).json({ message: "Store not found" });
    }
    return res.status(200).json(store);
  } catch (error) {
    console.error("Error fetching user store:", error);
    res.status(500).json({ message: "Server error fetching user store" });
  }
};
