
export async function loginUser(email: string, password: string) {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data?.message || "Login failed");
    }
    return data; // return success response
  } catch (error: any) {
    throw new Error(error.message || "Something went wrong");
  }
}


export async function sendOtpApi(email: string) {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/auth/sendOtp`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email }),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data?.message || "Failed to send OTP");
    }
    return data; // return success response
  } catch (error: any) {
    throw new Error(error.message || "Something went wrong");
  }
}


export async function verifyOtpApi(email: string, otp: string) {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/auth/verifyOtp`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, otp }),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data?.message || "Failed to verify OTP");
    }
    return data; // return success response
  } catch (error: any) {
    throw new Error(error.message || "Something went wrong");
  }
}


export async function resetPasswordApi(userId: string, newPassword: string) {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/auth/resetPassword`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ userId, newPassword }),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data?.message || "Failed to reset password");
    }
    return data; // return success response
  } catch (error: any) {
    throw new Error(error.message || "Something went wrong");
  }
}


