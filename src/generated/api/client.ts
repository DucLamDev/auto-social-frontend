import createClient, { type Middleware } from "openapi-fetch";
import { env } from "@/config/env";
import { tokenStore } from "@/services/api/token-store";
import type { paths } from "./schema";

/** Typed low-level client generated from the backend contract. Feature code uses service adapters. */
export const openapiClient = createClient<paths>({ baseUrl: env.apiUrl, credentials: "include" });

const bearerMiddleware: Middleware = {
  onRequest({ request }) {
    const token = tokenStore.get();
    if (token) request.headers.set("Authorization", `Bearer ${token}`);
    return request;
  },
};

openapiClient.use(bearerMiddleware);
