import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const Login = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const error = new URLSearchParams(location.search).get("error");

  useEffect(() => {
    const userRole = document.cookie
      .split("; ")
      .find((row) => row.startsWith("user_role="));

    if (userRole) {
      const role = userRole.split("=")[1];
      navigate(role === "admin" ? "/admin_dashboard" : "/agent_dashboard");
    }
  }, [navigate]);

  useEffect(() => {
    if (error) {
      toast.error(getErrorMessage(error), {
        position: "top-center",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
      });
    }
  }, [error]);

  const handleGoogleLogin = () => {
    window.location.href = `${import.meta.env.VITE_API_URL}/users/auth/google_oauth2`;
  };

  const getErrorMessage = (error) => {
    switch (error) {
      case "unauthorized":
        return "Unauthorized access. Please contact the administrator.";
      case "google_auth_failed":
        return "Google authentication failed. Please try again.";
      default:
        return "";
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 p-4">
      <ToastContainer />
      <Card className="w-full max-w-md p-8 shadow-lg rounded-lg border border-gray-300 bg-white">
        <div className="text-center">
          <img src="Logo.jpg" alt="Logo" className="w-40 mx-auto" />
        </div>
        <h2 className="text-center text-xl font-semibold text-gray-800 mb-4">
          Sign in to your account
        </h2>
        <div className="flex justify-center mb-4">
          <Button
            className="flex items-center gap-2 bg-gray-800 text-white px-4 py-2 rounded-md hover:bg-gray-900 transition"
            onClick={handleGoogleLogin}
          >
            <img
              src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
              alt="Google logo"
              className="w-5"
            />
            Sign in with Google
          </Button>
        </div>
        <div className="text-center text-xs mt-4 p-2 rounded bg-gray-200 text-gray-700">
          🔒 Secure authentication powered by Google OAuth 2.0
        </div>
      </Card>
    </div>
  );
};

export default Login;