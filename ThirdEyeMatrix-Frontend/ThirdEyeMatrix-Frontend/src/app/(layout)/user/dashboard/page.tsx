"use client";
import { BanknoteArrowDown, IndianRupee, LayoutGrid } from "lucide-react";
import Image from "next/image";
import woocommerceImage from "@/assets/images/WooCommerce.svg";
import shopifyImage from "@/assets/images/shopify.svg";
import magentoImage from "@/assets/images/magentoLogoImage.png";
import metaAdsImage from "@/assets/images/meta.png";
import CustomMatrix from "@/components/user-dashboard-sections/custom-metrix";
import MetricTooltip from "@/components/user-dashboard-sections/metric-tooltip";
import KlaviyoSection from "@/components/user-dashboard-sections/klaviyo";
import WebAnalysisSection from "@/components/user-dashboard-sections/web-analysis";
import GoogleAdsSection from "@/components/user-dashboard-sections/google-ads";
import { useDashboard } from "@/contexts/DashboardContext";
import { BeatLoader } from "react-spinners";
import { useState, useEffect } from "react";

// Helper function to get currency symbol
const getCurrencySymbol = (currencyCode: string | null | undefined): string => {
  if (!currencyCode) return "₹"; // Default to INR

  const currencyMap: { [key: string]: string } = {
    CHF: "CHF",
    USD: "$",
    EUR: "€",
    GBP: "£",
    INR: "₹",
    JPY: "¥",
    CNY: "¥",
    CAD: "C$",
    AUD: "A$",
    NZD: "NZ$",
    SGD: "S$",
    HKD: "HK$",
    KRW: "₩",
    MXN: "$",
    BRL: "R$",
    ZAR: "R",
    SEK: "kr",
    NOK: "kr",
    DKK: "kr",
    PLN: "zł",
    TRY: "₺",
    RUB: "₽",
    THB: "฿",
    MYR: "RM",
    IDR: "Rp",
    PHP: "₱",
    VND: "₫",
  };

  return currencyMap[currencyCode.toUpperCase()] || currencyCode;
};

// ---------- Shopify ----------
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

  // Array of refunded line items
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

// ---------- WooCommerce ----------
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
  subtotal: string; // subtotal for this item
  total: string; // total after any line-item discount
  tax?: string;
  [key: string]: any; // for any other optional fields
}
interface WooRefund {
  id: number;
  total: string; // refunded amount
  refund_tax?: string; // refunded tax
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

// ---------- Magento ----------
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
  subtotal: string; // subtotal of the order (without tax)
  grand_total: string; // total including tax and shipping
  discount_amount: string;
  tax_amount: string;
  shipping_amount: string;
  state: string; // order status (complete, processing, pending, etc.)
  created_at: string;
  refunds?: MagentoRefund[]; // optional refunds array
}

type Platform = "Shopify" | "Woocommerce" | "Magento" | null;

//  Main Component
export default function Dashboard() {
  const {
    platform,
    storeCurrency,
    data,
    metaSpend,
    isLoading,
    magentoPagination,
  } = useDashboard();

  const [showCompletionMessage, setShowCompletionMessage] = useState(true);

  const currencySymbol = getCurrencySymbol(storeCurrency);

  // Hide completion message after 5 seconds when all records are fetched
  useEffect(() => {
    if (
      platform === "Magento" &&
      magentoPagination.currentPage > 0 &&
      !magentoPagination.hasMore &&
      !magentoPagination.isLoadingPage
    ) {
      setShowCompletionMessage(true);
      const timer = setTimeout(() => {
        setShowCompletionMessage(false);
      }, 5000); // Hide after 5 seconds

      return () => clearTimeout(timer);
    } else {
      setShowCompletionMessage(true);
    }
  }, [
    platform,
    magentoPagination.currentPage,
    magentoPagination.hasMore,
    magentoPagination.isLoadingPage,
  ]);

  /* -------- WooCommerce calculation start -------- */

  const getOrderRevenue = (order: WooOrder) => {
    const grossSales = order.line_items.reduce(
      (sum, item) => sum + parseFloat(item.subtotal || "0"),
      0
    );
    const discounts = parseFloat(order.discount_total || "0");

    // Include shipping only for relevant statuses
    const shipping =
      order.status === "completed" ||
      order.status === "processing" ||
      order.status === "on-hold"
        ? parseFloat(order.shipping_total || "0")
        : 0;

    const tax = parseFloat(order.total_tax || "0");

    return grossSales - discounts + shipping + tax;
  };

  const customWoocommerceOrderRevenue = (order: WooOrder) => {
    // Calculate gross sales from all line items
    const grossSales = (order.line_items || []).reduce(
      (sum, item) => sum + parseFloat(item?.subtotal || "0"),
      0
    );

    const discounts = parseFloat(order?.discount_total || "0");
    const shippingRevenue = parseFloat(order?.shipping_total || "0"); // what customer paid
    const tax = parseFloat(order?.total_tax || "0");

    // Revenue from customer (Triple Whale "Order Revenue")
    const orderRevenue = grossSales - discounts + shippingRevenue + tax;

    return {
      orderRevenue,
    };
  };

  const getRefundsExcludingTax = (order: WooOrder) => {
    if (!order.refunds || order.refunds.length === 0) return 0;
    return order.refunds.reduce(
      (sum, refund) => sum + parseFloat(refund.total || "0"), // exclude refund.tax
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

  const totalShipping = allOrders.reduce(
    (sum, order) => sum + parseFloat(order.shipping_total || "0"),
    0
  );

  const shippingCost = allOrders.reduce((sum, order) => {
    // Include shipping only for completed, processing, or on-hold orders
    if (
      order.status === "completed" ||
      order.status === "processing" ||
      order.status === "on-hold"
    ) {
      return sum + parseFloat(order.shipping_total || "0");
    }
    return sum; // ignore other statuses
  }, 0);

  // Total tax across all orders
  const totalTax = allOrders.reduce(
    (sum, order) => sum + parseFloat(order.total_tax || "0"),
    0
  );

  //  total number of orders
  const totalOrders = data.woocommerce.orders.length;

  const averageOrderValue =
    totalOrders > 0
      ? (totalOrderRevenue - shippingCost - totalTax) / totalOrders
      : 0;

  // True Average Order Value (AOV)

  const trueAOVOrders = allOrders
    .map((order) => {
      const orderRevenue = getOrderRevenue(order);
      const netRevenue =
        orderRevenue -
        parseFloat(order.shipping_total || "0") -
        parseFloat(order.total_tax || "0");
      return netRevenue; // only include positive orders
    })
    .filter((netRevenue) => netRevenue > 0); // remove zero or negative orders

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

  /* -------- WooCommerce calculation end -------- */

  /*---------- Shopify calculaion Start -------- */

  //  Total number of orders
  const totalShopifyOrders = data.shopify.orders.length;

  // Shopify Order Revenue
  const getShopifyOrderRevenue = (order: ShopifyOrder) => {
    const grossSales = parseFloat(order.total_price || "0");

    const discounts = parseFloat(order.total_discounts || "0");

    const shipping =
      order.financial_status === "paid"
        ? parseFloat(order.total_shipping_price_set?.shop_money?.amount || "0")
        : 0;

    const tax = parseFloat(order.total_tax || "0");

    // Final revenue calculation (same logic as WooCommerce)
    return grossSales - discounts + shipping + tax;
  };

  const customShopifyOrderRevenue = (order: ShopifyOrder) => {
    const grossSales = parseFloat(order?.total_price || "0");

    const discounts = parseFloat(order?.total_discounts || "0");

    const shippingRevenue =
      order?.financial_status === "paid"
        ? parseFloat(order?.total_shipping_price_set?.shop_money?.amount || "0")
        : 0;

    const tax = parseFloat(order?.total_tax || "0");

    const orderRevenue = grossSales - discounts + shippingRevenue + tax;

    return {
      orderRevenue,
    };
  };

  const allShopifyOrders = data.shopify.orders;

  const totalShopifyOrderRevenue = allShopifyOrders.reduce(
    (sum, order) => sum + getShopifyOrderRevenue(order),
    0
  );

  // calculate total sales (including tax, minus discount)
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
        ) || 0; //

      return sum + refundTotal;
    }, 0);
  };

  const shopifyTotalSales = allShopifyOrders.reduce(
    (sum, order) =>
      sum +
      (getShopifyOrderRevenue(order) - getShopifyRefundsExcludingTax(order)),
    0
  );

  //  Average Order Value (AOV)
  const totalRevenue = allShopifyOrders.reduce(
    (sum, order) => sum + getShopifyOrderRevenue(order),
    0
  );

  const overallAOV =
    allShopifyOrders.length > 0 ? totalRevenue / allShopifyOrders.length : 0;

  //  True AOV (based on paid orders)
  const paidOrders = allShopifyOrders.filter(
    (order) => order.financial_status === "paid"
  );

  const totalRevenuePaid = paidOrders.reduce(
    (sum, order) => sum + getShopifyOrderRevenue(order),
    0
  );

  const shopifyTrueAOV =
    paidOrders.length > 0 ? totalRevenuePaid / paidOrders.length : 0;

  /* --------- Shopify calculaion End ----------  */

  /*---------- Magento calculaion Start -------- */
  // Total number of orders
  const totalMagentoOrders = data.magento.orders.length;

  // Function to calculate Magento order revenue (like WooCommerce)
  const getMagentoOrderRevenue = (order: MagentoOrder) => {
    const grossSales = parseFloat(order.subtotal || "0"); // subtotal without tax
    const discounts = parseFloat(order.discount_amount || "0"); // discounts
    const shipping =
      order.state === "complete" || order.state === "processing"
        ? parseFloat(order.shipping_amount || "0")
        : 0;
    const tax = parseFloat(order.tax_amount || "0"); // tax

    // Revenue = subtotal - discount + shipping + tax
    return grossSales - discounts + shipping + tax;
  };

  // Total revenue (all orders)
  const totalMagentoRevenue = data.magento.orders.reduce(
    (sum, order) => sum + getMagentoOrderRevenue(order),
    0
  );

  // Refunds (exclude tax)
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

  // Total sales (after refunds)
  const totalMagentoSales = data.magento.orders.reduce(
    (sum, order) =>
      sum +
      (getMagentoOrderRevenue(order) - getMagentoRefundsExcludingTax(order)),
    0
  );

  // Shipping cost for completed/processing orders
  const magentoShippingCost = data.magento.orders.reduce((sum, order) => {
    if (order.state === "complete" || order.state === "processing") {
      return sum + parseFloat(order.shipping_amount || "0");
    }
    return sum;
  }, 0);

  // Overall Average Order Value (AOV) - all orders
  const magentoOverallAOV =
    totalMagentoOrders > 0
      ? (totalMagentoRevenue -
          magentoShippingCost -
          data.magento.orders.reduce(
            (sum, o) => sum + parseFloat(o.tax_amount || "0"),
            0
          )) /
        totalMagentoOrders
      : 0;

  // True AOV (only completed/processing orders)
  const completedOrders = data.magento.orders.filter(
    (order) => order.state === "complete" || order.state === "processing"
  );

  const magentoTotalNetRevenue = completedOrders.reduce((sum, order) => {
    const netRevenue =
      getMagentoOrderRevenue(order) -
      parseFloat(order.shipping_amount || "0") -
      parseFloat(order.tax_amount || "0");
    return netRevenue > 0 ? sum + netRevenue : sum;
  }, 0);

  const magentoTrueAOV =
    completedOrders.length > 0
      ? magentoTotalNetRevenue / completedOrders.length
      : 0;

  /* --------- Magento calculaion End ----------  */

  /*------------- custom matrix calculation --------------*/
  const customAdsSpend = Math.round(metaSpend);
  const customOrderRevenue = Math.round(
    data.woocommerce.orders.reduce(
      (sum, order) => sum + getOrderRevenue(order),
      0
    ) +
      data.shopify.orders.reduce(
        (sum, order) => sum + getShopifyOrderRevenue(order),
        0
      ) +
      data.magento.orders.reduce(
        (sum, order) => sum + getMagentoOrderRevenue(order),
        0
      )
  );
  const customNetProfit = Math.round(customOrderRevenue - customAdsSpend);
  // Only calculate MER and Net Margin if order revenue is greater than 0 to avoid division by zero
  const customMER =
    customOrderRevenue > 0
      ? Math.round((customAdsSpend / customOrderRevenue) * 100)
      : 0;
  const customNetMargin =
    customOrderRevenue > 0
      ? Math.round((customNetProfit / customOrderRevenue) * 100)
      : 0;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[80vh]">
        <div className="text-lg font-medium text-gray-700">
          <BeatLoader />
        </div>
      </div>
    );
  }

  return (
    <div className="container p-4 max-w-7xl mx-auto">
      <div className=" mx-auto">
        <CustomMatrix
          customAdsSpend={customAdsSpend}
          customNetProfit={customNetProfit}
          customMER={customMER}
          customNetMargin={customNetMargin}
        />
        <KlaviyoSection />
      </div>
      {/* -------- Shopify -------- */}
      {platform === "Shopify" && (
        <>
          <div className=" mx-auto">
            <div className=" mx-auto mt-8">
              <div className="flex justify-start items-center gap-2">
                <Image
                  src={shopifyImage}
                  alt="shopify image"
                  height={20}
                  width={20}
                />{" "}
                <h2 className="font-semibold font-custom text-xl  ">Store</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 py-5 ">
                <div className="border rounded-md px-4 pb-10 pt-2 shadow-md">
                  <MetricTooltip
                    message={`The total revenue after adjustments such as discounts, shipping, fees, and taxes (but before refunds).

                    Order Revenue = Gross Sales - Discounts + Shipping + Tax`}
                  >
                    <h3 className="font-custom text-md font-semibold text-gray-500 flex items-center justify-start gap-2">
                      <Image
                        src={shopifyImage}
                        alt="shopify image"
                        height={16}
                        width={16}
                      />{" "}
                      Order Revenue
                    </h3>
                  </MetricTooltip>
                  <div className="flex justify-start items-center gap-0 text-sm py-2">
                    {" "}
                    <span className="text-2xl font-semibold mr-2">
                      {currencySymbol}
                    </span>{" "}
                    <p className="text-2xl font-semibold">
                      {Math.round(totalShopifyOrderRevenue)}
                    </p>{" "}
                  </div>
                </div>
                <div className="border rounded-md px-4 pb-10 pt-2 shadow-md">
                  <MetricTooltip
                    message={`The average non-zero order value, excluding shipping and taxes, as reported by Shopify.

                    True AOV = (Order Revenue - Shipping Price - Taxes) / Number of Orders > $0`}
                  >
                    <h3 className="font-custom text-md font-semibold text-gray-500 flex items-center justify-start gap-2">
                      <Image
                        src={shopifyImage}
                        alt="shopify image"
                        height={16}
                        width={16}
                      />{" "}
                      True AOV
                    </h3>
                  </MetricTooltip>
                  <div className="flex justify-start items-center gap-0 text-2xl py-2">
                    <span className="text-2xl font-semibold mr-2">
                      {currencySymbol}
                    </span>{" "}
                    <p className="text-2xl font-semibold">
                      {Math.round(shopifyTrueAOV)}
                    </p>
                  </div>
                </div>
                <div className="border rounded-md px-4 pb-10 pt-2 shadow-md">
                  <MetricTooltip
                    message={`The average order value, excluding shipping and taxes, as reported by Shopify.

                    AOV = (Order Revenue - Shipping Price - Taxes) / Number of Orders`}
                  >
                    <h3 className="font-custom text-md font-semibold text-gray-500 flex items-center justify-start gap-2">
                      <Image
                        src={shopifyImage}
                        alt="shopify image"
                        height={16}
                        width={16}
                      />{" "}
                      Avarage Order Value
                    </h3>
                  </MetricTooltip>
                  <div className="flex justify-start items-center gap-0 text-2xl py-2">
                    <span className="text-2xl font-semibold mr-2">
                      {currencySymbol}
                    </span>{" "}
                    <p className="text-2xl font-semibold">
                      {Math.round(overallAOV)}
                    </p>
                  </div>
                </div>
                <div className="border rounded-md px-4 pb-10 pt-2 shadow-md">
                  <MetricTooltip
                    message={`The total sales after deducting refunds, excluding refunded taxes.

                    Total Sales = Order Revenue - Refunds (excluding refunded taxes)`}
                  >
                    <h3 className="font-custom text-md font-semibold text-gray-500 flex items-center justify-start gap-2">
                      <Image
                        src={shopifyImage}
                        alt="shopify image"
                        height={16}
                        width={16}
                      />{" "}
                      Total Sales
                    </h3>
                  </MetricTooltip>
                  <div className="flex justify-start items-center gap-0 text-2xl py-2">
                    <span className="text-2xl font-semibold mr-2">
                      {currencySymbol}
                    </span>{" "}
                    <p className="text-2xl font-semibold">
                      {Math.round(shopifyTotalSales)}
                    </p>
                  </div>
                </div>
                <div className="border rounded-md px-4 pb-10 pt-2 shadow-md">
                  <MetricTooltip message={`The total number of orders placed within the selected timeframe.`}>
                    <h3 className="font-custom text-md font-semibold text-gray-500 flex items-center justify-start gap-2">
                      <Image
                        src={shopifyImage}
                        alt="shopify image"
                        height={16}
                        width={16}
                      />{" "}
                      Orders
                    </h3>
                  </MetricTooltip>
                  <div className="flex justify-start items-center gap-0 text-2xl font-semibold py-2">
                    {totalShopifyOrders}
                  </div>
                </div>
              </div>
            </div>

            {/* Meta ads */}

            <div className="mt-10">
              <div className="flex justify-start items-center gap-2">
                <Image
                  src={metaAdsImage}
                  alt="Meta image"
                  height={20}
                  width={20}
                />
                <h2 className="font-semibold font-custom text-xl  ">
                  Meta Ads
                </h2>
              </div>
              <div className=" grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4  gap-3 py-5 ">
                <div className="border rounded-md px-4 pb-10 pt-2 shadow-md">
                  <div className="flex gap-2 items-center">
                    <Image
                      src={metaAdsImage}
                      alt="Meta image"
                      height={20}
                      width={20}
                    />
                    <MetricTooltip message={`Ad Spend`}>
                      <h3 className="font-custom text-md font-semibold text-gray-500 flex gap-2  ">
                        Meta Ads
                      </h3>
                    </MetricTooltip>
                  </div>

                  <div className="flex justify-start items-center gap-0 text-2xl py-2">
                    {" "}
                    <span className="text-2xl font-semibold">
                      <IndianRupee />
                    </span>{" "}
                    <p className="text-2xl font-semibold">
                      {Math.round(metaSpend)}
                    </p>{" "}
                  </div>
                </div>

                <div className="border rounded-md px-4 pb-10 pt-2 shadow-md">
                  <div className="flex gap-2 items-center">
                    <Image
                      src={metaAdsImage}
                      alt="Meta  image"
                      height={20}
                      width={20}
                    />
                    <MetricTooltip message={`Return on Ad Spend`}>
                      <h3 className="font-custom text-md font-semibold text-gray-500 flex gap-2  ">
                        ROAS
                      </h3>
                    </MetricTooltip>
                  </div>
                  <div className="flex justify-start items-center gap-0 text-2xl py-2">
                    {" "}
                    <span className="text-2xl font-semibold">
                      <IndianRupee />
                    </span>{" "}
                    <p className="text-2xl font-semibold">0</p>{" "}
                  </div>
                </div>
              </div>
            </div>

            {/* Web Analysis Start */}
            <WebAnalysisSection />
            {/* Web Analysis Ends */}

            {/* Google Ads Start */}
            <GoogleAdsSection />
            {/* Google Ads End */}

            <div className="mt-4  mx-auto">
              <h2 className="font-semibold font-custom text-xl flex gap-2 items-center pt-4 ">
                <BanknoteArrowDown size={22} /> Expenses
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 py-5 ">
                <div className="border rounded-md px-4 pb-10 pt-2 shadow-md">
                  <MetricTooltip message={`Payment processing fees. Edit these in: Store > Gateway Costs`}>
                    <h3 className="font-custom text-md font-semibold text-gray-500">
                      Payment Gateways
                    </h3>
                  </MetricTooltip>
                  <div className="flex justify-start items-center gap-0 text-2xl py-2">
                    {" "}
                    <span className="text-2xl font-semiboldm mr-2">
                      {currencySymbol}
                    </span>{" "}
                    <p className="text-2xl font-semibold">0</p>{" "}
                  </div>
                </div>
                <div className="border rounded-md px-4 pb-10 pt-2 shadow-md">
                  <MetricTooltip message={`Cost of goods sold in this time frame, minus cost of goods of refunded items in this time frame. Imported from shopify, or edit these in: Store > Cost of Goods.`}>
                    <h3 className="font-custom text-md font-semibold text-gray-500 flex items-center justify-start gap-2">
                      <Image
                        src={shopifyImage}
                        alt="woocommerce image"
                        height={16}
                        width={16}
                      />{" "}
                      COGS
                    </h3>
                  </MetricTooltip>
                  <div className="flex justify-start items-center gap-0 text-2xl py-2">
                    {" "}
                    <span className="text-2xl font-semibold mr-2">
                      {currencySymbol}
                    </span>{" "}
                    <p className="text-2xl font-semibold">0</p>{" "}
                  </div>
                </div>
                <div className="border rounded-md px-4 pb-10 pt-2 shadow-md">
                  <MetricTooltip message={`Cost of boxing, packaging, or “pick & pack” services. Edit these in: Store > Cost of Goods`}>
                    <h3 className="font-custom text-md font-semibold text-gray-500 flex items-center justify-start gap-2">
                      <Image
                        src={shopifyImage}
                        alt="woocommerce image"
                        height={16}
                        width={16}
                      />{" "}
                      Handling Fess
                    </h3>
                  </MetricTooltip>
                  <div className="flex justify-start items-center gap-0 text-2xl py-2">
                    {" "}
                    <span className="text-2xl font-semibold mr-2">
                      {currencySymbol}
                    </span>{" "}
                    <p className="text-2xl font-semibold">0</p>{" "}
                  </div>
                </div>
                <div className="border rounded-md px-4 pt-2 pb-10 shadow-md">
                  <MetricTooltip message={`Amount the store paid in shipping costs for fulfilling orders within the select timeframe. Edit these in: Store > Shipping`}>
                    <h3 className="font-custom text-md font-semibold text-gray-500 flex items-center justify-start gap-2">
                      <Image
                        src={shopifyImage}
                        alt="woocommerce image"
                        height={16}
                        width={16}
                      />{" "}
                      Shipping
                    </h3>
                  </MetricTooltip>
                  <div className="flex justify-start items-center gap-0 text-2xl py-2">
                    {" "}
                    <span className="text-2xl font-semibold mr-2">
                      {currencySymbol}
                    </span>{" "}
                    <p className="text-2xl font-semibold">0</p>{" "}
                  </div>
                </div>
                <div className="border rounded-md px-4 pt-2 pb-10 shadow-md">
                  <MetricTooltip message={`Any additional expenses you’d like to see deducted from your Net Profit. Includes custom expenses marked as ad spend. Edit these in Store > Custom Expenses.`}>
                    <h3 className="font-custom text-md font-semibold text-gray-500">
                      Custom Expenses
                    </h3>
                  </MetricTooltip>
                  <div className="flex justify-start items-center gap-0 text-2xl py-2">
                    {" "}
                    <span className="text-2xl font-semibold mr-2">
                      {currencySymbol}
                    </span>{" "}
                    <p className="text-2xl font-semibold">0</p>{" "}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* -------- WooCommerce -------- */}
      {platform === "Woocommerce" && (
        <>
          <div className=" mx-auto ">
            {/* Woocommerce Store Data */}
            <div className="mx-auto mt-10">
              <div className="flex justify-start items-center gap-2">
                <Image
                  src={woocommerceImage}
                  alt="woocommerce image"
                  height={24}
                  width={24}
                />{" "}
                <h2 className="font-semibold font-custom text-xl  ">Store</h2>
              </div>
              <div className="  grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4  gap-4 py-5 ">
                <div className="border rounded-md px-4 pb-10 pt-2 shadow-md">
                  <MetricTooltip
                    message={`The total revenue after adjustments such as discounts, shipping, fees, and taxes (but before refunds).

                    Order Revenue = Gross Sales - Discounts + Shipping + Tax`}
                  >
                    <h3 className="font-custom text-md font-semibold text-gray-500 flex gap-2">
                      <Image
                        src={woocommerceImage}
                        alt="woocommerce image"
                        height={20}
                        width={20}
                      />{" "}
                      Order Revenue
                    </h3>
                  </MetricTooltip>
                  <div className="flex justify-start items-center gap-0 text-2xl py-2">
                    {" "}
                    <span className="text-2xl font-semibold mr-2">
                      {currencySymbol}
                    </span>{" "}
                    <p className="text-2xl font-semibold">
                      {Math.round(totalOrderRevenue)}
                    </p>{" "}
                  </div>
                </div>
                <div className="border rounded-md px-4 pb-10 pt-2 shadow-md">
                  <MetricTooltip
                    message={`The average non-zero order value, excluding shipping and taxes, as reported by WooCommerce.

                    True AOV = (Order Revenue - Shipping Price - Taxes) / Number of Orders > $0`}
                  >
                    <h3 className="font-custom text-md font-semibold text-gray-500 flex gap-2">
                      <Image
                        src={woocommerceImage}
                        alt="woocommerce image"
                        height={20}
                        width={20}
                      />{" "}
                      True AOV
                    </h3>
                  </MetricTooltip>
                  <div className="flex justify-start items-center gap-0 text-2xl py-2">
                    {" "}
                    <span className="text-2xl font-semibold  mr-2">
                      {currencySymbol}
                    </span>
                    {"  "}
                    <p className="text-2xl font-semibold">
                      {Math.round(trueAOV)}
                    </p>{" "}
                  </div>
                </div>
                <div className="border rounded-md px-4 pb-10 pt-2 shadow-md">
                  <MetricTooltip
                    message={`The average order value, excluding shipping and taxes, as reported by WooCommerce.

                    AOV = (Order Revenue - Shipping Price - Taxes) / Number of Orders`}
                  >
                    <h3 className="font-custom text-md font-semibold text-gray-500 flex gap-2">
                      <div style={{ height: "auto", width: "auto" }}>
                        <Image
                          src={woocommerceImage}
                          alt="woocommerce image"
                          height={20}
                          width={20}
                        />
                      </div>
                      Avarage Order Value
                    </h3>
                  </MetricTooltip>
                  <div className="flex justify-start items-center gap-0 text-2xl py-2">
                    {" "}
                    <span className="text-2xl font-semibold mr-2">
                      {currencySymbol}
                    </span>{" "}
                    <p className="text-2xl font-semibold">
                      {Math.round(averageOrderValue)}
                    </p>{" "}
                  </div>
                </div>
                <div className="border rounded-md px-4 pb-10 pt-2 shadow-md">
                  <MetricTooltip
                    message={`The total sales after deducting refunds, excluding refunded taxes.

                    Total Sales = Order Revenue - Refunds (excluding refunded taxes)`}
                  >
                    <h3 className="font-custom text-md font-semibold text-gray-500 flex gap-2">
                      <div style={{ height: "auto", width: "auto" }}>
                        <Image
                          src={woocommerceImage}
                          alt="woocommerce image"
                          height={20}
                          width={20}
                        />
                      </div>
                      Total Sales
                    </h3>
                  </MetricTooltip>
                  <div className="flex justify-start items-center gap-0 text-2xl py-2">
                    {" "}
                    <span className="text-2xl font-semibold mr-2">
                      {currencySymbol}
                    </span>{" "}
                    <p className="text-2xl font-semibold">
                      {Math.round(totalSales)}
                    </p>{" "}
                  </div>
                </div>
                <div className="border rounded-md px-4 pb-10 pt-2 shadow-md">
                  <MetricTooltip message={`The total number of orders placed within the selected timeframe.`}>
                    <h3 className="font-custom text-md font-semibold text-gray-500 flex gap-2">
                      <div style={{ height: "auto", width: "auto" }}>
                        <Image
                          src={woocommerceImage}
                          alt="woocommerce image"
                          height={20}
                          width={20}
                        />
                      </div>
                      Orders
                    </h3>
                  </MetricTooltip>
                  <div className="flex justify-start items-center gap-0 text-2xl py-2">
                    <p className="text-2xl font-semibold">
                      {data.woocommerce.orders.length}
                    </p>{" "}
                  </div>
                </div>
              </div>
            </div>

            {/* Meta ads */}

            <div className="mt-10">
              <div className="flex justify-start items-center gap-2">
                <Image
                  src={metaAdsImage}
                  alt="Google Ads image"
                  height={20}
                  width={20}
                />
                <h2 className="font-semibold font-custom text-xl  ">
                  Meta Ads
                </h2>
              </div>
              <div className="  grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4  gap-4 py-5 ">
                <div className="border rounded-md px-4 pb-10 pt-2 shadow-md">
                  <div className="flex gap-2 items-center">
                    <Image
                      src={metaAdsImage}
                      alt="Meta Ads image"
                      height={20}
                      width={20}
                    />
                    <MetricTooltip message={`Ad Spend`}>
                      <h3 className="font-custom text-md font-semibold text-gray-500 flex gap-2  ">
                        Facebook Ads
                      </h3>
                    </MetricTooltip>
                  </div>

                  <div className="flex justify-start items-center gap-0 text-2xl py-2">
                    {" "}
                    <span className="text-2xl font-semibold">
                      <IndianRupee />
                    </span>{" "}
                    <p className="text-2xl font-semibold">
                      {Math.round(metaSpend)}
                    </p>{" "}
                  </div>
                </div>

                <div className="border rounded-md px-4 pb-10 pt-2 shadow-md">
                  <div className="flex gap-2 items-center">
                    <Image
                      src={metaAdsImage}
                      alt="Meta Ads image"
                      height={20}
                      width={20}
                    />
                    <MetricTooltip message={`Return on Ad Spend`}>
                      <h3 className="font-custom text-md font-semibold text-gray-500 flex gap-2  ">
                        ROAS
                      </h3>
                    </MetricTooltip>
                  </div>
                  <div className="flex justify-start items-center gap-0 text-2xl py-2">
                    {" "}
                    <span className="text-2xl font-semibold">
                      <IndianRupee />
                    </span>{" "}
                    <p className="text-2xl font-semibold">0</p>{" "}
                  </div>
                </div>
              </div>
            </div>

            {/* Web Analysis Start */}
            <WebAnalysisSection />
            {/* Web Analysis Ends */}

            {/* Google Ads Start */}
            <GoogleAdsSection />
            {/* Google Ads End */}

            <div className="mt-6 mx-auto">
              <h2 className="font-semibold font-custom text-xl flex items-center gap-2 pt-4 ">
                <BanknoteArrowDown size={22} /> Expenses
              </h2>
              <div className="  grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4  gap-4 py-5 ">
                <div className="border rounded-md px-4 pb-10 pt-2 shadow-md">
                  <MetricTooltip message={`Payment processing fees. Edit these in: Store > Gateway Costs`}>
                    <h3 className="font-custom text-md font-semibold text-gray-500">
                      Payment Gateways
                    </h3>
                  </MetricTooltip>
                  <div className="flex justify-start items-center gap-0 text-2xl py-2">
                    {" "}
                    <span className="text-2xl font-semibold mr-2">
                      {currencySymbol}
                    </span>{" "}
                    <p className="text-2xl font-semibold">0</p>{" "}
                  </div>
                </div>
                <div className="border rounded-md px-4 pb-10 pt-2 shadow-md">
                  <MetricTooltip message={`Cost of goods sold in this time frame, minus cost of goods of refunded items in this time frame. Imported from WooCommerce, or edit these in: Store > Cost of Goods.`}>
                    <h3 className="font-custom text-md font-semibold text-gray-500 flex gap-2">
                      <Image
                        src={woocommerceImage}
                        alt="woocommerce image"
                        height={20}
                        width={20}
                      />{" "}
                      COGS
                    </h3>
                  </MetricTooltip>
                  <div className="flex justify-start items-center gap-0 text-2xl py-2">
                    {" "}
                    <span className="text-2xl font-semibold mr-2">
                      {currencySymbol}
                    </span>{" "}
                    <p className="text-2xl font-semibold">0</p>{" "}
                  </div>
                </div>
                <div className="border rounded-md px-4 pb-10 pt-2 shadow-md">
                  <MetricTooltip message={`Cost of boxing, packaging, or “pick & pack” services. Edit these in: Store > Cost of Goods`}>
                    <h3 className="font-custom text-md font-semibold text-gray-500 flex gap-2">
                      <Image
                        src={woocommerceImage}
                        alt="woocommerce image"
                        height={20}
                        width={20}
                      />{" "}
                      Handling Fees
                    </h3>
                  </MetricTooltip>
                  <div className="flex justify-start items-center gap-0 text-2xl py-2">
                    {" "}
                    <span className="text-2xl font-semibold mr-2">
                      {currencySymbol}
                    </span>{" "}
                    <p className="text-2xl font-semibold">
                      {woocommerceHandlingFees}
                    </p>{" "}
                  </div>
                </div>
                <div className="border rounded-md px-4 pt-2 pb-10 shadow-md">
                  <MetricTooltip message={`Amount the store paid in shipping costs for fulfilling orders within the select timeframe. Edit these in: Store > Shipping`}>
                    <h3 className="font-custom text-md font-semibold text-gray-500 flex gap-2">
                      <Image
                        src={woocommerceImage}
                        alt="woocommerce image"
                        height={20}
                        width={20}
                      />{" "}
                      Shipping
                    </h3>
                  </MetricTooltip>
                  <div className="flex justify-start items-center gap-0 text-2xl py-2">
                    {" "}
                    <span className="text-2xl font-semibold mr-2">
                      {currencySymbol}
                    </span>{" "}
                    <p className="text-2xl font-semibold">{shippingCost}</p>{" "}
                  </div>
                </div>
                <div className="border rounded-md px-4 pt-2 pb-10 shadow-md">
                  <MetricTooltip message={`Any additional expenses you’d like to see deducted from your Net Profit. Includes custom expenses marked as ad spend. Edit these in Store > Custom Expenses.`}>
                    <h3 className="font-custom text-md font-semibold text-gray-500">
                      Custom Expenses
                    </h3>
                  </MetricTooltip>
                  <div className="flex justify-start items-center gap-0 text-2xl py-2">
                    {" "}
                    <span className="text-2xl font-semibold mr-2">
                      {currencySymbol}
                    </span>{" "}
                    <p className="text-2xl font-semibold">0</p>{" "}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* -------- Magento -------- */}
      {platform === "Magento" && (
        <>
          <div className=" mx-auto">
            <div className="mt-8 mx-auto">
              <div className="flex justify-between items-center gap-8 mb-4">
                <div className="flex justify-start items-center gap-2">
                  <Image
                    src={magentoImage}
                    alt="magento image"
                    height={20}
                    width={20}
                  />{" "}
                  <h2 className="font-semibold font-custom text-xl  ">Store</h2>
                </div>
                {/* Pagination Indicator - Only show when fetching new orders from API */}
                {(() => {
                  if (!magentoPagination.source) return false;
                  if (magentoPagination.source === "api") {
                    return (
                      magentoPagination.isLoadingPage ||
                      magentoPagination.hasMore
                    );
                  }
                  if (magentoPagination.source === "database") {
                    return magentoPagination.isLoadingPage;
                  }
                  return false;
                })() ? (
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2 text-sm text-gray-700">
                      <BeatLoader size={6} color="#374151" />
                      <span className="font-bold whitespace-nowrap font-custom text-md">
                        {magentoPagination.source === "api"
                          ? "Fetching all orders..."
                          : "Loading saved orders..."}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 border p-2 rounded-md max-w-5xl font-custom overflow-x-auto whitespace-nowrap scrollbar-thin scrollbar-thumb-orange-300 scrollbar-track-orange-200">
                      {Array.from(
                        { length: magentoPagination.currentPage },
                        (_, idx) => idx + 1
                      ).map((pageNum) => (
                        <span
                          key={pageNum}
                          className="px-2.5 py-1 text-xs font-medium text-gray-700 bg-gray-100 rounded border border-gray-300 shrink-0"
                        >
                          {magentoPagination.source === "api"
                            ? `Batch ${pageNum}`
                            : `Page ${pageNum}`}
                        </span>
                      ))}
                      <span className="px-3 py-1 text-xs font-semibold bg-blue-500 text-white rounded-md animate-pulse shadow-md shrink-0">
                        {magentoPagination.source === "api"
                          ? `Batch ${magentoPagination.currentPage + 1}`
                          : `Page ${magentoPagination.currentPage + 1}`}
                      </span>
                    </div>
                    {magentoPagination.lastBatchCount > 0 && (
                      <span className="text-xs text-gray-500">
                        {magentoPagination.source === "api"
                          ? `Last batch saved ${magentoPagination.lastBatchCount} orders`
                          : `Loaded ${magentoPagination.lastBatchCount} saved orders`}
                      </span>
                    )}
                  </div>
                ) : magentoPagination.currentPage > 0 &&
                  !magentoPagination.hasMore &&
                  showCompletionMessage &&
                  data.magento.orders.length > 0 ? (
                  <div className="flex items-center gap-2 text-sm text-green-600 font-medium animate-fade-in">
                    <span>
                      ✓ Fetched all records ({magentoPagination.totalCount}{" "}
                      orders)
                    </span>
                  </div>
                ) : null}
              </div>
              <div className="  grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 py-5 ">
                <div className=" border rounded-md px-4 pb-10 pt-2 shadow-md">
                  <MetricTooltip
                    message={`The total revenue after adjustments such as discounts, shipping, fees, and taxes (but before refunds).

                    Order Revenue = Gross Sales - Discounts + Shipping + Tax`}
                  >
                    <h3 className="font-custom text-md font-semibold text-gray-500 flex gap-2">
                      <Image
                        src={magentoImage}
                        alt="magento image"
                        height={14}
                        width={18}
                      />{" "}
                      Order Revenue
                    </h3>
                  </MetricTooltip>
                  <div className="flex justify-start items-center gap-0 text-2xl py-2">
                    {" "}
                    <span className="text-2xl font-semibold mr-2">
                      {currencySymbol}
                    </span>{" "}
                    <p className="text-2xl font-semibold">
                      {Math.round(totalMagentoRevenue)}
                    </p>{" "}
                  </div>
                </div>
                <div className="border rounded-md px-4 pb-10 pt-2 shadow-md">
                  <MetricTooltip
                    message={`The average non-zero order value, excluding shipping and taxes, as reported by Magento.

                    True AOV = (Order Revenue - Shipping Price - Taxes) / Number of Orders > $0`}
                  >
                    <h3 className="font-custom text-md font-semibold text-gray-500 flex gap-2">
                      <Image
                        src={magentoImage}
                        alt="magento image"
                        height={14}
                        width={18}
                      />{" "}
                      True AOV
                    </h3>
                  </MetricTooltip>
                  <div className="flex justify-start items-center gap-0 text-2xl py-2">
                    {" "}
                    <span className="text-2xl font-semibold mr-2 ">
                      {currencySymbol}
                    </span>{" "}
                    <p className="text-2xl font-semibold">
                      {Math.round(magentoTrueAOV)}
                    </p>{" "}
                  </div>
                </div>
                <div className="border rounded-md px-4 pb-10 pt-2 shadow-md">
                  <MetricTooltip
                    message={`The average order value, excluding shipping and taxes, as reported by Magento.

                    AOV = (Order Revenue - Shipping Price - Taxes) / Number of Orders`}
                  >
                    <h3 className="font-custom text-md font-semibold text-gray-500 flex gap-2">
                      <Image
                        src={magentoImage}
                        alt="magento image"
                        height={14}
                        width={18}
                      />{" "}
                      Avarage Order Value
                    </h3>
                  </MetricTooltip>
                  <div className="flex justify-start items-center gap-0 text-2xl py-2">
                    {" "}
                    <span className="text-2xl font-semibold mr-2 ">
                      {currencySymbol}
                    </span>{" "}
                    <p className="text-2xl font-semibold">
                      {Math.round(magentoOverallAOV)}
                    </p>{" "}
                  </div>
                </div>
                <div className="border rounded-md px-4 pb-10 pt-2 shadow-md">
                  <MetricTooltip
                    message={`The total sales after deducting refunds, excluding refunded taxes.

                    Total Sales = Order Revenue - Refunds (excluding refunded taxes)`}
                  >
                    <h3 className="font-custom text-md font-semibold text-gray-500 flex gap-2">
                      <Image
                        src={magentoImage}
                        alt="magento image"
                        height={14}
                        width={18}
                      />{" "}
                      Total Sales
                    </h3>
                  </MetricTooltip>
                  <div className="flex justify-start items-center gap-0 text-2xl py-2">
                    {" "}
                    <span className="text-2xl font-semibold mr-2 ">
                      {currencySymbol}
                    </span>{" "}
                    <p className="text-2xl font-semibold">
                      {Math.round(totalMagentoSales)}
                    </p>{" "}
                  </div>
                </div>
                <div className="border rounded-md px-4 pb-10 pt-2 shadow-md">
                  <MetricTooltip  message={`The total number of orders placed within the selected timeframe.`}  >
                    <h3 className="font-custom text-md font-semibold text-gray-500 flex gap-2">
                      <Image
                        src={magentoImage}
                        alt="magento image"
                        height={14}
                        width={18}
                      />{" "}
                      Orders
                    </h3>
                  </MetricTooltip>
                  <div className="flex justify-start items-center gap-0 text-2xl py-2">
                    <p className="text-2xl font-semibold">
                      {totalMagentoOrders}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Meta ads */}

            <div className="mt-10">
              <div className="flex justify-start items-center gap-2">
                <Image
                  src={metaAdsImage}
                  alt="Google Ads image"
                  height={20}
                  width={20}
                />
                <h2 className="font-semibold font-custom text-xl  ">
                  Meta Ads
                </h2>
              </div>
              <div className="  grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 py-5 ">
                <div className="border rounded-md px-4 pb-10 pt-2 shadow-md">
                  <div className="flex gap-2 items-center">
                    <Image
                      src={metaAdsImage}
                      alt="Meta Ads image"
                      height={20}
                      width={20}
                    />
                    <MetricTooltip  message= {`Ad Spend`} >
                      <h3 className="font-custom text-md font-semibold text-gray-500 flex gap-2  ">
                        Facebook Ads
                      </h3>
                    </MetricTooltip>
                  </div>

                  <div className="flex justify-start items-center gap-0 text-2xl py-2">
                    {" "}
                    <span className="text-2xl font-semibold">
                      <IndianRupee />
                    </span>{" "}
                    <p className="text-2xl font-semibold">
                      {Math.round(metaSpend)}
                    </p>{" "}
                  </div>
                </div>

                <div className="border rounded-md px-4 pb-10 pt-2 shadow-md">
                  <div className="flex gap-2 items-center">
                    <Image
                      src={metaAdsImage}
                      alt="Meta Ads image"
                      height={20}
                      width={20}
                    />
                    <MetricTooltip  message={`Return on Ad Spend`}  >
                      <h3 className="font-custom text-md font-semibold text-gray-500 flex gap-2  ">
                        ROAS
                      </h3>
                    </MetricTooltip>
                  </div>
                  <div className="flex justify-start items-center gap-0 text-2xl py-2">
                    {" "}
                    <span className="text-2xl font-semibold">
                      <IndianRupee />
                    </span>{" "}
                    <p className="text-2xl font-semibold">0</p>{" "}
                  </div>
                </div>
              </div>
            </div>

            {/* Web Analysis Start */}
            <WebAnalysisSection />
            {/* Web Analysis Ends */}

            {/* Google Ads Start */}
            <GoogleAdsSection />
            {/* Google Ads End */}

            <div className="mt-6 mx-auto">
              <h2 className="font-semibold font-custom text-xl flex gap-2 items-center pt-4 ">
                <BanknoteArrowDown size={22} /> Expenses
              </h2>
              <div className="  grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 py-5 ">
                <div className="border rounded-md px-4 pb-10 pt-2 shadow-md">
                  <MetricTooltip  message={`Payment processing fees. Edit these in: Store > Gateway Costs`}>
                    <h3 className="font-custom text-md font-semibold text-gray-500">
                      Payment Gateways
                    </h3>
                  </MetricTooltip>
                  <div className="flex justify-start items-center gap-0 text-2xl py-2">
                    {" "}
                    <span className="text-2xl font-semibold mr-2 ">
                      {currencySymbol}
                    </span>{" "}
                    <p className="text-2xl font-semibold">0</p>{" "}
                  </div>
                </div>
                <div className="border rounded-md px-4 pb-10 pt-2 shadow-md">
                  <MetricTooltip  message={`Cost of goods sold in this time frame, minus cost of goods of refunded items in this time frame. Imported from Magento, or edit these in: Store > Cost of Goods.`}>
                    <h3 className="font-custom text-md font-semibold text-gray-500 flex gap-2">
                      <Image
                        src={magentoImage}
                        alt="magento image"
                        height={14}
                        width={18}
                      />{" "}
                      COGS
                    </h3>
                  </MetricTooltip>
                  <div className="flex justify-start items-center gap-0 text-2xl py-2">
                    {" "}
                    <span className="text-2xl font-semibold mr-2 ">
                      {currencySymbol}
                    </span>{" "}
                    <p className="text-2xl font-semibold">0</p>{" "}
                  </div>
                </div>
                <div className="border rounded-md px-4 pb-10 pt-2 shadow-md">
                  <MetricTooltip message={`Cost of boxing, packaging, or “pick & pack” services. Edit these in: Store > Cost of Goods`}>
                    <h3 className="font-custom text-md font-semibold text-gray-500 flex gap-2">
                      <Image
                        src={magentoImage}
                        alt="magento image"
                        height={14}
                        width={18}
                      />{" "}
                      Handling Fees
                    </h3>
                  </MetricTooltip>
                  <div className="flex justify-start items-center gap-0 text-2xl py-2">
                    {" "}
                    <span className="text-2xl font-semibold mr-2">
                      {currencySymbol}
                    </span>{" "}
                    <p className="text-2xl font-semibold">0</p>{" "}
                  </div>
                </div>
                <div className="border rounded-md px-4 pt-2 pb-10 shadow-md">
                  <MetricTooltip message={`Amount the store paid in shipping costs for fulfilling orders within the select timeframe. Edit these in: Store > Shipping`}>
                    <h3 className="font-custom text-md font-semibold text-gray-500 flex gap-2">
                      <Image
                        src={magentoImage}
                        alt="magento image"
                        height={14}
                        width={18}
                      />{" "}
                      Shipping
                    </h3>
                  </MetricTooltip>
                  <div className="flex justify-start items-center gap-0 text-2xl py-2">
                    {" "}
                    <span className="text-2xl font-semibold mr-2">
                      {currencySymbol}
                    </span>{" "}
                    <p className="text-2xl font-semibold">
                      {Math.round(magentoShippingCost)}
                    </p>{" "}
                  </div>
                </div>
                <div className="border rounded-md px-4 pt-2 pb-10 shadow-md">
                  <MetricTooltip  message={`Any additional expenses you’d like to see deducted from your Net Profit. Includes custom expenses marked as ad spend. Edit these in Store > Custom Expenses.`}>
                    <h3 className="font-custom text-md font-semibold text-gray-500">
                      Custom Expenses
                    </h3>
                  </MetricTooltip>
                  <div className="flex justify-start items-center gap-0 text-2xl py-2">
                    {" "}
                    <span className="text-2xl font-semibold mr-2">
                      {currencySymbol}
                    </span>{" "}
                    <p className="text-2xl font-semibold">0</p>{" "}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
