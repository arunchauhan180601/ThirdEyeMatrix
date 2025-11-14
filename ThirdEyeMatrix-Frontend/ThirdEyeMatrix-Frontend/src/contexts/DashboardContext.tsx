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

const MAGENTO_PAGE_SIZE = 700;

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
  pageSize: number;
  lastBatchCount: number;
  source: "database" | "api" | null;
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
  fetchMagentoOrdersPage: (page: number) => Promise<number>;
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
  const NEXT_PUBLIC_API_URL = process.env.NEXT_PUBLIC_API_URL;

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
    pageSize: MAGENTO_PAGE_SIZE,
    lastBatchCount: 0,
    source: null,
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

  const fetchMagentoOrdersPage = useCallback(async (page: number) => {
    setMagentoPagination((prev) => {
      if (prev.isLoadingPage) return prev; // Prevent concurrent requests
      return { ...prev, isLoadingPage: true, lastBatchCount: 0, source: "api" };
    });

    const DEFAULT_PAGE_SIZE = MAGENTO_PAGE_SIZE;

    try {
      const token =
        typeof window !== "undefined"
          ? localStorage.getItem("User_token")
          : null;

      if (!token) {
        setMagentoPagination((prev) => ({ ...prev, isLoadingPage: false }));
        return 0;
      }

      const res = await fetch(
        `${NEXT_PUBLIC_API_URL}/api/magento/orders?page=${page}&pageSize=${DEFAULT_PAGE_SIZE}&source=api`,
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
      const hasMore = Boolean(body.has_more);
      const backendPageSize = Number(body.pageSize) || DEFAULT_PAGE_SIZE;
      const reportedTotalCount = Number(body.total_count) || 0;
      let mergedLength = 0;
      let batchCount = 0;

      console.log(
        `Fetched Magento Orders Batch ${page} from API:`,
        orders.length,
        "orders"
      );

      setData((prev) => {
        const baseOrders =
          page === 1 && prev.magento.orders.length === 0
            ? []
            : prev.magento.orders;
        const existingIds = new Set(baseOrders.map((order) => order.id));
        const filteredNew = orders.filter((order) => !existingIds.has(order.id));
        batchCount = filteredNew.length;
        const merged = [...baseOrders, ...filteredNew];
        mergedLength = merged.length;

        return {
          ...prev,
          magento: {
            ...prev.magento,
            orders: merged,
          },
        };
      });

      setMagentoPagination((prev) => ({
        ...prev,
        currentPage: page,
        hasMore,
        isLoadingPage: false,
        totalCount: reportedTotalCount || mergedLength,
        pageSize: backendPageSize,
        lastBatchCount: batchCount,
        source: "api",
      }));

      return batchCount;
    } catch (error) {
      console.error("Error fetching Magento orders page:", error);
      setMagentoPagination((prev) => ({ ...prev, isLoadingPage: false }));
      return 0;
    }
  }, []);

  const loadMagentoOrdersFromDatabase = useCallback(
    async (token: string): Promise<number> => {
      const PAGE_SIZE = MAGENTO_PAGE_SIZE;
      let page = 1;
      let hasMore = true;
      let collected: MagentoOrder[] = [];

      setMagentoPagination({
        currentPage: 0,
        hasMore: true,
        isLoadingPage: true,
        totalCount: 0,
        pageSize: PAGE_SIZE,
        lastBatchCount: 0,
        source: "database",
      });

      try {
        while (hasMore) {
          const res = await fetch(
            `${NEXT_PUBLIC_API_URL}/api/magento/orders?page=${page}&pageSize=${PAGE_SIZE}&source=db`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
            }
          );

          if (!res.ok) {
            throw new Error("Failed to load orders from database");
          }

          const body = await res.json();
          const orders: MagentoOrder[] = body.items || [];
          hasMore = Boolean(body.has_more);
          const totalCount = Number(body.total_count) || 0;
          const pageFromResponse = Number(body.page) || page;

          const newOrders = orders.filter(
            (order) => !collected.some((existing) => existing.id === order.id)
          );

          if (newOrders.length > 0) {
            collected = [...collected, ...newOrders];
            setData((prev) => ({
              ...prev,
              magento: {
                ...prev.magento,
                orders: collected,
              },
            }));
          }

          setMagentoPagination({
            currentPage: collected.length > 0 ? pageFromResponse : 0,
            hasMore,
            isLoadingPage: hasMore,
            totalCount: totalCount || collected.length,
            pageSize: PAGE_SIZE,
            lastBatchCount: orders.length,
            source: "database",
          });

          if (!hasMore) {
            break;
          }

          page += 1;
        }

        if (collected.length === 0) {
          setMagentoPagination({
            currentPage: 0,
            hasMore: false,
            isLoadingPage: false,
            totalCount: 0,
            pageSize: PAGE_SIZE,
            lastBatchCount: 0,
            source: "database",
          });
        }

        return collected.length;
      } catch (error) {
        console.error("Error loading orders from database:", error);
        setMagentoPagination((prev) => ({
          ...prev,
          isLoadingPage: false,
          hasMore: false,
          lastBatchCount: 0,
          source: "database",
        }));
        return collected.length;
      }
    },
    [setData]
  );

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
      const storeRes = await fetch(`${NEXT_PUBLIC_API_URL}/api/user/store`, {
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
          `${NEXT_PUBLIC_API_URL}/api/meta/insights?level=campaign&time_increment=1`,
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
          `${NEXT_PUBLIC_API_URL}/api/shopify/products`,
            token
          ),
          fetchData<ShopifyCustomer>(
            `${NEXT_PUBLIC_API_URL}/api/shopify/customers`,
            token
          ),
          fetchData<ShopifyOrder>(
            `${NEXT_PUBLIC_API_URL}/api/shopify/orders`,
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
            `${NEXT_PUBLIC_API_URL}/api/woocommerce/products`,
            token
          ),
          fetchData<WooCustomer>(
            `${NEXT_PUBLIC_API_URL}/api/woocommerce/customers`,
            token
          ),
          fetchData<WooOrder>(
            `${NEXT_PUBLIC_API_URL}/api/woocommerce/orders`,
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
          // Reset Magento data before fetching in desired order
          setData((prev) => ({
            ...prev,
            magento: { products: [], customers: [], orders: [] },
          }));

          setMagentoPagination({
            currentPage: 0,
            hasMore: true,
            isLoadingPage: false,
            totalCount: 0,
            pageSize: MAGENTO_PAGE_SIZE,
            lastBatchCount: 0,
            source: null,
          });

          // 1. Fetch orders first (database then API)
          const loadedCount = await loadMagentoOrdersFromDatabase(token);
          let totalOrdersFetched = loadedCount;

          const nextPageToFetch = Math.max(
            Math.floor(totalOrdersFetched / MAGENTO_PAGE_SIZE) + 1,
            1
          );
          const firstApiBatchCount = await fetchMagentoOrdersPage(nextPageToFetch);
          totalOrdersFetched += firstApiBatchCount;

          if (totalOrdersFetched === 0) {
            console.warn("Magento orders failed to load; skipping customers and products fetch.");
            return;
          }

          // 2. Fetch customers after orders
          const customers = await fetchData<MagentoCustomer>(
            `${NEXT_PUBLIC_API_URL}/api/magento/customers`,
            token
          );
          console.log("Magento Customers:", customers);
          setData((prev) => ({
            ...prev,
            magento: {
              ...prev.magento,
              customers,
            },
          }));

          // 3. Fetch products last
          const products = await fetchData<MagentoProduct>(
            `${NEXT_PUBLIC_API_URL}/api/magento/products`,
            token
          );
          console.log("Magento Products:", products);
          setData((prev) => ({
            ...prev,
            magento: {
              ...prev.magento,
              products,
            },
          }));
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
      magentoPagination.currentPage > 0 &&
      magentoPagination.source === "api"
    ) {
      const nextPage = magentoPagination.currentPage + 1;
      console.log(`Auto-fetching next page from API: ${nextPage}`);
      void fetchMagentoOrdersPage(nextPage);
    }
  }, [
    magentoPagination.currentPage,
    magentoPagination.hasMore,
    magentoPagination.isLoadingPage,
    magentoPagination.source,
    platform,
    fetchMagentoOrdersPage,
  ]);

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

