export interface UpdateUserData {
  first_name?: string;
  last_name?: string;
  email?: string;
  role_id?: number;

}

export async function updateUser(id: number, userData: UpdateUserData, token: string) {
  try { 
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/adminUsers/edit/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(userData),
    });

     

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error updating user:", error);
    throw error; // Re-throw to be handled by the calling component
  }
}
