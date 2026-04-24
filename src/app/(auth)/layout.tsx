// src/app/(auth)/layout.tsx
import { ModeToggle } from "@/components/mode-toggle";

export default function AuthLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex min-h-screen w-full items-center justify-center bg-background relative">
            <div className="absolute top-6 right-6 z-50">
                <ModeToggle />
            </div>
            <div className="w-full h-full flex items-center justify-center">
                {children}
            </div>
        </div>
    );
}