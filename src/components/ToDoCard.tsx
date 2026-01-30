"use client"
import clsx from "clsx";
import { useState } from "react";
import { AiOutlineCalendar } from "react-icons/ai";
import { BsTag } from "react-icons/bs";
import Button from "./Buttons";
import { FiTrash, FiEdit } from "react-icons/fi";





export type Priority = "high" | "medium" | "low";

export interface Task {
    id: string;
    title: string;
    description?: string;
    priority?: Priority;
    label?: string;
    date?: string; 
    completed?: boolean;
}

export interface ToDoCardProps extends Task {
    handleDelete?: (id: string) => void;
    handleEdit?: (id: string) => void;
    handleToggleComplete?: (id: string) => void;
}


const ToDoCard: React.FC<ToDoCardProps> = ({id, title, description, priority, label, date, completed, handleDelete, handleEdit, handleToggleComplete}) => {
    const [isTaskHovered, setIsTaskHovered] = useState<boolean>(false);



    return (
        <div 
            className={clsx("border-2 shadow-lg rounded-3xl p-4 bg-[var(--bg-control)]/50 backdrop:blur-[2px] w-[45%] mx-auto", priority === "high" ? "border-[red]" : priority === "medium" ? "border-[yellow]" : priority === "low" ? "border-[green]" : "border-[var(--fill-primary)]")}
            onMouseEnter={() => setIsTaskHovered(true)}
            onMouseLeave={() => setIsTaskHovered(false)}    
        >
            <div className="flex justify-between">
                <div className="flex items-center gap-4 mb-4">
                    <span 
                        className={clsx("border-2 p-1 rounded-full cursor-pointer", priority === "high" ? "border-[red]" : priority === "medium" ? "border-[yellow]" : priority === "low" ? "border-[green]" : "border-[var(--fill-primary)]")}
                        onClick={() => handleToggleComplete?.(id)}
                    >
                        <div className={clsx("w-4 h-4 rounded-full transition-all duration-150 ease-in-out",  completed ? priority === "high" ? "bg-[red]" : priority === "medium" ? "bg-[yellow]" : priority === "low" ? "bg-[green]" : "bg-[var(--fill-primary)]" : "bg-transparent")}></div>
                    </span>
                    <h3 className={clsx("text-2xl font-bold", completed && "line-through opacity-70")}>
                        {title}
                    </h3>
                </div>
                {isTaskHovered &&
                    <div className="flex gap-2">
                        <Button
                            htmlType="button"
                            kind="button"
                            variant="filled"
                            color="accent-blue"
                            size="manual"
                            classname="px-2 py-0 rounded-xl transition-all duration-200 ease-in-out"
                            onClick={() => handleEdit?.(id)}

                        >
                            <FiEdit />
                        </Button>
                        <Button
                            htmlType="button"
                            kind="button"
                            variant="filled"
                            color="accent-red"
                            size="manual"
                            classname="px-2 py-0 rounded-xl transition-all duration-200 ease-in-out"
                            onClick={() => handleDelete?.(id)}

                        >
                            <FiTrash />
                        </Button>
                    </div>
                }
            </div>
            {description &&
                <p className={clsx("pl-6 pb-2", completed && "line-through opacity-70")}>
                    {description}
                </p>
            }
            {(label || date) &&
                <div className="flex gap-2 pl-2">
                    {label &&
                        <span
                            className="p-2 bg-[var(--fill-primary)] rounded-full text-sm text-center flex gap-2 items-center justify-center"
                        >
                            <BsTag />
                            {label}
                        </span>
                    }
                    {date &&
                        <span
                            className="p-2 bg-[var(--fill-primary)] rounded-full text-sm text-center flex gap-2 items-center justify-center"
                        >
                            <AiOutlineCalendar />
                            {date}
                        </span>
                    }
                </div>
            }
        </div>
    )
}

export default ToDoCard;