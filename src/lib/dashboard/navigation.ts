import type { PageSearchParams } from "@/lib/dashboard/types";

export const makeBuildHref =
  (searchParams?: PageSearchParams) =>
  (overrides: Record<string, string | undefined>) => {
    const params = new URLSearchParams();
    if (searchParams) {
      Object.entries(searchParams).forEach(([key, value]) => {
        if (!value || Array.isArray(value)) {
          return;
        }
        params.set(key, value);
      });
    }
    Object.entries(overrides).forEach(([key, value]) => {
      if (!value) {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    });
    const query = params.toString();
    return query ? `/?${query}` : "/";
  };
