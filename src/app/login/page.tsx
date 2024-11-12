"use client";

import { useRequestVerificationTokenMutation } from "@/features/login/hooks";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { useState } from "react";

export default function Login() {
  const [email, setEmail] = useState<string | null>(null);
  const [password, setPassword] = useState<string | null>(null);

  const [tokenSent, setTokenSent] = useState(false);
  const { isPendingVerificationToken, requestVerificationToken } =
    useRequestVerificationTokenMutation({
      // TODO: handle error
      onSettled: () => setTokenSent(true),
    });

  const searchParams = useSearchParams();
  const error = searchParams.get("error");
  const code = searchParams.get("code");

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="w-96 p-4 bg-white rounded-lg border border-gray-200">
        <div className="space-y-4">
          <div>
            <label
              htmlFor="email"
              className="block mb-2 text-sm font-medium text-gray-900"
            >
              Email
            </label>
            <input
              type="email"
              id="email"
              className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
              placeholder="name@company.com"
              required
              disabled={isPendingVerificationToken}
              value={email ?? ""}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          {!tokenSent && (
            <div>
              <button
                className="w-full bg-blue-500 text-white p-2 rounded-lg"
                disabled={isPendingVerificationToken}
                onClick={() => email && requestVerificationToken({ email })}
              >
                Enviar código de verificação
              </button>
            </div>
          )}
          {tokenSent && (
            <>
              <div>
                <label
                  htmlFor="password"
                  className="block mb-2 text-sm font-medium text-gray-900"
                >
                  Código de Verificação
                </label>
                <input
                  type="password"
                  id="password"
                  className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                  required
                  value={password ?? ""}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              <button
                className="w-full bg-blue-500 text-white p-2 rounded-lg mt-4"
                onClick={async () =>
                  await signIn("credentials", {
                    callbackUrl: "/",
                    email,
                    password,
                  })
                }
              >
                Login
              </button>
            </>
          )}
          {error && <div className="text-red-500">{code}</div>}
        </div>
      </div>
    </div>
  );
}
