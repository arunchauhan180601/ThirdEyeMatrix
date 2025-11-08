export interface RoleData {
  id: number;
  name: string;
}

export async function getRoles(token: string): Promise<RoleData[]> {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/adminUsers/role`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const jsonResponse = await response.json();
    console.log(jsonResponse.roles)
    return jsonResponse.roles; 
  } catch (error) {
    console.error("Error fetching roles:", error);
    return [];
  }
}
