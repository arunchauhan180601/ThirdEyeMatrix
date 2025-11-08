"use client";
import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";

// Type definitions
interface ShopifyProduct {
  id: string;
  title: string;
  variants: { price: string }[];
}

interface ShopifyCustomer {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
}

interface ShopifyRefund {
  id: string;
  created_at: string;
  note?: string;
  restock?: boolean;
  refund_line_items?: {
    id: string;
    quantity: number;
    line_item?: {
      id: string;
      title: string;
      price: string;
      quantity: number;
      sku?: string;
    };
  }[];
}

interface ShopifyOrder {
  id: string;
  name: string;
  total_price: string;
  total_discounts: string;
  total_tax: string;
  confirmed: boolean;
  status: string;
  financial_status: string;
  created_at: string;
  refunds?: ShopifyRefund[];
  total_shipping_price_set?: {
    shop_money?: {
      amount: string;
      currency_code: string;
    };
    presentment_money?: {
      amount: string;
      currency_code: string;
    };
  };
}

interface WooProduct {
  id: number;
  name: string;
  price: string;
}

interface WooBillingAddress {
  first_name?: string;
  last_name?: string;
  company?: string;
  address_1?: string;
  address_2?: string;
  city?: string;
  state?: string;
  postcode?: string;
  country?: string;
  email?: string;
  phone?: string;
}

interface WooShippingAddress {
  first_name?: string;
  last_name?: string;
  company?: string;
  address_1?: string;
  address_2?: string;
  city?: string;
  state?: string;
  postcode?: string;
  country?: string;
  phone?: string;
}

interface WooCustomer {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  billing?: WooBillingAddress[];
  shipping?: WooShippingAddress[];
}

interface WooFeeLine {
  id: number;
  name: string;
  amount: string;
  total?: string;
  tax_class?: string;
  tax_status?: string;
}

interface WooLineItem {
  id: number;
  name: string;
  product_id: number;
  quantity: number;
  subtotal: string;
  total: string;
  tax?: string;
  [key: string]: any;
}

interface WooRefund {
  id: number;
  total: string;
  refund_tax?: string;
}

interface WooOrder {
  id: number;
  number: string;
  subtotal: string;
  total_tax?: string;
  status: string;
  fee_lines: WooFeeLine[];
  shipping_total: string;
  line_items: WooLineItem[];
  discount_total: string;
  date_created: string;
  refunds?: WooRefund[];
}

interface MagentoProduct {
  id: number;
  name: string;
  sku: string;
  price: number;
}

interface MagentoCustomer {
  id: number;
  firstname: string;
  lastname: string;
  email: string;
}

interface MagentoRefund {
  id: number;
  subtotal: string;
  shipping_amount: string;
  tax_amount: string;
}

interface MagentoOrder {
  id: number;
  increment_id: string;
  subtotal: string;
  grand_total: string;
  discount_amount: string;
  tax_amount: string;
  shipping_amount: string;
  state: string;
  created_at: string;
  refunds?: MagentoRefund[];
}

type Platform = "Shopify" | "Woocommerce" | "Magento" | null;

interface DashboardData {
  shopify: {
    products: ShopifyProduct[];
    customers: ShopifyCustomer[];
    orders: ShopifyOrder[];
  };
  woocommerce: {
    products: WooProduct[];
    customers: WooCustomer[];
    orders: WooOrder[];
  };
  magento: {
    products: MagentoProduct[];
    customers: MagentoCustomer[];
    orders: MagentoOrder[];
  };
}

interface MagentoPaginationState {
  currentPage: number;
  hasMore: boolean;
  isLoadingPage: boolean;
  totalCount: number;
}

interface DashboardContextType {
  platform: Platform;
  storeCurrency: string;
  data: DashboardData;
  metaSpend: number;
  isLoading: boolean;
  magentoPagination: MagentoPaginationState;
  setPlatform: (platform: Platform) => void;
  setStoreCurrency: (currency: string) => void;
  setData: (data: DashboardData) => void;
  setMetaSpend: (spend: number) => void;
  refreshData: () => Promise<void>;
  fetchMagentoOrdersPage: (page: number) => Promise<void>;
}

const DashboardContext = createContext<DashboardContextType | null>(null);

export function useDashboard() {
  const context = useContext(DashboardContext);
  if (!context) {
    throw new Error("useDashboard must be used within a DashboardProvider");
  }
  return context;
}

interface DashboardProviderProps {
  children: ReactNode;
}

export function DashboardProvider({ children }: DashboardProviderProps) {
  const [platform, setPlatform] = useState<Platform>(null);
  const [storeCurrency, setStoreCurrency] = useState<string>("INR");
  const [data, setData] = useState<DashboardData>({
    shopify: {
      products: [],
      customers: [],
      orders: [],
    },
    woocommerce: {
      products: [],
      customers: [],
      orders: [],
    },
    magento: {
      products: [],
      customers: [],
      orders: [],
    },
  });
  const [metaSpend, setMetaSpend] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [magentoPagination, setMagentoPagination] = useState<MagentoPaginationState>({
    currentPage: 0,
    hasMore: true,
    isLoadingPage: false,
    totalCount: 0,
  });

  const fetchData = async <T,>(
    url: string,
    token: string | null
  ): Promise<T[]> => {
    try {
      const res = await fetch(url, {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          "Content-Type": "application/json",
        },
      });
      if (!res.ok) return [];
      const body = await res.json();
      return Array.isArray(body)
        ? body
        : body.items || body.products || body.customers || body.orders || [];
    } catch (err) {
      console.error(err);
      return [];
    }
  };

  // Load all existing orders from database
  const loadAllOrdersFromDatabase = async (token: string) => {
    try {
      let allOrders: MagentoOrder[] = [];
      let currentPage = 1;
      let hasMore = true;

      while (hasMore) {
        const res = await fetch(
          `http://localhost:5000/api/magento/orders?page=${currentPage}&pageSize=500&source=db`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (!res.ok) {
          throw new Error("Failed to fetch orders from database");
        }

        const body = await res.json();
        const orders: MagentoOrder[] = body.items || [];
        hasMore = body.has_more || false;
        const totalCount = body.total_count || 0;

        if (orders.length > 0) {
          allOrders = [...allOrders, ...orders];
          console.log(`Loaded page ${currentPage} from database: ${orders.length} orders (Total: ${allOrders.length})`);
        }

        if (hasMore) {
          currentPage++;
        }
      }

      if (allOrders.length > 0) {
        setData((prev) => ({
          ...prev,
          magento: {
            ...prev.magento,
            orders: allOrders,
          },
        }));

        // Set pagination state to indicate we've loaded from DB (currentPage = 0 means no API fetching)
        setMagentoPagination({
          currentPage: 0, // 0 means loaded from DB, not fetching from API
          hasMore: false,
          isLoadingPage: false,
          totalCount: allOrders.length,
        });

        console.log(`Loaded ${allOrders.length} orders from database`);
      }
    } catch (error) {
      console.error("Error loading orders from database:", error);
    }
  };

  // Fetch new orders from API (only if there are new orders)
  const fetchNewOrdersFromAPI = async (token: string) => {
    try {
      // Check if there are new orders by fetching page 1 with auto source
      // Don't use continueOnEmpty here - we only want to check for new orders
      const checkRes = await fetch(
        `http://localhost:5000/api/magento/orders?page=1&pageSize=500&source=auto`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!checkRes.ok) {
        throw new Error("Failed to check for new orders");
      }

      const checkBody = await checkRes.json();
      
      // If source is 'database', no new orders to fetch
      if (checkBody.source === 'database') {
        console.log("No new orders to fetch, all orders loaded from database");
        setMagentoPagination((prev) => ({
          ...prev,
          currentPage: 0, // Keep at 0 to indicate no API fetching
          hasMore: false,
          isLoadingPage: false,
        }));
        return;
      }

      // If source is 'api', there are new orders - start fetching them
      if (checkBody.source === 'api') {
        console.log("New orders detected, starting to fetch from API");
        const orders: MagentoOrder[] = checkBody.items || [];
        const hasMore = checkBody.has_more || false;
        const totalCount = checkBody.total_count || 0;

        // Add new orders to existing ones
        setData((prev) => ({
          ...prev,
          magento: {
            ...prev.magento,
            orders: [...prev.magento.orders, ...orders],
          },
        }));

        setMagentoPagination({
          currentPage: 1,
          hasMore,
          isLoadingPage: false,
          totalCount,
        });

        // Continue fetching remaining pages if needed
        if (hasMore) {
          await fetchMagentoOrdersPage(2);
        } else {
          setMagentoPagination((prev) => ({
            ...prev,
            hasMore: false,
          }));
        }
      }
    } catch (error) {
      console.error("Error fetching new orders from API:", error);
    }
  };

  const fetchMagentoOrdersPage = useCallback(async (page: number) => {
    setMagentoPagination((prev) => {
      if (prev.isLoadingPage) return prev; // Prevent concurrent requests
      return { ...prev, isLoadingPage: true };
    });
    
    try {
      const token =
        typeof window !== "undefined"
          ? localStorage.getItem("User_token")
          : null;

      if (!token) {
        setMagentoPagination((prev) => ({ ...prev, isLoadingPage: false }));
        return;
      }

      // When fetching new orders, use source=api which will only fetch NEW orders (not all orders)
      // Don't use continueOnEmpty here since we're only fetching new orders with date filter
      const res = await fetch(
        `http://localhost:5000/api/magento/orders?page=${page}&pageSize=500&source=api`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!res.ok) {
        throw new Error("Failed to fetch orders");
      }

      const body = await res.json();
      const orders: MagentoOrder[] = body.items || [];
      const hasMore = body.has_more || false;
      const totalCount = body.total_count || 0;

      console.log(`Fetched Magento Orders Page ${page} from API:`, orders.length, "orders");

      // Accumulate orders in state
      setData((prev) => ({
        ...prev,
        magento: {
          ...prev.magento,
          orders: [...prev.magento.orders, ...orders],
        },
      }));

      setMagentoPagination({
        currentPage: page,
        hasMore,
        isLoadingPage: false,
        totalCount,
      });
    } catch (error) {
      console.error("Error fetching Magento orders page:", error);
      setMagentoPagination((prev) => ({ ...prev, isLoadingPage: false }));
    }
  }, []);

  const refreshData = async () => {
    setIsLoading(true);
    try {
      const token =
        typeof window !== "undefined"
          ? localStorage.getItem("User_token")
          : null;

      if (!token) {
        setIsLoading(false);
        return;
      }

      // Fetch store info
      const storeRes = await fetch("http://localhost:5000/api/user/store", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (!storeRes.ok) {
        setIsLoading(false);
        return;
      }

      const storeData = await storeRes.json();
      setPlatform(storeData.platform);
      setStoreCurrency(storeData.store_currency || "INR");

      // Fetch Meta insights spend
      try {
        const insightsRes = await fetch(
          "http://localhost:5000/api/meta/insights?level=campaign&time_increment=1",
          { headers: token ? { Authorization: `Bearer ${token}` } : {} }
        );
        if (insightsRes.ok) {
          const body = await insightsRes.json();
          const insights: any[] = Array.isArray(body?.insights)
            ? body.insights
            : [];
          const totalSpend = insights.reduce(
            (sum, row: any) => sum + parseFloat(row?.spend || "0"),
            0
          );
          const totalSpendInRupees = totalSpend * 9.29;
          setMetaSpend(totalSpendInRupees);
        }
      } catch (_) {
        // ignore meta fetch errors
      }

      // Fetch platform-specific data
      if (storeData.platform === "Shopify") {
        const [products, customers, orders] = await Promise.all([
          fetchData<ShopifyProduct>(
            "http://localhost:5000/api/shopify/products",
            token
          ),
          fetchData<ShopifyCustomer>(
            "http://localhost:5000/api/shopify/customers",
            token
          ),
          fetchData<ShopifyOrder>(
            "http://localhost:5000/api/shopify/orders",
            token
          ),
        ]);
        console.log("Shopify Products:", products);
        console.log("Shopify Customers:", customers);
        console.log("Shopify Orders:", orders);
        setData((prev) => ({
          ...prev,
          shopify: { products, customers, orders },
        }));
      } else if (storeData.platform === "Woocommerce") {
        const [products, customers, orders] = await Promise.all([
          fetchData<WooProduct>(
            "http://localhost:5000/api/woocommerce/products",
            token
          ),
          fetchData<WooCustomer>(
            "http://localhost:5000/api/woocommerce/customers",
            token
          ),
          fetchData<WooOrder>(
            "http://localhost:5000/api/woocommerce/orders",
            token
          ),
        ]);
        console.log("WooCommerce Products:", products);
        console.log("WooCommerce Customers:", customers);
        console.log("WooCommerce Orders:", orders);
        setData((prev) => ({
          ...prev,
          woocommerce: { products, customers, orders },
        }));
      } else if (storeData.platform === "Magento") {
        try {
          const products = await fetchData<MagentoProduct>(
            "http://localhost:5000/api/magento/products",
            token
          );
          console.log("Magento Products:", products);

          const customers = await fetchData<MagentoCustomer>(
            "http://localhost:5000/api/magento/customers",
            token
          );
          console.log("Magento Customers:", customers);

          // Reset orders and pagination state
          setData((prev) => ({
            ...prev,
            magento: { products, customers, orders: [] },
          }));

          setMagentoPagination({
            currentPage: 0,
            hasMore: true,
            isLoadingPage: false,
            totalCount: 0,
          });

          // First, load all existing orders from database
          await loadAllOrdersFromDatabase(token);

          // Then check and fetch new orders from API if needed
          await fetchNewOrdersFromAPI(token);
        } catch (error) {
          console.error("Error fetching Magento data:", error);
        }
      }
    } catch (error) {
      console.error("Error refreshing dashboard data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshData();
  }, []);

  // Automatically fetch next page when current page is loaded and there are more pages (only for API fetching)
  useEffect(() => {
    if (
      platform === "Magento" &&
      magentoPagination.hasMore &&
      !magentoPagination.isLoadingPage &&
      magentoPagination.currentPage > 0
    ) {
      const nextPage = magentoPagination.currentPage + 1;
      console.log(`Auto-fetching next page from API: ${nextPage}`);
      fetchMagentoOrdersPage(nextPage);
    }
  }, [magentoPagination.currentPage, magentoPagination.hasMore, magentoPagination.isLoadingPage, platform, fetchMagentoOrdersPage]);

  const value: DashboardContextType = {
    platform,
    storeCurrency,
    data,
    metaSpend,
    isLoading,
    magentoPagination,
    setPlatform,
    setStoreCurrency,
    setData,
    setMetaSpend,
    refreshData,
    fetchMagentoOrdersPage,
  };

  return (
    <DashboardContext.Provider value={value}>
      {children}
    </DashboardContext.Provider>
  );
}

// Export types for use in other components
export type {
  ShopifyProduct,
  ShopifyCustomer,
  ShopifyOrder,
  WooProduct,
  WooCustomer,
  WooOrder,
  MagentoProduct,
  MagentoCustomer,
  MagentoOrder,
  Platform,
  DashboardData,
  MagentoPaginationState,
};

