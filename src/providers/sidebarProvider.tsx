"use client"

const SidebarProvider = ({children}: Readonly<{children: React.ReactNode;}>) => {
    return (
        <div
            className="hidden lg:block"
        >
            {children}
        </div>
    )
}

export default SidebarProvider;
