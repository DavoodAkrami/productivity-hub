import SidebarProvider from "@/providers/sidebarProvider";
import SideBar from "@/components/SideBar";
import { sideBarOption } from "@/components/SideBar";
import { IoBookmarks } from "react-icons/io5";
import { FaRobot } from "react-icons/fa";
import { FiList } from "react-icons/fi";

const options: sideBarOption[] = [
    {
        title: "Bookmarks",
        icon: <IoBookmarks />,
        path: "/bookmarks",
    },
    {
        title: "ToDoList",
        icon: <FiList />,
        path: "/todolist",
    },
    {
        title: "AI Assistance",
        icon: <FaRobot />,
        path: "/AI",
    },
];

export default function MainAppLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <div className="flex min-h-screen">
            <SidebarProvider>
                <SideBar options={options} />
            </SidebarProvider>
            <main className="flex-1 min-w-0">{children}</main>
        </div>
    );
}
