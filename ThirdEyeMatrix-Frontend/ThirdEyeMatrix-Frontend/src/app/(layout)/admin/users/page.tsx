"use client";

import { getAllUsers, UserData } from "@/api/user/getUsers";
import AddUserModal from "@/components/AddUserModal";
import { useEffect, useState } from "react";
import EditUserModal from "@/components/EditUserModal";
import { toast } from "react-toastify";
import { Edit, Trash2 } from "lucide-react";
import { deleteUser } from "@/api/user/deleteUser";
import DeleteConfirmationModal from "@/components/DeleteConfirmationModal";
import { jwtDecode } from "jwt-decode";

export default function Users() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false); // State for edit modal
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null); // State for selected user
  const [isDeleteConfirmModalOpen, setIsDeleteConfirmModalOpen] = useState(false); // State for delete confirmation modal
  const [userToDelete, setUserToDelete] = useState<UserData | null>(null); // State for user to be deleted
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null);

  const fetchUsers = async () => {
    let token = localStorage.getItem("token"); // Try admin token first

    if (token) {
      try {
        const decodedToken: { roleName: string } = jwtDecode(token);
        setCurrentUserRole(decodedToken.roleName);
      } catch (error) {
        console.error("Error decoding token:", error);
        setCurrentUserRole(null);
      }
      const fetchedUsers: UserData[] = await getAllUsers(token); // Pass currentPage
      setUsers(fetchedUsers);
    } else {
      console.warn(
        "No token found in local storage. User data might not be loaded."
      );
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleUserAdded = () => {
    fetchUsers(); // Re-fetch users when a new user is added
  };

  const handleUserUpdated = () => {
    fetchUsers(); // Re-fetch users when a user is updated
  };

  const handleDelete = (id: number) => {
    const userToDel = users.find((user) => user.id === id);
    if (userToDel) {
      setUserToDelete(userToDel);
      setIsDeleteConfirmModalOpen(true);
    }
  };

  const handleConfirmDelete = async () => {
    if (!userToDelete) return;
    let token = localStorage.getItem("token");

    if (token) {
      await deleteUser(token, userToDelete.id);
      fetchUsers(); // Re-fetch users after deletion
      toast.success("User deleted successfully!", {
        style: {
          fontSize: "16px",
          fontWeight: "bold",
          borderRadius: "10px",
        },
      });
    } else {
      console.warn("No token found in local storage. User might not be deleted.");
      toast.error("Authentication required to delete a user.", {
        style: {
          fontSize: "16px",
          fontWeight: "bold",
          borderRadius: "10px",
        },
      });
    }
    setIsDeleteConfirmModalOpen(false);
    setUserToDelete(null);
  };

  const handleEdit = (id: number) => {
    const userToEdit = users.find((user) => user.id === id);
    if (userToEdit) {
      setSelectedUser(userToEdit);
      setIsEditModalOpen(true);
    }
  };

  return (
    <>
      <div className="min-h-screen">
        <div className="grid grid-cols-2 mt-4 mx-1 sm:mx-4 mb-2">
          <p className="text-md flex items-center font-semibold px-1 py-0  md:text-2xl font-custom ">
            Users :
          </p>
          {currentUserRole !== "user" && (
            <div className="flex justify-end items-center ">
              <button
                className="font-custom font-semibold text-md  px-2 sm:px-4 py-1 sm:py-2 rounded-md border-1 cursor-pointer bg-green-700 text-white "
                onClick={() => setIsModalOpen(true)}
              >
                Add User
              </button>
            </div>
          )}
        </div>

        <div className="overflow-x-auto px-1  sm:px-4 scrollbar-hide">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-100 font-custom rounded-md">
              <tr className="font-normal text-[14px] sm:text-[16px] font-custom">
                <th className="px-6 py-4 text-left font-custom tracking-wide whitespace-nowrap">
                  First Name
                </th>
                <th className="px-6 py-4 text-left  tracking-wide whitespace-nowrap">
                  Last Name
                </th>
                <th className="px-6 py-4 text-left  tracking-wide whitespace-nowrap">
                  Email
                </th>
                <th className="px-6 py-4 text-left  tracking-wide  whitespace-nowrap">
                  Role
                </th>
                <th className="px-6 py-4 text-left  tracking-wide whitespace-nowrap ">
                  Joined Date
                </th>
                {currentUserRole !== "user" && (
                  <th className="px-6 py-4 text-center  tracking-wide whitespace-nowrap ">
                    Action
                  </th>
                )}
              </tr>
            </thead>

            <tbody className="bg-white divide-y divide-gray-200">
              {users.map((row, index) => (
                <tr
                  key={index}
                  className="font-custom font-medium text-gray-800"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    {row.first_name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {row.last_name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">{row.email}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {row.role_name || "N/A"}
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap">
                    {new Date(row.created_at).toLocaleDateString("en-GB")}
                  </td>
                  {currentUserRole !== "user" && (
                    <td className="px-6 py-4 flex gap-2 justify-center whitespace-nowrap">
                      <button
                        className="button text-center px-2 py-2 sm:px-2 sm:py-2 border border-yellow-200 rounded-md bg-yellow-100 text-yellow-600 cursor-pointer"
                        onClick={() => handleEdit(row.id)}
                      >
                        <Edit className=" w-4 h-4 sm:w-5 sm:h-5" />
                      </button>

                      <button
                        className="button text-center px-2 py-2 sm:px-2 sm:py-2 border border-red-200 rounded-md bg-red-100 text-red-600 cursor-pointer"
                        onClick={() => handleDelete(row.id)}
                      >
                        <Trash2 className=" w-4 h-4 sm:w-5 sm:h-5" />
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <AddUserModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onUserAdded={handleUserAdded}
        />
        {isEditModalOpen && selectedUser && (
          <EditUserModal
            isOpen={isEditModalOpen}
            onClose={() => setIsEditModalOpen(false)}
            onUserUpdated={handleUserUpdated}
            user={selectedUser}
          />
        )}
        {isDeleteConfirmModalOpen && userToDelete && (
          <DeleteConfirmationModal
            isOpen={isDeleteConfirmModalOpen}
            onClose={() => setIsDeleteConfirmModalOpen(false)}
            onConfirm={handleConfirmDelete}
            userName={`${userToDelete.first_name} ${userToDelete.last_name}`}
          />
        )}
      </div>
    </>
  );
}
