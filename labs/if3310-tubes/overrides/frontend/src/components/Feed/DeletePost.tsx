import React, { useState } from "react";
import axios from "axios";
import { Button } from "../ui/button";

interface DeletePostProps {
  postId: string;
  onClose: (success: boolean) => void;
}

const DeletePost: React.FC<DeletePostProps> = ({ postId, onClose }) => {
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await axios.delete(`${import.meta.env.VITE_API_URL}/api/feed/${postId}`, {
        withCredentials: true,
      });
      onClose(true);
    } catch (error: any) {
      console.error("Failed to delete post", error);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div>
      <Button onClick={handleDelete} disabled={isDeleting}>
        {isDeleting ? "Deleting..." : "Delete Post"}
      </Button>
    </div>
  );
};

export default DeletePost;
