// "use client";

// import { useState } from "react";
// import Image from "next/image";
// import signupImage from "@/assets/images/Sign up-rafiki.png";
// import ShopifyImage from "@/assets/images/shopify.svg"
// import BigCommerceImage from "@/assets/images/bigCommerce.svg"
// import WooCommerceImage from "@/assets/images/WooCommerce.svg"
// import MagentoImage from "@/assets/images/magentoLogoImage.png"
// import CustomImage from "@/assets/images/custom.svg"
// import { useRouter } from "next/navigation";


// export default function AddBusinessForm() {
//   const router = useRouter();
//   const [platform, setPlatform] = useState<string | null>(null); // Renamed and consolidated

//   const handlePlatformChange = (selectedPlatform: string) => {
//     setPlatform(selectedPlatform.charAt(0).toUpperCase() + selectedPlatform.slice(1)); // Directly set formatted storeName
//   };

//   const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
//     e.preventDefault();
//     console.log("Platform:", platform);

//     // Save data to local storage
//     localStorage.setItem('signupPlatform', platform || ''); 

//     router.push('/auth/user/signup/connect-business');
//   };

//   return (
//     <div className="relative flex items-center justify-center min-h-screen bg-gradient-to-r  from-white-100 via-sky-50 to-white-50">
//       <div className="w-full h-screen grid grid-cols-1 lg:grid-cols-2">
//         <div className="relative hidden lg:block">
//           <Image
//             src={signupImage}
//             alt="Business setup image"
//             className="absolute inset-0 w-full h-full object-cover "
//             loading="lazy"
//           />
//         </div>
//         <div className="flex items-center justify-center px-1 py-1 md:p-12 ">
//           <div className="w-full max-w-lg bg-white shadow-2xl rounded-2xl dark:bg-dark-900 p-8">
//             <div className="mb-8 mt-2 text-center">
//               <h1 className="text-3xl sm:text-3xl mb-3  font-medium text-black  font-custom">
//                 ThirdEyeMatrix
//               </h1>
//             </div>
//             <form onSubmit={handleSubmit} className="space-y-5">
//               <div>
//                 <h2 className="block mb-4 text-xl font-semibold font-custom ">
//                   What powers your business ?
//                 </h2>
//                 <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
//                   {/* Shopify & BigCommerce */}
//                   <div className={`flex flex-row items-center justify-center p-4 border border-gray-300 rounded-lg cursor-pointer transition ${platform === 'Shopify' ? 'bg-sky-100 border-sky-500 shadow-md' : 'hover:bg-gray-50 dark:hover:bg-dark-850'}`}
//                        onClick={() => handlePlatformChange('shopify')}>
//                     <input
//                       type="radio" 
//                       checked={platform === 'Shopify'}
//                       readOnly
//                       className="hidden" 
//                     />
//                     <div className="w-8 h-8 flex items-center justify-center mr-2">
//                        <Image
//                          src={ShopifyImage}
//                          alt="Shopify Image"
//                          width={22}
//                          height={22}
//                        />
//                      </div>
//                     <span className="text-gray-700 font-custom font-medium text-md">Shopify</span>
//                   </div>
//                   <div className={`flex flex-row items-center justify-center p-4 border border-gray-300 rounded-lg cursor-pointer transition ${platform === 'Bigcommerce' ? 'bg-sky-100 border-sky-500 shadow-md' : 'hover:bg-gray-50 dark:hover:bg-dark-850'}`}
//                        onClick={() => handlePlatformChange('bigcommerce')}>
//                     <input
//                       type="radio" 
//                       checked={platform === 'Bigcommerce'}
//                       readOnly
//                       className="hidden"
//                     />
//                     <div className="w-8 h-8 flex items-center justify-center mr-2">
//                        <Image
//                          src={BigCommerceImage}
//                          alt="BigCommerce Image"
//                          width={22}
//                          height={22}
//                        />
//                      </div>
//                     <span className="text-gray-700 font-custom font-medium text-md">BigCommerce</span>
//                   </div>

//                   {/* WooCommerce & Magento */}
//                   <div className={`flex flex-row items-center justify-center p-4 border border-gray-300 rounded-lg cursor-pointer transition ${platform === 'Woocommerce' ? 'bg-sky-100 border-sky-500 shadow-md' : 'hover:bg-gray-50 dark:hover:bg-dark-850'}`}
//                        onClick={() => handlePlatformChange('woocommerce')}>
//                     <input
//                       type="radio" 
//                       checked={platform === 'Woocommerce'}
//                       readOnly
//                       className="hidden"
//                     />
//                     <div className="w-8 h-8 flex items-center justify-center mr-2">
//                        <Image
//                          src={WooCommerceImage}
//                          alt="WooCommerce Image"
//                          width={22}
//                          height={22}
//                        />
//                      </div>
//                     <span className="text-gray-700 font-custom font-medium text-md">WooCommerce</span>
//                   </div>
//                   <div className={`flex flex-row items-center justify-center p-4 border border-gray-300 rounded-lg cursor-pointer transition ${platform === 'Magento' ? 'bg-sky-100 border-sky-500 shadow-md' : 'hover:bg-gray-50 dark:hover:bg-dark-850'}`}
//                        onClick={() => handlePlatformChange('magento')}>
//                     <input
//                       type="radio" 
//                       checked={platform === 'Magento'}
//                       readOnly
//                       className="hidden"
//                     />
//                     <div className="w-8 h-8 flex items-center justify-center mr-2">
//                        <Image
//                          src={MagentoImage}
//                          alt="Magento Image"
//                          width={22}
//                          height={22}
//                        />
//                      </div>
//                     <span className="text-gray-700 font-custom font-medium text-md">Magento</span>
//                   </div>

//                   {/* Custom/Other */}
//                   <div className={`flex flex-row items-center justify-center p-4 border border-gray-300 rounded-lg cursor-pointer transition ${platform === 'Custom_other' ? 'bg-sky-100 border-sky-500 shadow-md' : 'hover:bg-gray-50 dark:hover:bg-dark-850'}`}
//                        onClick={() => handlePlatformChange('custom_other')}>
//                     <input
//                       type="radio" 
//                       checked={platform === 'Custom_other'}
//                       readOnly
//                       className="hidden"
//                     />
//                     <div className="w-8 h-8 flex items-center justify-center mr-2">
//                        <Image
//                          src={CustomImage}
//                          alt="Custom/Other Image"
//                          width={22}
//                          height={22}
//                        />
//                      </div>
//                     <span className="text-gray-700 font-custom font-medium text-md">Custom/Other</span>
//                   </div>
//                 </div>
//               </div>
             
//                 <button
//                 type="submit"
//                 disabled={!platform}
//                 className="w-full py-2 mt-1 cursor-pointer font-semibold text-white font-custom transition-all duration-200 rounded-lg shadow-md bg-[#37B5FF] hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed "
//                  >
//                 Continue
//                 </button>
              
//             </form>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }

"use client";

import { useState } from "react";
import Image from "next/image";
import signupImage from "@/assets/images/Sign up-rafiki.png";
import ShopifyImage from "@/assets/images/shopify.svg";
import BigCommerceImage from "@/assets/images/bigCommerce.svg";
import WooCommerceImage from "@/assets/images/WooCommerce.svg";
import MagentoImage from "@/assets/images/magentoLogoImage.png";
import CustomImage from "@/assets/images/custom.svg";
import { useRouter } from "next/navigation";

export default function AddBusinessForm() {
  const router = useRouter();
  const [platform, setPlatform] = useState<string | null>(null);
  const [showMagentoModal, setShowMagentoModal] = useState(false);
  const [magentoCredentials, setMagentoCredentials] = useState({
    consumerKey: "",
    consumerSecret: "",
    accessToken: "",
    accessTokenSecret: "",
  });

  // Handle platform click
  const handlePlatformChange = (selectedPlatform: string) => {
    const formatted =
      selectedPlatform.charAt(0).toUpperCase() + selectedPlatform.slice(1);
    setPlatform(formatted);

    if (selectedPlatform.toLowerCase() === "magento") {
      setShowMagentoModal(true);
    }
  };

  // Handle Magento credentials change
  const handleMagentoInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setMagentoCredentials((prev) => ({ ...prev, [name]: value }));
  };

  // Close modal
  const handleCancelModal = () => {
    setShowMagentoModal(false);
    setPlatform(null); // reset if canceled
    setMagentoCredentials({
      consumerKey: "",
      consumerSecret: "",
      accessToken: "",
      accessTokenSecret: "",
    });
  };

  // Save Magento credentials
  const handleSaveMagento = () => {
    setShowMagentoModal(false);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    localStorage.setItem("signupPlatform", platform || "");
    if (platform === "Magento") {
      localStorage.setItem("magentoCredentials", JSON.stringify(magentoCredentials));
    }

    router.push("/auth/user/signup/connect-business");
  };

  const isMagentoFormFilled =
    magentoCredentials.consumerKey &&
    magentoCredentials.consumerSecret &&
    magentoCredentials.accessToken &&
    magentoCredentials.accessTokenSecret;

  return (
    <div className="relative flex items-center justify-center min-h-screen bg-linear-to-r from-white-100 via-sky-50 to-white-50">
      <div className="w-full h-screen grid grid-cols-1 lg:grid-cols-2">
        {/* Left Image */}
        <div className="relative hidden lg:block">
          <Image
            src={signupImage}
            alt="Business setup image"
            className="absolute inset-0 w-full h-full object-cover"
            loading="lazy"
          />
        </div>

        {/* Right Form Section */}
        <div className="relative flex items-center justify-center px-1 py-1 md:p-12">
          <div className="relative w-full max-w-lg bg-white shadow-2xl rounded-2xl dark:bg-dark-900 p-8 font-custom">
            {/* --- Magento Modal Above Form --- */}
            {showMagentoModal && (
              <div className="absolute -top-3 left-0 w-full z-50">
                <div className="bg-white rounded-2xl shadow-2xl p-6 m border-gray-200">
                  <h2 className="text-2xl font-semibold mb-4 text-center font-custom text-gray-800">
                    Connect Magento Store
                  </h2>
                  <p className="text-center pb-2 font-custom text-gray-500">Please provide the following keys and permissions to authorize access to your Magento store data in ThirdEyeMatrix.</p>

                  <div className="space-y-4 ">
                    <InputField
                      label="Consumer Key"
                      name="consumerKey"
                      value={magentoCredentials.consumerKey}
                      onChange={handleMagentoInputChange}
                    />
                    <InputField
                      label="Consumer Secret"
                      name="consumerSecret"
                      value={magentoCredentials.consumerSecret}
                      onChange={handleMagentoInputChange}
                    />
                    <InputField
                      label="Access Token"
                      name="accessToken"
                      value={magentoCredentials.accessToken}
                      onChange={handleMagentoInputChange}
                    />
                    <InputField
                      label="Access Token Secret"
                      name="accessTokenSecret"
                      value={magentoCredentials.accessTokenSecret}
                      onChange={handleMagentoInputChange}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2 mt-6">
                    <button
                      onClick={handleCancelModal}
                      className="px-4 py-2  text-gray-700 font-medium bg-gray-200 rounded-lg hover:bg-gray-300"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveMagento}
                      disabled={!isMagentoFormFilled}
                      className={`px-4 py-2  font-semibold text-white rounded-lg shadow-md ${
                        isMagentoFormFilled
                          ? "bg-[#37B5FF] hover:opacity-90"
                          : "bg-[#37b6ff96] cursor-not-allowed"
                      }`}
                    >
                      Save
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* --- Main Form --- */}
            <div className="mb-8 mt-2 text-center">
              <h1 className="text-3xl mb-3 font-medium text-black font-custom">
                ThirdEyeMatrix
              </h1>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <h2 className="block mb-4 text-xl font-semibold font-custom">
                  What powers your business?
                </h2>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <PlatformCard
                    image={ShopifyImage}
                    label="Shopify"
                    selected={platform === "Shopify"}
                    onClick={() => handlePlatformChange("shopify")}
                  />

                  <PlatformCard
                    image={BigCommerceImage}
                    label="Bigcommerce"
                    selected={platform === "Bigcommerce"}
                    onClick={() => handlePlatformChange("bigcommerce")}
                  />

                  <PlatformCard
                    image={WooCommerceImage}
                    label="Woocommerce"
                    selected={platform === "Woocommerce"}
                    onClick={() => handlePlatformChange("woocommerce")}
                  />

                  <PlatformCard
                    image={MagentoImage}
                    label="Magento"
                    selected={platform === "Magento"}
                    onClick={() => handlePlatformChange("magento")}
                  />

                  <PlatformCard
                    image={CustomImage}
                    label="Custom/Other"
                    selected={platform === "Custom_other"}
                    onClick={() => handlePlatformChange("custom_other")}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={!platform}
                className="w-full py-2 mt-1 cursor-pointer font-semibold text-white font-custom transition-all duration-200 rounded-lg shadow-md bg-[#37B5FF] hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Continue
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

// Reusable platform card component
function PlatformCard({
  image,
  label,
  selected,
  onClick,
}: {
  image: any;
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <div
      className={`flex flex-row items-center justify-center p-4 border border-gray-300 rounded-lg cursor-pointer transition ${
        selected ? "bg-sky-100 border-sky-500 shadow-md" : "hover:bg-gray-50"
      }`}
      onClick={onClick}
    >
      <input type="radio" checked={selected} readOnly className="hidden" />
      <div className="w-8 h-8 flex items-center justify-center mr-2">
        <Image src={image} alt={label} width={22} height={22} />
      </div>
      <span className="text-gray-700 font-custom font-medium text-md">
        {label}
      </span>
    </div>
  );
}

// Reusable input field component
function InputField({
  label,
  name,
  value,
  onChange,
}: {
  label: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <div>
      <label className="block font-semibold mb-1 mt-2">{label}</label>
      <input
        type="text"
        name={name}
        value={value}
        onChange={onChange}
        className="w-full border border-gray-300 rounded-lg p-2  focus:ring-1 focus:ring-sky-300 focus:border-sky-300 focus:outline-none"
        placeholder={`Enter ${label}`}
      />
    </div>
  );
}

