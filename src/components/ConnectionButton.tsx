"use client"

import React, { useState, useEffect } from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { UserPlus, Clock, Check, X } from "lucide-react";
import { toast } from "sonner";

export type ConnectionStatus = "NONE" | "PENDING" | "ACCEPTED" | "REJECTED";

interface ConnectionButtonProps {
  userId: string;
  connectionStatus?: ConnectionStatus;
  isRequestSentByMe?: boolean;
  onStatusChange?: (status: ConnectionStatus, isRequestSentByMe: boolean) => void;
}

export default function ConnectionButton({ 
  userId, 
  connectionStatus = "NONE", 
  isRequestSentByMe = false,
  onStatusChange 
}: ConnectionButtonProps) {
  const [status, setStatus] = useState<ConnectionStatus>(connectionStatus);
  const [isRequestSentByMeState, setIsRequestSentByMeState] = useState(isRequestSentByMe);
  const [loading, setLoading] = useState(false);

  // Update local state when props change
  useEffect(() => {
    setStatus(connectionStatus);
    setIsRequestSentByMeState(isRequestSentByMe);
  }, [connectionStatus, isRequestSentByMe]);

  const handleConnect = async () => {
    setLoading(true);
    try {
      await axios.post("/api/connection/request", { userId });
      setStatus("PENDING");
      setIsRequestSentByMeState(true);
      onStatusChange?.("PENDING", true);
      toast.success("Connection request sent!");
    } catch (error: unknown) {
      const message =
        axios.isAxiosError(error) && error.response?.data?.error
          ? error.response.data.error
          : "Failed to send connection request";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async () => {
    setLoading(true);
    try {
      await axios.post("/api/connection/accept", { userId });
      setStatus("ACCEPTED");
      onStatusChange?.("ACCEPTED", false);
      toast.success("Connection accepted!");
    } catch (error: unknown) {
      const message =
        axios.isAxiosError(error) && error.response?.data?.error
          ? error.response.data.error
          : "Failed to accept connection";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    setLoading(true);
    try {
      await axios.post("/api/connection/reject", { userId });
      setStatus("REJECTED");
      onStatusChange?.("REJECTED", false);
      toast.success("Connection rejected");
    } catch (error: unknown) {
      const message =
        axios.isAxiosError(error) && error.response?.data?.error
          ? error.response.data.error
          : "Failed to reject connection";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  // If already connected, show connected state
  if (status === "ACCEPTED") {
    return (
      <Button size="sm" variant="outline" disabled>
        <Check className="h-4 w-4 mr-1" />
        Connected
      </Button>
    );
  }

  // If there's a pending request
  if (status === "PENDING") {
    if (isRequestSentByMeState) {
      // User sent the request - show pending state
      return (
        <Button size="sm" variant="outline" disabled>
          <Clock className="h-4 w-4 mr-1" />
          Request Sent
        </Button>
      );
    } else {
      // User received the request - show accept/decline buttons
      return (
        <div className="flex space-x-2">
          <Button size="sm" onClick={handleAccept} disabled={loading}>
            <Check className="h-4 w-4 mr-1" />
            Accept
          </Button>
          <Button size="sm" variant="outline" onClick={handleReject} disabled={loading}>
            <X className="h-4 w-4 mr-1" />
            Decline
          </Button>
        </div>
      );
    }
  }

  // If rejected or no connection, show connect button
  return (
    <Button size="sm" onClick={handleConnect} disabled={loading}>
      <UserPlus className="h-4 w-4 mr-1" />
      Connect
    </Button>
  );
} 
