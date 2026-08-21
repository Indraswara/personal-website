import React, { useState } from "react";
import axios from "axios";
import { Button } from "../ui/button";
import { Textarea } from "../ui/textarea";
import { Post } from "@/Pages/Feed";

interface CreatePostProps {
  onClose: (newPost?: Post) => void;
}

const CreatePost: React.FC<CreatePostProps> = ({ onClose }) => {
  const [content, setContent] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/feed`,
        { content },
        { withCredentials: true }
      );
      if (response.data.success){
        const newPost = response.data.body;
        onClose(newPost);
      }
    } catch (error: any) {
      const errorMessage =
        error?.response?.data?.message || "Failed to create post.";
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <form onSubmit={handleSubmit} className="flex flex-col w-full gap-5">
        <Textarea
          value={content}
          className="h-[200px]"
          onChange={(e) => setContent(e.target.value)}
          placeholder="Create a new post..."
          required
        />
        {error && <p>{error}</p>}
        <Button disabled={isSubmitting} className="self-end w-[100px]">
          {isSubmitting ? "Creating..." : "Create Post"}
        </Button>
      </form>
    </div>
  );
};

export default CreatePost;
