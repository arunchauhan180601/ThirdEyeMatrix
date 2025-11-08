import { IndianRupee } from "lucide-react";
import Image from "next/image";
import klaviyoImage from "@/assets/images/Ads Integrations Image/Klaviyo.png";

export default function KlaviyoSection() {
  return (
    <>
      <div className="mt-10">
        <div className="flex justify-start items-center gap-2">
          <Image
            src={klaviyoImage}
            alt="klaviyo image"
            height={30}
            width={30}
          />
          <h2 className="font-semibold font-custom text-xl  ">Klaviyo</h2>
        </div>
        <div className=" grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4  gap-4 py-5 ">
          <div className="border rounded-md px-4 pb-10 pt-2 shadow-md">
            <div className="flex gap-2 items-center ">
              <Image
                src={klaviyoImage}
                alt="klaviyo image"
                height={24}
                width={24}
              />
              <h3 className="font-custom text-md font-semibold text-gray-500 flex gap-2  ">
                Revenue Flows
              </h3>
            </div>

            <div className="flex justify-start items-center gap-0 text-2xl pt-2 pb-4">
              {" "}
              <IndianRupee /> <p className="text-2xl font-semibold">0</p>{" "}
            </div>
          </div>

          <div className="border rounded-md px-4 pb-10 pt-2 shadow-md">
            <div className="flex gap-2 items-center">
              <Image
                src={klaviyoImage}
                alt="klaviyo image"
                height={24}
                width={24}
              />
              <h3 className="font-custom text-md font-semibold text-gray-500 flex gap-2  ">
                Percent of Revenue Flows
              </h3>
            </div>
            <div className="flex justify-start items-center gap-0 text-2xl pt-2 pb-4">
              {" "}
              <IndianRupee /> <p className="text-2xl font-semibold">0</p>{" "}
            </div>
          </div>
          <div className="border rounded-md px-4 pb-10 pt-2 shadow-md">
            <div className="flex gap-2 items-center">
              <Image
                src={klaviyoImage}
                alt="klaviyo image"
                height={24}
                width={24}
              />
              <h3 className="font-custom text-md font-semibold text-gray-500 flex gap-2  ">
                Revenue Campaigns
              </h3>
            </div>
            <div className="flex justify-start items-center gap-0 text-2xl pt-2">
              {" "}
              <IndianRupee /> <p className="text-2xl font-semibold">0</p>{" "}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
