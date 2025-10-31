export interface PostAuthor {
  id: string;
  name: string;
  image?: string | null;
  headline?: string | null;
}

export interface PostCommentUser {
  id: string;
  name: string;
  image?: string | null;
}

export interface PostComment {
  id: string;
  content: string;
  createdAt: string | Date;
  user: PostCommentUser;
}

// Shape received from API/DB
export interface PostShape {
  id: string;
  title?: string | null;
  content: string;
  type?: string | null;
  visibility?: "PUBLIC" | "PRIVATE" | "UNLISTED" | null;
  linkUrl?: string | null;
  videoUrl?: string | null;
  imageUrl?: string | null;
  images?: string[];
  eventDate?: string | null; // ISO
  eventTime?: string | null; // HH:mm or freeform
  author: PostAuthor;
  createdAt: string;
  likes?: Array<{ id: string; userId?: string }>; // raw likes relation when included
  comments?: Array<PostComment>;
  bookmarks?: Array<{ id: string; userId?: string }>; // raw bookmarks relation when included
  _count?: { likes?: number; comments?: number; bookmarks?: number };
}

// Normalized UI post that `PostCard` consumes
export interface UIMappedPost {
  id: string;
  content: string;
  type: "TEXT" | "IMAGE" | "LINK" | "ARTICLE";
  visibility?: "PUBLIC" | "PRIVATE" | "UNLISTED";
  linkUrl?: string;
  videoUrl?: string;
  images: string[];
  eventDate?: string;
  eventTime?: string;
  author: {
    id: string;
    name: string;
    image?: string;
    headline?: string;
  };
  createdAt: string | Date;
  likes: number;
  comments: PostComment[];
  shares: number;
  isLiked: boolean;
  isBookmarked: boolean;
}
