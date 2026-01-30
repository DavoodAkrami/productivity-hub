"use client"
import React, { useState } from "react";
import { TbLayoutSidebarLeftExpand, TbLayoutSidebarRightExpand } from "react-icons/tb";
import { motion } from "motion/react";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import { usePathname } from "next/navigation";
import { IoMenu } from "react-icons/io5";
import Button from "./Buttons";
import { FaRobot } from "react-icons/fa";




export type sideBarOption = {
    title: string;
    icon?: React.ReactNode;
    path: string;
}

export interface sideBarProp {
    options: sideBarOption[];
    classname?: string;
    type?: "AI" | "normal";
}

const SideBar: React.FC<sideBarProp> = ({ options, classname, type="normal" }) => {
    const [isSideBarOpen, setIsSideBarOpen] = useState<boolean>(false);
    const pathname = usePathname();
    const router = useRouter();

    const handleNewChat = () => {
        localStorage.removeItem("chatHistory")
        window.location.reload();
    }


    return (
        <motion.div
            initial={false}
            animate={{ width: isSideBarOpen ? '15vw' : '70px' }}
            transition={{ duration: 0.2 }}
            className={clsx(
                "bg-[var(--bg-control)]/50 backdrop-blur-xl h-screen flex flex-col relative box-border flex-none min-w-[70px] max-w-[15vw] p-2",
                !isSideBarOpen && "items-center",
                classname
            )}
            style={{ overflow: 'hidden' }}
        >
            {type === "AI" ? 
                <Button
                    size="manual"
                    color="manual"
                    variant="filled"
                    htmlType="button"
                    kind="button"
                    classname="text-[1.4rem] hover:bg-[var(--fill-primary)] cursor-pointer p-3 rounded-xl transition-all duration-200 flex gap-[1rem] items-center"
                    onClick={handleNewChat}
                >
                    <FaRobot className="text-2xl text-[var(--accent-blue)]"/>
                    {isSideBarOpen && 
                        <span className="pt-2 whitespace-nowrap">
                            New Chat
                        </span>
                    }
                </Button> : 
                <h2 className="flex gap-[1rem] items-center p-3 text-center mt-1">
                    {!isSideBarOpen && 
                        <IoMenu className="text-[2rem] text-[var(--accent-blue)]" />
                    }
                    {isSideBarOpen &&
                        <span className="text-[2rem] font-extrabold text-center">
                            Menu
                        </span>
                    }
                </h2>
            }
            <div className="w-[90%] mx-auto my-2 border-t border-[var(--border-separator)]" />
            <ul className="flex flex-col gap-1">
                {options.map((option, index) => (
                    <li
                        key={index}
                        onClick={() => { window.location.href = option.path; }}
                        className={clsx(
                            "text-[1.4rem] hover:bg-[var(--fill-primary)] cursor-pointer p-3 rounded-xl transition-all duration-200 flex gap-[1rem] items-center",
                            isSideBarOpen && "",
                            type !== "AI" && pathname === option.path && "bg-[var(--fill-secondary)]/80"
                        )}
                    >
                        <span className="text-[var(--accent-blue)] shrink-0">
                            {option.icon}
                        </span>
                        {isSideBarOpen &&
                            <span className="text-[var(--text-secondary)] whitespace-nowrap">
                                {option.title}
                            </span>
                        }
                    </li>
                ))}
            </ul>
            <div
                className={clsx(
                    "absolute bottom-1 flex flex-col justify-center items-center",
                    isSideBarOpen && 'right-2'
                )}
                
            >
                {isSideBarOpen ?
                    <button
                        className="text-[var(--accent-blue)] text-[2.2rem] p-2 rounded-xl hover:bg-[var(--fill-primary)] cursor-pointer transition-all duration-200"
                        onClick={() => setIsSideBarOpen(!isSideBarOpen)}
                    >
                        <TbLayoutSidebarLeftExpand  />
                    </button>
                    :
                    <button
                        className="text-[var(--accent-blue)] text-[2.2rem] p-2 rounded-xl hover:bg-[var(--fill-primary)] cursor-pointer transition-all duration-200"
                        onClick={() => setIsSideBarOpen(!isSideBarOpen)}
                    >
                        <TbLayoutSidebarRightExpand />
                    </button>
                }
            </div>
        </motion.div>
    )
}

export default SideBar;