import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ToastContainer, showErrorToast, showSuccessToast } from "@/utils/toast";
import { useAuth } from '../contexts/AuthContext';

const Login = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { user, loading, authInitialized, fetchUserProfile } = useAuth();
    const error = new URLSearchParams(location.search).get("error");
    const status = new URLSearchParams(location.search).get("status");
    const [checkingAuth, setCheckingAuth] = useState(true);

    useEffect(() => {
        if (authInitialized && !loading) {
            if (user) {
                if (user.role === "admin") {
                    navigate("/admin_dashboard");
                } else if (user.role === "agent") {
                    navigate("/agent_dashboard");
                }
            }
            setCheckingAuth(false);
        }
    }, [user, navigate, loading, authInitialized]);

    useEffect(() => {
        if (status === "success") {
            fetchUserProfile().then((userData) => {
                if (userData) {
                    const destination = userData.role === "admin"
                        ? "/admin_dashboard?welcome=true"
                        : "/agent_dashboard?welcome=true";
                    navigate(destination);
                } else {
                    showErrorToast("Failed to fetch user profile. Please try again.");
                }
            });
        }
    }, [status, navigate, fetchUserProfile]);

    useEffect(() => {
        if (error) {
            showErrorToast(getErrorMessage(error));
        }
    }, [error]);

    useEffect(() => {
        if (status === "logout") {
            setTimeout(() => {
                showSuccessToast("You have been successfully logged out.");
            }, 100);

            const newUrl = window.location.pathname;
            window.history.replaceState({}, document.title, newUrl);
        }
    }, [status]);

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
                return "An error occurred during login. Please try again.";
        }
    };

    if (checkingAuth) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
                <span className="ml-3 text-lg">Loading...</span>
            </div>
        );
    }

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100 p-6">
            <ToastContainer />
            <Card className="w-1/4 h-auto p-10 shadow-2xl rounded-2xl border border-gray-300 bg-white">
                <div className="text-center">
                    <img src="/Logo.jpg" alt="Logo" className="w-48 mx-auto" />
                </div>
                <h2 className="text-center text-2xl font-bold text-gray-900 mb-6">
                    Sign in to your account
                </h2>
                <div className="flex justify-center mb-6">
                    <Button
                        className="flex items-center gap-3 bg-gray-800 text-white px-6 py-3 text-lg rounded-lg hover:bg-gray-900 transition"
                        onClick={handleGoogleLogin}
                    >
                        <img
                            src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
                            alt="Google logo"
                            className="w-6"
                        />
                        Sign in with Google
                    </Button>
                </div>
                <div className="text-center text-sm mt-6 p-3 rounded bg-gray-200 text-gray-700">
                    🔒 Secure authentication powered by Google OAuth 2.0
                </div>
            </Card>
        </div>
    );
};

export default Login;
