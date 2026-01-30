"use client"
import { usePathname } from "next/navigation";
import clsx from "clsx";


const SidebarProvider = ({children}: Readonly<{children: React.ReactNode;}>) => {
    const pathname = usePathname();


    return (
        <div
            className={clsx(pathname === "/AI" && "hidden")}
        >
            {children}
        </div>
    )
}

export default SidebarProvider;