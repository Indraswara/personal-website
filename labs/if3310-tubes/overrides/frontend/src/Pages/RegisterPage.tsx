import { useState } from "react";

const RegisterPage = () => {
  const [username, setUsername] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");

  const handleRegister = async () => {
    try {
      if (!username || !name || !email || !password || !confirmPassword) {
        setError("All fields are required");
      } else if (password !== confirmPassword) {
        setError("Passwords do not match");
      } else if (password.length < 6) {
        setError("Password must be at least 6 characters long");
      }
      const userData = {
        username,
        email,
        name,
        password,
        confirmPassword,
      };

      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/register`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(userData),
        });

        if (response.ok) {
          const data = await response.json();
          console.log(data.message);
          console.log("response ok");
        } else {
          console.log("response not ok");
          const data = await response.json();
          setError(data.message || "Something went wrong data");
          console.log(data.user);
        }
      } catch {
        setError("Something went wrong cathc");
      }
    } catch (err: unknown) {
      if (err instanceof String) {
        setError("");
      }
    }
  };

  return (
    <div className="flex items-center justify-center h-screen">
      <div className="flex flex-col w-full max-w-md p-8 bg-white rounded-lg shadow-md">
        <h2 className="text-3xl font-semibold text-[#0073b1] mb-6 text-center">
          Register
        </h2>
        {/* username */}
        <input
          type="text"
          placeholder="username"
          className="p-3 mb-4 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0073b1] focus:border-[#0073b1]"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />
        {/* email pengguna */}
        <input
          type="email"
          placeholder="mail@gmail.com"
          className="p-3 mb-4 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0073b1] focus:border-[#0073b1]"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        {/* nama pengguna */}
        <input
          type="text"
          placeholder="name"
          className="p-3 mb-4 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0073b1] focus:border-[#0073b1]"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        {/* password */}
        <input
          type="password"
          placeholder="password"
          className="p-3 mb-4 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0073b1] focus:border-[#0073b1]"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        {/* confirm password */}
        <input
          type="password"
          placeholder="confirm password"
          className="p-3 mb-4 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0073b1] focus:border-[#0073b1]"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
        />
        <button
          onClick={handleRegister}
          className="w-full p-3 bg-[#0073b1] text-white font-semibold rounded-md shadow-md hover:bg-[#005c8c] transition duration-200"
        >
          Register
        </button>
        {error && <p className="mt-4 text-center text-red-500">{error}</p>}
        <div className="mt-4 text-center">
          <p className="text-sm text-gray-600">Already have an account?</p>
          <a
            href="/login"
            className="text-sm text-[#0073b1] hover:text-[#005c8c]"
          >
            Sign in
          </a>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
