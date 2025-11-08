const OAuth = require("oauth-1.0a");
const crypto = require("crypto");
const axios = require("axios");
const { db } = require("../../config/db");

/**
 * Helper: Get store credentials from DB by user ID
 */
const getStoreCredentials = async (userId) => {
  const store = await db("stores")
    .select(
      "id",
      "store_URL",
      "magento_consumer_key",
      "magento_consumer_secret",
      "magento_access_token",
      "magento_access_token_secret"
    )
    .where({ user_id: userId })
    .first();

  if (!store) throw new Error("Store not found for this user");

  return store;
};

/**
 * Helper: Fetch Magento API data dynamically
 */
const fetchMagento = async (store, endpoint) => {
  const oauth = OAuth({
    consumer: {
      key: store.magento_consumer_key,
      secret: store.magento_consumer_secret,
    },
    signature_method: "HMAC-SHA256",
    hash_function(base_string, key) {
      return crypto
        .createHmac("sha256", key)
        .update(base_string)
        .digest("base64");
    },
  });

  const token = {
    key: store.magento_access_token,
    secret: store.magento_access_token_secret,
  };

  const requestData = {
    url: `${store.store_URL}/rest/V1/${endpoint}`,
    method: "GET",
  };

  const headers = oauth.toHeader(oauth.authorize(requestData, token));

  const response = await axios.get(requestData.url, { headers });
  return response.data;
};

// Helper function to format tier_prices array
function formatTierPrices(tierPrices) {
  if (!tierPrices || !Array.isArray(tierPrices)) return null;
  
  const formattedTierPrices = tierPrices.map(tier => ({
    customer_group_id: tier.customer_group_id !== undefined ? tier.customer_group_id : null,
    qty: tier.qty !== undefined ? parseFloat(tier.qty) : null,
    value: tier.value !== undefined ? parseFloat(tier.value) : null,
  })).filter(tier => {
    // Only include tiers that have at least one valid field
    return tier.customer_group_id !== null || tier.qty !== null || tier.value !== null;
  });
  
  return formattedTierPrices.length > 0 ? formattedTierPrices : null;
}

// Helper function to save products to database
async function saveProductsToDB(products, userId, storeId) {
  for (const product of products) {
    try {
      // Format tier_prices
      const tierPricesArray = formatTierPrices(product.tier_prices);
      
      // Prepare tier_prices value for JSONB
      let tierPricesValue = null;
      if (tierPricesArray && tierPricesArray.length > 0) {
        try {
          const jsonString = JSON.stringify(tierPricesArray);
          tierPricesValue = db.raw('?::jsonb', [jsonString]);
        } catch (err) {
          console.error("Error stringifying tier_prices:", err);
          tierPricesValue = null;
        }
      }

      // Parse Magento created_at timestamp
      let magentoCreatedAt = null;
      if (product.created_at) {
        try {
          magentoCreatedAt = new Date(product.created_at);
          if (isNaN(magentoCreatedAt.getTime())) {
            magentoCreatedAt = null;
          }
        } catch (err) {
          console.error("Error parsing created_at:", err);
          magentoCreatedAt = null;
        }
      }

      const productData = {
        user_id: userId,
        store_id: storeId,
        magento_product_id: String(product.id),
        name: product.name || null,
        price: product.price ? parseFloat(product.price) : null,
        sku: product.sku || null,
        magento_created_at: magentoCreatedAt,
        type_id: product.type_id || 'simple',
        tier_prices: tierPricesValue,
        status: product.status !== undefined ? parseInt(product.status) : 1,
        visibility: product.visibility !== undefined ? parseInt(product.visibility) : 4,
      };

      // Check if product already exists
      const existing = await db("magento_products")
        .where({
          store_id: storeId,
          magento_product_id: String(product.id),
        })
        .first();

      if (existing) {
        // Update existing product
        await db("magento_products")
          .where({ id: existing.id })
          .update({
            ...productData,
            updated_at: db.fn.now(),
          });
      } else {
        // Insert new product
        await db("magento_products").insert(productData);
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

// Helper function to format addresses array
function formatAddresses(addresses) {
  if (!addresses || !Array.isArray(addresses)) return null;
  
  const formattedAddresses = addresses.map(address => ({
    id: address.id !== undefined ? String(address.id) : null,
    city: address.city || null,
    country_id: address.country_id || null,
    postcode: address.postcode || null,
    street: Array.isArray(address.street) ? address.street : (address.street ? [address.street] : null),
    telephone: address.telephone || null,
    region: address.region ? {
      region: address.region.region || null,
      region_code: address.region.region_code || null,
      region_id: address.region.region_id !== undefined ? parseInt(address.region.region_id) : null,
    } : null,
  })).filter(addr => {
    // Only include addresses that have at least one valid field
    return addr.id !== null || addr.city !== null || addr.country_id !== null || 
           addr.postcode !== null || addr.street !== null || addr.telephone !== null;
  });
  
  return formattedAddresses.length > 0 ? formattedAddresses : null;
}

// Helper function to save customers to database
async function saveCustomersToDB(customers, userId, storeId) {
  for (const customer of customers) {
    try {
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

      // Parse Magento created_at timestamp
      let magentoCreatedAt = null;
      if (customer.created_at) {
        try {
          magentoCreatedAt = new Date(customer.created_at);
          if (isNaN(magentoCreatedAt.getTime())) {
            magentoCreatedAt = null;
          }
        } catch (err) {
          console.error("Error parsing created_at:", err);
          magentoCreatedAt = null;
        }
      }

      const customerData = {
        user_id: userId,
        store_id: storeId,
        magento_customer_id: String(customer.id),
        first_name: customer.firstname || null,
        last_name: customer.lastname || null,
        email: customer.email || null,
        website_id: customer.website_id !== undefined ? parseInt(customer.website_id) : 1,
        group_id: customer.group_id !== undefined ? parseInt(customer.group_id) : 1,
        is_subscribed: customer.is_subscribed !== undefined ? Boolean(customer.is_subscribed) : true,
        gender: customer.gender !== undefined ? parseInt(customer.gender) : null,
        default_billing: customer.default_billing ? String(customer.default_billing) : null,
        default_shipping: customer.default_shipping ? String(customer.default_shipping) : null,
        magento_created_at: magentoCreatedAt,
        addresses: addressesValue,
      };

      // Check if customer already exists
      const existing = await db("magento_customers")
        .where({
          store_id: storeId,
          magento_customer_id: String(customer.id),
        })
        .first();

      if (existing) {
        // Update existing customer
        await db("magento_customers")
          .where({ id: existing.id })
          .update({
            ...customerData,
            updated_at: db.fn.now(),
          });
      } else {
        // Insert new customer
        await db("magento_customers").insert(customerData);
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

// Helper function to save orders to database
async function saveOrdersToDB(orders, userId, storeId) {
  for (const order of orders) {
    try {
      // Parse Magento timestamps
      let magentoCreatedAt = null;
      if (order.created_at) {
        try {
          magentoCreatedAt = new Date(order.created_at);
          if (isNaN(magentoCreatedAt.getTime())) {
            magentoCreatedAt = null;
          }
        } catch (err) {
          console.error("Error parsing created_at:", err);
          magentoCreatedAt = null;
        }
      }

      let magentoUpdatedAt = null;
      if (order.updated_at) {
        try {
          magentoUpdatedAt = new Date(order.updated_at);
          if (isNaN(magentoUpdatedAt.getTime())) {
            magentoUpdatedAt = null;
          }
        } catch (err) {
          console.error("Error parsing updated_at:", err);
          magentoUpdatedAt = null;
        }
      }

      // Prepare JSONB fields
      let billingAddressValue = null;
      if (order.billing_address) {
        try {
          const jsonString = JSON.stringify(order.billing_address);
          billingAddressValue = db.raw('?::jsonb', [jsonString]);
        } catch (err) {
          console.error("Error stringifying billing_address:", err);
          billingAddressValue = null;
        }
      }

      let shippingAddressValue = null;
      if (order.extension_attributes?.shipping_assignments?.[0]?.shipping?.address) {
        try {
          const jsonString = JSON.stringify(order.extension_attributes.shipping_assignments[0].shipping.address);
          shippingAddressValue = db.raw('?::jsonb', [jsonString]);
        } catch (err) {
          console.error("Error stringifying shipping_address:", err);
          shippingAddressValue = null;
        }
      }

      let paymentValue = null;
      if (order.payment) {
        try {
          const jsonString = JSON.stringify(order.payment);
          paymentValue = db.raw('?::jsonb', [jsonString]);
        } catch (err) {
          console.error("Error stringifying payment:", err);
          paymentValue = null;
        }
      }

      let refundsValue = null;
      // Get refunds from extension_attributes or creditmemos
      if (order.extension_attributes?.creditmemos || order.refunds) {
        try {
          const refunds = order.extension_attributes?.creditmemos || order.refunds;
          const jsonString = JSON.stringify(refunds);
          refundsValue = db.raw('?::jsonb', [jsonString]);
        } catch (err) {
          console.error("Error stringifying refunds:", err);
          refundsValue = null;
        }
      }

      let taxDetailsValue = null;
      if (order.extension_attributes?.applied_taxes || order.tax_details) {
        try {
          const taxDetails = order.extension_attributes?.applied_taxes || order.tax_details;
          const jsonString = JSON.stringify(taxDetails);
          taxDetailsValue = db.raw('?::jsonb', [jsonString]);
        } catch (err) {
          console.error("Error stringifying tax_details:", err);
          taxDetailsValue = null;
        }
      }

      let extensionAttributesValue = null;
      if (order.extension_attributes) {
        try {
          const jsonString = JSON.stringify(order.extension_attributes);
          extensionAttributesValue = db.raw('?::jsonb', [jsonString]);
        } catch (err) {
          console.error("Error stringifying extension_attributes:", err);
          extensionAttributesValue = null;
        }
      }

      let customAttributesValue = null;
      if (order.custom_attributes && Array.isArray(order.custom_attributes)) {
        try {
          const jsonString = JSON.stringify(order.custom_attributes);
          customAttributesValue = db.raw('?::jsonb', [jsonString]);
        } catch (err) {
          console.error("Error stringifying custom_attributes:", err);
          customAttributesValue = null;
        }
      }

      // Calculate total_refunded from credit memos
      let totalRefunded = null;
      if (order.extension_attributes?.creditmemos && Array.isArray(order.extension_attributes.creditmemos)) {
        totalRefunded = order.extension_attributes.creditmemos.reduce((sum, memo) => {
          return sum + (parseFloat(memo.grand_total || 0));
        }, 0);
      } else if (order.total_refunded !== undefined) {
        totalRefunded = parseFloat(order.total_refunded);
      }

      const orderData = {
        user_id: userId,
        store_id: storeId,
        magento_order_id: order.entity_id || order.id,
        increment_id: order.increment_id || null,
        customer_id: order.customer_id !== undefined ? parseInt(order.customer_id) : null,
        customer_firstname: order.customer_firstname || order.billing_address?.firstname || null,
        customer_lastname: order.customer_lastname || order.billing_address?.lastname || null,
        customer_email: order.customer_email || order.billing_address?.email || null,
        grand_total: order.grand_total ? parseFloat(order.grand_total) : null,
        subtotal: order.subtotal ? parseFloat(order.subtotal) : null,
        shipping_amount: order.shipping_amount ? parseFloat(order.shipping_amount) : null,
        discount_amount: order.discount_amount ? parseFloat(order.discount_amount) : null,
        tax_amount: order.tax_amount ? parseFloat(order.tax_amount) : null,
        total_refunded: totalRefunded !== null ? totalRefunded : null,
        status: order.status || null,
        state: order.state || null,
        currency_code: order.order_currency_code || order.currency_code || null,
        magento_created_at: magentoCreatedAt,
        magento_updated_at: magentoUpdatedAt,
        billing_address: billingAddressValue,
        shipping_address: shippingAddressValue,
        payment: paymentValue,
        refunds: refundsValue,
        tax_details: taxDetailsValue,
        extension_attributes: extensionAttributesValue,
        custom_attributes: customAttributesValue,
      };

      // Check if order already exists
      const existing = await db("magento_orders")
        .where({
          store_id: storeId,
          magento_order_id: order.entity_id || order.id,
        })
        .first();

      if (existing) {
        // Update existing order
        await db("magento_orders")
          .where({ id: existing.id })
          .update({
            ...orderData,
            updated_at: db.fn.now(),
          });
      } else {
        // Insert new order
        await db("magento_orders").insert(orderData);
      }
    } catch (error) {
      console.error(
        `Error saving order ${order.entity_id || order.id}:`,
        error.message
      );
      // Continue with next order
    }
  }
}

/**
 * Controller: Get Products
 */
exports.getProducts = async (req, res) => {
  try {
    const store = await getStoreCredentials(req.user.id);
    const data = await fetchMagento(
      store,
      "products?searchCriteria[pageSize]=10"
    );
    
    const products = data.items || [];

    // Save products to database
    try {
      await saveProductsToDB(
        products,
        req.user.id,
        store.id
      );
      console.log(`Successfully saved ${products.length} products to database`);
    } catch (dbError) {
      console.error("Error saving products to database:", dbError.message);
      // Continue to return products even if DB save fails
    }
    
    res.json(data);
  } catch (err) {
    console.error("getProducts error:", err.response?.data || err.message);
    res.status(500).json({ error: "Error fetching products" });
  }
};

/**
 * Controller: Get Customers - Fetches new customers from Magento and returns all from database
 */
exports.getCustomers = async (req, res) => {
  try {
    const store = await getStoreCredentials(req.user.id);
    
    // Get the latest customer from database to determine what's new
    const latestCustomer = await db("magento_customers")
      .where({ store_id: store.id })
      .orderBy("magento_created_at", "desc")
      .orderBy("magento_customer_id", "desc")
      .first();

    let newCustomersCount = 0;
    const newCustomers = [];

    // Only fetch new customers if we have existing customers in the database
    if (latestCustomer && latestCustomer.magento_created_at) {
      // Fetch customers created after the latest customer date
      const latestDate = new Date(latestCustomer.magento_created_at);
      // Add 1 second to avoid fetching the same customer
      latestDate.setSeconds(latestDate.getSeconds() + 1);
      
      // Format date for Magento API (YYYY-MM-DD HH:mm:ss)
      const dateFilter = latestDate.toISOString().slice(0, 19).replace('T', ' ');
      
      console.log(`Fetching new customers created after: ${dateFilter}`);

      let currentPage = 1;
      const pageSize = 900;
      let hasMore = true;

      while (hasMore) {
        // URL encode the date filter value
        const encodedDateFilter = encodeURIComponent(dateFilter);
        const endpoint = `customers/search?searchCriteria[filterGroups][0][filters][0][field]=created_at&searchCriteria[filterGroups][0][filters][0][value]=${encodedDateFilter}&searchCriteria[filterGroups][0][filters][0][conditionType]=gt&searchCriteria[currentPage]=${currentPage}&searchCriteria[pageSize]=${pageSize}`;
        const data = await fetchMagento(store, endpoint);
        const items = data.items || [];

        if (items.length > 0) {
          newCustomers.push(...items);
          newCustomersCount += items.length;
          console.log(`Fetched page ${currentPage} with ${items.length} new customers (Total: ${newCustomersCount})`);
        }

        hasMore = items.length === pageSize;
        currentPage++;

        // Optional: small delay to prevent server overload
        if (hasMore) {
          await new Promise((r) => setTimeout(r, 200));
        }
      }

      // Save new customers to database
      if (newCustomers.length > 0) {
        try {
          await saveCustomersToDB(newCustomers, req.user.id, store.id);
          console.log(`Successfully saved ${newCustomersCount} new customers to database`);
        } catch (dbError) {
          console.error("Error saving new customers to database:", dbError.message);
        }
      } else {
        console.log("No new customers found");
      }
    } else {
      // No existing customers, fetch all customers (first time sync)
      console.log("No existing customers found, fetching all customers for first sync");
      let currentPage = 1;
      const pageSize = 900;
      let hasMore = true;

      while (hasMore) {
        const endpoint = `customers/search?searchCriteria[currentPage]=${currentPage}&searchCriteria[pageSize]=${pageSize}`;
        const data = await fetchMagento(store, endpoint);
        const items = data.items || [];

        if (items.length > 0) {
          newCustomers.push(...items);
          newCustomersCount += items.length;
          console.log(`Fetched page ${currentPage} with ${items.length} customers (Total: ${newCustomersCount})`);
        }

        hasMore = items.length === pageSize;
        currentPage++;

        // Optional: small delay to prevent server overload
        if (hasMore) {
          await new Promise((r) => setTimeout(r, 200));
        }
      }

      // Save all customers to database
      if (newCustomers.length > 0) {
        try {
          await saveCustomersToDB(newCustomers, req.user.id, store.id);
          console.log(`Successfully saved ${newCustomersCount} customers to database`);
        } catch (dbError) {
          console.error("Error saving customers to database:", dbError.message);
        }
      }
    }

    // Fetch all customers from database (not from API response to avoid large payloads)
    const dbCustomers = await db("magento_customers")
      .where({ store_id: store.id })
      .orderBy("magento_created_at", "desc")
      .select(
        "magento_customer_id as id",
        "first_name as firstname",
        "last_name as lastname",
        "email",
        "magento_created_at as created_at",
        "addresses",
        "website_id",
        "group_id",
        "is_subscribed",
        "gender",
        "default_billing",
        "default_shipping"
      );

    // Format customers for frontend (convert JSONB fields back to objects)
    const formattedCustomers = dbCustomers.map(customer => ({
      ...customer,
      addresses: customer.addresses || null,
    }));

    res.json({
      items: formattedCustomers,
      total_count: formattedCustomers.length
    });

    console.log(`Returned ${formattedCustomers.length} customers from database (${newCustomersCount} new customers fetched)`);
  } catch (err) {
    console.error("getCustomers error:", err.response?.data || err.message);
    res.status(500).json({ error: "Error fetching customers" });
  }
};

/**
 * Helper: Format order from database for frontend
 */
function formatOrderFromDB(order) {
  // Parse refunds from JSONB
  let refunds = null;
  if (order.refunds) {
    try {
      const refundsData = typeof order.refunds === 'string' 
        ? JSON.parse(order.refunds) 
        : order.refunds;
      
      if (Array.isArray(refundsData)) {
        refunds = refundsData.map((refund) => ({
          id: refund.id || refund.entity_id,
          subtotal: String(refund.subtotal || 0),
          shipping_amount: String(refund.shipping_amount || 0),
          tax_amount: String(refund.tax_amount || 0),
        }));
      }
    } catch (err) {
      console.error("Error parsing refunds:", err);
    }
  }

  return {
    id: order.id,
    increment_id: order.increment_id || null,
    subtotal: order.subtotal ? String(order.subtotal) : null,
    grand_total: order.grand_total ? String(order.grand_total) : null,
    discount_amount: order.discount_amount ? String(order.discount_amount) : null,
    tax_amount: order.tax_amount ? String(order.tax_amount) : null,
    shipping_amount: order.shipping_amount ? String(order.shipping_amount) : null,
    state: order.state || null,
    created_at: order.created_at || null,
    refunds: refunds,
  };
}

/**
 * Controller: Get Orders - Loads from database first, then fetches new orders from Magento if needed
 */
exports.getAllOrders = async (req, res) => {
  try {
    const store = await getStoreCredentials(req.user.id);
    
    // Get pagination parameters from query string
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 500;
    const source = req.query.source || 'auto'; // 'db', 'api', or 'auto'
    const continueOnEmpty = req.query.continueOnEmpty === 'true'; // Continue fetching even if page is empty
    
    // Get total count of orders in database for this store
    const totalCountResult = await db("magento_orders")
      .where({ store_id: store.id })
      .count("* as count")
      .first();
    const totalCount = parseInt(totalCountResult?.count || 0);

    // If source is 'db', always return orders from database
    if (source === 'db' && totalCount > 0) {
      const dbOrders = await db("magento_orders")
        .where({ store_id: store.id })
        .orderBy("magento_created_at", "desc")
        .limit(pageSize)
        .offset((page - 1) * pageSize)
        .select(
          "magento_order_id as id",
          "increment_id",
          "subtotal",
          "grand_total",
          "discount_amount",
          "tax_amount",
          "shipping_amount",
          "state",
          "magento_created_at as created_at",
          "refunds"
        );

      const formattedOrders = dbOrders.map(formatOrderFromDB);
      const totalPages = Math.ceil(totalCount / pageSize);
      const hasMore = page < totalPages;

      console.log(`Returned page ${page} with ${formattedOrders.length} orders from database (has_more: ${hasMore})`);

      return res.json({
        items: formattedOrders,
        page: page,
        pageSize: pageSize,
        total_count: totalCount,
        has_more: hasMore,
        source: 'database'
      });
    }

    // If source is 'auto' and we have orders in DB, check if there are new orders first
    if (source === 'auto' && totalCount > 0) {
      const latestOrder = await db("magento_orders")
        .where({ store_id: store.id })
        .orderBy("magento_created_at", "desc")
        .orderBy("magento_order_id", "desc")
        .first();

      if (latestOrder && latestOrder.magento_created_at) {
        // Check if there are new orders in Magento (fetch just 1 order to check)
        try {
          const latestDate = new Date(latestOrder.magento_created_at);
          latestDate.setSeconds(latestDate.getSeconds() + 1);
          const dateFilter = latestDate.toISOString().slice(0, 19).replace('T', ' ');
          const encodedDateFilter = encodeURIComponent(dateFilter);
          const checkEndpoint = `orders?searchCriteria[filterGroups][0][filters][0][field]=created_at&searchCriteria[filterGroups][0][filters][0][value]=${encodedDateFilter}&searchCriteria[filterGroups][0][filters][0][conditionType]=gt&searchCriteria[currentPage]=1&searchCriteria[pageSize]=1`;
          const checkData = await fetchMagento(store, checkEndpoint);
          const hasNewOrders = checkData.items && checkData.items.length > 0;
          
          if (!hasNewOrders) {
            // No new orders, return from database
            console.log(`Auto mode: No new orders found, returning from database (${totalCount} orders in DB)`);
            const dbOrders = await db("magento_orders")
              .where({ store_id: store.id })
              .orderBy("magento_created_at", "desc")
              .limit(pageSize)
              .offset((page - 1) * pageSize)
              .select(
                "magento_order_id as id",
                "increment_id",
                "subtotal",
                "grand_total",
                "discount_amount",
                "tax_amount",
                "shipping_amount",
                "state",
                "magento_created_at as created_at",
                "refunds"
              );

            const formattedOrders = dbOrders.map(formatOrderFromDB);
            const totalPages = Math.ceil(totalCount / pageSize);
            const hasMore = page < totalPages;

            return res.json({
              items: formattedOrders,
              page: page,
              pageSize: pageSize,
              total_count: totalCount,
              has_more: hasMore,
              source: 'database'
            });
          }
          // If hasNewOrders, continue to fetch new orders from API (will be handled below)
          console.log(`Auto mode: New orders detected, will fetch from API`);
        } catch (err) {
          console.error("Error checking for new orders:", err.message);
          // If check fails, return from database to avoid unnecessary API calls
          const dbOrders = await db("magento_orders")
            .where({ store_id: store.id })
            .orderBy("magento_created_at", "desc")
            .limit(pageSize)
            .offset((page - 1) * pageSize)
            .select(
              "magento_order_id as id",
              "increment_id",
              "subtotal",
              "grand_total",
              "discount_amount",
              "tax_amount",
              "shipping_amount",
              "state",
              "magento_created_at as created_at",
              "refunds"
            );

          const formattedOrders = dbOrders.map(formatOrderFromDB);
          const totalPages = Math.ceil(totalCount / pageSize);
          const hasMore = page < totalPages;

          return res.json({
            items: formattedOrders,
            page: page,
            pageSize: pageSize,
            total_count: totalCount,
            has_more: hasMore,
            source: 'database'
          });
        }
      }
    }

    // Fetch from Magento API - Only fetch NEW orders if orders exist in DB
    // If no orders in DB, fetch all orders (initial sync)
    let endpoint = '';
    
    // Get the latest order from database to determine what's new
    const latestOrderForFetch = await db("magento_orders")
      .where({ store_id: store.id })
      .orderBy("magento_created_at", "desc")
      .orderBy("magento_order_id", "desc")
      .first();

    if (latestOrderForFetch && latestOrderForFetch.magento_created_at && (source === 'api' || source === 'auto')) {
      // When source is 'api' or 'auto' (and new orders detected), fetch only NEW orders (created after the latest order in database)
      const latestDate = new Date(latestOrderForFetch.magento_created_at);
      latestDate.setSeconds(latestDate.getSeconds() + 1);
      const dateFilter = latestDate.toISOString().slice(0, 19).replace('T', ' ');
      const encodedDateFilter = encodeURIComponent(dateFilter);
      
      console.log(`Fetching page ${page} of NEW orders from Magento API (created after: ${dateFilter})`);
      
      endpoint = `orders?searchCriteria[filterGroups][0][filters][0][field]=created_at&searchCriteria[filterGroups][0][filters][0][value]=${encodedDateFilter}&searchCriteria[filterGroups][0][filters][0][conditionType]=gt&searchCriteria[currentPage]=${page}&searchCriteria[pageSize]=${pageSize}`;
    } else {
      // If no orders in DB, fetch all orders (initial sync)
      console.log(`Fetching page ${page} from Magento API (initial sync, pageSize: ${pageSize})`);
      endpoint = `orders?searchCriteria[currentPage]=${page}&searchCriteria[pageSize]=${pageSize}`;
    }

    const data = await fetchMagento(store, endpoint);
    const items = data.items || [];

    if (items.length > 0) {
      newOrders = items;
      // Continue fetching if we got a full page (might be more pages)
      hasMoreFromMagento = items.length === pageSize;
      console.log(`Fetched page ${page} with ${items.length} orders from Magento`);
    } else {
      // If page is empty and continueOnEmpty is true, continue fetching to handle data gaps
      // Continue up to page 200 (100k orders max) to ensure we get all orders
      // This handles cases where there might be gaps in the order data
      if (continueOnEmpty && page < 200) {
        hasMoreFromMagento = true;
        console.log(`No orders found on page ${page} - continuing to next page (up to page 200) to ensure all orders are fetched`);
      } else {
        hasMoreFromMagento = false;
        console.log(`No orders found on page ${page} - stopping fetch (${continueOnEmpty ? 'reached max page limit' : 'continueOnEmpty not set'})`);
      }
    }

    // Save new orders to database (saveOrdersToDB handles upserts)
    if (newOrders.length > 0) {
      try {
        console.log(`Attempting to save ${newOrders.length} orders to database...`);
        await saveOrdersToDB(newOrders, req.user.id, store.id);
        console.log(`✓ Successfully saved ${newOrders.length} orders to database`);
        
        // Verify the save by checking the count
        const verifyCount = await db("magento_orders")
          .where({ store_id: store.id })
          .count("* as count")
          .first();
        console.log(`Database now contains ${verifyCount?.count || 0} total orders`);
      } catch (dbError) {
        console.error("✗ Error saving new orders to database:", dbError.message);
        console.error("DB Error stack:", dbError.stack);
        // Don't throw - continue to return the orders to frontend even if save fails
        // This allows the frontend to show the orders, but they won't persist
      }
    } else {
      console.log(`No new orders to save for page ${page}`);
    }

    // Format the orders we just fetched from Magento for frontend
    const formattedOrders = newOrders.map(order => {
      // Extract refunds from extension_attributes or order.refunds
      let refunds = null;
      if (order.extension_attributes?.creditmemos) {
        refunds = order.extension_attributes.creditmemos.map((memo) => ({
          id: memo.entity_id || memo.id,
          subtotal: String(memo.subtotal || 0),
          shipping_amount: String(memo.shipping_amount || 0),
          tax_amount: String(memo.tax_amount || 0),
        }));
      } else if (order.refunds && Array.isArray(order.refunds)) {
        refunds = order.refunds.map((refund) => ({
          id: refund.id,
          subtotal: String(refund.subtotal || 0),
          shipping_amount: String(refund.shipping_amount || 0),
          tax_amount: String(refund.tax_amount || 0),
        }));
      }

      return {
        id: order.entity_id || order.id,
        increment_id: order.increment_id || null,
        subtotal: order.subtotal ? String(order.subtotal) : null,
        grand_total: order.grand_total ? String(order.grand_total) : null,
        discount_amount: order.discount_amount ? String(order.discount_amount) : null,
        tax_amount: order.tax_amount ? String(order.tax_amount) : null,
        shipping_amount: order.shipping_amount ? String(order.shipping_amount) : null,
        state: order.state || null,
        created_at: order.created_at || null,
        refunds: refunds,
      };
    });

    // Get updated total count after saving
    const updatedTotalCountResult = await db("magento_orders")
      .where({ store_id: store.id })
      .count("* as count")
      .first();
    const updatedTotalCount = parseInt(updatedTotalCountResult?.count || 0);

    res.json({
      items: formattedOrders,
      page: page,
      pageSize: pageSize,
      total_count: updatedTotalCount,
      has_more: hasMoreFromMagento,
      source: 'api'
    });

    console.log(`Returned page ${page} with ${formattedOrders.length} orders from API (has_more: ${hasMoreFromMagento})`);
  } catch (err) {
    console.error("getAllOrders error:", err.response?.data || err.message);
    res.status(500).json({ error: "Error fetching orders" });
  }
};
