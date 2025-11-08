
import googleAdsImage from "@/assets/images/google-ads-image.png";
import { IndianRupee } from "lucide-react";
import Image from "next/image";
import MetricTooltip from "./metric-tooltip";

export default function GoogleAdsSection(){
    return(
        <>
        <div className="mt-8">
              <div className="flex justify-start items-center gap-2">
                <Image
                  src={googleAdsImage}
                  alt="Google Ads image"
                  height={20}
                  width={20}
                />
              
                <h2 className="font-semibold font-custom text-xl  ">
                  Google Ads
                </h2>
               
              </div>
              <div className=" grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4  gap-3 py-5 ">
                <div className="border rounded-md px-4 pb-10 pt-2 shadow-md">
                    <MetricTooltip  message={`Ads Spend`}> 
                  <h3 className="font-custom text-md font-semibold text-gray-500 flex gap-2  ">
                    <Image
                      src={googleAdsImage}
                      alt="Google Ads image"
                      height={20}
                      width={18}
                    />{" "}
                    Google Ads
                  </h3>
                    </MetricTooltip>
                  <div className="flex justify-start items-center gap-0 text-2xl py-2">
                    {" "}
                    <IndianRupee /> <p className="text-2xl font-semibold">
                      0
                    </p>{" "}
                  </div>
                </div>

                <div className="border rounded-md px-4 pb-10 pt-2 shadow-md">
                  <MetricTooltip  message={`Return on ad spend`}>  
                  <h3 className="font-custom text-md font-semibold text-gray-500  flex gap-2 ">
                    <Image
                      src={googleAdsImage}
                      alt="Google Ads image"
                      height={20}
                      width={20}
                    />{" "}
                    ROAS
                  </h3>
                  </MetricTooltip>
                  <div className="flex justify-start items-center gap-0 text-2xl py-2">
                    {" "}
                    <IndianRupee /> <p className="text-2xl font-semibold">
                      0
                    </p>{" "}
                  </div>
                </div>
              </div>
            </div>
        </>
    )
}