import { createFileRoute, Navigate } from "@tanstack/react-router";
import type { Role } from "@/lib/types";
import { RoleSwitcher } from "@/components/RoleSwitcher";
import { SecretaryWorkbench } from "@/features/SecretaryWorkbench";
import { DoctorOnDutyWorkbench } from "@/features/DoctorOnDutyWorkbench";
import { SurgicalTeamWorkbench } from "@/features/SurgicalTeamWorkbench";
import { TherapistWorkbench } from "@/features/TherapistWorkbench";
import { roleMeta } from "@/lib/mock-data";

const VALID: Role[] = ["secretary", "doctor-on-duty", "surgical-team", "therapist"];

export const Route = createFileRoute("/role/$role")({
  head: ({ params }) => {
    const meta = roleMeta[params.role as Role];
    const title = meta ? `${meta.title} 工作台 — 骨安` : "角色工作台 — 骨安";
    return {
      meta: [
        { title },
        { name: "description", content: meta?.description ?? "骨安角色化诊疗工作台" },
      ],
    };
  },
  component: RolePage,
});

function RolePage() {
  const { role } = Route.useParams() as { role: Role };

  if (!VALID.includes(role)) {
    return <Navigate to="/" />;
  }

  return (
    <div className="min-h-screen bg-background">
      <RoleSwitcher activeRole={role} />
      <main className="mx-auto max-w-[1600px] px-6 py-6">
        {role === "secretary" && <SecretaryWorkbench />}
        {role === "doctor-on-duty" && <DoctorOnDutyWorkbench />}
        {role === "surgical-team" && <SurgicalTeamWorkbench />}
        {role === "therapist" && <TherapistWorkbench />}
      </main>
    </div>
  );
}
