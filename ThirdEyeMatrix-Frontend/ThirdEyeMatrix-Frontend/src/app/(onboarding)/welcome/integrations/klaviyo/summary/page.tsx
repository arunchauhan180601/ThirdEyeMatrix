"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import klaviyoImage from "@/assets/images/Ads Integrations Image/Klaviyo.png";
import Image from "next/image";

// --- START: UPDATED INTERFACES ---

interface ContactInformation {
  default_sender_email: string;
  default_sender_name: string;
  organization_name: string; // Actual company name field
   website_url: string;
}

interface AccountAttributes {
  contact_information: ContactInformation;
  industry: string;
  timezone: string;
  // Actual website field
  // ... other attributes omitted for brevity
}

interface AccountDataItem {
  type: string;
  id: string;
  attributes: AccountAttributes;
}

interface KlaviyoAccountResponse {
  data: AccountDataItem[]; // The API returns an array
  links: any; // Simplified for the links object
}

// --- END: UPDATED INTERFACES ---


const KlaviyoSummaryPage = () => {
  const router = useRouter();
  // Use the correct interface for the state
  const [accountInfo, setAccountInfo] = useState<KlaviyoAccountResponse | null>(null); 
  const [isLoading, setIsLoading] = useState(true);
  const [accountError, setAccountError] = useState("");
  // Campaigns state
  type CampaignItem = { id: string; type: string; attributes?: { name?: string } };
  type CampaignsResponse = { data?: CampaignItem[] } | null;
  const [campaigns, setCampaigns] = useState<CampaignsResponse>(null);
  const [campaignsLoading, setCampaignsLoading] = useState(false);
  const [campaignsError, setCampaignsError] = useState("");
  // Lists state
  type ListItem = { id: string; type: string; attributes?: { name?: string } };
  type ListsResponse = { data?: ListItem[] } | null;
  const [lists, setLists] = useState<ListsResponse>(null);
  const [listsLoading, setListsLoading] = useState(false);
  const [listsError, setListsError] = useState("");
  // Profiles state
  type ProfileItem = { id: string; type: string; attributes?: { email?: string; name?: string } };
  type ProfilesResponse = { data?: ProfileItem[] } | null;
  const [profiles, setProfiles] = useState<ProfilesResponse>(null);
  const [profilesLoading, setProfilesLoading] = useState(false);
  const [profilesError, setProfilesError] = useState("");
  // Flows state
  type FlowItem = { id: string; type: string; attributes?: { name?: string } };
  type FlowsResponse = { data?: FlowItem[] } | null;
  const [flows, setFlows] = useState<FlowsResponse>(null);
  const [flowsLoading, setFlowsLoading] = useState(false);
  const [flowsError, setFlowsError] = useState("");
  // Metrics state
  type MetricItem = { id: string; type: string; attributes?: { name?: string } };
  type MetricsResponse = { data?: MetricItem[] } | null;
  const [metrics, setMetrics] = useState<MetricsResponse>(null);
  const [metricsLoading, setMetricsLoading] = useState(false);
  const [metricsError, setMetricsError] = useState("");
  // Events state
  type EventItem = { id: string; type: string; attributes?: { event_name?: string; name?: string } };
  type EventsResponse = { data?: EventItem[] } | null;
  const [events, setEvents] = useState<EventsResponse>(null);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [eventsError, setEventsError] = useState("");

  useEffect(() => {
    fetchAccountInfo();
  }, []);

  const fetchAccountInfo = async () => {
    // ... (Your fetch logic is fine)
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('User_token') : null;
      if (!token) {
        router.push('/auth/user/signin');
        return;
      }

      const res = await fetch('http://localhost:5000/api/klaviyo/account', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      const data: KlaviyoAccountResponse = await res.json();
      
      if (!res.ok) {
        throw new Error((data as any).message || 'Failed to fetch account info');
      }
      console.log("data", data);
      setAccountInfo(data);
      // After account info, fetch campaigns
      fetchCampaigns();
      fetchLists();
      fetchProfiles();
      fetchFlows();
      fetchMetrics();
      fetchEvents();
    } catch (e) {
      setAccountError((e as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCampaigns = async () => {
    try {
      setCampaignsLoading(true);
      const token = typeof window !== 'undefined' ? localStorage.getItem('User_token') : null;
      if (!token) return;
      const url = 'http://localhost:5000/api/klaviyo/campaigns';
      const res = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.message || 'Failed to fetch campaigns');
      console.log("campaign", json);
      setCampaigns(json as CampaignsResponse);
    } catch (e) {
      // surface but don't block the page
      setCampaignsError((e as Error).message);
    } finally {
      setCampaignsLoading(false);
    }
  };

  const getAuthHeaders = () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('User_token') : null;
    if (!token) return null;
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    } as const;
  };

  const fetchLists = async () => {
    try {
      setListsLoading(true);
      const headers = getAuthHeaders();
      if (!headers) return;
      const res = await fetch('http://localhost:5000/api/klaviyo/lists', { headers });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.message || 'Failed to fetch lists');
      setLists(json as ListsResponse);
    } catch (e) {
      setListsError((e as Error).message);
    } finally {
      setListsLoading(false);
    }
  };

  const fetchProfiles = async () => {
    try {
      setProfilesLoading(true);
      const headers = getAuthHeaders();
      if (!headers) return;
      const res = await fetch('http://localhost:5000/api/klaviyo/profiles', { headers });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.message || 'Failed to fetch profiles');
      console.log("profile", json );
      setProfiles(json as ProfilesResponse);
    } catch (e) {
      setProfilesError((e as Error).message);
    } finally {
      setProfilesLoading(false);
    }
  };

  const fetchFlows = async () => {
    try {
      setFlowsLoading(true);
      const headers = getAuthHeaders();
      if (!headers) return;
      const res = await fetch('http://localhost:5000/api/klaviyo/flows', { headers });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.message || 'Failed to fetch flows');
      setFlows(json as FlowsResponse);
    } catch (e) {
      setFlowsError((e as Error).message);
    } finally {
      setFlowsLoading(false);
    }
  };

  const fetchMetrics = async () => {
    try {
      setMetricsLoading(true);
      const headers = getAuthHeaders();
      if (!headers) return;
      const res = await fetch('http://localhost:5000/api/klaviyo/metrics', { headers });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.message || 'Failed to fetch metrics');
      console.log("metrics", json);
      setMetrics(json as MetricsResponse);
    } catch (e) {
      setMetricsError((e as Error).message);
    } finally {
      setMetricsLoading(false);
    }
  };

  const fetchEvents = async () => {
    try {
      setEventsLoading(true);
      const headers = getAuthHeaders();
      if (!headers) return;
      const res = await fetch('http://localhost:5000/api/klaviyo/events', { headers });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.message || 'Failed to fetch events');
      setEvents(json as EventsResponse);
    } catch (e) {
      setEventsError((e as Error).message);
    } finally {
      setEventsLoading(false);
    }
  };

  const handleContinue = () => {
    router.push('/welcome/integrations');
  };

  const handleDisconnect = async () => {
    // ... (Your disconnect logic is fine)
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('User_token') : null;
      if (!token) {
        router.push('/auth/user/signin');
        return;
      }

      const res = await fetch('http://localhost:5000/api/klaviyo/disconnect', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        router.push('/welcome/integrations');
      } else {
        const data = await res.json();
        setAccountError(data.message || 'Failed to disconnect');
      }
    } catch (e) {
      setAccountError((e as Error).message);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] text-center font-custom p-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <p className="mt-4 text-gray-600">Loading account information...</p>
      </div>
    );
  }

  // Define a variable for the account data to simplify referencing it
  // Check if data is an array and has at least one item
  const accountData = accountInfo?.data?.[0]?.attributes;

  // Use a return guard if accountData is missing, as there is no info to display
  if (accountError || !accountData) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[80vh] text-center font-custom p-4">
            <h1 className="text-2xl sm:text-3xl font-semibold text-red-600 mb-4">Connection Failed</h1>
            <p className="text-gray-600 mb-8">Could not retrieve Klaviyo account details after connection.</p>
            {accountError && <div className="text-red-600 text-sm bg-red-50 p-3 rounded-md mb-6 max-w-lg">{accountError}</div>}
            <button onClick={handleDisconnect} className="w-48 bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-md transition duration-300">
                Try Disconnect
            </button>
        </div>
      );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] text-center font-custom p-4">
      <div className="max-w-2xl w-full">
        <div className="flex justify-center mb-6">
          <Image src={klaviyoImage} alt="Klaviyo" height={80} width={80} />
        </div>
        
        <h1 className="text-2xl sm:text-3xl font-semibold text-gray-800 mb-4">
          Klaviyo Connected Successfully!
        </h1>
        
        <p className="text-sm sm:text-base text-gray-600 mb-8">
          Your Klaviyo account has been connected via OAuth and we can now access your email marketing data.
        </p>

        {accountError && (
          <div className="text-red-600 text-sm bg-red-50 p-3 rounded-md mb-6">
            {accountError}
          </div>
        )}

        {/* --- START: CORRECTED DATA ACCESS --- */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 mb-8 text-left">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Account Information</h3>
          <div className="space-y-3">
            <div>
              <span className="font-medium text-gray-700">Company:</span>
              <span className="ml-2 text-gray-600">
                {/* Use the correct path: organization_name inside contact_information */}
                {accountData.contact_information.organization_name || 'N/A'}
              </span>
            </div>
            <div>
              <span className="font-medium text-gray-700">Industry:</span>
              <span className="ml-2 text-gray-600">
                {/* Use the correct path: industry is a direct attribute */}
                {accountData.industry || 'N/A'}
              </span>
            </div>
            <div>
              <span className="font-medium text-gray-700">Website:</span>
              <span className="ml-2 text-gray-600">
                {/* Use the correct path: website_url is a direct attribute */}
                {accountData.contact_information.website_url || 'N/A'}
              </span>
            </div>
            <div>
              <span className="font-medium text-gray-700">Timezone:</span>
              <span className="ml-2 text-gray-600">
                {/* Use the correct path: timezone is a direct attribute */}
                {accountData.timezone || 'N/A'}
              </span>
            </div>
          </div>
        </div>
        {/* --- END: CORRECTED DATA ACCESS --- */}

        {/* Campaigns section */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 mb-8 text-left">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Campaigns</h3>
          {campaignsLoading ? (
            <div className="text-gray-500 text-sm">Loading campaigns...</div>
          ) : (
            <ul className="text-sm text-gray-700 space-y-2">
              {(campaigns?.data || []).slice(0, 5).map((item) => (
                <li key={item.id} className="flex justify-between">
                  <span>{item.attributes?.name || item.id}</span>
                  <span className="text-gray-400">{item.type}</span>
                </li>
              ))}
              {!(campaigns?.data || []).length && (
                <li className="text-gray-500">No campaigns found</li>
              )}
            </ul>
          )}
          {campaignsError && (
            <div className="text-red-600 text-xs bg-red-50 p-2 rounded-md mt-3">{campaignsError}</div>
          )}
        </div>

        {/* Lists section */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 mb-8 text-left">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Lists</h3>
          {listsLoading ? (
            <div className="text-gray-500 text-sm">Loading lists...</div>
          ) : (
            <ul className="text-sm text-gray-700 space-y-2">
              {(lists?.data || []).slice(0, 5).map((item) => (
                <li key={item.id} className="flex justify-between">
                  <span>{item.attributes?.name || item.id}</span>
                  <span className="text-gray-400">{item.type}</span>
                </li>
              ))}
              {!(lists?.data || []).length && (
                <li className="text-gray-500">No lists found</li>
              )}
            </ul>
          )}
          {listsError && (
            <div className="text-red-600 text-xs bg-red-50 p-2 rounded-md mt-3">{listsError}</div>
          )}
        </div>

        {/* Profiles section */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 mb-8 text-left">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Profiles</h3>
          {profilesLoading ? (
            <div className="text-gray-500 text-sm">Loading profiles...</div>
          ) : (
            <ul className="text-sm text-gray-700 space-y-2">
              {(profiles?.data || []).slice(0, 5).map((item) => (
                <li key={item.id} className="flex justify-between">
                  <span>{item.attributes?.email || item.attributes?.name || item.id}</span>
                  <span className="text-gray-400">{item.type}</span>
                </li>
              ))}
              {!(profiles?.data || []).length && (
                <li className="text-gray-500">No profiles found</li>
              )}
            </ul>
          )}
          {profilesError && (
            <div className="text-red-600 text-xs bg-red-50 p-2 rounded-md mt-3">{profilesError}</div>
          )}
        </div>

        {/* Flows section */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 mb-8 text-left">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Flows</h3>
          {flowsLoading ? (
            <div className="text-gray-500 text-sm">Loading flows...</div>
          ) : (
            <ul className="text-sm text-gray-700 space-y-2">
              {(flows?.data || []).slice(0, 5).map((item) => (
                <li key={item.id} className="flex justify-between">
                  <span>{item.attributes?.name || item.id}</span>
                  <span className="text-gray-400">{item.type}</span>
                </li>
              ))}
              {!(flows?.data || []).length && (
                <li className="text-gray-500">No flows found</li>
              )}
            </ul>
          )}
          {flowsError && (
            <div className="text-red-600 text-xs bg-red-50 p-2 rounded-md mt-3">{flowsError}</div>
          )}
        </div>

        {/* Metrics section */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 mb-8 text-left">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Metrics</h3>
          {metricsLoading ? (
            <div className="text-gray-500 text-sm">Loading metrics...</div>
          ) : (
            <ul className="text-sm text-gray-700 space-y-2">
              {(metrics?.data || []).slice(0, 5).map((item) => (
                <li key={item.id} className="flex justify-between">
                  <span>{item.attributes?.name || item.id}</span>
                  <span className="text-gray-400">{item.type}</span>
                </li>
              ))}
              {!(metrics?.data || []).length && (
                <li className="text-gray-500">No metrics found</li>
              )}
            </ul>
          )}
          {metricsError && (
            <div className="text-red-600 text-xs bg-red-50 p-2 rounded-md mt-3">{metricsError}</div>
          )}
        </div>

        {/* Events section */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 mb-8 text-left">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Recent Events</h3>
          {eventsLoading ? (
            <div className="text-gray-500 text-sm">Loading events...</div>
          ) : (
            <ul className="text-sm text-gray-700 space-y-2">
              {(events?.data || []).slice(0, 5).map((item) => (
                <li key={item.id} className="flex justify-between">
                  <span>{item.attributes?.event_name || item.attributes?.name || item.id}</span>
                  <span className="text-gray-400">{item.type}</span>
                </li>
              ))}
              {!(events?.data || []).length && (
                <li className="text-gray-500">No events found</li>
              )}
            </ul>
          )}
          {eventsError && (
            <div className="text-red-600 text-xs bg-red-50 p-2 rounded-md mt-3">{eventsError}</div>
          )}
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-8">
          <h3 className="text-lg font-semibold text-green-800 mb-3">What's Next?</h3>
          <ul className="text-sm text-green-700 space-y-2 text-left">
            <li>• Access your email campaign performance data</li>
            <li>• View customer profiles and segmentation</li>
            <li>• Track email engagement metrics</li>
            <li>• Analyze flow performance and conversions</li>
            <li>• Get insights into your email marketing ROI</li>
          </ul>
        </div>

        <div className="space-y-3">
          <button
            onClick={handleContinue}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md transition duration-300"
          >
            Continue to Integrations
          </button>
          
          <button
            onClick={handleDisconnect}
            className="w-full bg-red-100 hover:bg-red-200 text-red-700 font-medium py-2 px-4 rounded-md transition duration-300"
          >
            Disconnect Klaviyo
          </button>
        </div>
      </div>
    </div>
  );
};

export default KlaviyoSummaryPage;