"use client"
import React, { useState, useEffect, useRef } from "react";
import ToDoCard, { Task, Priority } from "@/components/ToDoCard";
import Calendar from "@/components/Calendar";
import { motion, AnimatePresence } from "motion/react";
import clsx from "clsx";
import { AiOutlineCalendar } from "react-icons/ai";
import { BsTag } from "react-icons/bs";
import { FaFlag } from "react-icons/fa";
import { IoIosArrowUp } from "react-icons/io";
import Button from "@/components/Buttons";
import { FiPlusSquare } from "react-icons/fi";
import { FiTrash } from "react-icons/fi";
import { BiSort } from "react-icons/bi";
import { FiFilter } from "react-icons/fi";
import { HiXMark } from "react-icons/hi2";
import { FiCheckSquare, FiSquare } from "react-icons/fi";




type Label = { name: string; value: string };
type FilterDate = "today" | "thisWeek" | "thisMonth" | "past";
type FilterState = {
    priorities: Priority[];
    labels: string[];
    date: FilterDate | null;
};

const ToDoList = () => {
    const [toDos, settoDos] = useState<Task[]>([])
    const [isWriting, setIsWriting] = useState<boolean>(false);
    const [taskForm, setTaskForm] = useState<Task>({
        id: "",
        title: "",
        description: "",
        priority: undefined,
        label: "",
        date: "",
    })
    const [isModalOpen, setIsModalOpen] = useState<null | "priority" | "label" | "date">(null);
    const [labels, setLabels] = useState<Label[] | []>([]);
    const [newLabel, setNewLabel] = useState<Label>({
        name: "",
        value: ""
    })
    const [sortBy, setSortBy] = useState<"Date" | "Priority">("Priority");
    const [filter, setFilter] = useState<FilterState>({
        priorities: [],
        labels: [],
        date: null
    });
    const [isDataModalOpen, setIsDataModalOpen] = useState<"filter" | "sort" | null>(null);
    const [isEditing, setIsEditing] = useState<string | null>(null);
    const [showCompleted, setShowCompleted] = useState<boolean>(true);

    const formRef = useRef<HTMLFormElement>(null);
    const dataModalRef = useRef<HTMLUListElement>(null);
    const taskModalRef = useRef<HTMLUListElement>(null);

    
    useEffect(() => {
        const data = localStorage.getItem("toDos");
        if (data) {
            try {
                const parsed = JSON.parse(data) as Task[];
                const normalizedTasks = parsed.map(task => ({
                    ...task,
                    completed: task.completed ?? false
                }));
                settoDos(normalizedTasks);
            } catch {
                settoDos([]);
            }
        }
    }, []);

    useEffect(() => {      
        const availableLabels = localStorage.getItem("labels");
        if (availableLabels) {
            const parsed = JSON.parse(availableLabels);
            setLabels([{ name: "None", value: "" }, ...parsed, { name: "Add new label", value: "Add new label"}]);
        } else {
            localStorage.setItem("labels", JSON.stringify([]))
            const labelsFromStorage = localStorage.getItem("labels");
            const parsed = JSON.parse(labelsFromStorage ?? "[]");
            setLabels([{ name: "None", value: "" }, ...parsed, { name: "Add new label", value: "Add new label"}]);
        }
    }, []);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            const target = e.target as Node;
            
            if (isDataModalOpen) {
                const clickedOutsideDataModal = dataModalRef.current && !dataModalRef.current.contains(target);
                if (clickedOutsideDataModal) {
                    setIsDataModalOpen(null);
                }
            }

            if (isModalOpen) {
                const clickedOutsideTaskModal = taskModalRef.current && !taskModalRef.current.contains(target);
                if (clickedOutsideTaskModal) {
                    setIsModalOpen(null);
                }
            }
        };
    
        document.addEventListener("mousedown", handleClickOutside);
    
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [isDataModalOpen, isModalOpen]);


    const priorities: { name: string; color: string; value: Priority | undefined }[] = [
        {
            name: "None",
            color: "",
            value: undefined
        },
        {
            name: "high",
            color: "red",
            value: "high"
        },
        {
            name: "Medium",
            color: "yellow",
            value: "medium"
        },
        {
            name: "Low",
            color: "green",
            value: "low"
        }
    ]

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
    
        const tasks = localStorage.getItem("toDos");
        const parsedTasks: Task[] = tasks ? JSON.parse(tasks) : [];
    
        const newTask: Task = {
            ...taskForm,
            id: isEditing && taskForm.id ? taskForm.id : crypto.randomUUID(),
            completed: taskForm.completed ?? false
        };
    
        let newTasks;
    
        if (isEditing) {
            newTasks = parsedTasks.map((task: Task) =>
                task.id === isEditing ? newTask : task
            );
            setIsEditing(null);
        } else {
            newTasks = [...parsedTasks, newTask];
        }
    
        localStorage.setItem("toDos", JSON.stringify(newTasks));
        settoDos(newTasks);
    
        setTaskForm({
            id: "",
            title: "",
            description: "",
            priority: undefined,
            label: "",
            date: "",
        });
    };
    

    const handleDelete = (id: string) => {
        const tasks = localStorage.getItem("toDos");
        const parsedTasks: Task[] = tasks ? JSON.parse(tasks) : []; 
    
        const updatedTasks = parsedTasks.filter(
            (task: Task) => task.id !== id
        );
    
        localStorage.setItem("toDos", JSON.stringify(updatedTasks));
        settoDos(updatedTasks);
    }

    const handleEdit = (id: string) => {
        const tasks = localStorage.getItem("toDos");
        const parsedTasks: Task[] = tasks ? JSON.parse(tasks) : []; 

        const foundTask = parsedTasks.find((task: Task) => task.id === id);
        if (foundTask) {
            setTaskForm(foundTask);
            setIsEditing(id);
        }
    }

    const handleToggleComplete = (id: string) => {
        const tasks = localStorage.getItem("toDos");
        const parsedTasks: Task[] = tasks ? JSON.parse(tasks) : [];

        const updatedTasks = parsedTasks.map((task: Task) =>
            task.id === id ? { ...task, completed: !task.completed } : task
        );

        localStorage.setItem("toDos", JSON.stringify(updatedTasks));
        settoDos(updatedTasks);
    }


    const handleAddNewlabel = () => {
        const availableLabels = localStorage.getItem("labels");
        const parsedLabels = availableLabels ? JSON.parse(availableLabels) : [];

        parsedLabels.push(newLabel);
        localStorage.setItem("labels", JSON.stringify(parsedLabels))
        setNewLabel({
            name: "",
            value: ""
        })
        const filteredLabels = parsedLabels.filter((label: Label) => label.value !== "" && label.value !== "Add new label");
        filteredLabels.unshift({ name: "None", value: "" });
        filteredLabels.push({ name: "Add new label", value: "Add new label" });
        setLabels(filteredLabels)
    }

    const handleDeleteLabel = (value: string) => {
        const labels = localStorage.getItem("labels");
        const parsedLabels: Label[] = labels ? JSON.parse(labels) : [];
    
        const newLabels = parsedLabels.filter(label => label.value !== value)
        localStorage.setItem("labels", JSON.stringify(newLabels));
        const filteredLabels = parsedLabels.filter(label => label.value !== value && label.value !== "" && label.value !== "Add new label");
        filteredLabels.unshift({ name: "None", value: "" });
        filteredLabels.push({ name: "Add new label", value: "Add new label" });
        setLabels(filteredLabels);  
    }
    

    type sortType = {
        name: "By Priority" | "By Date";
        value: "Date" | "Priority";
    }

    const priorityOrder: (Priority | undefined)[] = ["high", "medium", "low", undefined];

    const sortKinds: sortType[] = [
        {
            name: "By Priority",
            value: "Priority"
        },
        {
            name: "By Date",
            value: "Date"
        }
    ]

    const filters = {
        priorities: ["high", "medium", "low"] as Priority[],
        date: ["today", "thisWeek", "thisMonth", "past"] as FilterDate[],
    };

    const formatDisplayDate = (isoDate?: string): string => {
        if (!isoDate) return "";
        const target = new Date(isoDate);
        if (Number.isNaN(target.getTime())) return "";

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const t = new Date(target);
        t.setHours(0, 0, 0, 0);

        const diffTime = t.getTime() - today.getTime();
        const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

        const weekdays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
        const months = [
            "January", "February", "March", "April", "May", "June",
            "July", "August", "September", "October", "November", "December"
        ];

        if (diffDays === 0) return "Today";
        if (diffDays === 1) return "Tomorrow";
        if (diffDays > 1 && diffDays < 7) return weekdays[t.getDay()];

        const day = t.getDate();
        const month = months[t.getMonth()];
        const year = t.getFullYear();

        const getSuffix = (d: number) => {
            if (d > 3 && d < 21) return "th";
            switch (d % 10) {
                case 1: return "st";
                case 2: return "nd";
                case 3: return "rd";
                default: return "th";
            }
        };

        const suffix = getSuffix(day);

        if (year === today.getFullYear()) {
            return `${month} ${day}${suffix}`;
        } else {
            return `${month} ${day}${suffix} ${year}`;
        }
    };
    

    type BadgeType = {
        name: string;
        onClick?: () => void;
        isActive?: boolean;
    }
    const Badge: React.FC<BadgeType> = ({name, onClick, isActive}) => {

        return (
            <div 
                className={clsx("text-sm py-2 px-3 border-2  rounded-full shadow-lg cursor-pointer", isActive ? "border-[var(--accent-blue)] bg-[var(--accent-blue)]/70 hover:bg-[var(--accent-blue)]/50" : "border-[var(--fill-primary)] bg-[var(--fill-primary)]/70 hover:bg-[var(--fill-primary)]/50")} 
                onClick={onClick}
            >
                {name}
            </div>
        )
    }

    return (
        <div className="h-screen relative select-none pt-[2.5vh]">
            <div 
                className=" flex gap-4 w-[45%] mx-auto relative mb-[1.5vh]"
            >
                <Button
                    htmlType="button"
                    kind="button"
                    color="accent-blue"
                    size="sm"
                    variant="filled"
                    classname="flex gap-2"
                    onClick={() => {
                        isDataModalOpen === "sort" ? setIsDataModalOpen(null) : setIsDataModalOpen("sort")
                    }}
                >
                    <BiSort />
                    Sort
                </Button>
                <Button
                    htmlType="button"
                    kind="button"
                    color="accent-blue"
                    size="sm"
                    variant="filled"
                    classname="flex gap-2"
                    onClick={() => {
                        isDataModalOpen === "filter" ? setIsDataModalOpen(null) : setIsDataModalOpen("filter")
                    }}
                >
                    <FiFilter />
                    Filter
                </Button>
                <Button
                    htmlType="button"
                    kind="button"
                    color="accent-blue"
                    size="sm"
                    variant="outline"
                    classname="flex gap-2"
                    onClick={() => setShowCompleted(!showCompleted)}
                >
                    {showCompleted ? <FiCheckSquare /> : <FiSquare />}
                    Show Completed Tasks
                </Button>
                <AnimatePresence>
                        {isDataModalOpen &&
                            <motion.ul
                                ref={dataModalRef}
                                initial={{ opacity: 0, scale: 0, y: -70}}
                                animate={{ opacity: 1, scale: 1, y: 0}}
                                exit={{ opacity: 0, scale: 0, y: -70 }}
                                className="z-10 absolute left-0 top-14 p-2 bg-[var(--fill-primary)]/50 backdrop-blur-xl rounded-xl w-[35%] flex flex-col gap-2"
                            >
                                {isDataModalOpen === "sort" ?
                                    sortKinds.map((sort, index) => (
                                        <li
                                            key={index}
                                            className={clsx("flex gap-2 cursor-pointer hover:bg-[var(--fill-primary)] p-2 rounded-xl", sortBy === sort.value && "bg-[var(--fill-primary)]")}
                                            onClick={() => {
                                                setSortBy(sort.value)
                                                setIsDataModalOpen(null)
                                            }}
                                        >
                                            {sort.name}
                                        </li>
                                    ))
                                    :
                                    <>
                                    <h5
                                        className="text-lg font-bold pl-2 pt-2"
                                    >
                                        Date
                                    </h5>
                                    <div className="flex flex-wrap gap-2">
                                        {filters.date.map((date, index) => (                                          
                                            <Badge 
                                                key={index}
                                                name={date}
                                                onClick={() => {
                                                    filter.date !== date ? setFilter({...filter, date: date}) : setFilter({...filter, date: null})
                                                }}
                                                isActive={filter.date === date}
                                            />
                                        ))}
                                    </div>
                                    <h5
                                        className="text-lg font-bold pl-2 pt-2"
                                    >
                                        Priority
                                    </h5>
                                    <div className="flex flex-wrap gap-2">
                                        {filters.priorities.map((priority, index) => (                                          
                                            <Badge 
                                                key={index}
                                                name={priority}
                                                onClick={() => {
                                                    setFilter(prev => ({
                                                        ...prev,
                                                        priorities: prev.priorities.includes(priority)
                                                            ? prev.priorities.filter(p => p !== priority) 
                                                            : [...prev.priorities, priority]              
                                                    }))
                                                }}
                                                isActive={filter.priorities.includes(priority)}
                                            />
                                        ))}
                                    </div>
                                    <h5
                                        className="text-lg font-bold pl-2 pt-2"
                                    >
                                        Label
                                    </h5>
                                    <div className="flex flex-wrap gap-2">
                                        {labels
                                            .filter(label => 
                                                label.value !== "" && 
                                                label.value !== "Add new label"
                                            )
                                            .map((label, index) => (                                          
                                                <Badge 
                                                    key={index}
                                                    name={label.name}
                                                    onClick={() => {
                                                        setFilter((prev) => ({
                                                            ...prev,
                                                            labels: prev.labels.includes(label.value)
                                                                ? prev.labels.filter(l => l !== label.value)
                                                                : [...prev.labels, label.value]
                                                        }))
                                                    }}
                                                    isActive={filter.labels.includes(label.value)}
                                                />
                                            ))
                                        }
                                    </div>
                                    </>
                                }
                            </motion.ul>
                        }
                    </AnimatePresence>
            </div>
            <div className="w-full mx-auto pt-[3vh] pb-4 flex flex-col gap-5 overflow-y-auto h-[77vh] rounded-xl">
                {toDos
                    .filter(todo => {
                        if (filter.priorities.length > 0) {
                            if (!filter.priorities.includes(todo.priority!)) return false;
                        }

                        if (filter.labels.length > 0) {
                            if (!todo.label || !filter.labels.includes(todo.label)) return false;
                        }

                        if (filter.date && todo.date) {
                            const today = new Date();
                            today.setHours(0, 0, 0, 0);
                            const taskDate = new Date(todo.date);
                            taskDate.setHours(0, 0, 0, 0);

                            if (Number.isNaN(taskDate.getTime())) return false;

                            if (filter.date === "today") {
                                if (taskDate.getTime() !== today.getTime()) return false;
                            }

                            if (filter.date === "thisWeek") {
                                const diff = (taskDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24);
                                if (diff < 0 || diff > 7) return false;
                            }

                            if (filter.date === "thisMonth") {
                                if (
                                    taskDate.getMonth() !== today.getMonth() ||
                                    taskDate.getFullYear() !== today.getFullYear()
                                ) return false;
                            }

                            if (filter.date === "past") {
                                if (taskDate.getTime() >= today.getTime()) return false;
                            }
                        }

                        if (!showCompleted && todo.completed) {
                            return false;
                        }

                        return true;
                    })
                    .sort((a, b) => {
                        if (a.completed && !b.completed) return 1;
                        if (!a.completed && b.completed) return -1;

                        if (sortBy === "Priority") {
                            return priorityOrder.indexOf(a.priority!) - priorityOrder.indexOf(b.priority!);
                        } else {
                            const today = new Date();
                            today.setHours(0, 0, 0, 0);
                            const dateA = a.date ? new Date(a.date) : null;
                            const dateB = b.date ? new Date(b.date) : null;

                            if (!dateA && !dateB) return 0;
                            if (!dateA) return 1;
                            if (!dateB) return -1;

                            dateA.setHours(0, 0, 0, 0);
                            dateB.setHours(0, 0, 0, 0);

                            const isAPast = dateA.getTime() < today.getTime();
                            const isBPast = dateB.getTime() < today.getTime();

                            if (isAPast && !isBPast) return 1;
                            if (!isAPast && isBPast) return -1;

                            return dateA.getTime() - dateB.getTime();
                        }
                    })
                    .map(toDo => (
                        <ToDoCard
                            key={toDo.id}
                            {...toDo}
                            date={formatDisplayDate(toDo.date)}
                            handleDelete={handleDelete}
                            handleEdit={handleEdit}
                            handleToggleComplete={handleToggleComplete}
                        />
                    ))
                }

                {toDos.length === 0 && (
                    <div className="text-center flex justify-center items-center text-2xl font-bold">
                        You have no task to do
                    </div>
                )}
            </div>


            <form 
                ref={formRef}
                onSubmit={(e) => handleSubmit(e)}
                className="absolute bottom-4 left-1/2 -translate-x-1/2 w-[50%] mx-auto h-fit pb-4 pt-3 px-2 bg-[var(--bg-control)] shadow-xl rounded-[3rem]"
            > 
                <input 
                    type="text" 
                    placeholder="New Task" 
                    className="w-full rounded-full h-12 px-4 outline-none"
                    onFocus={() => setIsWriting(true)}
                    onBlur={() => setIsWriting(false)}
                    onChange={(e) => setTaskForm({...taskForm, title:  e.target.value})}
                    value={taskForm.title}
                />
                <AnimatePresence>
                    {(isWriting || isModalOpen || taskForm.label !== "" || taskForm.priority !== undefined || taskForm.date !== "") && (
                        <motion.input
                            type="text"
                            placeholder="description"
                            className="w-full rounded-full px-4 text-sm outline-none mb-2"
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 40 }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.3 }}
                            onFocus={() => setIsWriting(true)}
                            onBlur={() => setIsWriting(false)}
                            onChange={(e) => setTaskForm({...taskForm, description: e.target.value})}
                            value={taskForm.description}
                        />
                    )}
                </AnimatePresence>
                <div className="flex gap-5 pl-4 text-sm relative">
                    <div
                        className={clsx("bg-[var(--bg-primary)] p-2.5 rounded-full cursor-pointer hover:bg-[var(--fill-primary)]", isModalOpen === "priority" && "bg-[var(--fill-primary)]", taskForm.priority === "high" ? "text-[red]" : taskForm.priority === "medium" ? "text-[yellow]" : taskForm.priority === "low" ? "text-[green]" : "" )}
                        onClick={() => {
                            isModalOpen && isModalOpen === "priority" ?
                                setIsModalOpen(null)
                            :
                                setIsModalOpen("priority")
                        }}
                    >
                        <FaFlag />
                    </div>
                    <div
                        className={clsx("bg-[var(--bg-primary)] p-2.5 rounded-full cursor-pointer hover:bg-[var(--fill-primary)]", isModalOpen === "label" && "bg-[var(--fill-primary)]", taskForm.label !== "" && "border-[var(--accent-blue)] text-[var(--accent-blue)]")}
                        onClick={() => {
                            isModalOpen && isModalOpen === "label" ?
                                setIsModalOpen(null)
                            :
                                setIsModalOpen("label")
                        }}
                    >
                        <BsTag />
                    </div>
                    <div
                        className={clsx("bg-[var(--bg-primary)] p-2.5 rounded-full cursor-pointer hover:bg-[var(--fill-primary)]", isModalOpen === "date" && "bg-[var(--fill-primary)]", taskForm.date !== "" && "border-[var(--accent-green)] text-[var(--accent-green)]")}
                        onClick={() => {
                            isModalOpen === "date"
                                ? setIsModalOpen(null)
                                : setIsModalOpen("date");
                        }}
                    >
                        <AiOutlineCalendar />
                    </div>

                    <Button
                        htmlType="submit"
                        kind="button"
                        variant="filled"
                        color="accent-blue"
                        size="manual"
                        classname="p-4 absolute right-2 bottom-0 disabled:opacity-[60%]"
                        disabled={taskForm.title === ""}
                    >
                        <IoIosArrowUp className="rounded-full" />
                    </Button>
                    {isEditing &&
                        <Button
                            htmlType="button"
                            kind="button"
                            variant="outline"
                            color="accent-blue"
                            size="manual"
                            classname="p-3 absolute right-16 bottom-0"
                            onClick={() => {
                                setTaskForm({
                                    id: "",
                                    title: "",
                                    description: "",
                                    date: "",
                                    priority: undefined,
                                    label: "",
                                })
                                setIsEditing(null)
                            }}
                        >
                            <HiXMark className="rounded-full text-lg" />
                        </Button>
                    }
                    <AnimatePresence>
                        {isModalOpen &&
                            <motion.ul
                                ref={taskModalRef}
                                initial={{ opacity: 0, scale: 0, y: 70}}
                                animate={{ opacity: 1, scale: 1, y: 0}}
                                exit={{ opacity: 0, scale: 0, y: 70 }}
                                className={clsx(
                                    "z-10 absolute left-0 bottom-12 p-2 bg-[var(--fill-primary)]/50 backdrop-blur-[2px] rounded-xl flex flex-col gap-2",
                                    isModalOpen === "date" ? "w-[400px]" : "w-[25%]"
                                )}
                            >
                                {isModalOpen === "priority" ?
                                    priorities.map((priority, index) => (
                                        <li
                                            key={index}
                                            className={clsx("flex gap-2 cursor-pointer hover:bg-[var(--fill-primary)] p-2 rounded-xl", taskForm.priority === priority.value && "bg-[var(--fill-primary)]")}
                                            onClick={() => {
                                                setTaskForm({...taskForm, priority: priority.value})
                                                setIsModalOpen(null)
                                            }}
                                        >
                                            <FaFlag style={{ color: priority.color }} />
                                            {priority.name}
                                        </li>
                                    ))
                                    : isModalOpen === "label" ?
                                    labels.map((label, index) => (
                                        <li
                                            key={index}
                                            className={clsx("flex gap-2 hover:bg-[var(--fill-primary)] p-2 rounded-xl", taskForm.label === label.value && "bg-[var(--fill-primary)]", label.name !== "Add new label" && "cursor-pointer")}
                                            onClick={() => {
                                                label.value !== "Add new label" && setTaskForm({...taskForm, label: label.value})
                                                label.value !== "Add new label" && setIsModalOpen(null)
                                            }}
                                        >
                                            {label.value === "Add new label" ?
                                                <FiPlusSquare className={clsx("text-2xl", newLabel.name === "" ? "opacity-[0.5]" : "opacity-[1] cursor-pointer")} onClick={() => {newLabel.name !== "" && handleAddNewlabel()}} />
                                                :
                                                <FaFlag className={clsx(label.value !== "" && "text-[var(--accent-blue)]")} />
                                            }
                                            {label.value === "Add new label" ? 
                                                <input 
                                                    type="text" 
                                                    placeholder="Add new label"
                                                    className="w-[90%] h-full outline-none pt-0.5" 
                                                    value={newLabel.name}
                                                    onChange={(e) => setNewLabel({ name: e.target.value, value: e.target.value})}
                                                />
                                                :
                                                <div 
                                                    className="w-[75%]"
                                                >
                                                    {label.name}
                                                </div>
                                            }
                                            {(label.value !== "Add new label" && label.value !== "") &&
                                                <FiTrash 
                                                    className="text-[red] hover:text-[#913636]"     
                                                    onClick={(e) => {
                                                        e.stopPropagation(); 
                                                        handleDeleteLabel(label.value);
                                                    }} 
                                                />
                                            }
                                        </li>
                                    )) 
                                    :
                                    <li className="flex flex-col gap-2 p-2">
                                        <div
                                            className={clsx(
                                                "flex gap-2 cursor-pointer hover:bg-[var(--fill-primary)] p-2 rounded-xl",
                                                taskForm.date === "" && "bg-[var(--fill-primary)]"
                                            )}
                                            onClick={() => {
                                                setTaskForm({ ...taskForm, date: "" });
                                                setIsModalOpen(null);
                                            }}
                                        >
                                            None
                                        </div>
                                        <Calendar
                                            selectedDate={taskForm.date || null}
                                            onDateSelect={(date) => {
                                                setTaskForm({ ...taskForm, date: date || "" });
                                                setIsModalOpen(null);
                                            }}
                                        />
                                    </li>
                                }
                            </motion.ul>
                        }
                    </AnimatePresence>
                </div>
            </form>
        </div>
    )
}

export default ToDoList;
