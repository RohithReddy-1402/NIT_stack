import { useAuth } from "@/contexts/AuthContext";
import { useInfiniteList } from "@/hooks/forum/useInfiniteList";
import { fetchOpportunitiesFeed } from "@/services/opportunities";
import { seedOpportunities } from "@/services/opportunityStore";

/**
 * Cursor-paginated opportunities feed. `source` = { type: "all" | "recommended" | "saved" | "company", name? },
 * `filters` covers everything the browse screen lets you set: type, branch,
 * batch, location, mode, paid, stipendMin/Max, salaryMin/Max, skills, sort, q.
 * Reuses forum's generic useInfiniteList — same cursor-pagination contract.
 */
export function useOpportunitiesFeed(source, filters) {
  const { token } = useAuth();
  const key = `${source.type}|${source.name ?? ""}|${JSON.stringify(filters)}|${token ?? ""}`;
  return useInfiniteList(
    (cursor) => fetchOpportunitiesFeed(token, source, { ...filters, cursor }),
    key,
    { onPage: (items) => seedOpportunities(items) },
  );
}
