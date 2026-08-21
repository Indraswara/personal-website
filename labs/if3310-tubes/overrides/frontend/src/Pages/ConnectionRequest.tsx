import { useState, useEffect } from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

interface ConnectionRequest {
  request: {
    from_id: string;
    to_id: string;
    created_at: string;
  };
  user: {
    id: string;
    username: string;
    email: string;
    full_name: string;
    profile_photo_path: string;
  };
}

export default function ConnectionRequests() {
  const [requests, setRequests] = useState<ConnectionRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchRequests = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/connections/requests`,
        { withCredentials: true }
      );

      const requests = response.data.body;
      if (Array.isArray(requests)) {
        setRequests(requests);
      } else {
        setError("Unexpected response format.");
      }
    } catch (err: any) {
      if (axios.isAxiosError(err) && err.response) {
        const { success, message } = err.response.data;
        if (!success) {
          setError(message || "An error occurred.");
        }
      } else {
        setError("Failed to fetch requests. Please try again later.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (fromId: string, action: "accept" | "reject") => {
    setActionLoading(fromId);
    setError("");

    try {
      await axios.post(
        `${import.meta.env.VITE_API_URL}/api/connections/respond`,
        { to_id: fromId, action },
        { withCredentials: true }
      );

      setRequests((prevRequests) =>
        prevRequests.filter((request) => request.request.from_id !== fromId)
      );
    } catch (err: any) {
      if (axios.isAxiosError(err) && err.response) {
        const { success, message } = err.response.data;
        if (!success) {
          setError(message || "An error occurred.");
        }
      } else {
        setError(
          "Failed to respond to connection request. Please try again later."
        );
      }
    } finally {
      setActionLoading(null);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-lg shadow">
      <div className="flex items-center justify-between px-6 py-4 border-b">
        <h1 className="text-xl font-semibold">Connection Requests</h1>
      </div>

      {loading && (
        <div className="p-6 text-center text-muted-foreground">
          Loading requests...
        </div>
      )}

      {error && <div className="p-6 text-center text-red-500">{error}</div>}

      {!loading && !error && requests.length === 0 && (
        <div className="p-6 text-center text-muted-foreground">
          No connection requests found.
        </div>
      )}

      <div className="divide-y">
        {requests.map((request) => (
          <div
            key={request.request.from_id}
            className="flex items-center gap-4 p-6"
          >
            <Avatar className="flex-shrink-0 w-16 h-16">
              <AvatarImage
                src={`${import.meta.env.VITE_API_URL}${
                  request.user.profile_photo_path
                }`}
                alt={request.user.full_name || "no full name"}
              />
              <AvatarFallback>
                {request.user.full_name
                  ?.split(" ")
                  .map((n) => n[0])
                  .join("")}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-base font-semibold truncate">
                  {request.user.username}
                </h2>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                {new Date(request.request.created_at).toLocaleString()}
              </p>
            </div>

            <div className="flex items-center flex-shrink-0 gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleAction(request.request.from_id, "reject")}
                disabled={actionLoading === request.request.from_id}
                className="font-semibold"
              >
                Reject
              </Button>
              <Button
                variant={"outline"}
                size="sm"
                onClick={() => handleAction(request.request.from_id, "accept")}
                disabled={actionLoading === request.request.from_id}
                className="text-blue-500 border-blue-500 rounded-xl hover:text-blue-600 hover:border-blue-600 "
              >
                Accept
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
