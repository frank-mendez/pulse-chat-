import { useMutation } from "@tanstack/react-query";
import { Radio, UserPlus } from "lucide-react";
import { type FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { ErrorBanner } from "../components/chat/ErrorBanner";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { apiClient, ApiError } from "../lib/api-client";
import { queryClient } from "../lib/query-client";
import { queryKeys } from "../lib/query-keys";

export const RegisterPage = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | undefined>();
  const register = useMutation({
    mutationFn: apiClient.register,
    onSuccess: (data) => {
      queryClient.setQueryData(queryKeys.me, data);
      navigate("/conversations");
    },
    onError: (error) => {
      setErrorMessage(error instanceof ApiError ? error.message : "Registration failed.");
    },
  });

  const handleSubmit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    register.mutate({
      username,
      displayName,
      password,
    });
  };

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-8">
      <section className="w-full max-w-xl rounded-card border border-line bg-paper-strong p-5 shadow-rail md:p-7">
        <div className="mb-8">
          <div className="mb-3 inline-flex items-center gap-2 rounded-card border border-line bg-paper px-3 py-1 text-xs font-bold uppercase text-signal">
            <Radio className="h-4 w-4" />
            PulseChat
          </div>
          <h1 className="font-display text-4xl font-bold leading-tight text-ink">Create account</h1>
        </div>

        <ErrorBanner
          message={errorMessage}
          onDismiss={() => {
            setErrorMessage(undefined);
          }}
        />

        <form className="mt-5 grid gap-3" onSubmit={handleSubmit}>
          <label className="grid gap-2 text-sm font-bold text-graphite" htmlFor="display-name">
            Display name
            <Input
              autoComplete="name"
              autoFocus
              id="display-name"
              onChange={(event) => {
                setDisplayName(event.target.value);
              }}
              value={displayName}
            />
          </label>
          <label className="grid gap-2 text-sm font-bold text-graphite" htmlFor="username">
            Username
            <Input
              autoComplete="username"
              id="username"
              onChange={(event) => {
                setUsername(event.target.value);
              }}
              value={username}
            />
          </label>
          <label className="grid gap-2 text-sm font-bold text-graphite" htmlFor="password">
            Password
            <Input
              autoComplete="new-password"
              id="password"
              onChange={(event) => {
                setPassword(event.target.value);
              }}
              type="password"
              value={password}
            />
          </label>
          <Button
            disabled={
              register.isPending ||
              username.length < 2 ||
              displayName.length < 1 ||
              password.length < 8
            }
            type="submit"
          >
            <UserPlus className="h-4 w-4" />
            Register
          </Button>
        </form>
        <p className="mt-4 text-sm text-graphite">
          Already registered?{" "}
          <Link className="font-bold text-signal hover:text-ink" to="/login">
            Login
          </Link>
        </p>
      </section>
    </main>
  );
};
