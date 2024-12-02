"use client";

import { APIProvider } from "@vis.gl/react-google-maps";

export function GoogleApiProvider({
  apiKey,
  children,
}: {
  apiKey: string;
  children: React.ReactNode;
}) {
  return <APIProvider apiKey={apiKey}>{children}</APIProvider>;
}
