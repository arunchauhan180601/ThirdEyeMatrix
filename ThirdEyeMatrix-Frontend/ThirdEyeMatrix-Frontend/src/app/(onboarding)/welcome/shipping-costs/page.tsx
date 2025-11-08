import { Truck } from "lucide-react";
import React from "react";

const ShippingCostPage = () => {
  return (
    <>
      <div className="font-custom min-h-[80vh]  flex flex-col justify-center items-center">
        <h1 className="font-semibold text-xl sm:text-3xl text-center">
          Input Shipping Costs to calculate your Net Profit
        </h1>
        <p className="my-5 text-sm sm:text-md text-center text-gray-600 ">
          Tell us about your shop’s shipping costs so your net profit can be
          calculated throughout the app{" "}
        </p>

        <div className=" bg-white rounded-lg   mt-2 max-w-3xl" style={{ boxShadow: "0 0 15px rgba(0,0,0,0.3)" }}>
          <div className="p-5 border-b-1 flex justify-start flex-row">
            <p className="mr-3"><Truck className="text-blue-500" /> </p>
            <p>Shipping</p>
          </div>

          <div  className="p-5 border-b-1">
            <p className="mb-4 text-black">
              <input type="radio" className="scale-150 mr-2" /> Use Shipping Charges for Shipping Costs
            </p>
            <p className="text-gray-500">
              Enable this setting if your shipping costs are equal to what your
              customers have been charged for shipping
            </p>
          </div>

          <div  className="p-5 ">
            <p>
              <input type="radio" className="scale-150 mr-2" /> Default Shipping Costs
            </p>
          </div>
        </div>
        <div className="mt-12 mb-2">
          <button className="bg-[#1877f2] cursor-pointer hover:bg-blue-500 text-white font-bold py-2 px-5 sm:py-2 sm:px-8 rounded-md shadow-lg ">
            Let's go!
          </button>
        </div>
      </div>
    </>
  );
};
export default ShippingCostPage;
