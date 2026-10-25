/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as analytics from "../analytics.js";
import type * as auth from "../auth.js";
import type * as authUtils from "../authUtils.js";
import type * as bookings from "../bookings.js";
import type * as employees from "../employees.js";
import type * as menu from "../menu.js";
import type * as orders from "../orders.js";
import type * as seed from "../seed.js";
import type * as settings from "../settings.js";
import type * as tables from "../tables.js";
import type * as test from "../test.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  analytics: typeof analytics;
  auth: typeof auth;
  authUtils: typeof authUtils;
  bookings: typeof bookings;
  employees: typeof employees;
  menu: typeof menu;
  orders: typeof orders;
  seed: typeof seed;
  settings: typeof settings;
  tables: typeof tables;
  test: typeof test;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
