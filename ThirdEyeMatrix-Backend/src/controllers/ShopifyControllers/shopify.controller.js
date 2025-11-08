const axios = require("axios");
const { db } = require("../../config/db");

const SHOPIFY_API_KEY = process.env.SHOPIFY_API_KEY;
const SHOPIFY_API_SECRET = process.env.SHOPIFY_API_SECRET;
const SCOPES ="read_analytics,read_customers,read_inventory,read_orders,read_products";
const APP_URL = process.env.BECKEND_URL || "http://localhost:5000";
const frontend_url = process.env.FRONTEND_URL;

// Step 1: Redirect user to Shopify OAuth
exports.connectShopify = async (req, res) => {
  try {
    const userId = req.user.id;
    const store = await db("stores").where({ user_id: userId }).first();

    if (!store || !store.store_URL) {
      return res.status(400).json({ message: "Store URL not found" });
    }

    const shop = store.store_URL;
    const state = Math.random().toString(36).substring(2, 15);

    // Save state in DB
    await db("stores").where({ user_id: userId }).update({ oauth_state: state });

    const redirectUrl = `https://${shop}/admin/oauth/authorize?client_id=${SHOPIFY_API_KEY}&scope=${SCOPES}&redirect_uri=${APP_URL}/api/shopify/callback&state=${state}`;
   
    res.json({ redirectUrl });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error initiating Shopify connection" });
  }
};

// Step 2: Callback → exchange code for access token
exports.shopifyCallback = async (req, res) => {
  const { code, shop, state } = req.query;

  try {
    const store = await db("stores").where({ store_URL: shop }).first();

    if (!store || !store.oauth_state) {
      return res.status(403).send("No state stored for this shop");
    }


    if (store.oauth_state !== state) {
      return res.status(403).send("State mismatch. Possible CSRF attack.");
    }

    // Clear state after verification
    await db("stores").where({ id: store.id }).update({ oauth_state: null });

    // Exchange code for access token using Axios
    const tokenResponse = await axios.post(`https://${shop}/admin/oauth/access_token`, {
      client_id: SHOPIFY_API_KEY,
      client_secret: SHOPIFY_API_SECRET,
      code,
    });

    const tokenData = tokenResponse.data;

    if (!tokenData.access_token) {
      console.error("Failed token response:", tokenData);
      return res.status(500).send("Failed to get access token from Shopify");
    }

    // Save access_token in DB
    await db("stores")
      .where({ store_URL: shop })
      .update({ access_token: tokenData.access_token });

    // Redirect to frontend success page
    res.redirect(`${frontend_url}/welcome/integrations`);
  } catch (error) {
    console.error(error.response?.data || error.message);
    res.status(500).send("Error exchanging access token");
  }
};

// Helper function to format tags as comma-separated string
function formatTags(tags) {
  if (!tags) return null;
  
  // If tags is already a string, return it (trimmed)
  if (typeof tags === 'string') {
    return tags.trim() || null;
  }
  
  // If tags is an array, join it
  if (Array.isArray(tags)) {
    return tags.length > 0 ? tags.join(', ') : null;
  }
  
  return null;
}

// Helper function to format variants array
function formatVariants(variants) {
  if (!variants || !Array.isArray(variants)) return null;
  
  const formattedVariants = variants.map(variant => ({
    variant_id: variant.id ? String(variant.id) : null,
    sku: variant.sku || null,
    taxable: variant.taxable !== undefined ? variant.taxable : null,
    price: variant.price ? parseFloat(variant.price) : null,
    requires_shipping: variant.requires_shipping !== undefined ? variant.requires_shipping : null,
    inventory_quantity: variant.inventory_quantity !== undefined ? variant.inventory_quantity : null,
  })).filter(v => v.variant_id !== null); // Only include variants with valid variant_id
  
  return formattedVariants.length > 0 ? formattedVariants : null;
}

// Helper function to format addresses array
function formatAddresses(addresses) {
  if (!addresses || !Array.isArray(addresses)) return null;
  
  const formattedAddresses = addresses.map(address => ({
    address1: address.address1 || null,
    address2: address.address2 || null,
    city: address.city || null,
    company: address.company || null,
    country_name: address.country_name || address.country || null,
    phone: address.phone || null,
    zip: address.zip || address.postal_code || null,
  })).filter(addr => {
    // Only include addresses that have at least one field populated
    return Object.values(addr).some(val => val !== null);
  });
  
  return formattedAddresses.length > 0 ? formattedAddresses : null;
}

// Helper function to format single address object (for shipping/billing)
function formatSingleAddress(address) {
  if (!address || typeof address !== 'object') return null;
  
  const formattedAddress = {
    address1: address.address1 || null,
    address2: address.address2 || null,
    city: address.city || null,
    company: address.company || null,
    country: address.country || address.country_name || null,
    phone: address.phone || null,
    zip: address.zip || address.postal_code || null,
  };
  
  // Return null if all fields are empty
  const hasData = Object.values(formattedAddress).some(val => val !== null);
  return hasData ? formattedAddress : null;
}

// Helper function to format refunds array
function formatRefunds(refunds) {
  if (!refunds || !Array.isArray(refunds)) return null;
  return refunds.length > 0 ? refunds : null;
}

// Helper function to format total_shipping_price_set
function formatShippingPriceSet(priceSet) {
  if (!priceSet || typeof priceSet !== 'object') return null;
  
  const formatted = {};
  
  if (priceSet.shop_money) {
    formatted.shop_money = {
      amount: priceSet.shop_money.amount || null,
      currency_code: priceSet.shop_money.currency_code || null,
    };
  }
  
  if (priceSet.presentment_money) {
    formatted.presentment_money = {
      amount: priceSet.presentment_money.amount || null,
      currency_code: priceSet.presentment_money.currency_code || null,
    };
  }
  
  return Object.keys(formatted).length > 0 ? formatted : null;
}

// Helper function to save products to database
async function saveProductsToDB(products, userId, storeId) {
  for (const product of products) {
    try {
      // Format tags
      const tagsString = formatTags(product.tags);
      
      // Format variants
      const variantsArray = formatVariants(product.variants);
      
      // Prepare variants value for JSONB
      let variantsValue = null;
      if (variantsArray && variantsArray.length > 0) {
        try {
          const jsonString = JSON.stringify(variantsArray);
          variantsValue = db.raw('?::jsonb', [jsonString]);
        } catch (err) {
          console.error("Error stringifying variants:", err);
          variantsValue = null;
        }
      }
      
      const productData = {
        user_id: userId,
        store_id: storeId,
        product_id: String(product.id),
        name: product.title || product.name || null,
        tags: tagsString,
        product_type: product.product_type || null,
        vendor: product.vendor || null,
        variants: variantsValue,
      };
      
      // Check if product already exists
      const existing = await db("shopify_products")
        .where({
          store_id: storeId,
          product_id: String(product.id),
        })
        .first();

      if (existing) {
        // Update existing product
        await db("shopify_products")
          .where({ id: existing.id })
          .update({
            ...productData,
            updated_at: db.fn.now(),
          });
      } else {
        // Insert new product
        await db("shopify_products").insert(productData);
      }
    } catch (error) {
      console.error(
        `Error saving product ${product.id}:`,
        error.message
      );
      // Continue with next product
    }
  }
}

// Helper function to save customers to database
async function saveCustomersToDB(customers, userId, storeId) {
  for (const customer of customers) {
    try {
      // Format tags
      const tagsString = formatTags(customer.tags);
      
      // Format addresses
      const addressesArray = formatAddresses(customer.addresses);
      
      // Prepare addresses value for JSONB
      let addressesValue = null;
      if (addressesArray && addressesArray.length > 0) {
        try {
          const jsonString = JSON.stringify(addressesArray);
          addressesValue = db.raw('?::jsonb', [jsonString]);
        } catch (err) {
          console.error("Error stringifying addresses:", err);
          addressesValue = null;
        }
      }
      
      // Parse Shopify created_at timestamp
      let shopifyCreatedAt = null;
      if (customer.created_at) {
        try {
          shopifyCreatedAt = new Date(customer.created_at);
          // Validate the date
          if (isNaN(shopifyCreatedAt.getTime())) {
            shopifyCreatedAt = null;
          }
        } catch (err) {
          console.error("Error parsing created_at:", err);
          shopifyCreatedAt = null;
        }
      }

      const customerData = {
        user_id: userId,
        store_id: storeId,
        shopify_customer_id: String(customer.id),
        first_name: customer.first_name || null,
        last_name: customer.last_name || null,
        email: customer.email || null,
        addresses: addressesValue,
        tags: tagsString,
        currency: customer.currency || null,
        total_spent: customer.total_spent ? parseFloat(customer.total_spent) : 0,
        shopify_created_at: shopifyCreatedAt,
      };
      
      // Check if customer already exists
      const existing = await db("shopify_customers")
        .where({
          store_id: storeId,
          shopify_customer_id: String(customer.id),
        })
        .first();

      if (existing) {
        // Update existing customer
        await db("shopify_customers")
          .where({ id: existing.id })
          .update({
            ...customerData,
            updated_at: db.fn.now(),
          });
      } else {
        // Insert new customer
        await db("shopify_customers").insert(customerData);
      }
    } catch (error) {
      console.error(
        `Error saving customer ${customer.id}:`,
        error.message
      );
      // Continue with next customer
    }
  }
}

// Step 3: Fetch products example
exports.getProducts = async (req, res) => {
  try {
    const userId = req.user.id;
    const store = await db("stores").where({ user_id: userId }).first();

    if (!store || !store.access_token) {
      return res.status(400).json({ message: "Store not connected" });
    }

    const response = await axios.get(
      `https://${store.store_URL}/admin/api/2025-07/products.json`,
      {
        headers: { "X-Shopify-Access-Token": store.access_token },
      }
    );

    const products = response.data.products || [];

    // Save products to database
    try {
      await saveProductsToDB(
        products,
        userId,
        store.id
      );
      console.log(`Successfully saved ${products.length} products to database`);
    } catch (dbError) {
      console.error("Error saving products to database:", dbError.message);
      // Continue to return products even if DB save fails
    }

    res.json(response.data);
  } catch (error) {
    console.error(error.response?.data || error.message);
    res.status(500).json({ message: "Error fetching Shopify products" });
  }
};

// Fetch customers
exports.getCustomers = async (req, res) => {
  try {
    const userId = req.user.id;
    const store = await db("stores").where({ user_id: userId }).first();

    if (!store || !store.access_token) {
      return res.status(400).json({ message: "Store not connected" });
    }

    const response = await axios.get(
      `https://${store.store_URL}/admin/api/2025-07/customers.json`,
      {
        headers: { "X-Shopify-Access-Token": store.access_token },
      }
    );

    const customers = response.data.customers || [];

    // Save customers to database
    try {
      await saveCustomersToDB(
        customers,
        userId,
        store.id
      );
      console.log(`Successfully saved ${customers.length} customers to database`);
    } catch (dbError) {
      console.error("Error saving customers to database:", dbError.message);
      // Continue to return customers even if DB save fails
    }
   
    res.json(response.data);
  } catch (error) {
    const status = error.response?.status || 500;
    const payload = error.response?.data || { message: "Error fetching Shopify customers" };
    console.error(payload || error.message);
    res.status(status).json(payload);
  }
};

// Helper function to save orders to database
async function saveOrdersToDB(orders, userId, storeId) {
  for (const order of orders) {
    try {
      // Format shipping address
      const shippingAddress = formatSingleAddress(order.shipping_address);
      let shippingAddressValue = null;
      if (shippingAddress) {
        try {
          const jsonString = JSON.stringify(shippingAddress);
          shippingAddressValue = db.raw('?::jsonb', [jsonString]);
        } catch (err) {
          console.error("Error stringifying shipping_address:", err);
          shippingAddressValue = null;
        }
      }

      // Format billing address
      const billingAddress = formatSingleAddress(order.billing_address);
      let billingAddressValue = null;
      if (billingAddress) {
        try {
          const jsonString = JSON.stringify(billingAddress);
          billingAddressValue = db.raw('?::jsonb', [jsonString]);
        } catch (err) {
          console.error("Error stringifying billing_address:", err);
          billingAddressValue = null;
        }
      }

      // Format refunds
      const refundsArray = formatRefunds(order.refunds);
      let refundsValue = null;
      if (refundsArray) {
        try {
          const jsonString = JSON.stringify(refundsArray);
          refundsValue = db.raw('?::jsonb', [jsonString]);
        } catch (err) {
          console.error("Error stringifying refunds:", err);
          refundsValue = null;
        }
      }

      // Format total_shipping_price_set
      const shippingPriceSet = formatShippingPriceSet(order.total_shipping_price_set);
      let shippingPriceSetValue = null;
      if (shippingPriceSet) {
        try {
          const jsonString = JSON.stringify(shippingPriceSet);
          shippingPriceSetValue = db.raw('?::jsonb', [jsonString]);
        } catch (err) {
          console.error("Error stringifying total_shipping_price_set:", err);
          shippingPriceSetValue = null;
        }
      }

      // Parse Shopify created_at timestamp
      let shopifyCreatedAt = null;
      if (order.created_at) {
        try {
          shopifyCreatedAt = new Date(order.created_at);
          if (isNaN(shopifyCreatedAt.getTime())) {
            shopifyCreatedAt = null;
          }
        } catch (err) {
          console.error("Error parsing created_at:", err);
          shopifyCreatedAt = null;
        }
      }

      const orderData = {
        user_id: userId,
        store_id: storeId,
        shopify_order_id: String(order.id),
        order_number: order.order_number ? String(order.order_number) : null,
        name: order.name || null,
        customer_id: order.customer?.id !== undefined ? parseInt(order.customer.id) : null,
        customer_firstname: order.customer?.first_name || order.billing_address?.first_name || null,
        customer_lastname: order.customer?.last_name || order.billing_address?.last_name || null,
        customer_email: order.customer?.email || order.billing_address?.email || order.email || null,
        total_price: order.total_price ? parseFloat(order.total_price) : null,
        total_discounts: order.total_discounts ? parseFloat(order.total_discounts) : null,
        total_tax: order.total_tax ? parseFloat(order.total_tax) : null,
        order_confirmed: order.confirmed !== undefined ? order.confirmed : false,
        financial_status: order.financial_status || null,
        shopify_created_at: shopifyCreatedAt,
        refunds: refundsValue,
        shipping_address: shippingAddressValue,
        billing_address: billingAddressValue,
        total_shipping_price_set: shippingPriceSetValue,
      };

      // Check if order already exists
      const existing = await db("shopify_orders")
        .where({
          store_id: storeId,
          shopify_order_id: String(order.id),
        })
        .first();

      if (existing) {
        // Update existing order
        await db("shopify_orders")
          .where({ id: existing.id })
          .update({
            ...orderData,
            updated_at: db.fn.now(),
          });
      } else {
        // Insert new order
        await db("shopify_orders").insert(orderData);
      }
    } catch (error) {
      console.error(
        `Error saving order ${order.id}:`,
        error.message
      );
      // Continue with next order
    }
  }
}

// Fetch orders
exports.getOrders = async (req, res) => {
  try {
    const userId = req.user.id;
    const store = await db("stores").where({ user_id: userId }).first();

    if (!store || !store.access_token) {
      return res.status(400).json({ message: "Store not connected" });
    }

    // Request only non-PII fields to reduce PCD errors; include all statuses and a limit
    const response = await axios.get(
      `https://${store.store_URL}/admin/api/2025-07/orders.json`,
      {
        headers: { "X-Shopify-Access-Token": store.access_token },
      }
    );

    const orders = response.data.orders || [];

    // Save orders to database
    try {
      await saveOrdersToDB(
        orders,
        userId,
        store.id
      );
      console.log(`Successfully saved ${orders.length} orders to database`);
    } catch (dbError) {
      console.error("Error saving orders to database:", dbError.message);
      // Continue to return orders even if DB save fails
    }
  
    res.json(response.data);
  } catch (error) {
    const status = error.response?.status || 500;
    const payload = error.response?.data || { message: "Error fetching Shopify orders" };
    console.error(payload || error.message);
    res.status(status).json(payload);
  }
};