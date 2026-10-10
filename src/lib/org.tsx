import { createContext, useContext } from "react";
import type { Database } from "@/integrations/supabase/types";

export type Org = Database["public"]["Tables"]["organizations"]["Row"];
export type OrgRole = Database["public"]["Enums"]["org_role"];
export type Membership = { role: OrgRole; organization: Org };

export type OrgCtx = {
  org: Org;
  role: OrgRole;
  memberships: Membership[];
  userId: string;
  email: string;
  switchOrg: (id: string) => void;
};

export const OrgContext = createContext<OrgCtx | null>(null);
export function useOrg() {
  const c = useContext(OrgContext);
  if (!c) throw new Error("useOrg outside workspace");
  return c;
}

export const canWrite = (r: OrgRole) => r !== "viewer";
export const isAdmin = (r: OrgRole) => r === "owner" || r === "admin";
export const ORG_KEY = "orbit.activeOrg";
