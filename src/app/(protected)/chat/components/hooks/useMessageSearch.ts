import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { toast } from "sonner";

import { MessageSearchResult } from "@/types/message";

export function useMessageSearch(chatId: string) {
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [searchResults, setSearchResults] = useState<MessageSearchResult[]>([]);

  const performSearch = useCallback(async () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      const response = await axios.get(
        `/api/message/search?q=${encodeURIComponent(searchQuery)}&chatId=${chatId}`,
      );
      setSearchResults(response.data);
    } catch (_error) {
      toast.error("Failed to search messages");
    }
  }, [chatId, searchQuery]);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    const timer = window.setTimeout(() => {
      void performSearch();
    }, 300);

    return () => window.clearTimeout(timer);
  }, [performSearch, searchQuery]);

  const clearSearch = useCallback(() => {
    setSearchQuery("");
    setSearchResults([]);
  }, []);

  const handleSearchSelect = useCallback((messageId: string) => {
    clearSearch();

    const target = document.getElementById(`message-${messageId}`);
    if (!target) return;

    target.scrollIntoView({ behavior: "smooth", block: "center" });
    target.classList.add("ring-2", "ring-blue-400", "ring-offset-2");
    window.setTimeout(() => {
      target.classList.remove("ring-2", "ring-blue-400", "ring-offset-2");
    }, 1600);
  }, [clearSearch]);

  return {
    searchQuery,
    setSearchQuery,
    searchResults,
    clearSearch,
    handleSearchSelect,
  };
}
