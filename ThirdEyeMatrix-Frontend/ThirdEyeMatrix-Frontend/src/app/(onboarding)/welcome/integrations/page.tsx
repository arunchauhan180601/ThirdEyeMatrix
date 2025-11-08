"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import socialImage from "@/assets/images/social-media-logo-image.png";
import facebookImage from "@/assets/images/Ads Integrations Image/facebook.png";
import googleImage from "@/assets/images/Ads Integrations Image/googleAds.png";
import klaviyoImage from "@/assets/images/Ads Integrations Image/Klaviyo.png";
import trustPilotImage from "@/assets/images/Ads Integrations Image/Trustpilot.png";
import tiktokImage from "@/assets/images/Ads Integrations Image/tik-tok.png";
import snapchatImage from "@/assets/images/Ads Integrations Image/snapchat.png";
import yotpoImage from "@/assets/images/Ads Integrations Image/yotpo.png";
import omnisendImage from "@/assets/images/Ads Integrations Image/omnisend.png";
import amazonImage from "@/assets/images/Ads Integrations Image/amazon.png";
import linkedinImage from "@/assets/images/Ads Integrations Image/linkedIn.png";
import twitterImage from "@/assets/images/Ads Integrations Image/Logo_of_Twitter.png";
import Image from "next/image";
import { ChevronDown, Search } from "lucide-react";
import Link from "next/link";

const IntegrationsPage = () => {
  const router = useRouter();
  const [isMetaConnected, setIsMetaConnected] = useState<boolean | null>(null);
  const [isMetaActionLoading, setIsMetaActionLoading] = useState(false);
  const [isKlaviyoConnected, setIsKlaviyoConnected] = useState<boolean | null>(
    null
  );
  const [isKlaviyoActionLoading, setIsKlaviyoActionLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [connectionFilter, setConnectionFilter] = useState("");
  const [showDisconnectModal, setShowDisconnectModal] = useState(false);
  const [pendingDisconnectType, setPendingDisconnectType] = useState<
    "Meta" | "Klaviyo" | null
  >(null);

  useEffect(() => {
    const checkMetaStatus = async () => {
      const token =
        typeof window !== "undefined"
          ? localStorage.getItem("User_token")
          : null;
      if (!token) {
        setIsMetaConnected(false);
        setIsKlaviyoConnected(false);
        return;
      }
      try {
        const res = await fetch(
          `${
            process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000"
          }/api/meta/status`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          }
        );
        const data = await res.json();
        if (!res.ok)
          throw new Error(data.message || "Failed to fetch Meta status");
        setIsMetaConnected(!!data.connected);
      } catch (e) {
        console.error("Meta status error", e);
        setIsMetaConnected(false);
      }
      try {
        const res = await fetch(
          `${
            process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000"
          }/api/klaviyo/status`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          }
        );
        const data = await res.json();
        if (!res.ok)
          throw new Error(data.message || "Failed to fetch Klaviyo status");
        setIsKlaviyoConnected(!!data.connected);
      } catch (e) {
        console.error("Klaviyo status error", e);
        setIsKlaviyoConnected(false);
      }
    };
    checkMetaStatus();
  }, []);

  const handleConnectMeta = async () => {
    const token =
      typeof window !== "undefined" ? localStorage.getItem("User_token") : null;
    if (!token) {
      router.push("/auth/user/signin");
      return;
    }
    try {
      setIsMetaActionLoading(true);
      const res = await fetch(
        `${
          process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000"
        }/api/meta/start`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const data = await res.json();
      if (!res.ok)
        throw new Error(data.message || "Failed to start Meta OAuth");
      window.location.href = data.redirectUrl;
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setIsMetaActionLoading(false);
    }
  };

  const handleDisconnectMeta = async () => {
    const token =
      typeof window !== "undefined" ? localStorage.getItem("User_token") : null;
    if (!token) {
      router.push("/auth/user/signin");
      return;
    }
    try {
      setIsMetaActionLoading(true);
      const res = await fetch(
        `${
          process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000"
        }/api/meta/disconnect`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok)
        throw new Error((data as any).message || "Failed to disconnect Meta");
      setIsMetaConnected(false);
    } catch (e) {
      console.error("Meta disconnect error", e);
      alert((e as Error).message || "Failed to disconnect Meta");
    } finally {
      setIsMetaActionLoading(false);
    }
  };

  const handleConnectGoogleAds = async () => {
    const token =
      typeof window !== "undefined" ? localStorage.getItem("User_token") : null;
    if (!token) {
      router.push("/auth/user/signin");
      return;
    }
    try {
      const res = await fetch("http://localhost:5000/api/google-ads/start", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (!res.ok)
        throw new Error(data.message || "Failed to start Google Ads OAuth");
      window.location.href = data.redirectUrl;
    } catch (e) {
      alert((e as Error).message);
    }
  };

  const handleConnectKlaviyo = async () => {
    const token =
      typeof window !== "undefined" ? localStorage.getItem("User_token") : null;
    if (!token) {
      router.push("/auth/user/signin");
      return;
    }
    try {
      setIsKlaviyoActionLoading(true);
      const res = await fetch(
        `${
          process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000"
        }/api/klaviyo/start`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const data = await res.json();
      if (!res.ok)
        throw new Error(data.message || "Failed to start Klaviyo OAuth");
      window.location.href = data.redirectUrl;
    } catch (err) {
      console.error("start Klaviyo error", err);
      alert((err as Error).message || "Failed to start Klaviyo OAuth");
    } finally {
      setIsKlaviyoActionLoading(false);
    }
  };

  const handleDisconnectKlaviyo = async () => {
    const token =
      typeof window !== "undefined" ? localStorage.getItem("User_token") : null;
    if (!token) {
      router.push("/auth/user/signin");
      return;
    }
    try {
      setIsKlaviyoActionLoading(true);
      const res = await fetch(
        `${
          process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000"
        }/api/klaviyo/disconnect`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok)
        throw new Error(
          (data as any).message || "Failed to disconnect Klaviyo"
        );
      setIsKlaviyoConnected(false);
    } catch (e) {
      console.error("Klaviyo disconnect error", e);
      alert((e as Error).message || "Failed to disconnect Klaviyo");
    } finally {
      setIsKlaviyoActionLoading(false);
    }
  };

  const integrations = [
    { name: "Meta", image: facebookImage },
    { name: "Google", image: googleImage },
    { name: "Klaviyo", image: klaviyoImage },
    { name: "Trust Pilot", image: trustPilotImage },
    { name: "Tiktok Ads", image: tiktokImage },
    { name: "Snapchat", image: snapchatImage },
    { name: "Yotpo", image: yotpoImage },
    { name: "Omnisend", image: omnisendImage },
    { name: "Twitter", image: twitterImage },
    { name: "Amazon", image: amazonImage },
    { name: "Linkedin", image: linkedinImage },
  ];

  const filteredIntegrations = integrations.filter((integration) => {
    const matchesSearch = integration.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    let isConnected = false;
    if (integration.name === "Meta") isConnected = !!isMetaConnected;
    else if (integration.name === "Klaviyo") isConnected = !!isKlaviyoConnected;
    else isConnected = false;
    if (connectionFilter === "Connected" && !isConnected) return false;
    if (connectionFilter === "Not Connected" && isConnected) return false;
    return matchesSearch;
  });



  return (
    <div className="bg-[#f9fafb]">
      <div className="flex flex-col items-center justify-center min-h-[80vh] font-custom p-4">
        <div className="grid md:grid-cols-2 gap-4 w-full max-w-5xl shadow-lg rounded-xl my-10 p-4 items-center bg-white">
          <div className="text-center md:text-start px-2">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-4">
              Third Eye Matrix Integrations
            </h1>
            <p className="text-sm sm:text-[15px] text-gray-600 mb-8 max-w-xl">
              Easily connect external apps and platforms with your Third Eye
              Matrix account to add more data to your dashboard.
            </p>
          </div>
          <div className="hidden md:flex items-center justify-end">
            <img
              src={socialImage.src}
              alt="social-media-logo-image"
              height={230}
              width={230}
              className="image-fluid"
            />
          </div>
        </div>

        {/* Search Section */}
        <div className="w-full max-w-5xl grid grid-cols-2 lg:grid-cols-6 gap-1 mb-7 font-medium">
          <div className="relative border py-2 w-full rounded-lg flex items-center">
            <select
              className="w-full appearance-none outline-none bg-transparent px-3 text-md cursor-pointer"
              defaultValue=""
            >
              <option value="">All Categories</option>
              <option value="Advertising">Advertising</option>
              <option value="MarketPlace">Market Place</option>
              <option value="Email-SMS">Email / SMS</option>
              <option value="Analytics">Analytics</option>
              <option value="Data">Data In</option>
              <option value="Subscription">Subscription</option>
              <option value="Shipping">Shipping</option>
              <option value="Customer Service">Customer Servi..</option>
              <option value="Reviews">Reviews</option>
              <option value="Team Collaboration">Team Collab..</option>
            </select>
            <ChevronDown
              size={18}
              className="absolute right-2 text-gray-500 pointer-events-none"
            />
          </div>

          <div className="relative border py-2 w-full rounded-lg flex items-center">
            <select
              className="w-full appearance-none outline-none bg-transparent px-3 cursor-pointer"
              value={connectionFilter}
              onChange={(e) => setConnectionFilter(e.target.value)}
            >
              <option value="">All Integrations</option>
              <option value="Connected">Connected</option>
              <option value="Not Connected">Not Connected</option>
            </select>
            <ChevronDown
              size={18}
              className="absolute right-2 text-gray-500 pointer-events-none"
            />
          </div>

          <div className="relative border rounded-lg col-span-4 flex items-center">
            <Search className="absolute left-4 text-gray-500" size={18} />
            <input
              type="text"
              placeholder="Search integrations"
              className="w-full pl-10 pr-2 outline-none py-2 px-4 bg-transparent text-gray-700 focus:border-blue-600 focus:rounded-md focus:ring-1 focus:ring-blue-600"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Advertising Section */}
        <div className="w-full max-w-5xl mb-7">
          <h2 className="mb-2 font-semibold text-lg">Advertising</h2>
          <p className="text-gray-500">
            Gain full visibility into your advertising efforts—from ad spend to
            cross-channel ROAS & more.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 gap-4 w-full max-w-5xl">
          {filteredIntegrations
            .filter((item) => !["Klaviyo", "Yotpo"].includes(item.name))
            .map((item) => {
              if (item.name === "Meta") {
                return (
                  <div
                    key={item.name}
                    className="flex items-center justify-between py-6 px-4 border shadow-md rounded-lg bg-white hover:shadow-xl"
                  >
                    <div>
                      <div className="flex items-center gap-3 py-3">
                        <Image
                          src={item.image}
                          alt={item.name}
                          height={20}
                          width={20}
                        />
                        <span className="font-medium">{item.name}</span>
                      </div>
                      <Link href="/welcome/integrations/meta/summary">
                        <ul>
                          <li className="relative text-sm px-2 text-gray-700 before:content-[''] before:inline-block before:w-2 before:h-2 before:rounded-full before:bg-green-500 before:mr-2">
                            View Connection Details
                          </li>
                        </ul>
                      </Link>
                    </div>
                    <button
                      onClick={
                        isMetaConnected
                          ? () => {
                              setPendingDisconnectType("Meta");
                              setShowDisconnectModal(true);
                            }
                          : handleConnectMeta
                      }
                      disabled={isMetaActionLoading || isMetaConnected === null}
                      className={`px-4 py-2 rounded-md text-sm cursor-pointer ${
                        isMetaConnected
                          ? "border border-gray-400 bg-white text-black font-semibold"
                          : "bg-[#0c70f2] hover:bg-blue-700 text-white"
                      }`}
                    >
                      {isMetaConnected
                        ? isMetaActionLoading
                          ? "Disconnecting…"
                          : "Disconnect"
                        : isMetaActionLoading
                        ? "Connecting…"
                        : "Connect"}
                    </button>
                  </div>
                );
              } else if (item.name === "Google") {
                return (
                  <div
                    key={item.name}
                    className="flex items-center justify-between p-4 border shadow-md rounded-lg bg-white hover:shadow-xl"
                  >
                    <div className="flex items-center gap-1 py-4">
                      <Image
                        src={item.image}
                        alt={item.name}
                        height={30}
                        width={30}
                      />
                      <span className="font-medium">{item.name}</span>
                    </div>
                    <button
                      onClick={handleConnectGoogleAds}
                      className="bg-[#0c70f2] hover:bg-blue-700 text-white px-4 py-2 cursor-pointer rounded-md text-sm font-bold"
                    >
                      Connect
                    </button>
                  </div>
                );
              } else {
                return (
                  <div
                    key={item.name}
                    className="flex items-center justify-between p-4 border shadow-md rounded-lg py-6 bg-white hover:shadow-xl"
                  >
                    <div className="flex items-center gap-3 py-4">
                      <Image
                        src={item.image}
                        alt={item.name}
                        height={25}
                        width={25}
                      />
                      <span className="font-medium">{item.name}</span>
                    </div>
                    <button className="px-4 py-2 rounded-md cursor-pointer bg-[#0c70f2] hover:bg-blue-700 text-white font-bold text-sm">
                      Connect
                    </button>
                  </div>
                );
              }
            })}
        </div>

        {/* Email / SMS Section */}
        <div className="w-full max-w-5xl mb-7 mt-10">
          <h2 className="mb-2 font-semibold text-lg">Email / SMS</h2>
          <p className="text-gray-500">
            Gain visibility into your customer journey across your owned
            channels.
          </p>

          <div className="grid sm:grid-cols-2 gap-4 w-full max-w-5xl my-8">
            {filteredIntegrations
              .filter((item) => ["Klaviyo", "Yotpo"].includes(item.name))
              .map((item) => {
                if (item.name === "Klaviyo") {
                  return (
                    <div
                      key={item.name}
                      className="flex items-center justify-between p-4 py-6 border shadow-md rounded-lg bg-white hover:shadow-xl"
                    >
                      <div className="flex items-center gap-1 py-4">
                        <Image
                          src={item.image}
                          alt={item.name}
                          height={30}
                          width={30}
                        />
                        <span className="font-medium">{item.name}</span>
                      </div>
                      <button
                        onClick={
                          isKlaviyoConnected
                            ? () => {
                                setPendingDisconnectType("Klaviyo");
                                setShowDisconnectModal(true);
                              }
                            : handleConnectKlaviyo
                        }
                        disabled={
                          isKlaviyoActionLoading || isKlaviyoConnected === null
                        }
                        className={`px-4 py-2 rounded-md text-sm cursor-pointer ${
                          isKlaviyoConnected
                            ? "border border-gray-400 bg-white text-black font-semibold"
                            : "bg-[#0c70f2] hover:bg-blue-700 text-white"
                        }`}
                      >
                        {isKlaviyoConnected
                          ? isKlaviyoActionLoading
                            ? "Disconnecting…"
                            : "Disconnect"
                          : isKlaviyoActionLoading
                          ? "Connecting…"
                          : "Connect"}
                      </button>
                    </div>
                  );
                } else {
                  return (
                    <div
                      key={item.name}
                      className="flex items-center justify-between p-4 border shadow-md rounded-lg bg-white hover:shadow-xl"
                    >
                      <div className="flex items-center gap-3 py-4">
                        <Image
                          src={item.image}
                          alt={item.name}
                          height={25}
                          width={25}
                        />
                        <span className="font-medium">{item.name}</span>
                      </div>
                      <button className="px-4 py-2 rounded-md cursor-pointer bg-[#0c70f2] hover:bg-blue-700 text-white font-bold text-sm">
                        Connect
                      </button>
                    </div>
                  );
                }
              })}
          </div>
        </div>

        {/* Disconnect Modal */}
        {showDisconnectModal && (
          <div className="fixed inset-0 bg-opacity-50 flex justify-center items-center z-50 bg-gray/100 backdrop-blur-xs backdrop-brightness-50 ">
            <div className="bg-white rounded-lg shadow-lg p-6 w-[90%] max-w-lg">
              <h3 className="text-2xl font-semibold text-gray-800 mb-3 text-center ">
                Confirm Disconnect{" "}
              </h3>
              <p className="text-gray-600 mb-6 text-center">
                Are you sure you want to disconnect your {pendingDisconnectType}{" "}
                account? This will remove the connection from your dashboard.
              </p>
              <div className="grid grid-cols-2 gap-2 font-medium ">
                <button
                  onClick={() => setShowDisconnectModal(false)}
                  className="px-4 py-2 bg-gray-200 rounded-md text-gray-800 hover:bg-gray-300 cursor-pointer "
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (pendingDisconnectType === "Meta")
                      handleDisconnectMeta();
                    else if (pendingDisconnectType === "Klaviyo")
                      handleDisconnectKlaviyo();
                    setShowDisconnectModal(false);
                  }}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 cursor-pointer "
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default IntegrationsPage;
