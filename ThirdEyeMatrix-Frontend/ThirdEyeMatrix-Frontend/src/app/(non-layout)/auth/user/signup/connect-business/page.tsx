"use client";

import { useState } from "react";
import Image from "next/image";
import signupImage from "../../../../../../assets/images/Sign up-rafiki.png";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";

export default function ConnectBusinessPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    storeUrl: "",
    annualRevenue: "",
    storeCurrency: "",
    industryCategory: "",
    storeTimezone: "",
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    // Retrieve data from local storage
    const email = localStorage.getItem("signupEmail");
    const password = localStorage.getItem("signupPassword");
    const firstName = localStorage.getItem("signupFirstName"); // Re-introducing retrieval
    const lastName = localStorage.getItem("signupLastName"); // Re-introducing retrieval
    const phoneNumber = localStorage.getItem("signupPhoneNumber");
    const howDidYouHear = localStorage.getItem("signupHowDidYouHear");
    const platform = localStorage.getItem("signupPlatform");
    const recaptchaToken = localStorage.getItem("recaptchaToken");
    const magentoCredentials = localStorage.getItem("magentoCredentials");
    const parsedMagentoCredentials = magentoCredentials
      ? JSON.parse(magentoCredentials)
      : {};

    // Basic validation: Re-including firstName and lastName in validation
    if (
      !email ||
      !password ||
      !firstName ||
      !lastName ||
      !phoneNumber ||
      !howDidYouHear ||
      !platform ||
      !formData.storeUrl ||
      !formData.annualRevenue ||
      !formData.storeCurrency ||
      !formData.storeTimezone ||
      !formData.industryCategory
    ) {
      toast.error("Please fill in all required fields.", {
        style: {
          fontSize: "16px",
          fontWeight: "bold",
          borderRadius: "10px",
        },
      });
      setLoading(false);
      return;
    }

    try {
      const basicAuthToken = btoa(
        `${process.env.NEXT_PUBLIC_BASIC_AUTH_USERNAME}:${process.env.NEXT_PUBLIC_BASIC_AUTH_PASSWORD}`
      );

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/user/signup-complete`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Basic ${basicAuthToken}`,
          },
          body: JSON.stringify({
            email,
            password,
            firstName,
            lastName,
            phoneNumber,
            howDidYouHear,
            platform,
            storeUrl: formData.storeUrl,
            annualRevenue: formData.annualRevenue,
            storeCurrency: formData.storeCurrency,
            storeTimezone: formData.storeTimezone,
            industryCategory: formData.industryCategory,
            captcha: recaptchaToken, 
            magentoConsumerKey: parsedMagentoCredentials.consumerKey || null,
            magentoConsumerSecret:parsedMagentoCredentials.consumerSecret || null,
            magentoAccessToken: parsedMagentoCredentials.accessToken || null,
            magentoAccessTokenSecret: parsedMagentoCredentials.accessTokenSecret || null,
          }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        // Clear local storage after successful signup
        localStorage.removeItem("signupEmail");
        localStorage.removeItem("signupPassword");
        localStorage.removeItem("signupFirstName");
        localStorage.removeItem("signupLastName");
        localStorage.removeItem("signupPhoneNumber");
        localStorage.removeItem("signupHowDidYouHear");
        localStorage.removeItem("signupPlatform");
        localStorage.removeItem("recaptchaToken");
        localStorage.removeItem("magentoCredentials");

        toast.success("User registered successfully!", {
          style: {
            fontSize: "16px",
            fontWeight: "bold",
            borderRadius: "10px",
          },
        });
        setFormData({
          storeUrl: "",
          annualRevenue: "",
          storeCurrency: "",
          industryCategory: "",
          storeTimezone: "",
        });
        router.push("/auth/user/signin");
      }
    } catch (err: any) {
      toast.error(err.message || "An error occurred during signup!", {
        style: {
          fontSize: "16px",
          fontWeight: "bold",
          borderRadius: "10px",
        },
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex items-center justify-center min-h-screen bg-linear-to-r  from-white-100 via-sky-50 to-white-50">
      <div className="w-full h-screen grid grid-cols-1 lg:grid-cols-2">
        <div className="relative hidden lg:block">
          <Image
            src={signupImage}
            alt="Connect business image"
            className="absolute inset-0 w-full h-full object-cover "
            loading="lazy"
          />
        </div>
        <div className="flex items-center justify-center px-1 py-1 md:p-12 ">
          <div className="w-full max-w-lg bg-white shadow-2xl rounded-2xl dark:bg-dark-900 p-8">
            <div className="mb-8 text-center mt-4 ">
              <h2 className="text-2xl sm:text-3xl mb-3 font-bold text-black font-custom">
                Connect your business
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label
                  htmlFor="storeUrlInput"
                  className="block mb-1 text-md font-semibold font-custom"
                >
                  Store URL <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="storeUrlInput"
                  name="storeUrl"
                  value={formData.storeUrl}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 font-custom rounded-lg form-input focus:border-[#37b6ffe0] focus:ring-0 focus:ring-[#37b6ffb0] focus:outline-none"
                  placeholder="Enter your store URL"
                />
              </div>
              <div>
                <label
                  htmlFor="annualRevenueSelect"
                  className="block mb-1 text-md font-semibold font-custom"
                >
                  What is your store's annual revenue?{" "}
                  <span className="text-red-500">*</span>
                </label>
                <select
                  id="annualRevenueSelect"
                  name="annualRevenue"
                  value={formData.annualRevenue}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border font-custom border-gray-300 rounded-lg form-select focus:border-[#37b6ffe0] focus:ring-0 focus:ring-[#37b6ffb0] focus:outline-none"
                >
                  <option value="">Select an option</option>
                  <option value="0-50k">Less than $50,000</option>
                  <option value="50k-100k">$50,000 - $100,000</option>
                  <option value="100k-500k">$100,000 - $500,000</option>
                  <option value="500k-1m">$500,000 - $1,000,000</option>
                  <option value="1m-5m">$1,000,000 - $5,000,000</option>
                  <option value="5m-10m">$5,000,000 - $10,000,000</option>
                  <option value="10m+">$10,000,000+</option>
                </select>
              </div>
              <div>
                <label
                  htmlFor="storeCurrencySelect"
                  className="block mb-1 text-md font-semibold font-custom"
                >
                  Store Currency <span className="text-red-500">*</span>
                </label>
                <select
                  id="storeCurrencySelect"
                  name="storeCurrency"
                  value={formData.storeCurrency}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border font-custom border-gray-300 rounded-lg form-select focus:border-[#37b6ffe0] focus:ring-0 focus:ring-[#37b6ffb0] focus:outline-none"
                >
                  <option value="">Select an option</option>
                  <option value="USD">USD - United States Dollar</option>
                  <option value="EUR">EUR - Euro</option>
                  <option value="GBP">GBP - British Pound Sterling</option>
                  <option value="CAD">CAD - Canadian Dollar</option>
                  <option value="AUD">AUD - Australian Dollar</option>
                  <option value="INR">INR - Indian Rupee</option>
                  <option value="SGD">SGD - Singapore Dollar</option>
                  <option value="CHF">CHF - Switzerland Dollar</option>
                  <option value="Other">Others</option>
                </select>
              </div>
              <div>
                <label
                  htmlFor="storeTimezoneSelect"
                  className="block mb-1 text-md font-semibold font-custom"
                >
                  Store Timezone <span className="text-red-500">*</span>
                </label>
                <select
                  id="storeTimezoneSelect"
                  name="storeTimezone"
                  value={formData.storeTimezone}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border font-custom border-gray-300 rounded-lg form-select focus:border-[#37b6ffe0] focus:ring-0 focus:ring-[#37b6ffb0] focus:outline-none"
                >
                  <option value="">Select an option</option>
                  <option value="UTC-05">
                    UTC-05:00 (Eastern Standard Time - EST)
                  </option>
                  <option value="UTC-06">
                    UTC-06:00 (Central Standard Time - CST)
                  </option>
                  <option value="UTC-08">
                    UTC-08:00 (Pacific Standard Time - PST)
                  </option>
                  <option value="UTC+05:30">
                    UTC+05:30 (Indian Standard Time - IST)
                  </option>
                  <option value="UTC+00">
                    UTC+00:00 (Greenwich Mean Time - GMT)
                  </option>
                  <option value="UTC+08">
                    UTC+08:00 (China Standard Time - CST)
                  </option>
                </select>
              </div>
              <div className="mt-8 mb-8 text-sm">
                <p className=" text-gray-600 dark:text-gray-400 font-custom ">
                  In order to gain better insights and stats of your
                  competitors, please tell us more about yourself and your
                  store.
                </p>
              </div>
              <div>
                <label
                  htmlFor="industryCategorySelect"
                  className="block mb-1 text-md font-semibold font-custom"
                >
                  Select industry category{" "}
                  <span className="text-red-500">*</span>
                </label>
                <select
                  id="industryCategorySelect"
                  name="industryCategory"
                  value={formData.industryCategory}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border font-custom border-gray-300 rounded-lg form-select focus:border-[#37b6ffe0] focus:ring-0 focus:ring-[#37b6ffb0] focus:outline-none"
                >
                  <option value="">Select an industry</option>
                  <option value="Retail & Ecommerce">Retail & Ecommerce</option>
                  <option value="Technology & Software">
                    Technology & Software
                  </option>
                  <option value="Finance & Insurance">
                    Finance & Insurance
                  </option>
                  <option value="Healthcare & Wellness Services">
                    Healthcare & Wellness Services
                  </option>
                  <option value="Business Services">Business Services</option>
                  <option value="Education and Training">
                    Education and Training
                  </option>
                  <option value="Media & Entertainment">
                    Media & Entertainment
                  </option>
                  <option value="Other">Others</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={
                  loading ||
                  !formData.storeUrl ||
                  !formData.annualRevenue ||
                  !formData.storeCurrency ||
                  !formData.industryCategory ||
                  !formData.storeTimezone
                }
                className="w-full py-2 mt-1 cursor-pointer font-semibold text-white font-custom transition-all duration-200 rounded-lg shadow-md bg-[#37B5FF] hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Registering..." : "Continue"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
