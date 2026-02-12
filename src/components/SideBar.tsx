"use client"
import React, { useEffect, useMemo, useState } from "react";
import { TbLayoutSidebarLeftExpand, TbLayoutSidebarRightExpand } from "react-icons/tb";
import { motion } from "motion/react";
import clsx from "clsx";
import { usePathname, useRouter } from "next/navigation";
import { IoMenu } from "react-icons/io5";
import Button from "./Buttons";
import { FaRobot } from "react-icons/fa";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { hydrateAuth } from "@/store/authSlice";




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
    const dispatch = useAppDispatch();
    const profile = useAppSelector((state) => state.auth.profile);
    const authChecked = useAppSelector((state) => state.auth.checked);

    useEffect(() => {
        void dispatch(hydrateAuth());
    }, [dispatch]);

    const handleNewChat = () => {
        localStorage.removeItem("chatHistory")
        window.location.reload();
    }

    const isOptionActive = (path: string) => {
        if (path === "/") return pathname === "/";
        return pathname === path || pathname.startsWith(`${path}/`);
    };
    const isProfileActive = pathname === "/profile" || pathname.startsWith("/profile/");

    const profileInitial = useMemo(() => {
        const source = profile?.firstName?.trim() || profile?.email?.trim() || "U";
        return source.charAt(0).toUpperCase();
    }, [profile]);

    const profileFullName = useMemo(() => {
        if (!profile) return "Profile";
        const full = `${profile.firstName} ${profile.lastName}`.trim();
        return full || "Profile";
    }, [profile]);

    return (
        <motion.div
            initial={false}
            animate={{ width: isSideBarOpen ? '15vw' : '70px' }}
            transition={{ duration: 0.2 }}
            className={clsx(
                "bg-[var(--bg-control)]/45 backdrop-blur-2xl h-[calc(100vh-1rem)] my-2 ml-2 rounded-3xl flex flex-col relative box-border flex-none min-w-[70px] max-w-[15vw] p-2.5 border border-[var(--border-separator)]/45 shadow-[0_10px_36px_rgba(0,0,0,0.12)] cursor-e-resize",
                !isSideBarOpen && "items-center",
                classname
            )}
            style={{ overflow: 'hidden' }}
            onClick={(e) => {
                const target = e.target as HTMLElement;
                if (target.closest("button") || target.closest("a") || target.closest("li")) return;
                setIsSideBarOpen(prev => !prev);
            }}
        >
            {type === "AI" ? 
                <Button
                    size="manual"
                    color="manual"
                    variant="filled"
                    htmlType="button"
                    kind="button"
                    classname="text-[1.4rem] hover:bg-[var(--fill-primary)] cursor-pointer p-3 rounded-2xl transition-all duration-200 flex gap-[1rem] items-center"
                    onClick={(e) => {
                        e.stopPropagation();
                        handleNewChat();
                    }}
                >
                    <FaRobot className="text-2xl text-[var(--accent-blue)]"/>
                    {isSideBarOpen && 
                        <span className="pt-2 whitespace-nowrap">
                            New Chat
                        </span>
                    }
                </Button> : 
                <h2 className="flex gap-[1rem] items-center p-3 text-center mt-1 rounded-2xl bg-[var(--fill-primary)]/35 w-full justify-center">
                    {!isSideBarOpen && 
                        <IoMenu className="text-[2rem] text-[var(--accent-blue)]" />
                    }
                    {isSideBarOpen &&
                        <span className="text-[1.8rem] font-extrabold text-center">
                            Menu
                        </span>
                    }
                </h2>
            }
            <div className="w-[92%] mx-auto my-3 border-t border-[var(--border-separator)]/70" />
            <ul className="flex flex-col gap-2">
                {options.map((option, index) => (
                    <li
                        key={index}
                        onClick={(e) => {
                            e.stopPropagation();
                            router.push(option.path);
                        }}
                        className={clsx(
                            "group relative cursor-pointer p-2.5 rounded-2xl transition-all duration-200 flex items-center border border-transparent",
                            "hover:bg-[var(--fill-primary)]/75 hover:border-[var(--fill-primary)]/80 hover:shadow-[0_4px_14px_rgba(0,0,0,0.08)]",
                            !isSideBarOpen && "justify-center",
                            type !== "AI" && isOptionActive(option.path) && "bg-[var(--fill-secondary)]/80 border-[var(--fill-primary)] shadow-[0_6px_18px_rgba(0,0,0,0.14)]"
                        )}
                    >
                        <span
                            className={clsx(
                                "text-[var(--accent-blue)] shrink-0 rounded-xl p-2 transition-all duration-200",
                                "bg-[var(--fill-primary)]/45 group-hover:bg-[var(--fill-primary)]/80",
                                type !== "AI" && isOptionActive(option.path) && "bg-[var(--accent-blue)]/18"
                            )}
                        >
                            {option.icon}
                        </span>
                        {isSideBarOpen &&
                            <span
                                className={clsx(
                                    "text-[0.98rem] font-semibold whitespace-nowrap ml-3 transition-colors duration-200",
                                    type !== "AI" && isOptionActive(option.path)
                                        ? "text-[var(--text-primary)]"
                                        : "text-[var(--text-secondary)] group-hover:text-[var(--text-primary)]"
                                )}
                            >
                                {option.title}
                            </span>
                        }
                    </li>
                ))}
            </ul>
            <div className="mt-auto w-full pb-14">
                <button
                    type="button"
                    onClick={(e) => {
                        e.stopPropagation();
                        router.push("/profile");
                    }}
                    className={clsx(
                        "group w-full cursor-pointer rounded-2xl border border-transparent transition-all duration-200 flex items-center gap-3",
                        isSideBarOpen && "p-2 hover:bg-[var(--fill-primary)]"
                    )}
                >
                    {!authChecked ? (
                        <span className="h-11 w-11 rounded-full bg-[var(--fill-primary)]/70 animate-pulse shrink-0" />
                    ) : profile?.avatarUrl ? (
                        <img
                            src={profile.avatarUrl}
                            alt="Profile"
                            className={clsx(
                                "h-11 w-11 rounded-full object-cover shrink-0 border-2 border-transparent transition-all duration-200",
                                "group-hover:border-[var(--accent-blue)]/65"
                            )}
                            style={isProfileActive ? { borderColor: "var(--accent-blue)" } : undefined}
                        />
                    ) : (
                        <span
                            className={clsx(
                                "h-11 w-11 rounded-full bg-[var(--accent-blue)]/18 border-2 border-transparent flex items-center justify-center text-sm font-bold text-[var(--accent-blue)] shrink-0 transition-all duration-200",
                                "group-hover:border-[var(--accent-blue)]/65"
                            )}
                            style={isProfileActive ? { borderColor: "var(--accent-blue)" } : undefined}
                        >
                            {profileInitial}
                        </span>
                    )}
                    {isSideBarOpen && !authChecked && (
                        <span className="h-4 w-24 rounded-full bg-[var(--fill-primary)]/70 animate-pulse" />
                    )}
                    {isSideBarOpen && authChecked && (
                        <span className="text-md font-bold pt-1.5 text-left truncate group-hover:text-[var(--text-primary)]">
                            {profileFullName}
                        </span>
                    )}
                </button>
            </div>
            <div
                className={clsx(
                    "absolute bottom-2 flex flex-col justify-center items-center",
                    isSideBarOpen && 'right-2'
                )}
                
            >
                {isSideBarOpen ?
                    <button
                        className="text-[var(--accent-blue)] text-[2.1rem] p-2 rounded-2xl hover:bg-[var(--fill-primary)] cursor-pointer transition-all duration-200"
                        onClick={(e) => {
                            e.stopPropagation();
                            setIsSideBarOpen(!isSideBarOpen);
                        }}
                    >
                        <TbLayoutSidebarLeftExpand  />
                    </button>
                    :
                    <button
                        className="text-[var(--accent-blue)] text-[2.1rem] p-2 rounded-2xl hover:bg-[var(--fill-primary)] cursor-pointer transition-all duration-200"
                        onClick={(e) => {
                            e.stopPropagation();
                            setIsSideBarOpen(!isSideBarOpen);
                        }}
                    >
                        <TbLayoutSidebarRightExpand />
                    </button>
                }
            </div>
        </motion.div>
    )
}

export default SideBar;
