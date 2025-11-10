const axios = require("axios");
const { db } = require("../../config/db");

const APP_URL = process.env.BACKEND_URL || "https://logier-unsqueezed-teodoro.ngrok-free.dev";
const frontend_url = process.env.FRONTEND_URL;

// helper: ensure clean store URL (no trailing slash)
function normalizeStoreUrl(url) {
  if (!url) return null;
  return url.replace(/\/+$/, ""); // remove trailing slashes
}

// Step 1: Redirect user to WooCommerce OAuth
exports.connectWooCommerce = async (req, res) => {
  try {
    const userId = req.user.id;
    const store = await db("stores").where({ user_id: userId }).first();

    if (!store || !store.store_URL) {
      return res.status(400).json({ message: "Store URL not found" });
    }

    const shopUrl = normalizeStoreUrl(store.store_URL);

    // WooCommerce requires these query params
    const params = new URLSearchParams({
      app_name: "ThirdEyeMatrix",
      scope: "read",
      user_id: String(userId), // comes back in callback
      return_url: `${frontend_url}/welcome/integrations`,
      callback_url: `${APP_URL}/api/woocommerce/callback`,
    });

    const redirectUrl = `${shopUrl}/wc-auth/v1/authorize?${params.toString()}`;
    res.json({ redirectUrl });
  } catch (error) {
    console.error("connectWooCommerce error:", error.message);
    res
      .status(500)
      .json({ message: "Error initiating WooCommerce connection" });
  }
};

// Step 2: Handle WooCommerce callback
exports.wooCommerceCallback = async (req, res) => {
  try {
    const {
      consumer_key,
      consumer_secret,
      key_id,
      user_id,
      app_name,
      scope,
      key_permissions,
    } = req.body;


    if (!consumer_key || !consumer_secret) {
      console.error("WooCommerce callback missing keys:", req.query);
      return res.status(400).send("Failed to get API keys from WooCommerce");
    }

    // Save WooCommerce keys securely in DB
    await db("stores").where({ user_id: user_id }).update({
      woocommerce_consumer_key: consumer_key,
      woocommerce_consumer_secret: consumer_secret,
    });

    // Redirect back to frontend success page
    res.send(`${frontend_url}/welcome/integrations`);
  } catch (error) {
    console.error("wooCommerceCallback error:", error.message);
    res.status(500).send("Error handling WooCommerce callback");
  }
};

// Helper function to extract brand from product attributes or meta
function extractBrand(product) {
  // Check meta_data for brand
  if (product.meta_data && Array.isArray(product.meta_data)) {
    const brandMeta = product.meta_data.find(
      (meta) =>
        meta.key?.toLowerCase().includes("brand") ||
        meta.key?.toLowerCase() === "brand"
    );
    if (brandMeta?.value) return brandMeta.value;
  }

  // Check attributes for brand
  if (product.attributes && Array.isArray(product.attributes)) {
    const brandAttr = product.attributes.find(
      (attr) => attr.name?.toLowerCase().includes("brand") || attr.name?.toLowerCase() === "brand"
    );
    if (brandAttr?.options?.[0]) return brandAttr.options[0];
  }

  return null;
}

// Helper function to map categories
function mapCategories(categories) {
  if (!Array.isArray(categories) || categories.length === 0) return null;
  const mapped = categories
    .filter((cat) => cat && (cat.id !== undefined && cat.id !== null)) // Filter out invalid categories
    .map((cat) => {
      // Ensure all values are properly typed
      const category = {
        id: typeof cat.id === 'number' ? cat.id : (typeof cat.id === 'string' ? parseInt(cat.id) || null : null),
        name: typeof cat.name === 'string' ? cat.name : (cat.name || null),
        slug: typeof cat.slug === 'string' ? cat.slug : (cat.slug || null),
      };
      // Only include if id is valid
      return category.id !== null ? category : null;
    })
    .filter((cat) => cat !== null); // Remove any null entries
  return mapped.length > 0 ? mapped : null;
}

// Helper function to convert price string to integer (stored in cents)
function convertPriceToInteger(priceString) {
  if (!priceString) return null;
  const price = parseFloat(priceString);
  if (isNaN(price)) return null;
  // Convert to cents (multiply by 100) to preserve decimal precision
  return Math.round(price );
}

// Helper function to format billing address as array of objects
function formatBilling(billing) {
  if (!billing) return null;
  
  // If billing is already an array, validate and return it
  if (Array.isArray(billing)) {
    return billing.length > 0 ? billing : null;
  }
  
  // If billing is an object, convert to array with single object
  const billingObj = {
    first_name: billing.first_name || null,
    last_name: billing.last_name || null,
    company: billing.company || null,
    address_1: billing.address_1 || null,
    address_2: billing.address_2 || null,
    city: billing.city || null,
    state: billing.state || null,
    postcode: billing.postcode || null,
    country: billing.country || null,
    email: billing.email || null,
    phone: billing.phone || null,
  };
  
  // Return as array with single object (or null if all fields are null)
  const hasData = Object.values(billingObj).some(val => val !== null);
  return hasData ? [billingObj] : null;
}

// Helper function to format shipping address as array of objects
function formatShipping(shipping) {
  if (!shipping) return null;
  
  // If shipping is already an array, validate and return it
  if (Array.isArray(shipping)) {
    return shipping.length > 0 ? shipping : null;
  }
  
  // If shipping is an object, convert to array with single object
  const shippingObj = {
    first_name: shipping.first_name || null,
    last_name: shipping.last_name || null,
    company: shipping.company || null,
    address_1: shipping.address_1 || null,
    address_2: shipping.address_2 || null,
    city: shipping.city || null,
    state: shipping.state || null,
    postcode: shipping.postcode || null,
    country: shipping.country || null,
    phone: shipping.phone || null,
  };
  
  // Return as array with single object (or null if all fields are null)
  const hasData = Object.values(shippingObj).some(val => val !== null);
  return hasData ? [shippingObj] : null;
}

// Helper function to convert price string to decimal
function convertPriceToDecimal(priceString) {
  if (!priceString) return null;
  const price = parseFloat(priceString);
  if (isNaN(price)) return null;
  return price;
}

// Helper function to format date string to timestamp
function formatDate(dateString) {
  if (!dateString) return null;
  try {
    return new Date(dateString);
  } catch (error) {
    return null;
  }
}

// Helper function to save orders to database
async function saveOrdersToDB(orders, userId, storeId) {
  for (const order of orders) {
    try {
      // Prepare JSONB fields
      let billingValue = null;
      if (order.billing) {
        try {
          const jsonString = JSON.stringify(order.billing);
          billingValue = db.raw('?::jsonb', [jsonString]);
        } catch (err) {
          console.error("Error stringifying billing:", err);
          billingValue = null;
        }
      }
      
      let shippingValue = null;
      if (order.shipping) {
        try {
          const jsonString = JSON.stringify(order.shipping);
          shippingValue = db.raw('?::jsonb', [jsonString]);
        } catch (err) {
          console.error("Error stringifying shipping:", err);
          shippingValue = null;
        }
      }
      
      let lineItemsValue = null;
      if (order.line_items && Array.isArray(order.line_items) && order.line_items.length > 0) {
        try {
          const jsonString = JSON.stringify(order.line_items);
          lineItemsValue = db.raw('?::jsonb', [jsonString]);
        } catch (err) {
          console.error("Error stringifying line_items:", err);
          lineItemsValue = null;
        }
      }
      
      let feeLinesValue = null;
      if (order.fee_lines && Array.isArray(order.fee_lines) && order.fee_lines.length > 0) {
        try {
          const jsonString = JSON.stringify(order.fee_lines);
          feeLinesValue = db.raw('?::jsonb', [jsonString]);
        } catch (err) {
          console.error("Error stringifying fee_lines:", err);
          feeLinesValue = null;
        }
      }
      
      let refundsValue = null;
      if (order.refunds && Array.isArray(order.refunds) && order.refunds.length > 0) {
        try {
          const jsonString = JSON.stringify(order.refunds);
          refundsValue = db.raw('?::jsonb', [jsonString]);
        } catch (err) {
          console.error("Error stringifying refunds:", err);
          refundsValue = null;
        }
      }
      
      const orderData = {
        user_id: userId,
        store_id: storeId,
        woo_order_id: order.id,
        customer_id:order.customer_id,
        order_number: order.number || null,
        status: order.status || null,
        currency: order.currency || null,
        total: convertPriceToDecimal(order.total),
        subtotal: convertPriceToDecimal(order.subtotal),
        discount_total: convertPriceToDecimal(order.discount_total),
        discount_tax: convertPriceToDecimal(order.discount_tax),
        shipping_total: convertPriceToDecimal(order.shipping_total),
        shipping_tax: convertPriceToDecimal(order.shipping_tax),
        total_tax: convertPriceToDecimal(order.total_tax),
        payment_method: order.payment_method || null,
        payment_method_title: order.payment_method_title || null,
        transaction_id: order.transaction_id || null,
        prices_include_tax: order.prices_include_tax || null,
        created_via: order.created_via || null,
        customer_ip_address: order.customer_ip_address || null,
        date_created: formatDate(order.date_created),
        date_modified: formatDate(order.date_modified),
        date_paid: formatDate(order.date_paid),
        date_completed: formatDate(order.date_completed),
        billing: billingValue,
        shipping: shippingValue,
        line_items: lineItemsValue,
        fee_lines: feeLinesValue,
        refunds: refundsValue,
      };
      
      // Check if order already exists
      const existing = await db("woocommerce_orders")
        .where({
          store_id: storeId,
          woo_order_id: order.id,
        })
        .first();
      
      if (existing) {
        // Update existing order
        await db("woocommerce_orders")
          .where({ id: existing.id })
          .update({
            ...orderData,
            updated_at: db.fn.now(),
          });
      } else {
        // Insert new order
        await db("woocommerce_orders").insert(orderData);
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

// Helper function to save customers to database
async function saveCustomersToDB(customers, userId, storeId) {
  for (const customer of customers) {
    try {
      // Format billing and shipping as arrays
      const billingArray = formatBilling(customer.billing);
      const shippingArray = formatShipping(customer.shipping);
      
      // Prepare billing value for JSONB
      let billingValue = null;
      if (billingArray && billingArray.length > 0) {
        try {
          const jsonString = JSON.stringify(billingArray);
          billingValue = db.raw('?::jsonb', [jsonString]);
        } catch (err) {
          console.error("Error stringifying billing:", err);
          billingValue = null;
        }
      }
      
      // Prepare shipping value for JSONB
      let shippingValue = null;
      if (shippingArray && shippingArray.length > 0) {
        try {
          const jsonString = JSON.stringify(shippingArray);
          shippingValue = db.raw('?::jsonb', [jsonString]);
        } catch (err) {
          console.error("Error stringifying shipping:", err);
          shippingValue = null;
        }
      }
      
      const customerData = {
        user_id: userId,
        store_id: storeId,
        woo_customer_id: customer.id,
        first_name: customer.first_name || null,
        last_name: customer.last_name || null,
        email: customer.email || null,
        date_created: customer.date_created ? new Date(customer.date_created) : null,
        is_paying_customer: customer.is_paying_customer || false,
        billing: billingValue,
        shipping: shippingValue,
      };
      
      // Check if customer already exists
      const existing = await db("woocommerce_customers")
        .where({
          store_id: storeId,
          woo_customer_id: customer.id,
        })
        .first();
      
      if (existing) {
        // Update existing customer
        await db("woocommerce_customers")
          .where({ id: existing.id })
          .update({
            ...customerData,
            updated_at: db.fn.now(),
          });
      } else {
        // Insert new customer
        await db("woocommerce_customers").insert(customerData);
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

// Helper function to save products to database
async function saveProductsToDB(products, userId, storeId, currency) {
  const productsToInsert = [];

  for (const product of products) {
    // For variable products, we need to fetch variations
    if (product.type === "variable" && product.id) {
      try {
        // Fetch variations for variable products
        const store = await db("stores").where({ user_id: userId }).first();
        if (store) {
          const baseUrl = normalizeStoreUrl(store.store_URL);
          const variationsUrl = `${baseUrl}/wp-json/wc/v3/products/${product.id}/variations`;
          
          const variationsResponse = await axios.get(variationsUrl, {
            auth: {
              username: store.woocommerce_consumer_key,
              password: store.woocommerce_consumer_secret,
            },
          });

          const variations = variationsResponse.data || [];

          // Save each variation
          for (const variation of variations) {
            productsToInsert.push({
              user_id: userId,
              store_id: storeId,
              product_id: String(product.id),
              name: variation.name || product.name,
              sku: variation.sku || product.sku || null,
              price: convertPriceToInteger(variation.price || product.price),
              tax_status: variation.tax_status || product.tax_status || null,
              variant_id: String(variation.id),
              currency: currency || product.currency || "USD",
              stock_status: variation.stock_status || product.stock_status || null,
              categories: mapCategories(product.categories),
              brand: extractBrand(variation) || extractBrand(product),
            });
          }
        }
      } catch (error) {
        console.error(
          `Error fetching variations for product ${product.id}:`,
          error.message
        );
        // If variations fetch fails, save the parent product
        productsToInsert.push({
          user_id: userId,
          store_id: storeId,
          product_id: String(product.id),
          name: product.name,
          sku: product.sku || null,
          price: convertPriceToInteger(product.price),
          tax_status: product.tax_status || null,
          variant_id: null,
          currency: currency || product.currency || "USD",
          stock_status: product.stock_status || null,
          categories: mapCategories(product.categories),
          brand: extractBrand(product),
        });
      }
    } else {
      // Simple product or non-variable product
      productsToInsert.push({
        user_id: userId,
        store_id: storeId,
        product_id: String(product.id),
        name: product.name,
        sku: product.sku || null,
        price: convertPriceToInteger(product.price),
        tax_status: product.tax_status || null,
        variant_id: null,
        currency: currency || product.currency || "USD",
        stock_status: product.stock_status || null,
        categories: mapCategories(product.categories),
        brand: extractBrand(product),
      });
    }
  }

  // Use upsert (insert with conflict handling) to update existing products
  if (productsToInsert.length > 0) {
    for (const productData of productsToInsert) {
      const existing = await db("woocommerce_products")
        .where({
          store_id: productData.store_id,
          product_id: productData.product_id,
          variant_id: productData.variant_id,
        })
        .first();

      // Prepare data with proper JSONB formatting for categories
      // Use db.raw() to properly cast the JSON string to JSONB type
      let categoriesValue = null;
      if (productData.categories && Array.isArray(productData.categories) && productData.categories.length > 0) {
        try {
          const jsonString = JSON.stringify(productData.categories);
          // Use db.raw() to cast string to JSONB explicitly
          categoriesValue = db.raw('?::jsonb', [jsonString]);
        } catch (err) {
          console.error("Error stringifying categories:", err);
          categoriesValue = null;
        }
      }

      const preparedData = {
        user_id: productData.user_id,
        store_id: productData.store_id,
        product_id: productData.product_id,
        name: productData.name,
        sku: productData.sku,
        price: productData.price,
        tax_status: productData.tax_status,
        variant_id: productData.variant_id,
        currency: productData.currency,
        stock_status: productData.stock_status,
        categories: categoriesValue,
        brand: productData.brand,
      };

      if (existing) {
        // Update existing product
        await db("woocommerce_products")
          .where({ id: existing.id })
          .update({
            ...preparedData,
            updated_at: db.fn.now(),
          });
      } else {
        // Insert new product
        await db("woocommerce_products").insert(preparedData);
      }
    }
  }
}

// Step 3a: Fetch products
exports.getProducts = async (req, res) => {
  try {
    const userId = req.user.id;
    const store = await db("stores").where({ user_id: userId }).first();

    if (
      !store ||
      !store.woocommerce_consumer_key ||
      !store.woocommerce_consumer_secret
    ) {
      return res
        .status(400)
        .json({ message: "WooCommerce store not connected" });
    }

    const baseUrl = normalizeStoreUrl(store.store_URL);
    const url = `${baseUrl}/wp-json/wc/v3/products`;

    const response = await axios.get(url, {
      auth: {
        username: store.woocommerce_consumer_key,
        password: store.woocommerce_consumer_secret,
      },
    });

    const products = response.data;

    // Save products to database
    try {
      await saveProductsToDB(
        products,
        userId,
        store.id,
        store.store_currency
      );
      console.log(`Successfully saved ${products.length} products to database`);
    } catch (dbError) {
      console.error("Error saving products to database:", dbError.message);
      // Continue to return products even if DB save fails
    }

    res.json(products);
  } catch (error) {
    console.error("getProducts error:", error.response?.data || error.message);
    res.status(500).json({ message: "Error fetching WooCommerce products" });
  }
};

// Step 3b: Fetch customers
exports.getCustomers = async (req, res) => {
  try {
    const userId = req.user.id;
    const store = await db("stores").where({ user_id: userId }).first();

    if (
      !store ||
      !store.woocommerce_consumer_key ||
      !store.woocommerce_consumer_secret
    ) {
      return res
        .status(400)
        .json({ message: "WooCommerce store not connected" });
    }

    const baseUrl = normalizeStoreUrl(store.store_URL);
    const url = `${baseUrl}/wp-json/wc/v3/customers`;

    const response = await axios.get(url, {
      auth: {
        username: store.woocommerce_consumer_key,
        password: store.woocommerce_consumer_secret,
      },
    });

    const customers = response.data;

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

    res.json(customers);
  } catch (error) {
    const status = error.response?.status || 500;
    const payload = error.response?.data || {
      message: "Error fetching WooCommerce customers",
    };

    res.status(status).json(payload);
  }
};

// Step 3c: Fetch orders
exports.getOrders = async (req, res) => {
  try {
    const userId = req.user.id;
    const store = await db("stores").where({ user_id: userId }).first();

    if (
      !store ||
      !store.woocommerce_consumer_key ||
      !store.woocommerce_consumer_secret
    ) {
      return res
        .status(400)
        .json({ message: "WooCommerce store not connected" });
    }

    const baseUrl = normalizeStoreUrl(store.store_URL);
    const url = `${baseUrl}/wp-json/wc/v3/orders`;

    const response = await axios.get(url, {
      auth: {
        username: store.woocommerce_consumer_key,
        password: store.woocommerce_consumer_secret,
      },
    });

    const orders = response.data;

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

    res.json(orders);
  } catch (error) {
    const status = error.response?.status || 500;
    const payload = error.response?.data || {
      message: "Error fetching WooCommerce orders",
    };
    res.status(status).json(payload);
  }
};
