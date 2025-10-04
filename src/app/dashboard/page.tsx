import { RequestStatus } from "@/components/request-status";

export default async function DashboardPage() {
  return (
      <div className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
        <div className="flex items-center">
          <h1 className="text-2xl font-semibold">Dashboard</h1>
        </div>
        <RequestStatus />
      </div>
  );
}
