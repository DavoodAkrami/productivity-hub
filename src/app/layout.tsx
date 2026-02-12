import type { Metadata } from "next";
import "./globals.css";
import ReduxProvider from "@/providers/reduxProvider";

export const metadata: Metadata = {
    title: "Productive Hub",
    description: "A productive tool to manage your mind and life better",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            <body className="antialiased">
                <ReduxProvider>{children}</ReduxProvider>
            </body>
        </html>
    );
}
