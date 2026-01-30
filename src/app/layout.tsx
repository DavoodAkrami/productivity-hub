import type { Metadata } from "next";
import "./globals.css";
import SidebarProvider from "@/providers/sidebarProvider";
import SideBar from "@/components/SideBar";
import { sideBarOption } from "@/components/SideBar";
import { IoBookmarks } from "react-icons/io5";
import { FaRobot } from "react-icons/fa";
import { FiList } from 'react-icons/fi';



export const metadata: Metadata = {
    title: "Productive Hub",
    description: "A productive tool to manage your mind and life better",
};

const options: sideBarOption[] = [
    {
        title: "Bookmarks",
        icon: <IoBookmarks />,
        path: "/"
    },
    {
        title: "ToDoList",
        icon: <FiList />,
        path: "/todolist",
    },
    {
        title: "AI Assistance",
        icon: <FaRobot />,
        path: "/AI"
    },
] 

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {

    return (
        <html lang="en">
            <body className="antialiased">
                    <div
                        className="flex"
                    >
                        <SidebarProvider>
                            <SideBar 
                                options={options}
                            />
                        </SidebarProvider>
                        <main className="flex-1 min-w-0">
                            {children}
                        </main>
                    </div>
            </body>
        </html>
    );
}
