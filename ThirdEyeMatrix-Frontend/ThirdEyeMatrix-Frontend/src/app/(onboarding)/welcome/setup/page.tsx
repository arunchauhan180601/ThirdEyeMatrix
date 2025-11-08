"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import shopifyImage from "@/assets/images/shopify-image.svg";
import wooCommerceImage from "@/assets/images/WooCommerce.svg";
import magentoImage from "@/assets/images/magentoLogoImage.png";

const SetupPage = () => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnectingWoo, setIsConnectingWoo] = useState(false);
  const [platformName, setPlatformName] = useState("");
  const router = useRouter();

  useEffect(() => {
    if (typeof window !== "undefined") {
      const Token = localStorage.getItem("User_token");
      if (!Token) {
        router.push("/auth/user/signin");
        return;
      }

      const fetchUserStoreDetails = async () => {
        try {
          const response = await fetch("http://localhost:5000/api/user/store", {
            headers: {
              Authorization: `Bearer ${Token}`,
            },
          });

          if (!response.ok) {
            throw new Error("Failed to fetch user store");
          }

          const data = await response.json();
          setPlatformName(data.platform);
        } catch (error) {
          console.error("Error fetching user store:", error);
          router.push("/auth/user/signin");
        }
      };

      fetchUserStoreDetails();
    }
  }, []);

  const handleConnectToShopify = async () => {
    const token = localStorage.getItem("User_token");
    if (!token) {
      alert("You must be logged in to connect your Shopify store.");
      return;
    }
    setIsConnecting(true);

    try {
      const response = await fetch(
        "http://localhost:5000/api/shopify/connect",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || `HTTP error! status: ${response.status}`
        );
      }

      const data = await response.json();
      console.log("Frontend received redirectUrl:", data.redirectUrl);

      localStorage.setItem("shopifyCompleted", "true");
      window.dispatchEvent(new CustomEvent("shopifyCompleted"));

      setIsConnecting(false);
      setTimeout(() => {
        window.location.href = data.redirectUrl;
      }, 1500);
    } catch (error: any) {
      console.error("Error connecting to Shopify:", error);
      alert(error.message || "Failed to connect to Shopify. Please try again.");
      setIsConnecting(false);
    }
  };

  const handleConnectToWooCommerce = async () => {
    const token = localStorage.getItem("User_token");
    if (!token) {
      alert("You must be logged in to connect your WooCommerce store.");
      return;
    }

    setIsConnectingWoo(true);

    try {
      const response = await fetch(
        "http://localhost:5000/api/woocommerce/connect",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || `HTTP error! status: ${response.status}`
        );
      }

      const data = await response.json();
      console.log("Frontend received Woo redirectUrl:", data.redirectUrl);
      window.location.href = data.redirectUrl;
    } catch (error: any) {
      console.error("Error connecting to WooCommerce:", error);
      alert(
        error.message || "Failed to connect to WooCommerce. Please try again."
      );
      setIsConnectingWoo(false);
    }
  };

  return (
    <>
      <div className="flex flex-col items-center justify-center min-h-[80vh] text-center font-custom p-4">
        {/* ✅ Platform Logo */}
        {platformName?.toLowerCase() === "shopify" ? (
          <Image
            src={shopifyImage}
            alt="Shopify"
            width={90}
            height={90}
            className="mb-7 sm:mb-12"
          />
        ) : platformName?.toLowerCase() === "magento" ? (
          <Image
            src={magentoImage}
            alt="Magento"
            width={90}
            height={90}
            className="mb-7 sm:mb-12"
          />
        ) : platformName?.toLowerCase() === "woocommerce" ? (
          <Image
            src={wooCommerceImage}
            alt="WooCommerce"
            width={100}
            height={100}
            className="mb-5 sm:mb-12"
          />
        ) : null}

        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-4">
          Give Third Eye Matrix access to your shop
        </h1>
        <p className="sm:text-md text-gray-600 mb-8 max-w-xl">
          Click below to add the Third Eye Matrix app to your e-commerce store.
          Once connected, you'll be able to use Analytics in Third Eye Matrix.
        </p>

        {/* ✅ Conditionally show button based on platform */}
        <div className="p-6 sm:py-10 bg-gray-100 rounded-md">
          {platformName?.toLowerCase() === "shopify" && (
            <div className="flex justify-center">
              <button
                onClick={handleConnectToShopify}
                disabled={isConnecting}
                className="flex gap-2 text-white font-bold mb-2 py-2 px-5 sm:py-2 sm:px-8 rounded-lg shadow-lg bg-black cursor-pointer"
              >
                <Image
                  src={shopifyImage}
                  height={16}
                  width={16}
                  alt="shopify"
                />
                {isConnecting ? "Connecting..." : "Connect to Shopify"}
              </button>
            </div>
          )}

          {platformName?.toLowerCase() === "woocommerce" && (
            <div className="flex justify-center my-3">
              <button
                onClick={handleConnectToWooCommerce}
                disabled={isConnectingWoo}
                className="flex gap-2 text-white font-bold py-2 px-5 sm:py-2 sm:px-8 rounded-lg shadow-lg bg-black cursor-pointer"
              >
                <Image
                  src={wooCommerceImage}
                  height={20}
                  width={20}
                  alt="wooCommerceImage"
                />
                {isConnectingWoo
                  ? "Connecting to WooCommerce..."
                  : "Connect to WooCommerce"}
              </button>
            </div>
          )}

          {platformName?.toLowerCase() === "magento" && (
            <div className="flex justify-center my-3">
              <button
                disabled
                className="flex gap-2 text-white font-bold py-2 px-5 sm:py-2 sm:px-8 rounded-lg shadow-lg bg-black cursor-not-allowed"
              >
                 <Image
                  src={magentoImage}
                  height={20}
                  width={20}
                  alt="magentoImage"
                />
                Connect to Magento
              </button>
            </div>
          )}
          <p className="text-sm font-custom py-2">
            Not the admin on your{" "}
            {platformName === "Shopify"
              ? "Shopify"
              : platformName === "Woocommerce"
              ? "WooCommerce"
                : platformName === "Magento"
              ? "Magento"
              : ""}{" "}
            store?{" "}
            <span className="text-blue-500 underline">
              {" "}
              Invite another user{" "}
            </span>
          </p>
        </div>

        <div className="mt-8 mb-2">
          <button className="bg-blue-600 cursor-pointer hover:bg-blue-500 text-white font-bold py-2 px-5 sm:py-2 sm:px-8 rounded-md shadow-lg ">
            Next
          </button>
        </div>
      </div>
    </>
  );
};

export default SetupPage;
