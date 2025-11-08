"use client";

import { UpdateUserData } from "@/api/user/updateUser";
import React, { useEffect, useState } from "react";
import { UserData } from "@/api/user/getUsers";
import { updateUser } from "@/api/user/updateUser";
import { toast } from "react-toastify";
import { getRoles, RoleData } from "@/api/role/getRoles";
import { ChevronDown } from "lucide-react";

interface EditUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUserUpdated: () => void; // Callback to refresh user list
  user: UserData | null;
}

const EditUserModal: React.FC<EditUserModalProps> = ({
  isOpen,
  onClose,
  onUserUpdated,
  user,
}) => {
  
  const [formData, setFormData] = useState<UpdateUserData>({
    first_name: user?.first_name,
    last_name: user?.last_name,
    email: user?.email,
    role_id: 0, // Initialize with a default numeric value
  });

  const [roles, setRoles] = useState<RoleData[]>([]);

  useEffect(() => {
    const fetchRoles = async () => {
      const token = localStorage.getItem("token"); // Use general token
      if (token) {
        const fetchedRoles = await getRoles(token);
        setRoles(fetchedRoles);
        return fetchedRoles; // Return fetched roles
      } else {
        console.warn("No authentication token found. Cannot fetch roles.");
        return [];
      }
    };

    const initializeFormData = async () => {
      if (isOpen && user) {
        const fetchedRoles = await fetchRoles(); // Await roles here
        setFormData({
          first_name: user.first_name,
          last_name: user.last_name,
          email: user.email,
          role_id: Number(fetchedRoles.find(role => role.name === user.role_name)?.id) || 0,
        });
      }
    };

    initializeFormData();
  }, [isOpen, user]); // Removed 'roles' from dependency array

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]:
        e.target.name === "role_id" ? Number(e.target.value) : e.target.value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const token = localStorage.getItem("token");

    if (!token) {
      console.error("No authentication token found.");
      toast.error("Authentication required to update a user.");
      return;
    }

    try {
      if (!user) return; // Should not happen if modal is open and user is passed
      await updateUser(user.id, formData, token);
      toast.success("User updated successfully!", {
        style: {
        fontSize: "16px",
        fontWeight: "bold",
        borderRadius: "10px",
        } });
      onClose();
      onUserUpdated();
    } catch (error) {
      console.error("Failed to update user:", error);
      if (Array.isArray(error)) {
        error.forEach((msg) => toast.error(msg));
      } else {
        toast.error(`Failed to update user: ${(error as Error).message}` , {
          style: {
            fontSize: "16px",
            fontWeight: "bold",
            borderRadius: "10px",
            }
        });
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs">
      <div className="relative w-full max-w-md p-8 bg-white shadow-2xl rounded-2xl dark:bg-dark-900">
        <button
          className="absolute top-2 right-4 text-gray-600 hover:text-gray-900 text-3xl"
          onClick={onClose}
          aria-label="Close"
        >
          &times;
        </button>
        <h2 className="text-3xl sm:text-3xl font-bold text-black font-custom mb-2 text-center">
          Edit User
        </h2>
        <p className="mt-2 text-gray-600 dark:text-gray-400 font-custom text-center mb-6">Update user details below</p>
        <form className="font-custom" onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label
                htmlFor="first_name"
                className="block mb-1 text-md font-semibold font-custom"
              >
                First Name:
              </label>
              <input
                type="text"
                id="first_name"
                name="first_name"
                placeholder="Enter First Name"
                value={formData.first_name}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg form-input focus:border-[#37b6ffe0] focus:ring-0 focus:ring-[#37b6ffb0] focus:outline-none"
              />
            </div>
            <div>
              <label
                htmlFor="last_name"
                className="block mb-1 text-md font-semibold font-custom"
              >
                Last Name:
              </label>
              <input
                type="text"
                id="last_name"
                name="last_name"
                placeholder="Enter Last Name"
                value={formData.last_name}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg form-input focus:border-[#37b6ffe0] focus:ring-0 focus:ring-[#37b6ffb0] focus:outline-none"
              />
            </div>
          </div>

          <div className="mb-4">
            <label
              htmlFor="email"
              className="block mb-1 text-md font-semibold font-custom"
            >
              Email:
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              placeholder="Enter Email"
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg form-input focus:border-[#37b6ffe0] focus:ring-0 focus:ring-[#37b6ffb0] focus:outline-none"
            />
          </div>

          <div className="mb-4">
            <label
              htmlFor="roles"
              className="block mb-1 text-md font-semibold font-custom"
            >
              Role:
            </label>
            <div className="relative">
              <select
                id="roles"
                name="role_id"
                value={formData.role_id}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg form-input focus:border-[#37b6ffe0] focus:ring-0 focus:ring-[#37b6ffb0] focus:outline-none appearance-none pr-8"
              >
                {roles.map((role) => (
                  <option key={role.id} value={role.id}>
                    {role.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500 pointer-events-none" />
            </div>
          </div>

          
          <div className="flex items-center mt-6 justify-between space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="w-full cursor-pointer py-2 font-semibold text-gray-700 font-custom transition-all duration-200 rounded-lg shadow-md bg-gray-200 hover:opacity-90"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="w-full cursor-pointer py-2 font-semibold text-white font-custom transition-all duration-200 rounded-lg shadow-md bg-[#37B5FF] hover:opacity-90"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditUserModal;
