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
 * Helper: Format Magento API order for frontend response
 */
function formatMagentoApiOrder(order) {
  if (!order || typeof order !== "object") {
    return null;
  }

  const refundsSource =
    order.extension_attributes?.creditmemos || order.refunds || [];

  let refunds = null;
  if (Array.isArray(refundsSource) && refundsSource.length > 0) {
    refunds = refundsSource.map((refund) => ({
      id: refund.id || refund.entity_id || null,
      subtotal: refund.subtotal !== undefined
        ? String(refund.subtotal)
        : refund.base_subtotal !== undefined
        ? String(refund.base_subtotal)
        : "0",
      shipping_amount: refund.shipping_amount !== undefined
        ? String(refund.shipping_amount)
        : refund.base_shipping_amount !== undefined
        ? String(refund.base_shipping_amount)
        : "0",
      tax_amount: refund.tax_amount !== undefined
        ? String(refund.tax_amount)
        : refund.base_tax_amount !== undefined
        ? String(refund.base_tax_amount)
        : "0",
    }));
  }

  return {
    id: order.entity_id || order.id || null,
    increment_id: order.increment_id || null,
    subtotal:
      order.subtotal !== undefined
        ? String(order.subtotal)
        : order.base_subtotal !== undefined
        ? String(order.base_subtotal)
        : null,
    grand_total:
      order.grand_total !== undefined
        ? String(order.grand_total)
        : order.base_grand_total !== undefined
        ? String(order.base_grand_total)
        : null,
    discount_amount:
      order.discount_amount !== undefined
        ? String(order.discount_amount)
        : order.base_discount_amount !== undefined
        ? String(order.base_discount_amount)
        : null,
    tax_amount:
      order.tax_amount !== undefined
        ? String(order.tax_amount)
        : order.base_tax_amount !== undefined
        ? String(order.base_tax_amount)
        : null,
    shipping_amount:
      order.shipping_amount !== undefined
        ? String(order.shipping_amount)
        : order.base_shipping_amount !== undefined
        ? String(order.base_shipping_amount)
        : null,
    state: order.state || null,
    created_at: order.created_at || null,
    refunds,
  };
}

function formatDateForMagento(date) {
  if (!date) return null;
  const d = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString().slice(0, 19).replace('T', ' ');
}

async function syncAllMagentoOrders({ store, userId, pageSize = 200 }) {
  let currentPage = 1;
  let totalFetched = 0;

  while (true) {
    const endpoint = `orders?searchCriteria[currentPage]=${currentPage}&searchCriteria[pageSize]=${pageSize}`;
    const data = await fetchMagento(store, endpoint);
    const items = Array.isArray(data?.items) ? data.items : [];

    if (!items.length) {
      break;
    }

    await saveOrdersToDB(items, userId, store.id);
    totalFetched += items.length;

    console.log(
      `[Magento Sync] Batch ${currentPage}: ${totalFetched} orders stored so far`
    );

    if (items.length < pageSize) {
      break;
    }

    currentPage += 1;
  }

  console.log(
    `[Magento Sync] Full sync complete for store ${store.store_URL}. Total fetched=${totalFetched}`
  );

  return totalFetched;
}

async function syncNewMagentoOrders({ store, userId, pageSize = 200, createdAfter }) {
  const formattedDate = formatDateForMagento(createdAfter);
  if (!formattedDate) {
    return 0;
  }

  console.log(
    `[Magento Sync] Checking for new orders created after ${formattedDate} (pageSize=${pageSize})`
  );

  let currentPage = 1;
  let totalFetched = 0;

  while (true) {
    const encodedDate = encodeURIComponent(formattedDate);
    const endpoint = `orders?searchCriteria[currentPage]=${currentPage}&searchCriteria[pageSize]=${pageSize}&searchCriteria[filterGroups][0][filters][0][field]=created_at&searchCriteria[filterGroups][0][filters][0][value]=${encodedDate}&searchCriteria[filterGroups][0][filters][0][conditionType]=gt&searchCriteria[sortOrders][0][field]=created_at&searchCriteria[sortOrders][0][direction]=ASC`;

    const data = await fetchMagento(store, endpoint);
    const items = Array.isArray(data?.items) ? data.items : [];

    if (!items.length) {
      break;
    }

    await saveOrdersToDB(items, userId, store.id);
    totalFetched += items.length;

    console.log(
      `[Magento Sync] Incremental batch ${currentPage}: ${totalFetched} new orders stored so far`
    );

    if (items.length < pageSize) {
      break;
    }

    currentPage += 1;
  }

  console.log(
    `[Magento Sync] Incremental sync complete. Total new orders fetched=${totalFetched}`
  );

  return totalFetched;
}

/**
 * Controller: Get Orders - Loads from database first, then fetches new orders from Magento if needed
 */
exports.getAllOrders = async (req, res) => {
  try {
    const store = await getStoreCredentials(req.user.id);
    
    // Get pagination parameters from query string
    const rawPage = parseInt(req.query.page, 10);
    const rawPageSize = req.query.pageSize;
    const returnAll =
      !rawPageSize || rawPageSize === 'all' || Number.isNaN(parseInt(rawPageSize, 10));
    const page =
      !returnAll && rawPage && rawPage > 0
        ? rawPage
        : 1;
    const parsedPageSize = parseInt(rawPageSize, 10);
    const pageSize = returnAll || Number.isNaN(parsedPageSize) ? undefined : parsedPageSize;
    const source = req.query.source || 'auto'; // 'db', 'api', or 'auto'
    const forceFullSync = req.query.forceFullSync === 'true';
    const syncPageSize = Math.min(pageSize || 500, 500); // keep API page size reasonable
    let fetchedFromApi = false;

    if (source === 'api') {
      const apiPageSize = Math.min(parseInt(req.query.pageSize, 10) || 500, 500);
      const pageToFetch = rawPage && rawPage > 0 ? rawPage : 1;
      const createdAfterParam = req.query.createdAfter;
      const sortDirection = createdAfterParam ? 'ASC' : 'DESC';

      let endpoint = `orders?searchCriteria[currentPage]=${pageToFetch}&searchCriteria[pageSize]=${apiPageSize}&searchCriteria[sortOrders][0][field]=created_at&searchCriteria[sortOrders][0][direction]=${sortDirection}`;

      if (createdAfterParam) {
        const encodedDate = encodeURIComponent(createdAfterParam);
        endpoint += `&searchCriteria[filterGroups][0][filters][0][field]=created_at&searchCriteria[filterGroups][0][filters][0][value]=${encodedDate}&searchCriteria[filterGroups][0][filters][0][conditionType]=gt`;
      }

      const data = await fetchMagento(store, endpoint);
      const items = Array.isArray(data?.items) ? data.items : [];

      if (items.length > 0) {
        await saveOrdersToDB(items, req.user.id, store.id);
      }

      const formattedOrders = items
        .map(formatMagentoApiOrder)
        .filter(Boolean);
      const hasMore = items.length === apiPageSize;
      const totalCount =
        typeof data?.total_count === 'number'
          ? data.total_count
          : formattedOrders.length;

      return res.json({
        items: formattedOrders,
        page: pageToFetch,
        pageSize: apiPageSize,
        total_count: totalCount,
        has_more: hasMore,
        source: 'api',
        created_after: createdAfterParam || null,
      });
    }

    const countRow = await db("magento_orders")
      .where({ store_id: store.id })
      .count("* as count")
      .first();
    let localCount = parseInt(countRow?.count || 0, 10);

    // initial full sync if needed
    if (forceFullSync || localCount === 0) {
      const fetched = await syncAllMagentoOrders({
        store,
        userId: req.user.id,
        pageSize: syncPageSize,
      });
      if (fetched > 0) {
        fetchedFromApi = true;
      }
      const updatedCount = await db("magento_orders")
        .where({ store_id: store.id })
        .count("* as count")
        .first();
      localCount = parseInt(updatedCount?.count || 0, 10);
      console.log(
        `[Magento Sync] Database now holds ${localCount} total orders after full sync`
      );
    }

    // sync new orders (created after latest stored)
    const latestOrder = await db("magento_orders")
      .where({ store_id: store.id })
      .orderBy("magento_created_at", "desc")
      .first();

    if (latestOrder && !forceFullSync) {
      const fetched = await syncNewMagentoOrders({
        store,
        userId: req.user.id,
        pageSize: syncPageSize,
        createdAfter: latestOrder.magento_created_at,
      });
      if (fetched > 0) {
        fetchedFromApi = true;
        const updatedCount = await db("magento_orders")
          .where({ store_id: store.id })
          .count("* as count")
          .first();
        localCount = parseInt(updatedCount?.count || 0, 10);
        console.log(
          `[Magento Sync] Database updated to ${localCount} total orders after incremental sync (newly fetched=${fetched})`
        );
      } else {
        console.log("[Magento Sync] No new orders found during incremental sync.");
      }
    }

    // If source=db requested, return without triggering additional sync
    if (source === 'db' && !forceFullSync && localCount > 0) {
      let dbQuery = db("magento_orders")
        .where({ store_id: store.id })
        .orderBy("magento_created_at", "desc");

      if (!returnAll && pageSize) {
        dbQuery = dbQuery.limit(pageSize).offset((page - 1) * pageSize);
      }

      const dbOrders = await dbQuery.select(
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
      const hasMore = !returnAll && pageSize ? localCount > page * pageSize : false;

      return res.json({
        items: formattedOrders,
        page,
        pageSize: pageSize || localCount,
        total_count: localCount,
        has_more: hasMore,
        source: 'database',
      });
    }

    // Fetch requested page from DB for response
    let dbQuery = db("magento_orders")
      .where({ store_id: store.id })
      .orderBy("magento_created_at", "desc");

    if (!returnAll && pageSize) {
      dbQuery = dbQuery.limit(pageSize).offset((page - 1) * pageSize);
    }

    const dbOrders = await dbQuery.select(
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
    const hasMore = !returnAll && pageSize ? localCount > page * pageSize : false;

    console.log(
      `[Magento Orders] Responding with ${formattedOrders.length} orders (total stored=${localCount})`
    );

    res.json({
      items: formattedOrders,
      page,
      pageSize: pageSize || localCount,
      total_count: localCount,
      has_more: hasMore,
      source: fetchedFromApi ? 'api' : 'database',
    });
  } catch (err) {
    console.error("getAllOrders error:", err.response?.data || err.message);
    res.status(500).json({ error: "Error fetching orders" });
  }
};
