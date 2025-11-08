// "use client";

// import { useEffect } from "react";
// import { useRouter } from "next/navigation";

// const KlaviyoCallbackPage = () => {
//   const router = useRouter();

//   useEffect(() => {
//     const handleOAuthCallback = async () => {
//       const params = new URLSearchParams(window.location.search);
//       const code = params.get("code");
//       const state = params.get("state");

//       if (!code || !state) {
//         alert("Missing code or state from Klaviyo OAuth");
//         return;
//       }

//       try {
//         const token = localStorage.getItem("User_token"); // JWT from your login
//         if (!token) {
//           router.push("/auth/user/signin");
//           return;
//         }

//         const res = await fetch(
//           `http://localhost:5000/api/klaviyo/callback?code=${code}&state=${state}`,
//           {
//             method: "GET",
//             headers: {
//               Authorization: `Bearer ${token}`,
//             },
//           }
//         );

//         if (!res.ok) {
//           const errorData = await res.text();
//           throw new Error(errorData || "Failed to complete Klaviyo OAuth");
//         }

//         // Redirect to summary page after successful connection
//         router.push("/welcome/integrations/klaviyo/summary");
//       } catch (err) {
//         alert((err as Error).message);
//       }
//     };

//     handleOAuthCallback();
//   }, [router]);

//   return (
//     <div className="flex items-center justify-center min-h-[80vh]">
//       <p className="text-lg font-medium">Connecting your Klaviyo account...</p>
//     </div>
//   );
// };

// export default KlaviyoCallbackPage;
