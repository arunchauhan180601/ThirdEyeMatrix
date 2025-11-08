export interface AddUserData {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  role_id: number; 
}

export async function createUser(userData: AddUserData, token: string) {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/adminUsers/create`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(userData),
    });

     if (!response.ok) {
      const errorData = await response.json();

      if (errorData.errors) {
       
        const messages = Object.values(errorData.errors).flat() as string[];
        throw messages; 
      }

      throw [errorData.message || `HTTP error! status: ${response.status}`];
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error creating user:", error);
    throw error; // Re-throw to be handled by the calling component
  }
}


