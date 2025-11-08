import analyticsImage from "@/assets/images/AnalyticsImage.jpg";
import Image from "next/image";
import MetricTooltip from "./metric-tooltip";

export default function WebAnalysisSection() {
  return (
    <>
      <div className="mt-10">
        <div className="flex justify-start items-center gap-2">
          <Image
            src={analyticsImage}
            alt="Web Analysis image"
            height={22}
            width={22}
          />

          <h2 className="font-semibold font-custom text-xl  ">Web Analytics</h2>
        </div>
        <div className="  grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 py-5 ">
          <div className="rounded-md px-4 pb-10 pt-2 shadow-md border">
            <MetricTooltip message={`Website purchases / Sessions`}>
              <h3 className="font-custom text-md font-semibold text-gray-500 flex gap-2  ">
                <Image
                  src={analyticsImage}
                  alt=" Web Analysis image"
                  height={20}
                  width={18}
                />{" "}
                Conversion Rate
              </h3>
            </MetricTooltip>
            <div className="flex justify-start items-center gap-0 text-2xl py-2">
              <p className="text-2xl font-semibold"> 0.00%</p>
            </div>
          </div>

          <div className="border rounded-md px-4 pb-10 pt-2 shadow-md">
            <MetricTooltip message={`Unique users who visited your site`}>
              <h3 className="font-custom text-md font-semibold text-gray-500 flex gap-2  ">
                <Image
                  src={analyticsImage}
                  alt=" Web Analysis image"
                  height={20}
                  width={18}
                />{" "}
                Users
              </h3>
            </MetricTooltip>
            <div className="flex justify-start items-center gap-0 text-2xl py-2">
              <p className="text-2xl font-semibold"> 0</p>
            </div>
          </div>

          <div className="border rounded-md px-4 pb-10 pt-2 shadow-md">
            <MetricTooltip message={`Total number of sessions`}>  
            <h3 className="font-custom text-md font-semibold text-gray-500 flex gap-2  ">
              <Image
                src={analyticsImage}
                alt=" Web Analysis image"
                height={20}
                width={18}
              />{" "}
              Sessions
            </h3>
            </MetricTooltip>
            <div className="flex justify-start items-center gap-0 text-2xl py-2">
              <p className="text-2xl font-semibold"> 0</p>
            </div>
          </div>

          <div className="border rounded-md px-4 pb-10 pt-2 shadow-md">
            <MetricTooltip message={`Users who visited your site for the first time`}>  
            <h3 className="font-custom text-md font-semibold text-gray-500 flex gap-2  ">
              <Image
                src={analyticsImage}
                alt=" Web Analysis image"
                height={20}
                width={18}
              />{" "}
              New Users
            </h3>
            </MetricTooltip>
            <div className="flex justify-start items-center gap-0 text-2xl py-2">
              <p className="text-2xl font-semibold"> 0</p>
            </div>
          </div>

          <div className="border rounded-md px-4 pb-10 pt-2 shadow-md">
            <MetricTooltip message={`Percentage of new users (New Users / Users)`}>  
            <h3 className="font-custom text-md font-semibold text-gray-500 flex gap-2  ">
              <Image
                src={analyticsImage}
                alt=" Web Analysis image"
                height={20}
                width={18}
              />{" "}
              New Users %
            </h3>
            </MetricTooltip>
            <div className="flex justify-start items-center gap-0 text-2xl py-2">
              <p className="text-2xl font-semibold"> 0.00%</p>
            </div>
          </div>

          <div className="border rounded-md px-4 pb-10 pt-2 shadow-md">
            <MetricTooltip message={ `Percentage of sessions with add to carts (Add to Carts / Sessions)`}> 
            <h3 className="font-custom text-md font-semibold text-gray-500 flex gap-2  ">
              <Image
                src={analyticsImage}
                alt=" Web Analysis image"
                height={20}
                width={18}
              />{" "}
              Add to Cart %
            </h3>
            </MetricTooltip>
            <div className="flex justify-start items-center gap-0 text-2xl py-2">
              <p className="text-2xl font-semibold"> 0.00%</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
