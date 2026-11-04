import { requireStaffSession } from "@/lib/server-session";
import DataModel from "@/components/data-model";
export default async function DataModelPage() {
  await requireStaffSession("/portal/data-model");
  return <DataModel />;
}
