import { useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";

const ActivateAccount = () => {
  const { uid, token } = useParams();
  const navigate = useNavigate();
  const effectRan = useRef(false);

  useEffect(() => {
    // Prevent double-firing in React Strict Mode
    if (effectRan.current === true) return;

    const activateUser = async () => {
      try {
        // NOTE: This points to Django Backend (port 8000)
        const response = await fetch("http://127.0.0.1:8000/auth/users/activation/", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ uid, token }),
        });

        if (response.ok) {
          toast.success("Account activated successfully! Please log in.");
          navigate("/login");
        } else {
          toast.error("Activation failed. The link may be expired.");
          navigate("/");
        }
      } catch (error) {
        console.error("Activation error:", error);
        toast.error("Network error during activation.");
      }
    };

    if (uid && token) {
      activateUser();
    }

    return () => {
      effectRan.current = true;
    };
  }, [uid, token, navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="text-center p-8 bg-white shadow-lg rounded-lg">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Activating Account</h2>
        <p className="text-gray-600">Please wait while we verify your credentials...</p>
      </div>
    </div>
  );
};

export default ActivateAccount;