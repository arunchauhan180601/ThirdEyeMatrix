import { IndianRupee, LayoutGrid } from "lucide-react";
import MetricTooltip from "./metric-tooltip";

interface CustomMatrixProps {
  customAdsSpend: number;
  customNetProfit: number;
  customMER: number;
  customNetMargin: number;
}

export default function CustomMatrix({
  customAdsSpend,
  customNetProfit,
  customMER,
  customNetMargin,
}: CustomMatrixProps) {
  return (
    <>
      <div>
        <h2 className="font-semibold font-custom text-xl pt-4 flex items-center gap-2">
          <LayoutGrid size={20} /> Custom Metrics
        </h2>

        <div className=" grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 py-5 ">
          <div className="border rounded-md px-4 pb-10 pt-2 shadow-md">
            <MetricTooltip message="Order Revenue - Returns - Expenses (COGS, Shipping, Handling, Payment Gateways, Taxes, Custom Expenses) - Blended Ad Spend">
              <h3 className="font-custom text-md font-semibold text-gray-500">
                Net Profit
              </h3>
            </MetricTooltip>
            <div className="flex justify-start items-center gap-0 text-2xl py-2">
              {" "}
              <IndianRupee />{" "}
              <p className="text-2xl font-semibold">{customNetProfit}</p>{" "}
            </div>
          </div>
          <div className="border rounded-md px-4 pb-10 pt-2 shadow-md">
            <MetricTooltip
              message={`Revenue generated per dollar spent on ads.

              Blended ROAS = Order Revenue / Blended Ad Spend

              Note: For the inverse ratio (Blended Ad Spend / Order Revenue), see MER.`}
            >
              <h3 className="font-custom text-md font-semibold text-gray-500">
                ROAS
              </h3>
            </MetricTooltip>
            <div className="flex justify-start items-center gap-0 text-2xl py-2">
              {" "}
              <IndianRupee /> <p className="text-2xl font-semibold">0</p>{" "}
            </div>
          </div>
          <div className="border rounded-md px-4 pb-10 pt-2 shadow-md">
            <MetricTooltip message={`Ratio of ad spend to total revenue.

              MER = Blended Ad Spend / Order Revenue

              Note: For the inverse ratio (Order Revenue / Blended Ad Spend), see Blended ROAS.
              `}>
              <h3 className="font-custom text-md font-semibold text-gray-500">
                MER
              </h3>
            </MetricTooltip>
            <div className="flex justify-start items-center gap-0 text-2xl py-2">
              {" "}
              <p className="text-2xl font-semibold">{customMER}% </p>{" "}
            </div>
          </div>
          <div className="border rounded-md px-4 pt-2 pb-10 shadow-md">
            <MetricTooltip message="Net Profit / Order Revenue x 100. In other words: Percentage of Sales that is Net Profit. Answers the question of: “What percentage of my [Sales] is my [Net Profit]?”">
              <h3 className="font-custom text-md font-semibold text-gray-500">
                Net Margin
              </h3>
            </MetricTooltip>
            <div className="flex justify-start items-center gap-0 text-2xl py-2">
              {" "}
              <p className="text-2xl font-semibold">{customNetMargin}%</p>{" "}
            </div>
          </div>
          <div className="border rounded-md px-4 pt-2 pb-10 shadow-md">
            <MetricTooltip message="Total Ad Spend. This includes the reported ad spend of each marketing channel connected to Triple Whale, plus any Custom Expenses marked as Ad Spend
">
              <h3 className="font-custom text-md font-semibold text-gray-500">
                Ads
              </h3>
            </MetricTooltip>
            <div className="flex justify-start items-center gap-0 text-2xl py-2">
              {" "}
              <IndianRupee />{" "}
              <p className="text-2xl font-semibold">{customAdsSpend}</p>{" "}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
