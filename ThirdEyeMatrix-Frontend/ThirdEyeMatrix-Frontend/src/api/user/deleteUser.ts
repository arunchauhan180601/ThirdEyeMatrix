export async function deleteUser(token: string, id: number) {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/adminUsers/delete/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  } catch (error) {
    console.error("Error deleting user:", error);
    throw error; // Re-throw to be handled by the calling component
  }
}
