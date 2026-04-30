"use client";

import { Loader2 } from "lucide-react";

export default function DashboardLoading() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 animate-in fade-in duration-500">
      <div className="relative">
        <Loader2 className="w-12 h-12 text-indigo-600 animate-spin" />
        <div className="absolute inset-0 w-12 h-12 border-4 border-indigo-100 rounded-full -z-10"></div>
      </div>
      <p className="mt-4 text-sm font-medium text-slate-500 dark:text-slate-400 animate-pulse">
        Preparando sección...
      </p>
    </div>
  );
}
