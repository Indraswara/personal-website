import React, { useState, useEffect } from "react";
import axios from "axios";
import { Button } from "../ui/button";
import { Textarea } from "../ui/textarea";
import { Post } from "@/Pages/Feed";

interface EditPostProps {
  postId: string;
  onClose: (updatedPost?: Post) => void;
}

const EditPost: React.FC<EditPostProps> = ({ postId, onClose }) => {
  const [content, setContent] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const response = await axios.get(
          `${import.meta.env.VITE_API_URL}/api/feed/${postId}`,
          { withCredentials: true }
        );
        setContent(response.data.body.content);
      } catch (error: any) {
        console.error("Failed to fetch post", error);
      }
    };
    fetchPost();
  }, [postId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await axios.put(
        `${import.meta.env.VITE_API_URL}/api/feed/${postId}`,
        { trimmed: content },
        { withCredentials: true }
      );
      const updatedPost = response.data.body;
      onClose(updatedPost);
    } catch (error: any) {
      console.error("Failed to update post", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <Textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        required
      />
      <Button disabled={isSubmitting}>Save Changes</Button>
    </form>
  );
};

export default EditPost;
