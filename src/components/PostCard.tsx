import React from "react";
import Image from "next/image";

interface Post {
  author: {
    name: string;
    headline: string;
    image: string;
  };
  content: string;
}

export default function PostCard({ post }: { post: Post }) {
  return (
    <div className="border rounded p-4 mb-4">
      <div className="flex items-center mb-2">
        <Image 
          src={post.author.image} 
          alt={`${post.author.name}'s profile picture`}
          width={32} 
          height={32} 
          className="rounded-full mr-2" 
        />
        <div>
          <div className="font-bold">{post.author.name}</div>
          <div className="text-xs text-gray-500">{post.author.headline}</div>
        </div>
      </div>
      <div>{post.content}</div>
      {/* Like, comment, etc. */}
    </div>
  );
} 