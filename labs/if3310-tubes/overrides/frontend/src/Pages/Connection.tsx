import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import UserCard from "@/components/UserCard";

interface User {
  id: string;
  username: string;
  full_name?: string;
  profile_photo_path?: string;
  isConnected?: boolean;
}

const ConnectionsList: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const [connections, setConnections] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);

  const fetchConnections = async () => {
    if (!userId) {
      setError("User ID is required.");
      return;
    }
    
    setLoading(true);
    setError("");

    try {
      const response = await axios.get<{
        success: boolean;
        body: {
          connections: User[];
          isLogin: true;
        };
      }>(`${import.meta.env.VITE_API_URL}/api/connections/${userId}`, {
        withCredentials: true,
      });

      const { success, body } = response.data;

      if (success) {
        setConnections(body.connections);
        setIsLoggedIn(body.isLogin);
      } else {
        setError("Failed to fetch connections.");
      }
    } catch (err: any) {
      if (axios.isAxiosError(err) && err.response) {
        const { success, message } = err.response.data;
        if (!success) {
          setError(message || "An error occurred.");
        }
      } else {
        setError("Failed to fetch connections. Please try again later.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConnections();
  }, []);

  const handleConnection = async (toId: string, isConnected: boolean) => {
    setLoading(true);
    setError("");

    try {
      if (isConnected) {
        await axios.delete(`${import.meta.env.VITE_API_URL}/api/connections/unconnect`, {
          data: { to_id: toId },
          withCredentials: true,
        });
        alert("Connection successfully unconnected.");
      } else {
        await axios.post(
          `${import.meta.env.VITE_API_URL}/api/connections/request`,
          {
            to_id: toId,
          },
          {
            withCredentials: true,
          }
        );
        alert("Connection request sent.");
      }

      fetchConnections();
    } catch (err: any) {
      if (axios.isAxiosError(err) && err.response) {
        const { success, message } = err.response.data;
        if (!success) {
          setError(message || "An error occurred.");
        }
      } else {
        setError(
          "Failed to process connection request. Please try again later."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      {loading && <p>Loading...</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}
      {!loading && !error && connections.length === 0 && (
        <p>No connections found for this user.</p>
      )}
      <ul style={{ listStyleType: "none", padding: 0 }}>
        {connections.map((connection) => (
          <UserCard
            key={connection.id}
            user={connection}
            isLoggedIn={!!isLoggedIn}
            onAction={() =>
              handleConnection(connection.id, connection.isConnected || false)
            }
          />
        ))}
      </ul>
    </div>
  );
};

export default ConnectionsList;
