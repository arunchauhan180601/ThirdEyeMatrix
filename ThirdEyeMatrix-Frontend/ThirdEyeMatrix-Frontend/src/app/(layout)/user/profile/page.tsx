"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from 'react-toastify';
import profileImage from "../../../../assets/images/profileImage.png";



interface UserProfile {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
  avatar: string; // Added avatar field
}

export default function UserProfilePage() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [avatar, setAvatar] = useState<string | null>(null); // State for avatar URL
  const [selectedImage, setSelectedImage] = useState<File | null>(null); // State for selected image file
  const router = useRouter();
  const avatarInputRef = useRef<HTMLInputElement>(null); // Ref for the hidden file input
 

  const fetchUserProfile = async () => {
    try {
      const token = localStorage.getItem("User_token");
      if (!token) {
        router.push("/auth/user/signin");
        return;
      }

      const response = await fetch(
        "http://localhost:5000/api/user/profile",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch user profile");
      }

      const data = await response.json();
      console.log( "Data:" ,data);
      setUser(data);
      setFirstName(data.first_name);
      setLastName(data.last_name);
      setEmail(data.email);
      setPhoneNumber(data.phone_number);
      setAvatar(data.avatar || null); // Set avatar from fetched data
    } catch (error) {
      console.error("Error fetching user profile:", error);
      toast.error("Failed to fetch user profile.",{
          style: {
          fontSize: "16px",
          fontWeight: "bold",
          borderRadius: "10px",
        },
      });
      router.push("/auth/user/signin");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserProfile();
  }, [router]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedImage(e.target.files[0]);
      setAvatar(URL.createObjectURL(e.target.files[0])); // For immediate preview
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password && password !== confirmPassword) {
      toast.error("Passwords do not match." , {
          style: {
          fontSize: "16px",
          fontWeight: "bold",
          borderRadius: "10px",
        },
      });
      return;
    }

    try {
      const token = localStorage.getItem("User_token");
      if (!token) {
        router.push("/auth/user/signin");
        return;
      }

      const formData = new FormData();
      formData.append("first_name", firstName);
      formData.append("last_name", lastName);
      formData.append("email", email);
      formData.append("phone_number", phoneNumber);
      if (password) {
        formData.append("password", password);
      }
      if (selectedImage) {
        formData.append("avatar", selectedImage);
      }

      const response = await fetch(
        "http://localhost:5000/api/user/profile",
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );
   

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update user profile.");
      }

      toast.success("Profile updated successfully!", {
          style: {
          fontSize: "16px",
          fontWeight: "bold",
          borderRadius: "10px",
        },
      });
      setIsEditing(false);
      setPassword("");
      setConfirmPassword("");
      fetchUserProfile(); // Refetch user data after successful update
    } catch (error: any) {
      console.error("Error updating user profile:", error);
      toast.error(error.message || "Failed to update user profile.");
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center font-custom h-screen text-lg">Loading profile...</div>;
  }

  if (!user) {
    return <div className="flex justify-center items-center font-custom h-screen text-lg text-red-500">Error loading profile.</div>;
  }

  return (
    <div className="relative flex  justify-center ">
      <div className="w-full  grid grid-cols-1 ">
        <div className="flex justify-center px-1 py-1 md:p-12">
          <div className="w-full sm:max-w-md md:max-w-2xl lg:max-w-3xl bg-white shadow-2xl rounded-2xl dark:bg-dark-900 p-8">
            <div className="mb-8 text-center">
              <h2 className="text-2xl sm:text-3xl mb-3 font-bold text-black  font-custom">Account Profile</h2>
            </div>

            {!isEditing ? (
              <div className="grid grid-cols-12 gap-5">
                <div className="col-span-12 lg:col-span-5 flex justify-center items-start mt-2">
                  <img src={user.avatar || profileImage.src} alt="User Avatar" className="w-32 h-32 mb-5 rounded-full object-cover border-2 border-gray-300" />
                </div>
                <div className="col-span-12 lg:col-span-7 space-y-5">
                  <div>
                    <label htmlFor="firstName" className="block mb-1 text-md font-semibold font-custom">First Name</label>
                    <input id="firstName" value={user.first_name} readOnly className="w-full px-4 py-2 border font-custom  border-gray-300 rounded-lg form-input focus:border-[#37b6ffe0] focus:ring-0 focus:ring-[#37b6ffb0] focus:outline-none" />
                  </div>
                  <div>
                    <label htmlFor="lastName" className="block mb-1 text-md font-semibold font-custom">Last Name</label>
                    <input id="lastName" value={user.last_name} readOnly className="w-full px-4 py-2 border font-custom  border-gray-300 rounded-lg form-input focus:border-[#37b6ffe0] focus:ring-0 focus:ring-[#37b6ffb0] focus:outline-none" />
                  </div>
                  <div>
                    <label htmlFor="email" className="block mb-1 text-md font-semibold font-custom">Email</label>
                    <input id="email" value={user.email} readOnly className="w-full px-4 py-2 border font-custom  border-gray-300 rounded-lg form-input focus:border-[#37b6ffe0] focus:ring-0 focus:ring-[#37b6ffb0] focus:outline-none" />
                  </div>
                  <div>
                    <label htmlFor="phoneNumber" className="block mb-1 text-md font-semibold font-custom">Phone Number</label>
                    <input id="phoneNumber" value={user.phone_number || "N/A"} readOnly className="w-full px-4 py-2 border font-custom  border-gray-300 rounded-lg form-input focus:border-[#37b6ffe0] focus:ring-0 focus:ring-[#37b6ffb0] focus:outline-none" />
                  </div>
                  <button onClick={() => setIsEditing(true)} className="w-full py-2 mt-1 cursor-pointer font-semibold text-white font-custom transition-all duration-200 rounded-lg shadow-md bg-[#37B5FF] hover:opacity-90">
                    Edit Profile
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleUpdateProfile} className="space-y-5">
                <div className="grid grid-cols-12 gap-5">
                  <div className="col-span-12 lg:col-span-5 flex justify-center items-start  mt-2">
                    <div className="flex flex-col"> 
                    <label htmlFor="avatar-upload" className="cursor-pointer ">
                      <img
                        src={avatar || profileImage.src}
                        alt="Avatar"
                        className="w-32 h-32 mb-5 rounded-full object-cover border-2 border-gray-300"
                      />
                      <input
                        id="avatar-upload"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleImageChange}
                        ref={avatarInputRef} 
                      />
                    </label>
                    <button
                      type="button"
                      onClick={() => avatarInputRef.current?.click()} 
                      className="py-2 px-4 border border-gray-300 rounded-lg font-custom cursor-pointer font-medium hover:bg-gray-50 dark:hover:bg-dark-850 transition"
                    >
                      Add Photo
                    </button>
                    </div>
                  </div>
                  <div className="col-span-12 lg:col-span-7 space-y-5">
                    <div>
                      <label htmlFor="editFirstName" className="block mb-1 text-md font-semibold font-custom">First Name</label>
                      <input
                        id="editFirstName"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        required
                        className="w-full px-4 py-2 border font-custom  border-gray-300 rounded-lg form-input focus:border-[#37b6ffe0] focus:ring-0 focus:ring-[#37b6ffb0] focus:outline-none"
                      />
                    </div>
                    <div>
                      <label htmlFor="editLastName" className="block mb-1 text-md font-semibold font-custom">Last Name</label>
                      <input
                        id="editLastName"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        required
                        className="w-full px-4 py-2 border font-custom  border-gray-300 rounded-lg form-input focus:border-[#37b6ffe0] focus:ring-0 focus:ring-[#37b6ffb0] focus:outline-none"
                      />
                    </div>
                    <div>
                      <label htmlFor="editEmail" className="block mb-1 text-md font-semibold font-custom">Email</label>
                      <input
                        id="editEmail"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="w-full px-4 py-2 border font-custom  border-gray-300 rounded-lg form-input focus:border-[#37b6ffe0] focus:ring-0 focus:ring-[#37b6ffb0] focus:outline-none"
                      />
                    </div>
                    <div>
                      <label htmlFor="editPhoneNumber" className="block mb-1 text-md font-semibold font-custom">Phone Number</label>
                      <input
                        id="editPhoneNumber"
                        type="text"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        className="w-full px-4 py-2 border font-custom  border-gray-300 rounded-lg form-input focus:border-[#37b6ffe0] focus:ring-0 focus:ring-[#37b6ffb0] focus:outline-none"
                      />
                    </div>
                    <div>
                      <label htmlFor="editPassword" className="block mb-1 text-md font-semibold font-custom">New Password</label>
                      <input
                        id="editPassword"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Leave blank to keep current password"
                        className="w-full px-4 py-2 border font-custom  border-gray-300 rounded-lg form-input focus:border-[#37b6ffe0] focus:ring-0 focus:ring-[#37b6ffb0] focus:outline-none"
                      />
                    </div>
                    <div>
                      <label htmlFor="confirmPassword" className="block mb-1 text-md font-semibold font-custom">Confirm New Password</label>
                      <input
                        id="confirmPassword"
                        type="password"
                        value={confirmPassword}
                        placeholder="Confirm password"
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full px-4 py-2 border font-custom  border-gray-300 rounded-lg form-input focus:border-[#37b6ffe0] focus:ring-0 focus:ring-[#37b6ffb0] focus:outline-none"
                      />
                    </div>
                    <div className="flex gap-2 mt-6">
                  <button type="button" onClick={() => setIsEditing(false)} className="flex-1 py-2 border cursor-pointer border-gray-300 bg-gray-100 rounded-lg font-custom font-medium hover:bg-gray-50 dark:hover:bg-dark-850 transition flex items-center justify-center gap-2">
                    Cancel
                  </button>
                  <button type="submit" className="flex-1 py-2  cursor-pointer font-semibold text-white font-custom transition-all duration-200 rounded-lg shadow-md bg-[#37B5FF] hover:opacity-90">
                    Save Changes
                  </button>
                </div>
                  </div>
                </div>
                
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
