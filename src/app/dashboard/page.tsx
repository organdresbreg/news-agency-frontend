import { redirect } from "next/navigation";

export default function DashboardPage() {
    // Redirección temporal mientras el dashboard está en construcción
    redirect("/chat");
}
