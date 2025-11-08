export interface UserData {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  role_name: string;
  created_at: string
}

export async function getAllUsers(token: string): Promise<UserData[]> {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/adminUsers/all`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.users;
  } catch (error) {
    console.error("Error fetching users:", error);
    throw error; // Re-throw to be handled by the calling component
  }
}
