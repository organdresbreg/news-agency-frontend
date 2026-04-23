// src/app/(auth)/layout.tsx

export default function AuthLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex min-h-screen w-full items-center justify-center bg-background">
            {/* Contenedor opcional para limitar el ancho máximo si querés más control visual */}
            <div className="w-full max-w-md p-4">
                {children}
            </div>
        </div>
    );
}