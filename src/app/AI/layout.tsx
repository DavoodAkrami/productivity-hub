import SideBar from "@/components/SideBar";
import { sideBarOption } from "@/components/SideBar";

const options: sideBarOption[] = [
    {
        title: "chat",
        path: "/AI",

    }
]

const layout = ({children}: Readonly<{children: React.ReactNode;}>) => {
    return (
        <div className="flex">
            <SideBar 
                options={options}
                type="AI"
            />
            {children}
        </div>
    )
}

export default layout;