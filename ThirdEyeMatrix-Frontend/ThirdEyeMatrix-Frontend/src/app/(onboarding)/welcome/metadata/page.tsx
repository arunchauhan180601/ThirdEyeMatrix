"use client";
import React, { useEffect, useState } from "react";
import Image from "next/image";
import facebookImage from "@/assets/images/Ads Integrations Image/facebook.png";

interface MetaInsightRow {
  date_start?: string;
  date_stop?: string;
  campaign_id?: string;
  adset_id?: string;
  ad_id?: string;
  impressions?: string;
  clicks?: string;
  spend?: string;
  reach?: string;
  frequency?: string;
  actions?: { action_type: string; value: string }[];
  action_values?: { action_type: string; value: string }[];
}

const MetaDataPage = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasConnection, setHasConnection] = useState(false);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [ads, setAds] = useState<any[]>([]);
  const [insights, setInsights] = useState<MetaInsightRow[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const token = typeof window !== "undefined" ? localStorage.getItem("User_token") : null;
        if (!token) {
          setError("Please sign in to view Meta data.");
          setLoading(false);
          return;
        }

        // Check store and whether Meta ad account is connected
        const storeRes = await fetch("http://localhost:5000/api/user/store", {
          headers: { Authorization: `Bearer ${token}` },
        });
       
        if (!storeRes.ok) {
          setError("Failed to load store.");
          setLoading(false);
          return;
        }
        const store = await storeRes.json();
         console.log("store", store);
        if (!store?.meta_ad_account_id) {
          setHasConnection(false);
          setLoading(false);
          return;
        }
        setHasConnection(true);

        // Fetch Meta data
        const [cRes, aRes, iRes] = await Promise.all([
          fetch("http://localhost:5000/api/meta/campaigns", { headers: { Authorization: `Bearer ${token}` } }),
          fetch("http://localhost:5000/api/meta/ads", { headers: { Authorization: `Bearer ${token}` } }),
          fetch("http://localhost:5000/api/meta/insights?level=campaign&time_increment=1", { headers: { Authorization: `Bearer ${token}` } }),
        ]);
        const [cJson, aJson, iJson] = await Promise.all([
          cRes.ok ? cRes.json() : { campaigns: [] },
          aRes.ok ? aRes.json() : { ads: [] },
          iRes.ok ? iRes.json() : { insights: [] },
        ]);
        setCampaigns(cJson.campaigns || []);
        setAds(aJson.ads || []);
        setInsights((iJson.insights || []) as MetaInsightRow[]);
        console.log("ads", aJson.ads);
        console.log("insights", iJson.insights );
      } catch (e: any) {
        setError(e?.message || "Failed to load Meta data.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <div className="p-6">Loading Meta data...</div>;
  if (error) return <div className="p-6 text-red-600">{error}</div>;
  if (!hasConnection)
    return (
      <div className="p-6">
        <div className="flex items-center gap-2">
          <Image src={facebookImage} alt="Meta" height={20} width={20} />
          <h1 className="text-xl font-semibold">Meta Ads</h1>
        </div>
        <p className="text-gray-600 mt-2">No Meta ad account connected for this store.</p>
      </div>
    );

  const sum = (arr: MetaInsightRow[], key: keyof MetaInsightRow) =>
    arr.reduce((s, r) => s + parseFloat((r[key] as string) || "0"), 0);
  const totalSpend = sum(insights, "spend");
  const totalImpressions = sum(insights, "impressions");
  const totalClicks = sum(insights, "clicks");
  const ctr = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;
  const cpm = totalImpressions > 0 ? (totalSpend / totalImpressions) * 1000 : 0;
  const cpc = totalClicks > 0 ? totalSpend / totalClicks : 0;
  const purchases = insights.reduce((s, r) => {
    const a = Array.isArray(r.actions) ? r.actions : [];
    const p = a.find((x) => x.action_type === "purchase");
    return s + (p ? parseFloat(p.value || "0") : 0);
  }, 0);

  return (
    <div className="max-w-6xl mx-auto p-6 mt-10 font-custom">
      <div className="flex items-center gap-2">
        <Image src={facebookImage} alt="Meta" height={22} width={22} />
        <h1 className="text-2xl font-semibold font-custom ">Meta Ads (Last 30 Days)</h1>
      </div>

      <div className=" grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-3 py-6 ">
        <div className="border rounded-md px-4 py-3 shadow-md">
          <h3 className="text-sm font-semibold text-gray-500">Spend</h3>
          <div className="text-2xl font-semibold mt-1">{Math.round(totalSpend)}</div>
        </div>
        <div className="border rounded-md px-4 py-3 shadow-md">
          <h3 className="text-sm font-semibold text-gray-500">Impressions</h3>
          <div className="text-2xl font-semibold mt-1">{Math.round(totalImpressions)}</div>
        </div>
        <div className="border rounded-md px-4 py-3 shadow-md">
          <h3 className="text-sm font-semibold text-gray-500">Clicks</h3>
          <div className="text-2xl font-semibold mt-1">{Math.round(totalClicks)}</div>
        </div>
        <div className="border rounded-md px-4 py-3 shadow-md">
          <h3 className="text-sm font-semibold text-gray-500">CTR (Click-Through Rate)</h3>
          <div className="text-2xl font-semibold mt-1">{ctr.toFixed(2)}%</div>
        </div>
        <div className="border rounded-md px-4 py-3 shadow-md">
          <h3 className="text-sm font-semibold text-gray-500">CPM (Cost Per Mille (Cost per 1000 Impressions))</h3>
          <div className="text-2xl font-semibold mt-1">{Math.round(cpm)}</div>
        </div>
        <div className="border rounded-md px-4 py-3 shadow-md">
          <h3 className="text-sm font-semibold text-gray-500">CPC (Cost Per Click) </h3>
          <div className="text-2xl font-semibold mt-1">{Math.round(cpc)}</div>
        </div>
        <div className="border rounded-md px-4 py-3 shadow-md">
          <h3 className="text-sm font-semibold text-gray-500">Purchases</h3>
          <div className="text-2xl font-semibold mt-1">{Math.round(purchases)}</div>
        </div>
      </div>

      {/* Optional: quick peek lists */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="border rounded-md p-4 bg-white">
          <h3 className="font-semibold mb-2">Top Campaigns</h3>
          <ul className="text-sm text-gray-700 space-y-1 max-h-56 overflow-auto">
            {campaigns.slice(0, 10).map((c) => (
              <li key={c.id} className="flex justify-between">
                <span className="truncate pr-2">{c.name}</span>
                <span className="text-gray-500">{c.status}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="border rounded-md p-4 bg-white">
          <h3 className="font-semibold mb-2">Recent Ads</h3>
          <ul className="text-sm text-gray-700 space-y-1 max-h-56 overflow-auto">
            {ads.slice(0, 20).map((a) => (
              <li key={a.id} className="flex justify-between">
                <span className="truncate pr-2">Name - {a.name}</span>
                <span className="text-gray-500">{a.status}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default MetaDataPage;


