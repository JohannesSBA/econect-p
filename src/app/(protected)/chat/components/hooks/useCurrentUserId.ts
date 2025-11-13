import { useEffect, useState } from "react";
import axios from "axios";

export function useCurrentUserId(email?: string | null) {
  const [currentUserId, setCurrentUserId] = useState<string>("");

  useEffect(() => {
    if (!email) {
      setCurrentUserId("");
      return;
    }

    let isMounted = true;

    const fetchCurrentUser = async () => {
      try {
        const response = await axios.get("/api/user/current");
        if (isMounted && response.data?.id) {
          setCurrentUserId(response.data.id);
        }
      } catch (_error) {
        if (isMounted) {
          setCurrentUserId("");
        }
      }
    };

    fetchCurrentUser();

    return () => {
      isMounted = false;
    };
  }, [email]);

  return currentUserId;
}
