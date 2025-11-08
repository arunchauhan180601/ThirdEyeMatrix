"use client";

import { ChevronDown, EllipsisVertical, Mail, Search } from "lucide-react";
import Image from "next/image";
import slackImages from "@/assets/images/slack.png";
import metaImage from "@/assets/images/meta.png";
import yotpoImage from "@/assets/images/Ads Integrations Image/yotpo.png";
import klaviyoImage from "@/assets/images/Ads Integrations Image/Klaviyo.png";
import { useRouter } from "next/navigation";
import React, { useState, FormEvent, useEffect } from "react";
import { toast } from "react-toastify";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

type MetricType = string;
interface StatusType {
  message: string;
  type: "success" | "error" | "";
}
interface MetricCheckboxProps {
  value: MetricType;
  label: string;
}
interface Report {
  id: number;
  report_title: string;
  report_frequency: string;
  store: string;
  time_of_day: string;
  recipients_email: string;
  selected_metrics: string[] | string; // can be JSON string or array
  created_at: string;
  updated_at: string;
}

// Shopify Interfaces
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
  refund_line_items?: {
    id: string;
    quantity: number;
    line_item?: {
      id: string;
      title: string;
      price: string;
      quantity: number;
    };
  }[];
}
interface ShopifyOrder {
  id: string;
  name: string;
  total_price: string;
  total_discounts: string;
  total_tax: string;
  financial_status: string;
  refunds?: ShopifyRefund[];
  total_shipping_price_set?: {
    shop_money?: {
      amount: string;
    };
  };
}

// WooCommerce Interfaces
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
}
interface WooLineItem {
  id: number;
  name: string;
  subtotal: string;
  total: string;
}
interface WooRefund {
  id: number;
  total: string;
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
  refunds?: WooRefund[];
}

// Magento Interfaces
interface MagentoProduct {
  id: number;
  name: string;
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
  refunds?: MagentoRefund[];
}

type Platform = "Shopify" | "Woocommerce" | "Magento" | null;

export default function Report() {
  const [reportModal, setReportModal] = useState(false);
  const router = useRouter();
  const [reportTitle, setReportTitle] = useState("");
  const [reportFrequency, setReportFrequency] = useState("Daily");
  const [timeOfDay, setTimeOfDay] = useState("6:00 Am");
  const [email, setEmail] = useState("");
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [store, setStore] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Platform and data states (similar to dashboard)
  const [platform, setPlatform] = useState<Platform>(null);
  const [data, setData] = useState({
    shopify: {
      products: [] as ShopifyProduct[],
      customers: [] as ShopifyCustomer[],
      orders: [] as ShopifyOrder[],
    },
    woocommerce: {
      products: [] as WooProduct[],
      customers: [] as WooCustomer[],
      orders: [] as WooOrder[],
    },
    magento: {
      products: [] as MagentoProduct[],
      customers: [] as MagentoCustomer[],
      orders: [] as MagentoOrder[],
    },
  });
  const [metaSpend, setMetaSpend] = useState(0);

  // States for Accordions (Metrics sections)
  const [activeTab, setActiveTab] = useState("Metrics");
  const [showSummary, setShowSummary] = useState(false);
  const [showPixel, setShowPixel] = useState(false);
  const [showCustomMetrics, setShowCustomMetrics] = useState(false);
  const [showStoreMetrics, setShowStoreMetrics] = useState(false);
  const [showFacebookMetrics, setShowFacebookMetrics] = useState(false);
  const [showKlaviyoMetrics, setShowKlaviyoMetrics] = useState(false);
  const [showExpenseMetrics, setShowExpenseMetrics] = useState(false);

  // Status for the form submission inside the modal
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [modalStatus, setModalStatus] = useState<StatusType>({
    message: "",
    type: "",
  });

  //  New state for the success/error message on the main page
  const [pageStatus, setPageStatus] = useState<StatusType>({
    message: "",
    type: "",
  });

  // Dashboard tab states
  const [dashboardPrompt, setDashboardPrompt] = useState("");
  const [advancedInsights, setAdvancedInsights] = useState(false);
  const [dashboardFormat, setDashboardFormat] = useState("PDF");

  // Dropdown state for ellipsis menu
  const [openDropdownId, setOpenDropdownId] = useState<number | null>(null);
  const [editingReportId, setEditingReportId] = useState<number | null>(null);
  /*------------------- get user reports ----------------- */
  async function getUserReports() {
    try {
      const token = localStorage.getItem("User_token");
      if (!token) {
        router.push("/auth/user/signin");
        return;
      }
      const res = await fetch("http://localhost:5000/api/reports", {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();
      console.log(data.reports);
      setReports(data.reports);
      setStore(data.store);
    } catch (error) {
      console.error("Error fetching reports:", error);
    }
  }

  useEffect(() => {
    getUserReports();
  }, [router]);

  // Fetch data function (similar to dashboard)
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

  // Fetch store and data (similar to dashboard)
  useEffect(() => {
    (async () => {
      const token =
        typeof window !== "undefined"
          ? localStorage.getItem("User_token")
          : null;

      const storeRes = await fetch("http://localhost:5000/api/user/store", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!storeRes.ok) return;

      const storeData = await storeRes.json();
      setPlatform(storeData.platform);

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
        // ignore errors
      }

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
        setData((prev) => ({
          ...prev,
          woocommerce: { products, customers, orders },
        }));
      } else if (storeData.platform === "Magento") {
        const [products, customers, orders] = await Promise.all([
          fetchData<MagentoProduct>(
            "http://localhost:5000/api/magento/products",
            token
          ),
          fetchData<MagentoCustomer>(
            "http://localhost:5000/api/magento/customers",
            token
          ),
          fetchData<MagentoOrder>(
            "http://localhost:5000/api/magento/orders",
            token
          ),
        ]);
        setData((prev) => ({
          ...prev,
          magento: { products, customers, orders },
        }));
      }
    })();
  }, []);

  // Function to reset all form fields and close the modal
  const resetForm = () => {
    setReportTitle("");
    setReportFrequency("Daily");
    setTimeOfDay("6:00 Am");
    setEmail("");
    setSelectedMetrics([]);
    setReportModal(false);
    setModalStatus({ message: "", type: "" }); // Reset modal status
    setSearchQuery(""); // Reset search query
    setShowSummary(false);
    setShowPixel(false);
    setShowCustomMetrics(false);
    setShowStoreMetrics(false);
    setShowFacebookMetrics(false);
    setShowKlaviyoMetrics(false);
    setShowExpenseMetrics(false);
    // Reset dashboard fields
    setDashboardPrompt("");
    setAdvancedInsights(false);
    setDashboardFormat("PDF");
    setEditingReportId(null);
    setOpenDropdownId(null);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest(".dropdown-container")) {
        setOpenDropdownId(null);
      }
    };

    if (openDropdownId !== null) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [openDropdownId]);

  // Handle edit report
  const handleEditReport = (report: Report) => {
    setEditingReportId(report.id);
    setReportTitle(report.report_title);
    setReportFrequency(report.report_frequency);
    setTimeOfDay(report.time_of_day);
    setEmail(report.recipients_email);

    // Parse selected_metrics (could be string or array)
    const metrics = Array.isArray(report.selected_metrics)
      ? report.selected_metrics
      : JSON.parse(report.selected_metrics || "[]");
    setSelectedMetrics(metrics);

    // Open modal
    setReportModal(true);
    setOpenDropdownId(null);
    setPageStatus({ message: "", type: "" });
  };

  // Handle delete report
  const handleDeleteReport = async (reportId: number) => {
    if (!confirm("Are you sure you want to delete this report?")) {
      setOpenDropdownId(null);
      return;
    }

    try {
      const token = localStorage.getItem("User_token");
      if (!token) {
        router.push("/auth/user/signin");
        return;
      }

      const response = await fetch(
        `http://localhost:5000/api/reports/${reportId}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (response.ok) {
        toast.success("Report Deleted Successfully...", {
          autoClose: 2000,
          style: {
            fontSize: "16px",
            fontWeight: "bold",
            borderRadius: "10px",
          },
        });
        getUserReports(); // Refresh reports list
      } else {
        toast.error("Failed to delete report...", {
          autoClose: 2000,
          style: {
            fontSize: "16px",
            fontWeight: "bold",
            borderRadius: "10px",
          },
        });
      }
    } catch (error) {
      console.error("Error deleting report:", error);
      toast.error("An error occurred while deleting the report...", {
        autoClose: 2000,
        style: {
          fontSize: "16px",
          fontWeight: "bold",
          borderRadius: "10px",
        },
      });
    } finally {
      setOpenDropdownId(null);
    }
  };

  const handleMetricChange = (metricValue: MetricType) => {
    setSelectedMetrics((prev) =>
      prev.includes(metricValue)
        ? prev.filter((v) => v !== metricValue)
        : [...prev, metricValue]
    );
  };

  // Define metrics for each section to enable search
  const metricsData = {
    summary: {
      customMetrics: [
        "All Custom Metrics metrics",
        "Net Profit",
        "Blended ROAS",
        "MER",
        "Net Margin",
        "Blended Ad Spend",
        "Blended Sales",
        "Returns %",
        "Profit on Ad Spend",
      ],
      storeMetrics: [
        "All Store metrics",
        "Order Revenue",
        "Orders",
        "Returns",
        "True AOV",
        "Average Order Value",
        "Total Sales",
      ],
      facebookMetrics: [
        "All Meta Ads metrics",
        "Facebook Ads Spend",
        "Facebook ROAS",
      ],
      klaviyoMetrics: [
        "All Klaviyo metrics",
        "Revenue Flows",
        "Percent of Revenue Flows",
        "Revenue Campaigns",
        "klaviyo Total Revenue",
        "Klaviyo Sales %",
      ],
      expenseMetrics: [
        "All Expenses metrics",
        "COGS",
        "Handling Fees",
        "Shipping",
        "Custom Expenses",
        "Custom Net Revenue",
      ],
    },
    pixel: ["Meta Metrics", "Yotpo SMS and Email Metrics", "Klaviyo Metrics"],
  };

  // Handle search functionality
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    const lowerQuery = query.toLowerCase().trim();

    if (!lowerQuery) {
      // If search is empty, close all sections
      return;
    }

    // Check if any metric in Summary section matches
    const customMetricsMatch = metricsData.summary.customMetrics.some(
      (metric) => metric.toLowerCase().includes(lowerQuery)
    );
    const storeMetricsMatch = metricsData.summary.storeMetrics.some((metric) =>
      metric.toLowerCase().includes(lowerQuery)
    );
    const facebookMetricsMatch = metricsData.summary.facebookMetrics.some(
      (metric) => metric.toLowerCase().includes(lowerQuery)
    );
    const klaviyoSummaryMatch = metricsData.summary.klaviyoMetrics.some(
      (metric) => metric.toLowerCase().includes(lowerQuery)
    );
    const expenseMetricsMatch = metricsData.summary.expenseMetrics.some(
      (metric) => metric.toLowerCase().includes(lowerQuery)
    );

    const summaryHasMatch =
      customMetricsMatch ||
      storeMetricsMatch ||
      facebookMetricsMatch ||
      klaviyoSummaryMatch ||
      expenseMetricsMatch;

    // Check if any metric in Pixel section matches
    const pixelHasMatch = metricsData.pixel.some((metric) =>
      metric.toLowerCase().includes(lowerQuery)
    );

    // Auto-open Summary if any of its nested sections have a match
    if (summaryHasMatch) {
      setShowSummary(true);
      setShowCustomMetrics(customMetricsMatch);
      setShowStoreMetrics(storeMetricsMatch);
      setShowFacebookMetrics(facebookMetricsMatch);
      setShowKlaviyoMetrics(klaviyoSummaryMatch);
      setShowExpenseMetrics(expenseMetricsMatch);
    }

    // Auto-open Pixel if it has a match
    if (pixelHasMatch) {
      setShowPixel(true);
    }
  };

  // ==================== METRIC CALCULATIONS ====================

  // WooCommerce Calculations
  const getOrderRevenue = (order: WooOrder) => {
    const grossSales = order.line_items.reduce(
      (sum, item) => sum + parseFloat(item.subtotal || "0"),
      0
    );
    const discounts = parseFloat(order.discount_total || "0");
    const shipping =
      order.status === "completed" ||
      order.status === "processing" ||
      order.status === "on-hold"
        ? parseFloat(order.shipping_total || "0")
        : 0;
    const tax = parseFloat(order.total_tax || "0");
    return grossSales - discounts + shipping + tax;
  };

  const getRefundsExcludingTax = (order: WooOrder) => {
    if (!order.refunds || order.refunds.length === 0) return 0;
    return order.refunds.reduce(
      (sum, refund) => sum + parseFloat(refund.total || "0"),
      0
    );
  };

  const allOrders = data.woocommerce.orders;
  const totalOrderRevenue = allOrders.reduce(
    (sum, order) => sum + getOrderRevenue(order),
    0
  );
  const totalSales = allOrders.reduce(
    (sum, order) =>
      sum + (getOrderRevenue(order) - getRefundsExcludingTax(order)),
    0
  );
  const totalOrders = data.woocommerce.orders.length;
  const shippingCost = allOrders.reduce((sum, order) => {
    if (
      order.status === "completed" ||
      order.status === "processing" ||
      order.status === "on-hold"
    ) {
      return sum + parseFloat(order.shipping_total || "0");
    }
    return sum;
  }, 0);
  const totalTax = allOrders.reduce(
    (sum, order) => sum + parseFloat(order.total_tax || "0"),
    0
  );
  const averageOrderValue =
    totalOrders > 0
      ? (totalOrderRevenue - shippingCost - totalTax) / totalOrders
      : 0;
  const trueAOVOrders = allOrders
    .map((order) => {
      const orderRevenue = getOrderRevenue(order);
      const netRevenue =
        orderRevenue -
        parseFloat(order.shipping_total || "0") -
        parseFloat(order.total_tax || "0");
      return netRevenue;
    })
    .filter((netRevenue) => netRevenue > 0);
  const totalNetRevenue = trueAOVOrders.reduce((sum, value) => sum + value, 0);
  const trueAOV =
    trueAOVOrders.length > 0 ? totalNetRevenue / trueAOVOrders.length : 0;
  const woocommerceHandlingFees = data.woocommerce.orders.reduce(
    (sum, order) => {
      if (Array.isArray(order.fee_lines) && order.fee_lines.length > 0) {
        const orderFeeTotal = order.fee_lines.reduce(
          (feeSum, fee) => feeSum + parseFloat(fee.amount || "0"),
          0
        );
        return sum + orderFeeTotal;
      }
      return sum;
    },
    0
  );

  // Shopify Calculations
  const totalShopifyOrders = data.shopify.orders.length;
  const getShopifyOrderRevenue = (order: ShopifyOrder) => {
    const grossSales = parseFloat(order.total_price || "0");
    const discounts = parseFloat(order.total_discounts || "0");
    const shipping =
      order.financial_status === "paid"
        ? parseFloat(order.total_shipping_price_set?.shop_money?.amount || "0")
        : 0;
    const tax = parseFloat(order.total_tax || "0");
    return grossSales - discounts + shipping + tax;
  };
  const allShopifyOrders = data.shopify.orders;
  const totalShopifyOrderRevenue = allShopifyOrders.reduce(
    (sum, order) => sum + getShopifyOrderRevenue(order),
    0
  );
  const getShopifyRefundsExcludingTax = (order: ShopifyOrder) => {
    if (!order.refunds || order.refunds.length === 0) return 0;
    return order.refunds.reduce((sum, refund) => {
      const refundTotal =
        refund.refund_line_items?.reduce(
          (refundSum, item) =>
            refundSum +
            parseFloat(item.line_item?.price || "0") *
              (item.line_item?.quantity || 1),
          0
        ) || 0;
      return sum + refundTotal;
    }, 0);
  };
  const shopifyTotalSales = allShopifyOrders.reduce(
    (sum, order) =>
      sum +
      (getShopifyOrderRevenue(order) - getShopifyRefundsExcludingTax(order)),
    0
  );
  const paidOrders = allShopifyOrders.filter(
    (order) => order.financial_status === "paid"
  );
  const totalRevenuePaid = paidOrders.reduce(
    (sum, order) => sum + getShopifyOrderRevenue(order),
    0
  );
  const shopifyTrueAOV =
    paidOrders.length > 0 ? totalRevenuePaid / paidOrders.length : 0;
  const overallAOV =
    allShopifyOrders.length > 0
      ? totalShopifyOrderRevenue / allShopifyOrders.length
      : 0;

  // Magento Calculations
  const totalMagentoOrders = data.magento.orders.length;
  const getMagentoOrderRevenue = (order: MagentoOrder) => {
    const grossSales = parseFloat(order.subtotal || "0");
    const discounts = parseFloat(order.discount_amount || "0");
    const shipping =
      order.state === "complete" || order.state === "processing"
        ? parseFloat(order.shipping_amount || "0")
        : 0;
    const tax = parseFloat(order.tax_amount || "0");
    return grossSales - discounts + shipping + tax;
  };
  const totalMagentoRevenue = data.magento.orders.reduce(
    (sum, order) => sum + getMagentoOrderRevenue(order),
    0
  );
  const getMagentoRefundsExcludingTax = (order: MagentoOrder) => {
    if (!order.refunds || order.refunds.length === 0) return 0;
    return order.refunds.reduce((sum, refund) => {
      const refundTotal =
        parseFloat(refund.subtotal || "0") +
        parseFloat(refund.shipping_amount || "0") -
        parseFloat(refund.tax_amount || "0");
      return sum + refundTotal;
    }, 0);
  };
  const totalMagentoSales = data.magento.orders.reduce(
    (sum, order) =>
      sum +
      (getMagentoOrderRevenue(order) - getMagentoRefundsExcludingTax(order)),
    0
  );
  const magentoShippingCost = data.magento.orders.reduce((sum, order) => {
    if (order.state === "complete" || order.state === "processing") {
      return sum + parseFloat(order.shipping_amount || "0");
    }
    return sum;
  }, 0);

  // Custom Metrics
  const customAdsSpend = Math.round(metaSpend);
  const customNetProfit = Math.round(
    totalSales + shopifyTotalSales + totalMagentoSales - customAdsSpend
  );
  const customOrderRevenue = Math.round(
    totalOrderRevenue + totalShopifyOrderRevenue + totalMagentoRevenue
  );
  const customMER = Math.round((customAdsSpend / customOrderRevenue) * 100);
  const customNetMargin = Math.round(
    (customNetProfit / customOrderRevenue) * 100
  );

  // Function to get metric value by name
  const getMetricValue = (metricName: string): string => {
    const metricMap: { [key: string]: number | string } = {
      // Custom Metrics
      "Net Profit": customNetProfit,
      "Blended ROAS": 0, // placeholder
      MER: customMER,
      "Net Margin": customNetMargin,
      "Blended Ad Spend": customAdsSpend,
      "Blended Sales": Math.round(
        totalSales + shopifyTotalSales + totalMagentoSales
      ),
      "Returns %": 0, // placeholder
      "Profit on Ad Spend": 0, // placeholder

      // Store Metrics (WooCommerce)
      "Order Revenue": Math.round(totalOrderRevenue),
      Orders: totalOrders,
      Returns: 0, // placeholder
      "True AOV": Math.round(trueAOV),
      "Average Order Value": Math.round(averageOrderValue),
      "Total Sales": Math.round(totalSales),

      // Shopify specific
      "Shopify Order Revenue": Math.round(totalShopifyOrderRevenue),
      "Shopify Orders": totalShopifyOrders,
      "Shopify True AOV": Math.round(shopifyTrueAOV),
      "Shopify AOV": Math.round(overallAOV),
      "Shopify Total Sales": Math.round(shopifyTotalSales),

      // Magento specific
      "Magento Order Revenue": Math.round(totalMagentoRevenue),
      "Magento Orders": totalMagentoOrders,
      "Magento Total Sales": Math.round(totalMagentoSales),

      // Meta Ads
      "Facebook Ads Spend": customAdsSpend,
      "Facebook ROAS": 0, // placeholder

      // Expenses
      COGS: 0,
      "Handling Fees": Math.round(woocommerceHandlingFees),
      Shipping: Math.round(shippingCost),
      "Custom Expenses": 0,
      "Custom Net Revenue": Math.round(customOrderRevenue),

      // Klaviyo (placeholder values)
      "Revenue Flows": 0,
      "Percent of Revenue Flows": 0,
      "Revenue Campaigns": 0,
      "klaviyo Total Revenue": 0,
      "Klaviyo Sales %": 0,
    };

    return metricMap[metricName]?.toString() || "0";
  };

  // Function to get metric format (rupees, percentage, or none)
  const getMetricFormat = (
    metricName: string
  ): "rupees" | "percentage" | "none" => {
    // Handle "All" metrics - these will display mixed formats but default to rupees
    if (metricName.toLowerCase().includes("all")) {
      return "rupees";
    }

    // Percentage metrics
    const percentageMetrics = [
      "Blended ROAS",
      "MER",
      "Net Margin",
      "Returns %",
      "Profit on Ad Spend",
      "Facebook ROAS",
      "Percent of Revenue Flows",
      "Klaviyo Sales %",
    ];

    // Check if metric name contains percentage indicators
    if (
      percentageMetrics.includes(metricName) ||
      metricName.includes("%") ||
      metricName.toLowerCase().includes("percent") ||
      metricName.toLowerCase().includes("roas") ||
      metricName.toLowerCase().includes("margin")
    ) {
      return "percentage";
    }

    // Count/plain number metrics (no currency symbol)
    const noneMetrics = [
      "Orders",
      "Returns",
      "Revenue Flows",
      "Revenue Campaigns",
      "Shopify Orders",
      "Magento Orders",
      "All Store metrics",
    ];

    if (noneMetrics.includes(metricName)) {
      return "none";
    }

    // Default to rupees for all monetary values
    return "rupees";
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setModalStatus({ message: "", type: "" });
    setPageStatus({ message: "", type: "" });
    setIsLoading(true);

    const frequencyValue = reportFrequency;
    const timeValue = timeOfDay;

    // Validate based on active tab
    if (activeTab === "Metrics") {
      // For Metrics tab, require at least one metric selected
      if (
        !reportTitle ||
        !frequencyValue ||
        !timeValue ||
        !email ||
        selectedMetrics.length === 0
      ) {
        setModalStatus({
          message:
            "Please fill all required fields and select at least one metric.",
          type: "error",
        });
        setIsLoading(false);
        return;
      }
    } else {
      // For Dashboard tab, just require basic fields
      if (!reportTitle || !frequencyValue || !timeValue || !email) {
        setModalStatus({
          message: "Please fill all required fields.",
          type: "error",
        });
        setIsLoading(false);
        return;
      }
    }

    // Prepare payload based on active tab
    const payload: any = {
      report_title: reportTitle,
      report_frequency: frequencyValue,
      time_of_day: timeValue,
      recipients_email: email,
    };

    // Add tab-specific data
    if (activeTab === "Metrics") {
      payload.selected_metrics = selectedMetrics;
    } else if (activeTab === "Dashboard") {
      payload.dashboard_format = dashboardFormat;
      payload.dashboard_prompt = dashboardPrompt;
      payload.advanced_insights = advancedInsights;
      payload.selected_metrics = []; // Empty array for dashboard mode
    }

    try {
      const token = localStorage.getItem("User_token");
      if (!token) {
        router.push("/auth/user/signin");
        return;
      }

      // Determine if this is an update or create
      const isUpdate = editingReportId !== null;
      const url = isUpdate
        ? `http://localhost:5000/api/reports/${editingReportId}`
        : "http://localhost:5000/api/reports";
      const method = isUpdate ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(
          `Report  ${
            isUpdate ? "updated" : "created"
          } successfully!`,
          {
            autoClose: 2500,
            style: {
              fontSize: "16px",
              fontWeight: "bold",
              borderRadius: "10px",
            },
          }
        );

        // Reset form and refresh reports
        resetForm();
        getUserReports();
      } else {
        const errorMessage =
          data.error || data.message || "An unknown server error occurred.";

        toast.error(`Failed: ${errorMessage}`, {
          autoClose: 3000,
          style: {
            fontSize: "15px",
            fontWeight: "bold",
            borderRadius: "10px",
          },
        });
      }
    } catch (error) {
      console.error("Fetch Error:", error);

      toast.error(
        "A network error occurred. Check your connection or API URL.",
        {
          autoClose: 3000,
          style: {
            fontSize: "15px",
            fontWeight: "bold",
            borderRadius: "10px",
          },
        }
      );
    } finally {
      setIsLoading(false);
    }
  };

  // --- Metric Checkbox Component (Helper for readability) ---
  const MetricCheckbox: React.FC<MetricCheckboxProps> = ({ value, label }) => (
    <label className="flex items-center gap-2">
      <input
        type="checkbox"
        value={value}
        className="mr-2 h-4 w-4"
        checked={selectedMetrics.includes(value)}
        onChange={() => handleMetricChange(value)}
      />
      {label}
    </label>
  );

  // Function to capture dashboard screenshot and convert to PDF
  const captureDashboardAsPDF = async (): Promise<string> => {
    try {
      // Navigate to dashboard page in a hidden iframe or capture current page
      const dashboardElement = document.querySelector(".container"); // Adjust selector as needed

      if (!dashboardElement) {
        throw new Error("Dashboard element not found");
      }

      // Suppress console warnings from html2canvas
      const originalWarn = console.warn;
      const originalError = console.error;
      console.warn = (...args) => {
        const msg = args[0]?.toString() || "";
        if (!msg.includes("oklch") && !msg.includes("color function")) {
          originalWarn(...args);
        }
      };
      console.error = (...args) => {
        const msg = args[0]?.toString() || "";
        if (!msg.includes("oklch") && !msg.includes("color function")) {
          originalError(...args);
        }
      };

      let canvas;
      try {
        // First attempt: Try with standard options
        canvas = await html2canvas(dashboardElement as HTMLElement, {
          scale: 1.5,
          useCORS: true,
          logging: false,
          backgroundColor: "#ffffff",
          allowTaint: true,
          foreignObjectRendering: false,
          imageTimeout: 0,
          windowWidth: dashboardElement.scrollWidth,
          windowHeight: dashboardElement.scrollHeight,
          onclone: (clonedDoc) => {
            // Remove all stylesheets that might contain oklch
            const styleSheets = clonedDoc.querySelectorAll(
              'link[rel="stylesheet"], style'
            );
            styleSheets.forEach((sheet: any) => {
              const content = sheet.textContent || sheet.innerHTML || "";
              if (content.includes("oklch")) {
                sheet.remove();
              }
            });
          },
        });
      } catch (firstError: any) {
        console.log(
          "First capture attempt failed, trying with canvas fallback..."
        );

        // Second attempt: Try with minimal options if first fails
        try {
          canvas = await html2canvas(dashboardElement as HTMLElement, {
            scale: 1,
            logging: false,
            backgroundColor: "#ffffff",
            allowTaint: true,
            useCORS: false,
            foreignObjectRendering: true,
            onclone: (clonedDoc) => {
              // More aggressive style cleanup
              const allElements = clonedDoc.querySelectorAll("*");
              allElements.forEach((el: any) => {
                if (el.style) {
                  // Remove any CSS custom properties that might use oklch
                  const computedStyle = window.getComputedStyle(el);
                  el.style.color = computedStyle.color;
                  el.style.backgroundColor = computedStyle.backgroundColor;
                  el.style.borderColor = computedStyle.borderColor;
                  el.style.fill = computedStyle.fill;
                }
              });
            },
          });
        } catch (secondError) {
          console.error(
            "Both capture attempts failed:",
            firstError,
            secondError
          );
          throw new Error(
            "Unable to capture dashboard. Please try using a different browser or update your Tailwind CSS configuration."
          );
        }
      }

      // Restore console
      console.warn = originalWarn;
      console.error = originalError;

      if (!canvas) {
        throw new Error("Failed to create canvas from dashboard");
      }

      // Convert canvas to PDF

      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const imgWidth = 210; // A4 width in mm
      const pageHeight = 297; // A4 height in mm

      const imgData = canvas.toDataURL("image/jpeg", 0.85);
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      // Add first page
      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      // Add additional pages if needed
      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      // Return PDF as base64 string with data URI prefix
      const pdfDataUri = pdf.output("datauristring") as string;
      console.log("PDF output format:", pdfDataUri.substring(0, 100));
      console.log("PDF data URI length:", pdfDataUri.length);
      return pdfDataUri;
    } catch (error) {
      console.error("Error capturing dashboard:", error);
      throw error;
    }
  };

  const handleSendNow = async () => {
    setIsSending(true);
    try {
      const frequencyValue = reportFrequency;
      const timeValue = timeOfDay;

      let payload: any = {
        report_title: reportTitle,
        report_frequency: frequencyValue,
        time_of_day: timeValue,
        recipients_email: email,
      };

      // Check if Dashboard tab is selected
      if (activeTab === "Dashboard" && dashboardFormat === "PDF") {
        toast.info("Capturing dashboard screenshot...", {
          autoClose: 2000,
          style: {
            fontSize: "16px",
            fontWeight: "bold",
            borderRadius: "10px",
          },
        });

        let pdfBase64 = "";

        try {
          // Always use iframe approach to ensure we capture from dashboard page
          toast.info(
            "Loading dashboard and waiting for data to load (this may take 10-20 seconds)...",
            {
              autoClose: 5000,
              style: {
                fontSize: "16px",
                fontWeight: "bold",
                borderRadius: "10px",
              },
            }
          );

          // Create hidden iframe to load dashboard
          const iframe = document.createElement("iframe");
          iframe.style.position = "fixed";
          iframe.style.top = "-9999"; // Hidden off-screen
          iframe.style.left = "-9999";
          iframe.style.width = "1920px"; // Large initial width to accommodate content
          iframe.style.height = "10000px"; // Very tall to accommodate full dashboard
          iframe.style.border = "none";
          iframe.style.overflow = "hidden"; // Prevent scrollbars in iframe
          iframe.src = window.location.origin + "/user/dashboard";

          document.body.appendChild(iframe);

          // Wait for iframe to load and dashboard content to render
          await new Promise<void>((resolve, reject) => {
            let checkCount = 0;
            const maxChecks = 60; // 30 seconds max (60 * 500ms) - increased for data loading

            const checkDashboardReady = () => {
              try {
                const iframeDoc =
                  iframe.contentDocument || iframe.contentWindow?.document;
                if (!iframeDoc) {
                  checkCount++;
                  if (checkCount >= maxChecks) {
                    reject(
                      new Error(
                        "Dashboard loading timeout - iframe not accessible"
                      )
                    );
                    return;
                  }
                  setTimeout(checkDashboardReady, 500);
                  return;
                }

                // Wait for iframe to fully load first
                if (iframeDoc.readyState !== "complete") {
                  checkCount++;
                  if (checkCount >= maxChecks) {
                    reject(
                      new Error(
                        "Dashboard loading timeout - document not ready"
                      )
                    );
                    return;
                  }
                  setTimeout(checkDashboardReady, 500);
                  return;
                }

                // Check for dashboard-specific content (CustomMatrix, platform-specific sections)
                const dashboardContainer =
                  iframeDoc.querySelector(".container");
                if (!dashboardContainer) {
                  checkCount++;
                  if (checkCount >= maxChecks) {
                    reject(new Error("Dashboard container not found"));
                    return;
                  }
                  setTimeout(checkDashboardReady, 500);
                  return;
                }

                // Verify dashboard has actual content (not just empty container)
                const textContent = dashboardContainer.textContent || "";
                const innerHTML = dashboardContainer.innerHTML || "";

                // Check for platform-specific content or CustomMatrix component
                const hasStructure =
                  dashboardContainer.querySelector('[class*="CustomMatrix"]') ||
                  dashboardContainer.querySelector('[class*="Shopify"]') ||
                  dashboardContainer.querySelector('[class*="Woocommerce"]') ||
                  dashboardContainer.querySelector('[class*="Magento"]') ||
                  dashboardContainer.querySelector("h2") ||
                  dashboardContainer.querySelector("h3");

                // Verify actual data values are loaded (not just zeros or placeholders)
                // Look for numeric values that indicate data has loaded
                const hasNumericData =
                  /₹\s*\d+|Orders:\s*\d+|Revenue:\s*\d+|\d+[,\d]*\s*(Orders|Revenue|Sales|Spend)/i.test(
                    textContent
                  );

                // Check for metric cards with actual values (not just "0" or empty)
                const metricCards = dashboardContainer.querySelectorAll(
                  '[class*="rounded-md"], [class*="shadow-md"]'
                );
                let cardsWithData = 0;
                metricCards.forEach((card) => {
                  const cardText = card.textContent || "";
                  // Check if card has numeric values (excluding just "0" which might be placeholder)
                  if (
                    /₹\s*[1-9]\d*|₹\s*0[.,]\d+|[1-9]\d+[,\d]*(Orders|Revenue|Sales|Spend)/i.test(
                      cardText
                    )
                  ) {
                    cardsWithData++;
                  }
                });

                // Check for Indian Rupee symbols or numeric values in content
                const hasCurrencySymbols =
                  textContent.includes("₹") || textContent.includes("₹");

                // Check content length (should have substantial content)
                const hasContentLength =
                  textContent.trim().length > 500 || innerHTML.length > 2000;

                // Check if network requests might still be in progress
                // Look for loading indicators or spinner elements
                const hasLoadingIndicators =
                  dashboardContainer.querySelector('[class*="loading"]') ||
                  dashboardContainer.querySelector('[class*="spinner"]') ||
                  dashboardContainer.querySelector('[class*="animate-spin"]') ||
                  textContent.includes("Loading...") ||
                  textContent.includes("loading");

                // If loading indicators found, data not ready yet
                if (hasLoadingIndicators) {
                  checkCount++;
                  if (checkCount >= maxChecks) {
                    reject(
                      new Error(
                        "Dashboard still loading - loading indicators detected"
                      )
                    );
                    return;
                  }
                  setTimeout(checkDashboardReady, 500);
                  return;
                }

                // Data is ready if: structure exists, has content length, AND either has numeric data or currency symbols
                const dataReady =
                  hasStructure &&
                  hasContentLength &&
                  (hasNumericData || hasCurrencySymbols || cardsWithData >= 3);

                if (dataReady) {
                  console.log(
                    "Dashboard structure ready, waiting 10 seconds for data to load...",
                    {
                      hasStructure,
                      hasContentLength,
                      hasNumericData,
                      hasCurrencySymbols,
                      cardsWithData,
                      contentLength: textContent.length,
                      htmlLength: innerHTML.length,
                    }
                  );

                  // Wait 10 seconds for all API calls and data fetching to complete
                  // This ensures all dashboard metrics are populated before capture
                  setTimeout(() => {
                    // Final check - verify data is still present and populated
                    const finalText = dashboardContainer.textContent || "";
                    const finalCheck = finalText.trim().length > 500;

                    // Verify we still have numeric data after wait
                    const stillHasData =
                      /₹\s*\d+|Orders:\s*\d+|Revenue:\s*\d+|\d+[,\d]*\s*(Orders|Revenue|Sales|Spend)/i.test(
                        finalText
                      );

                    if (finalCheck && stillHasData) {
                      console.log("Data load complete after 10 second wait");
                      resolve();
                    } else {
                      console.log(
                        "Data check failed after wait, re-checking..."
                      );
                      // Re-check if data disappeared or not fully loaded
                      checkDashboardReady();
                    }
                  }, 10000); // Wait 10 seconds for data to fully load
                } else {
                  checkCount++;
                  if (checkCount >= maxChecks) {
                    reject(
                      new Error(
                        "Dashboard data not loaded - waiting for metrics and values to populate"
                      )
                    );
                    return;
                  }
                  setTimeout(checkDashboardReady, 500);
                }
              } catch (error: any) {
                // CORS or other errors
                if (error.message?.includes("Blocked a frame")) {
                  reject(
                    new Error(
                      "Cannot access iframe content due to CORS. Please ensure dashboard is on same origin."
                    )
                  );
                } else {
                  checkCount++;
                  if (checkCount >= maxChecks) {
                    reject(
                      new Error(
                        "Error checking dashboard: " +
                          (error.message || "Unknown error")
                      )
                    );
                    return;
                  }
                  setTimeout(checkDashboardReady, 500);
                }
              }
            };

            // Start checking after iframe starts loading
            iframe.onload = () => {
              // Wait longer for React to render and initial data to load
              setTimeout(() => checkDashboardReady(), 2000); // Increased from 1000ms to 2000ms
            };

            iframe.onerror = () =>
              reject(new Error("Failed to load dashboard iframe"));

            // Fallback: start checking even if onload doesn't fire
            setTimeout(() => {
              if (checkCount === 0) {
                checkDashboardReady();
              }
            }, 5000); // Increased from 3000ms to 5000ms

            // Overall timeout - increased to match maxChecks
            setTimeout(() => {
              if (checkCount < maxChecks) {
                reject(
                  new Error(
                    "Dashboard loading timeout after 30 seconds - data may still be loading"
                  )
                );
              }
            }, 30000); // Increased from 15 seconds to 30 seconds
          });

          // Try to capture from iframe
          // Suppress console warnings from html2canvas
          const originalWarn = console.warn;
          const originalError = console.error;
          console.warn = (...args) => {
            const msg = args[0]?.toString() || "";
            if (!msg.includes("oklch") && !msg.includes("color function")) {
              originalWarn(...args);
            }
          };
          console.error = (...args) => {
            const msg = args[0]?.toString() || "";
            if (!msg.includes("oklch") && !msg.includes("color function")) {
              originalError(...args);
            }
          };

          try {
            const iframeDocument =
              iframe.contentDocument || iframe.contentWindow?.document;
            if (!iframeDocument) {
              throw new Error("Cannot access iframe document");
            }

            const iframeDashboard = iframeDocument.querySelector(
              ".container"
            ) as HTMLElement;
            if (!iframeDashboard) {
              throw new Error("Dashboard container not found in iframe");
            }

            // Final verification that content is loaded with actual data
            const textContent = iframeDashboard.textContent || "";
            const innerHTML = iframeDashboard.innerHTML || "";

            // Check for actual numeric values (not just empty or placeholders)
            const hasNumericData =
              /₹\s*\d+|Orders:\s*\d+|Revenue:\s*\d+|\d+[,\d]*\s*(Orders|Revenue|Sales|Spend)/i.test(
                textContent
              );
            const hasCurrencySymbols =
              textContent.includes("₹") || textContent.includes("₹");
            const hasContentLength =
              textContent.trim().length > 500 || innerHTML.length > 2000;

            // Check for metric cards with data
            const metricCards = iframeDashboard.querySelectorAll(
              '[class*="rounded-md"], [class*="shadow-md"]'
            );
            let cardsWithData = 0;
            metricCards.forEach((card) => {
              const cardText = card.textContent || "";
              if (
                /₹\s*[1-9]\d*|₹\s*0[.,]\d+|[1-9]\d+[,\d]*(Orders|Revenue|Sales|Spend)/i.test(
                  cardText
                )
              ) {
                cardsWithData++;
              }
            });

            // Verify data is actually loaded
            if (
              !hasContentLength ||
              (!hasNumericData && !hasCurrencySymbols && cardsWithData < 2)
            ) {
              console.warn("Dashboard data verification failed:", {
                hasContentLength,
                hasNumericData,
                hasCurrencySymbols,
                cardsWithData,
                contentLength: textContent.length,
                htmlLength: innerHTML.length,
              });
              throw new Error(
                "Dashboard data not fully loaded - metrics and values are missing. Please wait for data to load and try again."
              );
            }

            console.log("Final data verification passed:", {
              hasNumericData,
              hasCurrencySymbols,
              cardsWithData,
              contentLength: textContent.length,
            });

            // Additional wait after verification to ensure data is stable and fully rendered
            // Wait 10 seconds to ensure all API calls complete and data is fully populated
            console.log(
              "Waiting 10 seconds for data to fully load and stabilize..."
            );
            toast.info("Waiting for dashboard data to load (10 seconds)...", {
              autoClose: 10000,
              style: {
                fontSize: "16px",
                fontWeight: "bold",
                borderRadius: "10px",
              },
            });

            await new Promise((resolve) => setTimeout(resolve, 10000));

            // Verify one more time that data is still present and populated
            const finalText = iframeDashboard.textContent || "";
            const finalVerification = finalText.trim().length > 500;
            const finalHasData =
              /₹\s*\d+|Orders:\s*\d+|Revenue:\s*\d+|\d+[,\d]*\s*(Orders|Revenue|Sales|Spend)/i.test(
                finalText
              );

            if (!finalVerification || !finalHasData) {
              console.error("Data verification failed after wait:", {
                hasLength: finalVerification,
                hasData: finalHasData,
                contentLength: finalText.length,
              });
              throw new Error(
                "Dashboard data not fully loaded after wait - please try again"
              );
            }

            console.log(
              "Data fully loaded and verified, proceeding with capture..."
            );

            // Ensure iframe body and html have enough height to show all content
            const iframeBody = iframeDocument.body;
            const iframeHtml = iframeDocument.documentElement;

            // Remove any height restrictions to get full content
            iframeBody.style.overflow = "visible";
            iframeBody.style.height = "auto";
            iframeBody.style.maxHeight = "none";
            const htmlEl = iframeHtml as HTMLElement;
            htmlEl.style.overflow = "visible";
            htmlEl.style.height = "auto";
            htmlEl.style.maxHeight = "none";

            // Wait for styles to apply
            await new Promise((resolve) => setTimeout(resolve, 100));

            // Get the actual content dimensions - use the maximum of all measurements
            const contentWidth = Math.max(
              iframeDashboard.scrollWidth || 0,
              iframeDashboard.offsetWidth || 0,
              iframeBody.scrollWidth || 0,
              iframeBody.offsetWidth || 0,
              htmlEl.scrollWidth || 0,
              htmlEl.offsetWidth || 0,
              1920 // Minimum width
            );

            const contentHeight = Math.max(
              iframeDashboard.scrollHeight || 0,
              iframeDashboard.offsetHeight || 0,
              iframeBody.scrollHeight || 0,
              iframeBody.offsetHeight || 0,
              htmlEl.scrollHeight || 0,
              htmlEl.offsetHeight || 0
            );

            console.log("Capturing dashboard from iframe...");
            console.log("Container dimensions:", {
              scrollWidth: iframeDashboard.scrollWidth,
              scrollHeight: iframeDashboard.scrollHeight,
              offsetWidth: iframeDashboard.offsetWidth,
              offsetHeight: iframeDashboard.offsetHeight,
              bodyScrollWidth: iframeBody.scrollWidth,
              bodyScrollHeight: iframeBody.scrollHeight,
              htmlScrollWidth: htmlEl.scrollWidth,
              htmlScrollHeight: htmlEl.scrollHeight,
              contentWidth,
              contentHeight,
              contentLength: iframeDashboard.innerHTML.length,
            });

            // Ensure container shows full content - remove all width/height constraints
            iframeDashboard.style.overflow = "visible";
            iframeDashboard.style.height = "auto";
            iframeDashboard.style.maxHeight = "none";
            iframeDashboard.style.width = "auto";
            iframeDashboard.style.maxWidth = "none";
            iframeDashboard.style.minWidth = "0";

            // Set iframe dimensions to match content (add padding for safety)
            // Use fixed pixel width to ensure consistent capture
            const iframeWidth = Math.max(contentWidth, 1920);
            const iframeHeight = Math.max(contentHeight + 200, 10000); // Extra padding
            iframe.style.width = `${iframeWidth}px`; // Use fixed width, not percentage
            iframe.style.height = `${iframeHeight}px`;

            console.log("Iframe dimensions set:", {
              width: iframeWidth,
              height: iframeHeight,
              contentWidth,
              contentHeight,
            });

            // Wait a moment for iframe to resize and re-render
            await new Promise((resolve) => setTimeout(resolve, 500));

            // Re-measure after resize
            const finalWidth = Math.max(
              iframeDashboard.scrollWidth || 0,
              iframeBody.scrollWidth || 0,
              contentWidth
            );
            const finalHeight = Math.max(
              iframeDashboard.scrollHeight || 0,
              iframeBody.scrollHeight || 0,
              contentHeight
            );

            // Limit maximum dimensions to prevent huge files (max 4000px width, 15000px height)
            const maxWidth = 4000;
            const maxHeight = 15000;
            const constrainedWidth = Math.min(finalWidth, maxWidth);
            const constrainedHeight = Math.min(finalHeight, maxHeight);

            // Calculate scale based on constrained dimensions (aim for smaller files)
            // Lower scale = smaller file size, but slightly lower quality
            const baseScale = 0.75; // Reduced from 1.5 to save space

            console.log("Final dimensions after resize:", {
              finalWidth,
              finalHeight,
              constrainedWidth,
              constrainedHeight,
              scale: baseScale,
            });

            // Capture from iframe with retry logic
            // IMPORTANT: Don't use width/height constraints - let html2canvas capture full element
            let canvas;
            try {
              canvas = await html2canvas(iframeDashboard as HTMLElement, {
                scale: baseScale, // Reduced scale for smaller file size
                useCORS: true,
                logging: false,
                backgroundColor: "#ffffff",
                allowTaint: true,
                foreignObjectRendering: false,
                imageTimeout: 0,
                // DO NOT set width/height - let it capture full element dimensions
                // width: constrainedWidth,  // REMOVED - was causing partial capture
                // height: constrainedHeight, // REMOVED - was causing partial capture
                // windowWidth: constrainedWidth,  // REMOVED
                // windowHeight: constrainedHeight, // REMOVED
                x: 0,
                y: 0,
                scrollX: 0,
                scrollY: 0,
                onclone: (clonedDoc, element) => {
                  // Ensure cloned element and body show full content - remove ALL constraints
                  const clonedBody = clonedDoc.body;
                  const clonedHtml = clonedDoc.documentElement;
                  const clonedElement = clonedDoc.querySelector(".container");

                  if (clonedBody) {
                    clonedBody.style.overflow = "visible";
                    clonedBody.style.height = "auto";
                    clonedBody.style.width = "auto";
                    clonedBody.style.maxWidth = "none";
                    clonedBody.style.minWidth = "0";
                  }
                  if (clonedHtml) {
                    clonedHtml.style.overflow = "visible";
                    clonedHtml.style.height = "auto";
                    clonedHtml.style.width = "auto";
                    clonedHtml.style.maxWidth = "none";
                    clonedHtml.style.minWidth = "0";
                  }
                  if (clonedElement) {
                    (clonedElement as HTMLElement).style.overflow = "visible";
                    (clonedElement as HTMLElement).style.height = "auto";
                    (clonedElement as HTMLElement).style.width = "auto";
                    (clonedElement as HTMLElement).style.maxWidth = "none";
                    (clonedElement as HTMLElement).style.minWidth = "0";
                  }

                  // Remove stylesheets with oklch
                  const styleSheets = clonedDoc.querySelectorAll(
                    'link[rel="stylesheet"], style'
                  );
                  styleSheets.forEach((sheet: any) => {
                    const content = sheet.textContent || sheet.innerHTML || "";
                    if (content.includes("oklch")) {
                      sheet.remove();
                    }
                  });
                },
              });
              console.log("Canvas created successfully:", {
                width: canvas.width,
                height: canvas.height,
              });
            } catch (firstError) {
              console.log(
                "First iframe capture attempt failed, trying fallback...",
                firstError
              );
              canvas = await html2canvas(iframeDashboard as HTMLElement, {
                scale: baseScale, // Use same reduced scale
                logging: false,
                backgroundColor: "#ffffff",
                allowTaint: true,
                useCORS: false,
                foreignObjectRendering: true,
                x: 0,
                y: 0,
                scrollX: 0,
                scrollY: 0,
                onclone: (clonedDoc) => {
                  // Ensure full content is visible - remove ALL width/height constraints
                  const clonedBody = clonedDoc.body;
                  const clonedHtml = clonedDoc.documentElement;
                  const clonedElement = clonedDoc.querySelector(".container");

                  if (clonedBody) {
                    clonedBody.style.overflow = "visible";
                    clonedBody.style.height = "auto";
                    clonedBody.style.width = "auto";
                    clonedBody.style.maxWidth = "none";
                    clonedBody.style.minWidth = "0";
                  }
                  if (clonedHtml) {
                    clonedHtml.style.overflow = "visible";
                    clonedHtml.style.height = "auto";
                    clonedHtml.style.width = "auto";
                    clonedHtml.style.maxWidth = "none";
                    clonedHtml.style.minWidth = "0";
                  }
                  if (clonedElement) {
                    (clonedElement as HTMLElement).style.overflow = "visible";
                    (clonedElement as HTMLElement).style.height = "auto";
                    (clonedElement as HTMLElement).style.width = "auto";
                    (clonedElement as HTMLElement).style.maxWidth = "none";
                    (clonedElement as HTMLElement).style.minWidth = "0";
                  }

                  const allElements = clonedDoc.querySelectorAll("*");
                  allElements.forEach((el: any) => {
                    if (el.style) {
                      const computedStyle = window.getComputedStyle(el);
                      el.style.color = computedStyle.color;
                      el.style.backgroundColor = computedStyle.backgroundColor;
                      el.style.borderColor = computedStyle.borderColor;
                    }
                  });
                },
              });
              console.log("Fallback canvas created:", {
                width: canvas.width,
                height: canvas.height,
              });
            }

            // Verify canvas has content
            if (!canvas || canvas.width === 0 || canvas.height === 0) {
              throw new Error("Canvas is empty - no content captured");
            }

            // Log canvas dimensions for debugging
            const actualContainerWidth =
              iframeDashboard.scrollWidth ||
              iframeDashboard.offsetWidth ||
              contentWidth;
            const expectedCanvasWidth = actualContainerWidth * baseScale;

            console.log("Canvas capture dimensions:", {
              canvasWidth: canvas.width,
              canvasHeight: canvas.height,
              containerScrollWidth: iframeDashboard.scrollWidth,
              containerOffsetWidth: iframeDashboard.offsetWidth,
              contentWidth: contentWidth,
              actualContainerWidth: actualContainerWidth,
              expectedCanvasWidth: expectedCanvasWidth,
              aspectRatio: canvas.width / canvas.height,
              baseScale: baseScale,
            });

            // Verify canvas captured full width (check if it matches container width)
            const widthDiff = Math.abs(canvas.width - expectedCanvasWidth);
            const widthDiffPercent = (widthDiff / expectedCanvasWidth) * 100;

            if (widthDiff > 50 || widthDiffPercent > 5) {
              // Allow 50px or 5% tolerance
              console.warn("Canvas width may not match container width!", {
                canvasWidth: canvas.width,
                containerWidth: actualContainerWidth,
                expectedCanvasWidth: expectedCanvasWidth,
                difference: widthDiff,
                differencePercent: widthDiffPercent.toFixed(2) + "%",
              });

              // If canvas is significantly narrower, it might be only capturing part of the dashboard
              if (canvas.width < expectedCanvasWidth * 0.8) {
                console.error(
                  "WARNING: Canvas width is less than 80% of expected width! Only partial dashboard may be captured."
                );
              }
            } else {
              console.log("✓ Canvas width matches container width correctly");
            }

            // Restore console
            console.warn = originalWarn;
            console.error = originalError;

            const imgData = canvas.toDataURL("image/jpeg", 0.85);

            if (!imgData || imgData === "data:,") {
              throw new Error("Failed to convert canvas to image");
            }

            // Log image size before PDF conversion
            const imgSizeMB = (imgData.length / 1024 / 1024).toFixed(2);
            console.log("Compressed image size:", imgSizeMB, "MB");

            // If image is still too large, try lower quality
            let quality = 0.85;
            let finalImgData = imgData;

            // If image data is > 50MB (before encoding), reduce quality further
            if (imgData.length > 50 * 1024 * 1024) {
              console.log("Image too large, reducing quality to 0.7...");
              quality = 0.9;
              finalImgData = canvas.toDataURL("image/jpeg", quality);
            }

            // If still too large, reduce quality more
            if (finalImgData.length > 50 * 1024 * 1024) {
              console.log("Image still too large, reducing quality to 0.6...");
              quality = 0.9;
              finalImgData = canvas.toDataURL("image/jpeg", quality);
            }

            const pdf = new jsPDF({
              orientation: "portrait",
              unit: "mm",
              format: "a4",
            });

            // A4 page dimensions in mm
            const pageWidth = 210; // Full width of A4 page
            const pageHeight = 297; // Full height of A4 page

            // Calculate aspect ratio of canvas
            const canvasAspectRatio = canvas.width / canvas.height;
            console.log("Canvas dimensions:", {
              width: canvas.width,
              height: canvas.height,
              aspectRatio: canvasAspectRatio,
            });

            // Calculate image dimensions on PDF - ensure it fits within page width
            // Scale to fit page width while maintaining aspect ratio
            let imgWidth = pageWidth; // Start with full page width
            let imgHeight = (canvas.height * imgWidth) / canvas.width; // Maintain aspect ratio

            // If image is wider than page, we need to scale down
            // Check if canvas aspect ratio suggests it's too wide
            const pageAspectRatio = pageWidth / pageHeight;

            // If canvas is wider than page aspect ratio, scale to fit width
            if (canvasAspectRatio > pageAspectRatio) {
              imgWidth = pageWidth;
              imgHeight = (canvas.height * imgWidth) / canvas.width;
            } else {
              // If canvas is taller, scale to fit width (which we're already doing)
              imgWidth = pageWidth;
              imgHeight = (canvas.height * imgWidth) / canvas.width;
            }

            // Calculate number of pages needed
            const totalPages = Math.ceil(imgHeight / pageHeight);

            console.log("PDF page calculation:", {
              canvasWidth: canvas.width,
              canvasHeight: canvas.height,
              canvasAspectRatio: canvasAspectRatio,
              pageAspectRatio: pageAspectRatio,
              imgWidth,
              imgHeightOnPDF: imgHeight,
              totalPages,
              pageHeight,
              pageWidth,
            });

            // Split image across pages correctly
            // Each page shows a section of the image using negative Y offset
            for (let pageNum = 0; pageNum < totalPages; pageNum++) {
              if (pageNum > 0) {
                pdf.addPage();
              }

              // Calculate the Y offset (negative value) to show the correct portion
              // This tells jsPDF which part of the image to display on this page
              const pageStartY = pageNum * pageHeight; // Where this page starts in the full image
              const negativeY = -pageStartY; // Negative offset to shift the image up

              // Height of image portion for this page (minimum of remaining or page height)
              const remainingHeight = imgHeight - pageStartY;
              const pageImageHeight = Math.min(remainingHeight, pageHeight);

              console.log(`Page ${pageNum + 1}/${totalPages}:`, {
                pageStartY,
                negativeY,
                pageImageHeight,
                remainingHeight,
                imgWidth,
                imgHeight,
              });

              // Add image to this page with negative Y offset
              // IMPORTANT: Ensure x position is 0 and width matches pageWidth to show full width
              // Use explicit source dimensions to ensure full width is captured
              const imageProps = {
                image: finalImgData,
                format: "JPEG",
                x: 0, // x position - always start at left edge
                y: negativeY, // y position (negative shifts image up to show lower portion)
                w: imgWidth, // image width on PDF - should be pageWidth (210mm) to show full width
                h: imgHeight, // full image height (negative Y handles vertical cropping)
              };

              console.log(`Adding image to page ${pageNum + 1}:`, imageProps);

              pdf.addImage(
                imageProps.image,
                imageProps.format,
                imageProps.x,
                imageProps.y,
                imageProps.w,
                imageProps.h
              );
            }

            pdfBase64 = pdf.output("datauristring") as string;

            // Log final PDF size
            const pdfSizeMB = (pdfBase64.length / 1024 / 1024).toFixed(2);
            console.log("PDF generated successfully, size:", pdfSizeMB, "MB");

            // Warn if still large but allow it (backend may handle differently)
            if (pdfBase64.length > 50 * 1024 * 1024) {
              console.warn(
                "PDF is still large (",
                pdfSizeMB,
                "MB). Consider splitting into multiple pages or further reducing scale."
              );
            }
          } catch (iframeError: any) {
            // Restore console in case of error
            console.warn = originalWarn;
            console.error = originalError;
            console.error("Iframe capture failed:", iframeError);
            throw iframeError;
          } finally {
            // Clean up iframe
            if (iframe && iframe.parentNode) {
              document.body.removeChild(iframe);
            }
          }

          if (!pdfBase64) {
            throw new Error("Failed to generate PDF");
          }
        } catch (captureError: any) {
          console.error("Dashboard capture error:", captureError);
          setIsSending(false);
          toast.error(`Capture failed: ${captureError.message}`, {
            autoClose: 5000,
            style: {
              fontSize: "16px",
              fontWeight: "bold",
              borderRadius: "10px",
            },
          });
          return;
        }

        if (!pdfBase64 || pdfBase64.length === 0) {
          toast.error("Failed to generate PDF. Please try again.", {
            autoClose: 5000,
            style: {
              fontSize: "16px",
              fontWeight: "bold",
              borderRadius: "10px",
            },
          });
          setIsSending(false);
          return;
        }

        console.log("Adding PDF to payload...");

        // Check PDF size (base64 is ~33% larger than binary)
        const pdfSizeMB = parseFloat(
          (pdfBase64.length / 1024 / 1024).toFixed(2)
        );
        console.log(`PDF size: ${pdfSizeMB} MB`);

        // Warn if PDF is still large (after compression optimizations)
        if (pdfBase64.length > 30 * 1024 * 1024) {
          // 30MB threshold
          toast.warning(
            `PDF is large (${pdfSizeMB} MB). Sending may take a moment...`,
            {
              autoClose: 4000,
              style: {
                fontSize: "16px",
                fontWeight: "bold",
                borderRadius: "10px",
              },
            }
          );
        } else if (pdfBase64.length > 20 * 1024 * 1024) {
          // 20MB threshold
          toast.info(`PDF size: ${pdfSizeMB} MB. Uploading...`, {
            autoClose: 2000,
            style: {
              fontSize: "16px",
              fontWeight: "bold",
              borderRadius: "10px",
            },
          });
        }

        payload.dashboard_pdf = pdfBase64;
        payload.dashboard_format = "PDF";
        payload.dashboard_prompt = dashboardPrompt;
        payload.advanced_insights = advancedInsights;
        console.log("Payload prepared with PDF attachment");
      } else if (activeTab === "Metrics") {
        // Map selected metrics to their values with format
        const metricsWithValues = selectedMetrics.map((metricName) => ({
          name: metricName,
          value: getMetricValue(metricName),
          format: getMetricFormat(metricName),
        }));

        payload.selected_metrics = selectedMetrics;
        payload.metrics_with_values = metricsWithValues;
      } else {
        // Dashboard with JSON format
        payload.dashboard_format = "JSON";
        payload.dashboard_prompt = dashboardPrompt;
        payload.advanced_insights = advancedInsights;
      }

      const token = localStorage.getItem("User_token");
      if (!token) {
        router.push("/auth/user/signin");
        return;
      }

      console.log("Sending request to backend...");
      console.log("Payload keys:", Object.keys(payload));
      console.log(
        "Payload size (approx):",
        JSON.stringify(payload).length,
        "bytes"
      );

      const response = await fetch("http://localhost:5000/api/reports/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      console.log("Response status:", response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("Backend error:", errorData);
        throw new Error(
          errorData.error ||
            errorData.message ||
            `Server error: ${response.status}`
        );
      }

      const responseData = await response.json();
      console.log("Success response:", responseData);

      toast.success("Report sent successfully!", {
        style: {
          fontSize: "16px",
          fontWeight: "bold",
          borderRadius: "10px",
        },
      });
    } catch (error: any) {
      console.error("Error sending report:", error);
      console.error("Error details:", {
        message: error.message,
        stack: error.stack,
        name: error.name,
      });

      toast.error(
        error.message || "Failed to send report. Check console for details.",
        {
          style: {
            fontSize: "16px",
            fontWeight: "bold",
            borderRadius: "10px",
          },
          autoClose: 5000,
        }
      );
    } finally {
      setIsSending(false);
    }
  };

  return (
    <>
      {/* ---------------- Header Section ---------------- */}
      <div className="px-2">
        <div className="container w-full max-w-7xl mt-10 mx-auto border rounded-md shadow-md px-4 py-6 font-custom relative">
          <div className="grid lg:grid-cols-2 gap-4 justify-between items-center">
            <div>
              <h2 className="font-semibold  text-2xl">Reports</h2>
              <p className="text-gray-800 mt-2">
                Regular, custom updates direct to your inbox
              </p>
            </div>

            <div className="flex sm:justify-end gap-3">
              <button className="border sm:px-4 px-2 py-2 rounded-md bg-[#1877f2] hover:bg-[#136ee6] text-white cursor-pointer">
                Connect to Slack
              </button>
              <button
                className="border sm:px-4 px-2 py-2 rounded-md bg-[#1877f2] hover:bg-[#136ee6] text-white cursor-pointer"
                onClick={() => {
                  resetForm(); // Reset form to clear any edit state
                  setReportModal(true);
                  setPageStatus({ message: "", type: "" }); // Clear page status when opening modal
                }}
              >
                + Create new report
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ------------ show reports --------------- */}
      <div className="w-full max-w-7xl mt-16 mx-auto font-custom px-2">
        <h2 className="text-2xl font-semibold mb-4">📊 Your Reports</h2>

        {reports.length === 0 ? (
          <p className="text-gray-600">No reports created yet.</p>
        ) : (
          <div className="grid grid-cols-1 gap-4 pb-8">
            {reports.map((report) => {
              const metrics = Array.isArray(report.selected_metrics)
                ? report.selected_metrics
                : JSON.parse(report.selected_metrics || "[]");

              return (
                <div
                  key={report.id}
                  className="bg-white shadow-md rounded-lg p-5 border border-gray-200 transition hover:shadow-lg"
                >
                  {/* Header */}
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      {report.report_title}
                      <span className="text-blue-500 cursor-pointer">📧</span>
                    </h3>
                    <div className="relative dropdown-container">
                      <button
                        className="text-gray-500 hover:text-blue-600 transition-colors"
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenDropdownId(
                            openDropdownId === report.id ? null : report.id
                          );
                        }}
                      >
                        <EllipsisVertical />
                      </button>
                      {openDropdownId === report.id && (
                        <div className="absolute right-0 top-8 mt-1 w-32 bg-white border border-gray-200 rounded-md shadow-lg z-10">
                          <button
                            className="w-full text-left font-custom font-semibold text-medium px-4 py-2  text-gray-600 hover:bg-gray-100 transition-colors flex items-center gap-2"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditReport(report);
                            }}
                          >
                            
                            Edit
                          </button>
                          <button
                            className="w-full font-custom font-semibold  text-left px-4 py-2 text-medium text-red-600 hover:bg-red-50 transition-colors flex items-center gap-2"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteReport(report.id);
                            }}
                          >                           
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <hr className="my-3" />

                  {/* Content */}
                  <div className="grid  md:grid-cols-2 lg:grid-cols-3 gap-2 text-md text-gray-700">
                    <div className="py-2">
                      <p>
                        {" "}
                        <strong>Store:</strong>{" "}
                      </p>
                      <p>{store}</p>
                    </div>
                    <div className="py-2">
                      <strong>Frequency:</strong>
                      <p>
                        {" "}
                        {report.report_frequency}, {report.time_of_day}
                      </p>
                    </div>
                    <div className="py-2">
                      <strong>Recipients:</strong>
                      <p>{report.recipients_email}</p>
                    </div>
                  </div>

                  <div className="mt-2 text-md text-gray-700">
                    <strong>Summary:</strong>{" "}
                    <span className="text-gray-800">
                      {metrics && metrics.length > 0
                        ? metrics.join(", ")
                        : "No metrics selected"}
                    </span>
                  </div>

                  <p className="mt-2 text-sm text-gray-700 py-2 ">
                    <strong>Created:</strong>{" "}
                    {new Date(report.created_at).toLocaleDateString()}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/*  Status Message on the Main Page  */}
      {pageStatus.message && (
        <div className="px-2">
          <div
            className={`container w-full max-w-7xl mt-4 mx-auto p-3 rounded-md text-sm text-center font-medium ${
              pageStatus.type === "success"
                ? "bg-green-100 text-green-700"
                : "bg-red-100 text-red-700"
            }`}
          >
            {pageStatus.message}
          </div>
        </div>
      )}

      {/* ---------------- Report Modal ---------------- */}
      {reportModal && (
        <div
          className="fixed inset-0 p-1 bg-black/40 backdrop-blur-sm font-custom flex justify-center items-center z-50"
          onClick={() => {
            setReportModal(false);
            setSearchQuery("");
          }}
        >
          <form
            className="bg-white rounded-lg shadow-lg p-6 w-full max-w-7xl relative overflow-x-auto overflow-scroll max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
            onSubmit={handleSubmit}
          >
            {/* ---------------- General Section ---------------- */}
            <h1 className="text-2xl font-semibold mb-2">
              {editingReportId ? "Edit Report" : "New Report"}
            </h1>
            <p className="text-gray-700 mb-4">
              Regular, custom updates direct to your inbox
            </p>

            <h2 className="text-xl font-semibold mb-3 mt-7">General</h2>
            <p className="text-gray-800 font-medium mb-2">Report title</p>
            <div className="max-w-md">
              <input
                type="text"
                className="border rounded-md px-2 py-2 pl-4 w-full mb-4 block border-gray-300"
                value={reportTitle}
                placeholder="Enter Title"
                onChange={(e) => setReportTitle(e.target.value)}
              />
            </div>

            {/* Send Report To */}
            <div>
              <p className="text-gray-800 font-medium mb-2 mt-7">
                Send report to
              </p>
              <div className="flex items-center gap-8 font-custom">
                <div className="flex items-center">
                  <Mail className="mr-3" size={16} />
                  <input
                    type="checkbox"
                    className="mr-2 h-4 w-4"
                    defaultChecked
                  />{" "}
                  Email
                </div>

                <div className="flex items-center">
                  <Image
                    src={slackImages}
                    alt="slack image"
                    height={20}
                    width={20}
                    className="mr-3"
                  />
                  <input type="checkbox" className="mr-2 h-4 w-4" /> Slack
                </div>
              </div>
            </div>

            {/* Frequency & Time */}
            <div className="flex flex-row sm:flex-row gap-4">
              <div>
                <p className="text-gray-800 font-medium mb-2 mt-7">
                  Report Frequency
                </p>
                <select
                  className="pl-6 pr-10 py-2 border rounded-md border-gray-300"
                  value={reportFrequency}
                  onChange={(e) => setReportFrequency(e.target.value)}
                >
                  <option value="Hourly">Hourly</option>
                  <option value="Daily">Daily</option>
                  <option value="Weekly">Weekly</option>
                  <option value="Monthly">Monthly</option>
                </select>
              </div>
              <div>
                <p className="text-gray-800 font-medium mb-2 mt-7">
                  Time of Day
                </p>
                <select
                  className="pl-6 pr-10 py-2 border rounded-md border-gray-300"
                  value={timeOfDay}
                  onChange={(e) => setTimeOfDay(e.target.value)}
                >
                  <option value="6:00 Am">6:00 Am</option>
                  <option value="9:00 Am">9:00 Am</option>
                  <option value="12:00 pm">12:00 pm</option>
                  <option value="3:00 pm">3:00 pm</option>
                  <option value="6:00 pm">6:00 pm</option>
                </select>
              </div>
            </div>

            {/* Email Input */}
            <div>
              <p className="text-gray-800 font-medium mb-2 mt-7">
                Email recipients (insert a comma in between recipients)
              </p>
              <div className="max-w-2xl">
                <input
                  type="text"
                  className="border rounded-md px-2 py-2 pl-4 w-full mb-4 block border-gray-300"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter Recipient Email..."
                />
              </div>
            </div>

            {/* Expanded Design Checkbox */}
            <div className="mt-7">
              <div className="flex justify-start items-center">
                <input type="checkbox" className="mr-2 h-4 w-4" />
                <p className="text-gray-800 font-medium">
                  Use expanded design for dashboards
                </p>
              </div>
            </div>

            <div className="my-7 border-b"></div>

            {/* ---------------- Metrics & dashboard ---------------- */}
            <div>
              {/* ---------- Tabs ---------- */}
              <div className="mt-10 flex gap-8 font-medium font-custom">
                <h3
                  onClick={() => setActiveTab("Metrics")}
                  className={`relative cursor-pointer ${
                    activeTab === "Metrics"
                      ? "after:content-[''] after:absolute after:left-0 after:top-7 after:w-full after:h-[3px] after:bg-blue-500"
                      : ""
                  }`}
                >
                  Metrics
                </h3>

                <h3
                  onClick={() => setActiveTab("Dashboard")}
                  className={`relative cursor-pointer ${
                    activeTab === "Dashboard"
                      ? "after:content-[''] after:absolute after:left-0 after:top-7 after:w-full after:h-[3px] after:bg-blue-500"
                      : ""
                  }`}
                >
                  Dashboard
                </h3>
              </div>

              {/* ---------- Show this part ONLY when Dashboard is active  ---------- */}
              {activeTab === "Dashboard" && (
                <div>
                  <p className="text-gray-800 font-medium mb-2 mt-6">Prompt</p>
                  <div className="max-w-2xl">
                    <input
                      type="text"
                      className="border rounded-md px-2 py-2 pl-4 w-full mb-4 block border-gray-300"
                      value={dashboardPrompt}
                      onChange={(e) => setDashboardPrompt(e.target.value)}
                      placeholder="Enter dashboard prompt (optional)"
                    />
                  </div>
                  <div>
                    <input
                      type="checkbox"
                      checked={advancedInsights}
                      onChange={(e) => setAdvancedInsights(e.target.checked)}
                    />{" "}
                    <span className="pl-1">Provide advanced insights?</span>
                  </div>
                  <div className="flex flex-col py-2">
                    <label className="py-2">
                      How would you like to send the dashboard?
                    </label>
                    <select
                      className="p-2 border rounded-md max-w-2xl"
                      value={dashboardFormat}
                      onChange={(e) => setDashboardFormat(e.target.value)}
                    >
                      <option value="PDF">PDF</option>
                      <option value="JSON">JSON</option>
                    </select>
                  </div>
                </div>
              )}

              {/* ---------- Show this part ONLY when Metrics tab is active ---------- */}
              {activeTab === "Metrics" && (
                <>
                  <div className="max-w-md mt-6 relative">
                    <input
                      type="text"
                      className="border rounded-md px-2 pl-8 py-2 w-full mb-4 block border-gray-300"
                      placeholder="Search Metrics"
                      value={searchQuery}
                      onChange={(e) => handleSearch(e.target.value)}
                    />
                    <Search
                      className="absolute top-3 text-gray-500 left-2"
                      size={18}
                    />
                  </div>

                  {/* ---------- Summary Accordion ---------- */}
                  <div className="rounded-md mt-4">
                    <button
                      onClick={() => setShowSummary(!showSummary)}
                      className="w-full text-left py-2 flex justify-between items-center font-medium relative"
                      type="button"
                    >
                      <span className="bg-gray-100 w-full p-3 rounded-md">
                        Summary
                      </span>
                      <ChevronDown
                        size={18}
                        className={`text-gray-600 absolute right-6 transform transition-transform duration-300 ${
                          showSummary ? "rotate-180" : "rotate-0"
                        }`}
                      />
                    </button>

                    <div
                      className={`transition-all duration-500 ease-in-out overflow-hidden ${
                        showSummary
                          ? "max-h-[1000px] opacity-100 py-4"
                          : "max-h-0 opacity-0 py-0"
                      }`}
                    >
                      <div className="px-6 space-y-6 text-gray-800">
                        {/* ---------- Custom Metrics Nested Accordion ---------- */}
                        <div className="rounded-md">
                          <button
                            onClick={() =>
                              setShowCustomMetrics((prev) => !prev)
                            }
                            className="w-full text-left flex items-center justify-between"
                            type="button"
                          >
                            <span className="flex items-center gap-2 font-semibold">
                              📊 Custom Metrics
                            </span>
                            <ChevronDown
                              size={18}
                              className={`text-gray-600 transform transition-transform duration-300 ${
                                showCustomMetrics ? "rotate-180" : "rotate-0"
                              }`}
                            />
                          </button>

                          <div
                            className={`transition-all duration-500 ease-in-out overflow-hidden ${
                              showCustomMetrics
                                ? "max-h-[600px] opacity-100 mt-4"
                                : "max-h-0 opacity-0 mt-0"
                            }`}
                          >
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-md text-gray-700 mt-2 ml-6">
                              <MetricCheckbox
                                label="All Custom Metrics metrics"
                                value="All Custom Metrics metrics"
                              />
                              <MetricCheckbox
                                label="Net Profit"
                                value="Net Profit"
                              />
                              <MetricCheckbox
                                label="Blended ROAS"
                                value="Blended ROAS"
                              />
                              <MetricCheckbox label="MER" value="MER" />
                              <MetricCheckbox
                                label="Net Margin"
                                value="Net Margin"
                              />
                              <MetricCheckbox
                                label="Blended Ad Spend"
                                value="Blended Ad Spend"
                              />
                              <MetricCheckbox
                                label="Blended Sales"
                                value="Blended Sales"
                              />
                              <MetricCheckbox
                                label="Returns %"
                                value="Returns %"
                              />
                              <MetricCheckbox
                                label="Profit on Ad Spend"
                                value="Profit on Ad Spend"
                              />
                            </div>
                          </div>
                        </div>

                        {/* ---------- Store Summary ---------- */}
                        <div>
                          <button
                            onClick={() =>
                              setShowStoreMetrics(!showStoreMetrics)
                            }
                            className="w-full text-left flex justify-between items-center font-medium relative"
                            type="button"
                          >
                            <span className="w-full rounded-md flex items-center gap-2">
                              <img
                                src="https://cdn-icons-png.flaticon.com/512/5968/5968866.png"
                                alt="WooCommerce Icon"
                                className="w-4 h-4"
                              />
                              Store Metrics
                            </span>
                            <ChevronDown
                              size={18}
                              className={`text-gray-600 transform transition-transform duration-300 ${
                                showStoreMetrics ? "rotate-180" : "rotate-0"
                              }`}
                            />
                          </button>

                          <div
                            className={`overflow-hidden transition-all duration-500 ease-in-out ${
                              showStoreMetrics
                                ? "max-h-[500px] opacity-100"
                                : "max-h-0 opacity-0"
                            }`}
                          >
                            <div className="px-6 py-4 text-gray-800 grid sm:grid-cols-2 md:grid-cols-3 gap-y-2">
                              <MetricCheckbox
                                label="All Store metrics"
                                value="All Store metrics"
                              />
                              <MetricCheckbox
                                label="Order Revenue"
                                value="Order Revenue"
                              />
                              <MetricCheckbox label="Orders" value="Orders" />
                              <MetricCheckbox label="Returns" value="Returns" />
                              <MetricCheckbox
                                label="True AOV"
                                value="True AOV"
                              />
                              <MetricCheckbox
                                label="Average Order Value"
                                value="Average Order Value"
                              />
                              <MetricCheckbox
                                label="Total Sales"
                                value="Total Sales"
                              />
                            </div>
                          </div>
                        </div>

                        <p className="font-semibold">📈 Top KPIs Metrics</p>
                        <p className="font-semibold">📦 Custom Order Metrics</p>

                        {/* ---------- Meta Ads ---------- */}
                        <div>
                          <button
                            onClick={() =>
                              setShowFacebookMetrics(!showFacebookMetrics)
                            }
                            className="w-full text-left flex justify-between items-center font-medium relative"
                            type="button"
                          >
                            <span className="w-full rounded-md flex items-center gap-2">
                              <Image
                                src={metaImage}
                                alt="Meta Icon"
                                className="w-4 h-4"
                              />
                              Meta Ads Metrics
                            </span>
                            <ChevronDown
                              size={18}
                              className={`text-gray-600 transform transition-transform duration-300 ${
                                showFacebookMetrics ? "rotate-180" : "rotate-0"
                              }`}
                            />
                          </button>

                          <div
                            className={`overflow-hidden transition-all duration-500 ease-in-out ${
                              showFacebookMetrics
                                ? "max-h-[500px] opacity-100"
                                : "max-h-0 opacity-0"
                            }`}
                          >
                            <div className="px-6 py-4 text-gray-800 grid sm:grid-cols-2 md:grid-cols-3 gap-y-2">
                              <MetricCheckbox
                                label="All Meta Ads metrics"
                                value="All Meta Ads metrics"
                              />
                              <MetricCheckbox
                                label="Facebook Ads Spend"
                                value="Facebook Ads Spend"
                              />
                              <MetricCheckbox
                                label="Facebook ROAS"
                                value="Facebook ROAS"
                              />
                            </div>
                          </div>
                        </div>

                        <p className="font-semibold">
                          💳 WooCommerce Subscriptions Metrics
                        </p>

                        {/* ---------- Klaviyo Metrics ---------- */}
                        <div>
                          <button
                            onClick={() =>
                              setShowKlaviyoMetrics(!showKlaviyoMetrics)
                            }
                            className="w-full text-left flex justify-between items-center font-medium relative"
                            type="button"
                          >
                            <span className="w-full rounded-md flex items-center gap-2">
                              <Image
                                src={klaviyoImage}
                                alt="Klaviyo Image"
                                className="w-6 h-6"
                              />
                              Klaviyo Metrics
                            </span>
                            <ChevronDown
                              size={18}
                              className={`text-gray-600 transform transition-transform duration-300 ${
                                showKlaviyoMetrics ? "rotate-180" : "rotate-0"
                              }`}
                            />
                          </button>

                          <div
                            className={`overflow-hidden transition-all duration-500 ease-in-out ${
                              showKlaviyoMetrics
                                ? "max-h-[500px] opacity-100"
                                : "max-h-0 opacity-0"
                            }`}
                          >
                            <div className="px-6 py-4 text-gray-800 grid sm:grid-cols-2 md:grid-cols-3 gap-y-2">
                              <MetricCheckbox
                                label="All Klaviyo metrics"
                                value="All Klaviyo metrics"
                              />
                              <MetricCheckbox
                                label="Revenue Flows"
                                value="Revenue Flows"
                              />
                              <MetricCheckbox
                                label="Percent of Revenue Flows"
                                value="Percent of Revenue Flows"
                              />
                              <MetricCheckbox
                                label="Revenue Campaigns"
                                value="Revenue Campaigns"
                              />
                              <MetricCheckbox
                                label="klaviyo Total Revenue"
                                value="klaviyo Total Revenue"
                              />
                              <MetricCheckbox
                                label="Klaviyo Sales %"
                                value="Klaviyo Sales %"
                              />
                            </div>
                          </div>
                        </div>

                        <p className="font-semibold">⚡ Affluencer Metrics</p>

                        {/* ---------- Expense Metrics ---------- */}
                        <div>
                          <button
                            onClick={() =>
                              setShowExpenseMetrics(!showExpenseMetrics)
                            }
                            className="w-full text-left flex justify-between items-center font-medium relative"
                            type="button"
                          >
                            <span className="w-full rounded-md flex items-center gap-2">
                              💰 Expenses Metrics
                            </span>
                            <ChevronDown
                              size={18}
                              className={`text-gray-600 transform transition-transform duration-300 ${
                                showExpenseMetrics ? "rotate-180" : "rotate-0"
                              }`}
                            />
                          </button>

                          <div
                            className={`overflow-hidden transition-all duration-500 ease-in-out ${
                              showExpenseMetrics
                                ? "max-h-[500px] opacity-100"
                                : "max-h-0 opacity-0"
                            }`}
                          >
                            <div className="px-6 py-4 text-gray-800 grid sm:grid-cols-2 md:grid-cols-3 gap-y-2">
                              <MetricCheckbox
                                label="All Expenses metrics"
                                value="All Expenses metrics"
                              />
                              <MetricCheckbox label="COGS" value="COGS" />
                              <MetricCheckbox
                                label="Handling Fees"
                                value="Handling Fees"
                              />
                              <MetricCheckbox
                                label="Shipping"
                                value="Shipping"
                              />
                              <MetricCheckbox
                                label="Custom Expenses"
                                value="Custom Expenses"
                              />
                              <MetricCheckbox
                                label="Custom Net Revenue"
                                value="Custom Net Revenue"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* ---------- Pixel Accordion ---------- */}
                  <div className="rounded-md mt-4">
                    <button
                      onClick={() => setShowPixel(!showPixel)}
                      className="w-full text-left py-2 flex justify-between items-center font-medium relative"
                      type="button"
                    >
                      <span className="bg-gray-100 w-full p-3 rounded-md">
                        Pixel
                      </span>
                      <ChevronDown
                        size={18}
                        className={`text-gray-600 absolute right-6 transform transition-transform duration-300 ${
                          showPixel ? "rotate-180" : "rotate-0"
                        }`}
                      />
                    </button>

                    <div
                      className={`transition-all duration-500 ease-in-out overflow-hidden ${
                        showPixel
                          ? "max-h-[300px] opacity-100 py-4"
                          : "max-h-0 opacity-0 py-0"
                      }`}
                    >
                      <div className="px-6 space-y-8 text-gray-800">
                        <p className="w-full font-semibold rounded-md flex items-center gap-2">
                          <Image
                            src={metaImage}
                            alt="Meta Image"
                            className="w-4 h-4"
                          />
                          Meta Metrics
                        </p>
                        <p className="w-full font-semibold rounded-md flex items-center gap-2">
                          <Image
                            src={yotpoImage}
                            alt="Yotpo Image"
                            className="w-4 h-4"
                          />
                          Yotpo SMS and Email Metrics
                        </p>
                        <p className="w-full font-semibold rounded-md flex items-center gap-2">
                          <Image
                            src={klaviyoImage}
                            alt="Klaviyo Image"
                            className="w-6 h-6"
                          />
                          Klaviyo Metrics
                        </p>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* ---------------- Status Message (Modal-Specific Error/Validation) ---------------- */}
            {modalStatus.message && (
              <div
                className={`mt-4 p-3 rounded-md text-sm text-center font-medium ${
                  modalStatus.type === "success"
                    ? "bg-green-100 text-green-700"
                    : "bg-red-100 text-red-700"
                }`}
              >
                {modalStatus.message}
              </div>
            )}

            {/* ---------------- Send Now Button ---------------- */}
            <div>
              <button
                className="mt-6 px-4 py-2 border-gray-300 text-[#1877f2] cursor-pointer border-2 rounded-md flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                type="button"
                onClick={handleSendNow}
                disabled={isSending}
              >
                {isSending ? (
                  <>
                    <svg
                      className="animate-spin h-5 w-5 text-[#1877f2]"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Sending...
                  </>
                ) : (
                  "Send Now"
                )}
              </button>

              <p className="py-5 px-1">
                Click 'Send now' to receive your first report immediately.
              </p>
            </div>

            {/* ---------------- Close and Submit Buttons ---------------- */}
            <div className="flex gap-3 justify-end">
              <button
                className="mt-6 px-4 py-2  text-[#1877f2] cursor-pointer border border-black rounded-md"
                onClick={() => {
                  setReportModal(false);
                  setSearchQuery("");
                }}
                type="button"
              >
                Close
              </button>
              <button
                className="mt-6 px-4 py-2 bg-[#1877f2] hover:bg-[#136ee6] cursor-pointer text-white rounded-md flex items-center justify-center disabled:bg-[#a8c6f7]"
                type="submit"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <svg
                      className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    {editingReportId ? "Updating..." : "Submitting..."}
                  </>
                ) : editingReportId ? (
                  "Update"
                ) : (
                  "Submit"
                )}
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
