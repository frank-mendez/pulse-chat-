import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { Navigate, Outlet, Route, Routes, useLocation } from "react-router-dom";

import { LoadingScreen } from "./components/chat/LoadingScreen";
import { apiClient, ApiError } from "./lib/api-client";
import { queryKeys } from "./lib/query-keys";
import { ChatPage } from "./routes/ChatPage";
import { ConversationsPage } from "./routes/ConversationsPage";
import { LoginPage } from "./routes/LoginPage";
import { RegisterPage } from "./routes/RegisterPage";
import { useChatStore } from "./state/chat-store";

const useMe = () =>
  useQuery({
    queryKey: queryKeys.me,
    queryFn: apiClient.me,
    retry: false,
  });

const ProtectedRoute = () => {
  const location = useLocation();
  const { connect } = useChatStore();
  const me = useMe();

  useEffect(() => {
    if (me.data !== undefined) {
      connect();
    }
  }, [connect, me.data]);

  if (me.isLoading) {
    return <LoadingScreen />;
  }

  if (me.error instanceof ApiError && me.error.statusCode === 401) {
    return <Navigate replace state={{ from: location }} to="/login" />;
  }

  if (me.data !== undefined) {
    return <Outlet />;
  }

  return <Navigate replace to="/login" />;
};

export const App = () => (
  <Routes>
    <Route path="/" element={<Navigate replace to="/conversations" />} />
    <Route path="/login" element={<LoginPage />} />
    <Route path="/register" element={<RegisterPage />} />
    <Route element={<ProtectedRoute />}>
      <Route path="/conversations" element={<ConversationsPage />} />
      <Route path="/chat/:conversationId" element={<ChatPage />} />
    </Route>
    <Route path="*" element={<Navigate replace to="/conversations" />} />
  </Routes>
);
