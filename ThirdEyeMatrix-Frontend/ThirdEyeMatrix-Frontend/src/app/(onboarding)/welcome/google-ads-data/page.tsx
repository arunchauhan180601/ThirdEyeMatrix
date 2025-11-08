"use client";
import React, { useEffect, useState } from "react";
import Image from "next/image";
import googleImage from "@/assets/images/Ads Integrations Image/googleAds.png";

interface GoogleAdsInsightRow {
  campaign_id?: string;
  campaign_name?: string;
  date?: string;
  impressions?: number;
  clicks?: number;
  cost_micros?: number;
  conversions?: number;
  conversions_value?: number;
  ctr?: string;
  cpc?: string;
}

const GoogleAdsDataPage = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasConnection, setHasConnection] = useState(false);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [ads, setAds] = useState<any[]>([]);
  const [insights, setInsights] = useState<GoogleAdsInsightRow[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const token = typeof window !== "undefined" ? localStorage.getItem("User_token") : null;
        if (!token) {
          setError("Please sign in to view Google Ads data.");
          setLoading(false);
          return;
        }

        // Check store and whether Google Ads account is connected
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
        if (!store?.google_customer_id) {
          setHasConnection(false);
          setLoading(false);
          return;
        }
        setHasConnection(true);

        // Fetch Google Ads data
        const [cRes, aRes, iRes] = await Promise.all([
          fetch("http://localhost:5000/api/google-ads/campaigns", { headers: { Authorization: `Bearer ${token}` } }),
          fetch("http://localhost:5000/api/google-ads/ads", { headers: { Authorization: `Bearer ${token}` } }),
          fetch("http://localhost:5000/api/google-ads/insights?startDate=2024-01-01&endDate=2024-12-31", { headers: { Authorization: `Bearer ${token}` } }),
        ]);
        const [cJson, aJson, iJson] = await Promise.all([
          cRes.ok ? cRes.json() : { campaigns: [] },
          aRes.ok ? aRes.json() : { ads: [] },
          iRes.ok ? iRes.json() : { insights: [] },
        ]);
        setCampaigns(cJson.campaigns || []);
        setAds(aJson.ads || []);
        setInsights((iJson.insights || []) as GoogleAdsInsightRow[]);
        console.log("Google Ads insights", iJson.insights);
      } catch (e: any) {
        setError(e?.message || "Failed to load Google Ads data.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <div className="p-6">Loading Google Ads data...</div>;
  if (error) return <div className="p-6 text-red-600">{error}</div>;
  if (!hasConnection)
    return (
      <div className="p-6">
        <div className="flex items-center gap-2">
          <Image src={googleImage} alt="Google Ads" height={20} width={20} />
          <h1 className="text-xl font-semibold">Google Ads</h1>
        </div>
        <p className="text-gray-600 mt-2">No Google Ads account connected for this store.</p>
      </div>
    );

  const sum = (arr: GoogleAdsInsightRow[], key: keyof GoogleAdsInsightRow) =>
    arr.reduce((s, r) => s + parseFloat((r[key] as string) || "0"), 0);
  
  const totalSpend = insights.reduce((s, r) => s + (r.cost_micros || 0) / 1000000, 0); // Convert micros to dollars
  const totalImpressions = sum(insights, "impressions");
  const totalClicks = sum(insights, "clicks");
  const totalConversions = sum(insights, "conversions");
  const totalConversionsValue = insights.reduce((s, r) => s + (r.conversions_value || 0), 0);
  
  const ctr = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;
  const cpm = totalImpressions > 0 ? (totalSpend / totalImpressions) * 1000 : 0;
  const cpc = totalClicks > 0 ? totalSpend / totalClicks : 0;
  const conversionRate = totalClicks > 0 ? (totalConversions / totalClicks) * 100 : 0;
  const roas = totalSpend > 0 ? totalConversionsValue / totalSpend : 0;

  return (
    <div className="max-w-6xl mx-auto p-6 mt-10 font-custom">
      <div className="flex items-center gap-2">
        <Image src={googleImage} alt="Google Ads" height={22} width={22} />
        <h1 className="text-2xl font-semibold font-custom">Google Ads (Last 30 Days)</h1>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 py-6">
        <div className="border rounded-md px-4 py-3 shadow-md">
          <h3 className="text-sm font-semibold text-gray-500">Spend</h3>
          <div className="text-2xl font-semibold mt-1">${totalSpend.toFixed(2)}</div>
        </div>
        <div className="border rounded-md px-4 py-3 shadow-md">
          <h3 className="text-sm font-semibold text-gray-500">Impressions</h3>
          <div className="text-2xl font-semibold mt-1">{Math.round(totalImpressions).toLocaleString()}</div>
        </div>
        <div className="border rounded-md px-4 py-3 shadow-md">
          <h3 className="text-sm font-semibold text-gray-500">Clicks</h3>
          <div className="text-2xl font-semibold mt-1">{Math.round(totalClicks).toLocaleString()}</div>
        </div>
        <div className="border rounded-md px-4 py-3 shadow-md">
          <h3 className="text-sm font-semibold text-gray-500">CTR (Click-Through Rate)</h3>
          <div className="text-2xl font-semibold mt-1">{ctr.toFixed(2)}%</div>
        </div>
        <div className="border rounded-md px-4 py-3 shadow-md">
          <h3 className="text-sm font-semibold text-gray-500">CPM (Cost Per Mille)</h3>
          <div className="text-2xl font-semibold mt-1">${cpm.toFixed(2)}</div>
        </div>
        <div className="border rounded-md px-4 py-3 shadow-md">
          <h3 className="text-sm font-semibold text-gray-500">CPC (Cost Per Click)</h3>
          <div className="text-2xl font-semibold mt-1">${cpc.toFixed(2)}</div>
        </div>
        <div className="border rounded-md px-4 py-3 shadow-md">
          <h3 className="text-sm font-semibold text-gray-500">Conversions</h3>
          <div className="text-2xl font-semibold mt-1">{Math.round(totalConversions)}</div>
        </div>
        <div className="border rounded-md px-4 py-3 shadow-md">
          <h3 className="text-sm font-semibold text-gray-500">Conversion Rate</h3>
          <div className="text-2xl font-semibold mt-1">{conversionRate.toFixed(2)}%</div>
        </div>
        <div className="border rounded-md px-4 py-3 shadow-md">
          <h3 className="text-sm font-semibold text-gray-500">Conversions Value</h3>
          <div className="text-2xl font-semibold mt-1">${totalConversionsValue.toFixed(2)}</div>
        </div>
        <div className="border rounded-md px-4 py-3 shadow-md">
          <h3 className="text-sm font-semibold text-gray-500">ROAS (Return on Ad Spend)</h3>
          <div className="text-2xl font-semibold mt-1">{roas.toFixed(2)}x</div>
        </div>
      </div>

      {/* Campaigns and Ads Lists */}
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
          <h3 className="font-semibold mb-2">Recent Ad Groups</h3>
          <ul className="text-sm text-gray-700 space-y-1 max-h-56 overflow-auto">
            {ads.slice(0, 10).map((a) => (
              <li key={a.id} className="flex justify-between">
                <span className="truncate pr-2">{a.name}</span>
                <span className="text-gray-500">{a.status}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Insights Table */}
      {insights.length > 0 && (
        <div className="mt-6 border rounded-md p-4 bg-white">
          <h3 className="font-semibold mb-4">Campaign Performance Details</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Campaign</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Impressions</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Clicks</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cost</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Conversions</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">CTR</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">CPC</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {insights.slice(0, 20).map((insight, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {insight.campaign_name || `Campaign ${insight.campaign_id}`}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {insight.date}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {insight.impressions?.toLocaleString() || 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {insight.clicks?.toLocaleString() || 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      ${((insight.cost_micros || 0) / 1000000).toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {insight.conversions || 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {insight.ctr || '0.00'}%
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      ${insight.cpc || '0.00'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default GoogleAdsDataPage;
