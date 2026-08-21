import { useState, useEffect } from 'react';

const Broh = () => {
    const [username, setUsername] = useState<string>("COk");
    const [userId, setUserId] = useState<string>("COK");

    // Fetch user data asynchronously in useEffect
    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const response = await fetch(`${import.meta.env.VITE_API_URL}/api/user`, {
                    method: "GET",
                    credentials: "include",
                });
                const data = await response.json();
                console.log(data);
                if (response.ok && data) {
                    setUsername(data.body.username);
                    setUserId(data.body.id);
                } else {
                    console.warn("Invalid user data:", data);
                }
            } catch (err) {
                console.error("Error fetching user data:", err);
            }
        };

        fetchUserData(); // Fetch user data when component mounts
    }, []); // Empty dependency array to run the effect only once when the component mounts

    return (
        <div>
            <h1>Username: {username}</h1>
            <h1>UserId: {userId}</h1>
        </div>
    );
};

export default Broh;
