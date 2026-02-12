"use client"
import React, { useState, useEffect, useRef, useMemo } from "react";
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
import { IoColorPaletteOutline } from "react-icons/io5";
import Notodolists from "@/components/Notodolists";
import { undoManager } from "@/lib/undoManager";
import {
    fetchLabelsForCurrentUser,
    fetchNotesForCurrentUser,
    fetchTodosForCurrentUser,
    replaceLabelsForCurrentUser,
    replaceNotesForCurrentUser,
    replaceTodosForCurrentUser,
} from "@/lib/supabase/userData";




type Label = { name: string; value: string };
type FilterDate = "today" | "thisWeek" | "thisMonth" | "past";
type FilterState = {
    priorities: Priority[];
    labels: string[];
    date: FilterDate | null;
};

type NotificationState = {
    isOpen: boolean;
    title: string;
    description: string;
    variant: "default" | "success" | "error";
    undoId?: number;
    key: number;
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
    const [searchTerm, setSearchTerm] = useState<string>("");
    const [filter, setFilter] = useState<FilterState>({
        priorities: [],
        labels: [],
        date: null
    });
    const [isDataModalOpen, setIsDataModalOpen] = useState<"filter" | "sort" | null>(null);
    const [isEditing, setIsEditing] = useState<string | null>(null);
    const [showCompleted, setShowCompleted] = useState<boolean>(false);
    const [notification, setNotification] = useState<NotificationState>({
        isOpen: false,
        title: "",
        description: "",
        variant: "default",
        undoId: undefined,
        key: 0,
    });

    const formRef = useRef<HTMLFormElement>(null);
    const dataModalRef = useRef<HTMLUListElement>(null);
    const taskModalRef = useRef<HTMLUListElement>(null);
    const todosHydratedRef = useRef<boolean>(false);
    const labelsHydratedRef = useRef<boolean>(false);

    
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
        const hydrateTodos = async () => {
            try {
                const remote = await fetchTodosForCurrentUser();
                if (remote.length > 0) {
                    const mapped: Task[] = remote.map((row) => ({
                        id: row.id,
                        title: row.title,
                        description: row.description,
                        priority: row.priority ?? undefined,
                        label: row.label || "",
                        date: row.due_date || "",
                        completed: row.completed,
                        completedAt: row.completed_at || undefined,
                    }));
                    settoDos(mapped);
                    localStorage.setItem("toDos", JSON.stringify(mapped));
                }
            } catch {
                // keep local fallback
            } finally {
                todosHydratedRef.current = true;
            }
        };
        void hydrateTodos();
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
        const hydrateLabels = async () => {
            try {
                const remote = await fetchLabelsForCurrentUser();
                if (remote.length > 0) {
                    const mapped = remote.map((label) => ({ name: label.name, value: label.value }));
                    localStorage.setItem("labels", JSON.stringify(mapped));
                    setLabels([{ name: "None", value: "" }, ...mapped, { name: "Add new label", value: "Add new label" }]);
                }
            } catch {
                // keep local fallback
            } finally {
                labelsHydratedRef.current = true;
            }
        };
        void hydrateLabels();
    }, []);

    useEffect(() => {
        if (!todosHydratedRef.current) return;
        const payload = toDos.map((task) => ({
            id: String(task.id),
            title: task.title,
            description: task.description || "",
            priority: task.priority ?? null,
            label: task.label || "",
            due_date: task.date || null,
            completed: Boolean(task.completed),
            completed_at: task.completedAt || null,
        }));
        void replaceTodosForCurrentUser(payload);
    }, [toDos]);

    useEffect(() => {
        if (!labelsHydratedRef.current) return;
        const payload = labels
            .filter((label) => label.value !== "" && label.value !== "Add new label")
            .map((label) => ({ name: label.name, value: label.value }));
        void replaceLabelsForCurrentUser(payload);
    }, [labels]);

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
        const wasEditing = Boolean(isEditing);
    
        const tasks = localStorage.getItem("toDos");
        const parsedTasks: Task[] = tasks ? JSON.parse(tasks) : [];
        const previousTask = isEditing ? parsedTasks.find((task) => task.id === isEditing) : undefined;
    
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
        const undoId = undoManager.register(() => {
            const stored = localStorage.getItem("toDos");
            const parsed: Task[] = stored ? JSON.parse(stored) : [];
            if (wasEditing && previousTask) {
                const updated = parsed.map((task) => task.id === previousTask.id ? previousTask : task);
                localStorage.setItem("toDos", JSON.stringify(updated));
                settoDos(updated);
            } else {
                const updated = parsed.filter((task) => task.id !== newTask.id);
                localStorage.setItem("toDos", JSON.stringify(updated));
                settoDos(updated);
            }
        });
        setNotification({
            isOpen: true,
            title: "Task Saved",
            description: wasEditing ? `${newTask.title} updated in tasks.` : `${newTask.title} added to tasks.`,
            variant: "success",
            undoId,
            key: Date.now(),
        });
    
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
        const deletedIndex = parsedTasks.findIndex((task: Task) => task.id === id);
        const deletedTask = parsedTasks.find((task: Task) => task.id === id);
    
        const updatedTasks = parsedTasks.filter(
            (task: Task) => task.id !== id
        );
    
        localStorage.setItem("toDos", JSON.stringify(updatedTasks));
        settoDos(updatedTasks);
        if (deletedTask) {
            const undoId = undoManager.register(() => {
                const stored = localStorage.getItem("toDos");
                const parsed: Task[] = stored ? JSON.parse(stored) : [];
                if (parsed.some((task) => task.id === deletedTask.id)) return;
                const next = [...parsed];
                next.splice(Math.min(deletedIndex, next.length), 0, deletedTask);
                localStorage.setItem("toDos", JSON.stringify(next));
                settoDos(next);
            });
            setNotification({
                isOpen: true,
                title: "Task Deleted",
                description: `${deletedTask.title} task deleted.`,
                variant: "error",
                undoId,
                key: Date.now(),
            });
        }
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
        const targetTask = parsedTasks.find((task) => task.id === id);

        let completedTaskTitle = "";
        const updatedTasks = parsedTasks.map((task: Task) => {
            if (task.id !== id) return task;
            const nextCompleted = !task.completed;
            if (nextCompleted) completedTaskTitle = task.title;
            return { ...task, completed: nextCompleted, completedAt: nextCompleted ? new Date().toISOString() : undefined };
        });

        localStorage.setItem("toDos", JSON.stringify(updatedTasks));
        settoDos(updatedTasks);
        if (completedTaskTitle) {
            const undoId = undoManager.register(() => {
                const stored = localStorage.getItem("toDos");
                const parsed: Task[] = stored ? JSON.parse(stored) : [];
                const next = parsed.map((task) =>
                    task.id === id
                        ? { ...task, completed: targetTask?.completed ?? false, completedAt: targetTask?.completedAt }
                        : task
                );
                localStorage.setItem("toDos", JSON.stringify(next));
                settoDos(next);
            });
            setNotification({
                isOpen: true,
                title: "Task Completed",
                description: `${completedTaskTitle} completed.`,
                variant: "success",
                undoId,
                key: Date.now(),
            });
        }
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
        <div className="h-screen relative select-none pt-[9vh]">
            <Notodolists
                key={notification.key}
                title={notification.title}
                description={notification.description}
                variant={notification.variant}
                isOpen={notification.isOpen}
                onUndo={notification.undoId ? () => { undoManager.consume(notification.undoId); } : undefined}
                onClose={() => setNotification((prev) => ({ ...prev, isOpen: false }))}
            />
            <div
                className="flex items-center w-[45%] mx-auto relative mb-[1.5vh] gap-3"
            >
                <div className="flex gap-3 shrink-0">
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
                </div>
                <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search tasks..."
                    className="rounded-full px-4 py-2 border-2 border-[var(--fill-primary)] bg-[var(--bg-primary)] outline-none flex-1 min-w-0 text-center"
                />
                <Button
                    htmlType="button"
                    kind="button"
                    color="accent-blue"
                    size="sm"
                    variant="outline"
                    classname="flex gap-2 shrink-0 ml-auto"
                    onClick={() => setShowCompleted(!showCompleted)}
                >
                    {showCompleted ? <FiCheckSquare /> : <FiSquare />}
                    {showCompleted ? "Hide Completed Tasks" : "Show Completed Tasks"}
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
            <div className="w-full mx-auto pt-[3vh] pb-4 flex flex-col gap-5 overflow-y-auto h-[70vh] rounded-xl">
                {toDos
                    .filter(todo => {
                        const query = searchTerm.trim().toLowerCase();
                        if (query) {
                            const searchableFields = [
                                todo.title || "",
                                todo.description || "",
                                todo.label || "",
                                todo.date || "",
                                formatDisplayDate(todo.date),
                                todo.priority || "",
                            ].map((item) => item.toLowerCase());
                            const isMatched = searchableFields.some((item) => item.includes(query));
                            if (!isMatched) return false;
                        }

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

type Note = {
    id: string;
    title: string;
    content: string;
    color: string;
    label: string;
    date: string;
    createdAt: string;
    updatedAt: string;
};

type NoteForm = {
    id: string;
    title: string;
    content: string;
    color: string;
    label: string;
    date: string;
};

type NoteSortBy = "Updated" | "Date" | "Color";

type NoteFilterState = {
    labels: string[];
    colors: string[];
    date: FilterDate | null;
};

const NOTE_COLORS = [
    { name: "None", value: "" },
    { name: "Ocean", value: "#0EA5E9" },
    { name: "Rose", value: "#FB7185" },
    { name: "Amber", value: "#F59E0B" },
    { name: "Mint", value: "#10B981" },
    { name: "Violet", value: "#8B5CF6" },
];

const NOTE_STORAGE_KEY = "notes";

const formatNoteDisplayDate = (isoDate?: string): string => {
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
    return year === today.getFullYear() ? `${month} ${day}${suffix}` : `${month} ${day}${suffix} ${year}`;
};

const toRgba = (hex: string, alpha: number) => {
    const cleaned = hex.replace("#", "");
    if (cleaned.length !== 6) return `rgba(148, 163, 184, ${alpha})`;
    const r = Number.parseInt(cleaned.slice(0, 2), 16);
    const g = Number.parseInt(cleaned.slice(2, 4), 16);
    const b = Number.parseInt(cleaned.slice(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const getSharedLabels = (): Label[] => {
    const storedLabels = localStorage.getItem("labels");
    try {
        const parsed: Label[] = storedLabels ? JSON.parse(storedLabels) : [];
        return parsed.filter((label) => label.value.trim() !== "");
    } catch {
        return [];
    }
};

const getStoredNotes = (): Note[] => {
    const stored = localStorage.getItem(NOTE_STORAGE_KEY);
    if (!stored) return [];
    try {
        const parsed = JSON.parse(stored) as Note[];
        return parsed.filter((note) => note.id && note.title);
    } catch {
        return [];
    }
};

const NotesBoard: React.FC<{ isActive: boolean }> = ({ isActive }) => {
    const initialColor = NOTE_COLORS[0].value;
    const [notes, setNotes] = useState<Note[]>([]);
    const [labels, setLabels] = useState<Label[]>([]);
    const [newLabel, setNewLabel] = useState<Label>({ name: "", value: "" });
    const [searchTerm, setSearchTerm] = useState<string>("");
    const [sortBy, setSortBy] = useState<NoteSortBy>("Updated");
    const [filter, setFilter] = useState<NoteFilterState>({
        labels: [],
        colors: [],
        date: null
    });
    const [isDataModalOpen, setIsDataModalOpen] = useState<"sort" | "filter" | null>(null);
    const [isWriting, setIsWriting] = useState<boolean>(false);
    const [isModalOpen, setIsModalOpen] = useState<null | "color" | "label" | "date">(null);
    const [selectedNote, setSelectedNote] = useState<Note | null>(null);
    const [detailModalType, setDetailModalType] = useState<null | "color" | "label" | "date">(null);
    const [noteForm, setNoteForm] = useState<NoteForm>({
        id: "",
        title: "",
        content: "",
        color: initialColor,
        label: "",
        date: "",
    });
    const [detailForm, setDetailForm] = useState<NoteForm>({
        id: "",
        title: "",
        content: "",
        color: initialColor,
        label: "",
        date: "",
    });
    const [notification, setNotification] = useState<NotificationState>({
        isOpen: false,
        title: "",
        description: "",
        variant: "default",
        undoId: undefined,
        key: 0,
    });

    const dataModalRef = useRef<HTMLUListElement>(null);
    const noteModalRef = useRef<HTMLUListElement>(null);
    const detailPickerRef = useRef<HTMLUListElement>(null);
    const detailContentRef = useRef<HTMLDivElement>(null);
    const notesHydratedRef = useRef<boolean>(false);
    const labelsHydratedRef = useRef<boolean>(false);

    const loadLabels = () => {
        const shared = getSharedLabels();
        setLabels([{ name: "None", value: "" }, ...shared, { name: "Add new label", value: "Add new label" }]);
    };

    useEffect(() => {
        if (!isActive) return;
        setNotes(getStoredNotes());
        loadLabels();
    }, [isActive]);

    useEffect(() => {
        if (!isActive) return;
        const hydrateNotes = async () => {
            try {
                const remote = await fetchNotesForCurrentUser();
                if (remote.length > 0) {
                    const mapped: Note[] = remote.map((row) => ({
                        id: row.id,
                        title: row.title,
                        content: row.content,
                        color: row.color || "",
                        label: row.label || "",
                        date: row.note_date || "",
                        createdAt: row.created_at,
                        updatedAt: row.updated_at,
                    }));
                    setNotes(mapped);
                    localStorage.setItem(NOTE_STORAGE_KEY, JSON.stringify(mapped));
                }
            } catch {
                // keep local fallback
            } finally {
                notesHydratedRef.current = true;
            }
        };
        const hydrateLabels = async () => {
            try {
                const remote = await fetchLabelsForCurrentUser();
                if (remote.length > 0) {
                    const mapped = remote.map((label) => ({ name: label.name, value: label.value }));
                    localStorage.setItem("labels", JSON.stringify(mapped));
                    setLabels([{ name: "None", value: "" }, ...mapped, { name: "Add new label", value: "Add new label" }]);
                }
            } catch {
                // keep local fallback
            } finally {
                labelsHydratedRef.current = true;
            }
        };
        void hydrateNotes();
        void hydrateLabels();
    }, [isActive]);

    useEffect(() => {
        if (!isActive || !notesHydratedRef.current) return;
        const payload = notes.map((note) => ({
            id: note.id,
            title: note.title,
            content: note.content,
            color: note.color || "",
            label: note.label || "",
            note_date: note.date || null,
            created_at: note.createdAt,
            updated_at: note.updatedAt,
        }));
        void replaceNotesForCurrentUser(payload);
    }, [isActive, notes]);

    useEffect(() => {
        if (!isActive || !labelsHydratedRef.current) return;
        const payload = labels
            .filter((label) => label.value !== "" && label.value !== "Add new label")
            .map((label) => ({ name: label.name, value: label.value }));
        void replaceLabelsForCurrentUser(payload);
    }, [isActive, labels]);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            const target = e.target as Node;
            if (isDataModalOpen && dataModalRef.current && !dataModalRef.current.contains(target)) {
                setIsDataModalOpen(null);
            }
            if (isModalOpen && noteModalRef.current && !noteModalRef.current.contains(target)) {
                setIsModalOpen(null);
            }
            if (detailModalType && detailPickerRef.current && !detailPickerRef.current.contains(target)) {
                setDetailModalType(null);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [isDataModalOpen, isModalOpen, detailModalType]);

    const saveNotes = (nextNotes: Note[]) => {
        setNotes(nextNotes);
        localStorage.setItem(NOTE_STORAGE_KEY, JSON.stringify(nextNotes));
    };

    const clearComposeForm = () => {
        setNoteForm({
            id: "",
            title: "",
            content: "",
            color: initialColor,
            label: "",
            date: "",
        });
        setIsModalOpen(null);
    };

    const createNote = (e: React.FormEvent) => {
        e.preventDefault();
        const trimmedTitle = noteForm.title.trim();
        const trimmedContent = noteForm.content.trim();
        if (!trimmedTitle || !trimmedContent) return;

        const now = new Date().toISOString();
        const newNote: Note = {
            id: crypto.randomUUID(),
            title: trimmedTitle,
            content: trimmedContent,
            color: noteForm.color,
            label: noteForm.label,
            date: noteForm.date,
            createdAt: now,
            updatedAt: now,
        };
        saveNotes([newNote, ...notes]);
        const undoId = undoManager.register(() => {
            const parsed = getStoredNotes();
            const updated = parsed.filter((note) => note.id !== newNote.id);
            saveNotes(updated);
        });
        setNotification({
            isOpen: true,
            title: "Note Added",
            description: `${newNote.title} added to notes.`,
            variant: "success",
            undoId,
            key: Date.now(),
        });
        clearComposeForm();
    };

    const openNoteDetail = (note: Note) => {
        setSelectedNote(note);
        setDetailForm({
            id: note.id,
            title: note.title,
            content: note.content,
            color: note.color,
            label: note.label,
            date: note.date,
        });
        setDetailModalType(null);
    };

    const closeNoteDetail = () => {
        setSelectedNote(null);
        setDetailModalType(null);
    };

    const saveDetailNote = () => {
        const trimmedTitle = detailForm.title.trim();
        const trimmedContent = detailForm.content.trim();
        if (!selectedNote || !trimmedTitle || !trimmedContent) return;

        const hasChanges =
            selectedNote.title !== trimmedTitle ||
            selectedNote.content !== trimmedContent ||
            (selectedNote.color || "") !== detailForm.color ||
            (selectedNote.label || "") !== detailForm.label ||
            (selectedNote.date || "") !== detailForm.date;

        if (!hasChanges) {
            closeNoteDetail();
            return;
        }

        const now = new Date().toISOString();
        const updated = notes.map((note) =>
            note.id === selectedNote.id
                ? {
                      ...note,
                      title: trimmedTitle,
                      content: trimmedContent,
                      color: detailForm.color,
                      label: detailForm.label,
                      date: detailForm.date,
                      updatedAt: now,
                  }
                : note
        );
        saveNotes(updated);
        const previousNote = selectedNote;
        const undoId = undoManager.register(() => {
            const parsed = getStoredNotes();
            const restored = parsed.map((note) => note.id === previousNote.id ? previousNote : note);
            saveNotes(restored);
        });
        setNotification({
            isOpen: true,
            title: "Note Updated",
            description: `${trimmedTitle} updated in notes.`,
            variant: "success",
            undoId,
            key: Date.now(),
        });
        closeNoteDetail();
    };

    const handleDeleteNote = (id: string, closeAfterDelete?: boolean) => {
        const deletedIndex = notes.findIndex((note) => note.id === id);
        const deletedNote = notes.find((note) => note.id === id);
        const nextNotes = notes.filter((note) => note.id !== id);
        saveNotes(nextNotes);
        if (deletedNote) {
            const undoId = undoManager.register(() => {
                const parsed = getStoredNotes();
                if (parsed.some((note) => note.id === deletedNote.id)) return;
                const next = [...parsed];
                next.splice(Math.min(deletedIndex, next.length), 0, deletedNote);
                saveNotes(next);
            });
            setNotification({
                isOpen: true,
                title: "Note Deleted",
                description: `${deletedNote.title} note deleted.`,
                variant: "error",
                undoId,
                key: Date.now(),
            });
        }
        if (closeAfterDelete) closeNoteDetail();
    };

    const handleAddNewlabel = () => {
        const trimmed = newLabel.value.trim();
        if (!trimmed) return;
        const availableLabels = localStorage.getItem("labels");
        const parsedLabels: Label[] = availableLabels ? JSON.parse(availableLabels) : [];
        if (parsedLabels.some((label) => label.value === trimmed)) return;

        const updatedLabels = [...parsedLabels, { name: trimmed, value: trimmed }];
        localStorage.setItem("labels", JSON.stringify(updatedLabels));
        setNewLabel({ name: "", value: "" });
        loadLabels();
    };

    const handleDeleteLabel = (value: string) => {
        const storedLabels = localStorage.getItem("labels");
        const parsedLabels: Label[] = storedLabels ? JSON.parse(storedLabels) : [];
        const updated = parsedLabels.filter((label) => label.value !== value);
        localStorage.setItem("labels", JSON.stringify(updated));

        setNoteForm((prev) => (prev.label === value ? { ...prev, label: "" } : prev));
        setDetailForm((prev) => (prev.label === value ? { ...prev, label: "" } : prev));
        loadLabels();
    };

    const sortKinds: { name: string; value: NoteSortBy }[] = [
        { name: "By Updated Time", value: "Updated" },
        { name: "By Date", value: "Date" },
        { name: "By Color", value: "Color" },
    ];

    const filters = {
        date: ["today", "thisWeek", "thisMonth", "past"] as FilterDate[],
    };

    const visibleNotes = useMemo(() => {
        const colorOrder = NOTE_COLORS.map((color) => color.value);
        const colorNameByValue = new Map(NOTE_COLORS.map((color) => [color.value, color.name.toLowerCase()]));

        return [...notes]
            .filter((note) => {
                const query = searchTerm.trim().toLowerCase();
                if (query) {
                    const searchableParts = [
                        note.title.toLowerCase(),
                        note.content.toLowerCase(),
                        (note.label || "").toLowerCase(),
                        (note.date || "").toLowerCase(),
                        formatNoteDisplayDate(note.date).toLowerCase(),
                        (note.color || "").toLowerCase(),
                        colorNameByValue.get(note.color || "") || "",
                    ];
                    const matchesSearch = searchableParts.some((part) => part.includes(query));
                    if (!matchesSearch) return false;
                }

                if (filter.labels.length > 0) {
                    if (!note.label || !filter.labels.includes(note.label)) return false;
                }

                if (filter.colors.length > 0) {
                    if (!filter.colors.includes(note.color || "")) return false;
                }

                if (filter.date && note.date) {
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    const noteDate = new Date(note.date);
                    noteDate.setHours(0, 0, 0, 0);
                    if (Number.isNaN(noteDate.getTime())) return false;

                    if (filter.date === "today" && noteDate.getTime() !== today.getTime()) return false;

                    if (filter.date === "thisWeek") {
                        const diff = (noteDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24);
                        if (diff < 0 || diff > 7) return false;
                    }

                    if (filter.date === "thisMonth") {
                        if (
                            noteDate.getMonth() !== today.getMonth() ||
                            noteDate.getFullYear() !== today.getFullYear()
                        ) return false;
                    }

                    if (filter.date === "past" && noteDate.getTime() >= today.getTime()) return false;
                } else if (filter.date && !note.date) {
                    return false;
                }

                return true;
            })
            .sort((a, b) => {
                if (sortBy === "Updated") {
                    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
                }

                if (sortBy === "Color") {
                    return colorOrder.indexOf(a.color || "") - colorOrder.indexOf(b.color || "");
                }

                const dateA = a.date ? new Date(a.date).getTime() : Number.POSITIVE_INFINITY;
                const dateB = b.date ? new Date(b.date).getTime() : Number.POSITIVE_INFINITY;
                return dateA - dateB;
            });
    }, [notes, sortBy, filter, searchTerm]);

    return (
        <div className="h-screen relative select-none pt-[9vh]">
            <Notodolists
                key={notification.key}
                title={notification.title}
                description={notification.description}
                variant={notification.variant}
                isOpen={notification.isOpen}
                onUndo={notification.undoId ? () => { undoManager.consume(notification.undoId); } : undefined}
                onClose={() => setNotification((prev) => ({ ...prev, isOpen: false }))}
            />
            <div className="flex gap-4 w-[45%] mx-auto relative mb-[1.5vh] items-center">
                <Button
                    htmlType="button"
                    kind="button"
                    color="accent-blue"
                    size="sm"
                    variant="filled"
                    classname="flex gap-2"
                    onClick={() => {
                        isDataModalOpen === "sort" ? setIsDataModalOpen(null) : setIsDataModalOpen("sort");
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
                        isDataModalOpen === "filter" ? setIsDataModalOpen(null) : setIsDataModalOpen("filter");
                    }}
                >
                    <FiFilter />
                    Filter
                </Button>
                <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search in notes..."
                    className="rounded-full px-4 py-2 w-full max-w-[260px] border-2 border-[var(--fill-primary)] bg-[var(--bg-primary)] outline-none"
                />
                <span className="ml-auto text-sm bg-[var(--fill-primary)]/70 border-2 border-[var(--fill-primary)] px-3 py-2 rounded-full">
                    Notes: {visibleNotes.length}
                </span>

                <AnimatePresence>
                    {isDataModalOpen &&
                        <motion.ul
                            ref={dataModalRef}
                            initial={{ opacity: 0, scale: 0, y: -70 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0, y: -70 }}
                            className="z-20 absolute left-0 top-14 p-2 bg-[var(--fill-primary)]/50 backdrop-blur-xl rounded-xl w-[45%] flex flex-col gap-2"
                        >
                            {isDataModalOpen === "sort" ?
                                sortKinds.map((sort, index) => (
                                    <li
                                        key={index}
                                        className={clsx("flex gap-2 cursor-pointer hover:bg-[var(--fill-primary)] p-2 rounded-xl", sortBy === sort.value && "bg-[var(--fill-primary)]")}
                                        onClick={() => {
                                            setSortBy(sort.value);
                                            setIsDataModalOpen(null);
                                        }}
                                    >
                                        {sort.name}
                                    </li>
                                ))
                                :
                                <>
                                    <h5 className="text-lg font-bold pl-2 pt-2">
                                        Date
                                    </h5>
                                    <div className="flex flex-wrap gap-2 px-2">
                                        {filters.date.map((date, index) => (
                                            <button
                                                key={index}
                                                type="button"
                                                className={clsx("text-sm py-2 px-3 border-2 rounded-full shadow-lg cursor-pointer", filter.date === date ? "border-[var(--accent-blue)] bg-[var(--accent-blue)]/70 hover:bg-[var(--accent-blue)]/50" : "border-[var(--fill-primary)] bg-[var(--fill-primary)]/70 hover:bg-[var(--fill-primary)]/50")}
                                                onClick={() => {
                                                    filter.date !== date ? setFilter({ ...filter, date }) : setFilter({ ...filter, date: null });
                                                }}
                                            >
                                                {date}
                                            </button>
                                        ))}
                                    </div>

                                    <h5 className="text-lg font-bold pl-2 pt-2">
                                        Color
                                    </h5>
                                    <div className="flex flex-wrap gap-2 px-2">
                                        {NOTE_COLORS.map((color, index) => (
                                            <button
                                                key={index}
                                                type="button"
                                                className={clsx("text-sm py-2 px-3 border-2 rounded-full shadow-lg cursor-pointer flex items-center gap-2", filter.colors.includes(color.value) ? "border-[var(--accent-blue)] bg-[var(--accent-blue)]/70 hover:bg-[var(--accent-blue)]/50" : "border-[var(--fill-primary)] bg-[var(--fill-primary)]/70 hover:bg-[var(--fill-primary)]/50")}
                                                onClick={() => {
                                                    setFilter((prev) => ({
                                                        ...prev,
                                                        colors: prev.colors.includes(color.value)
                                                            ? prev.colors.filter((item) => item !== color.value)
                                                            : [...prev.colors, color.value]
                                                    }));
                                                }}
                                            >
                                                <span className="w-3 h-3 rounded-full border border-[var(--text-primary)]" style={{ backgroundColor: color.value || "transparent" }} />
                                                {color.name}
                                            </button>
                                        ))}
                                    </div>

                                    <h5 className="text-lg font-bold pl-2 pt-2">
                                        Label
                                    </h5>
                                    <div className="flex flex-wrap gap-2 px-2">
                                        {labels
                                            .filter((label) => label.value !== "" && label.value !== "Add new label")
                                            .map((label, index) => (
                                                <button
                                                    key={index}
                                                    type="button"
                                                    className={clsx("text-sm py-2 px-3 border-2 rounded-full shadow-lg cursor-pointer", filter.labels.includes(label.value) ? "border-[var(--accent-blue)] bg-[var(--accent-blue)]/70 hover:bg-[var(--accent-blue)]/50" : "border-[var(--fill-primary)] bg-[var(--fill-primary)]/70 hover:bg-[var(--fill-primary)]/50")}
                                                    onClick={() => {
                                                        setFilter((prev) => ({
                                                            ...prev,
                                                            labels: prev.labels.includes(label.value)
                                                                ? prev.labels.filter((item) => item !== label.value)
                                                                : [...prev.labels, label.value]
                                                        }));
                                                    }}
                                                >
                                                    {label.name}
                                                </button>
                                            ))
                                        }
                                    </div>
                                </>
                            }
                        </motion.ul>
                    }
                </AnimatePresence>
            </div>

            <div className="w-full mx-auto pt-[3vh] pb-4 flex flex-col gap-5 overflow-y-auto h-[70vh] rounded-xl">
                {visibleNotes.map((note) => (
                    <article
                        key={note.id}
                        className="border-2 shadow-lg rounded-3xl p-4 w-[45%] mx-auto cursor-pointer transition-all duration-150 hover:scale-[1.01]"
                        style={{
                            borderColor: note.color || "var(--fill-primary)",
                            backgroundColor: toRgba(note.color, 0.16),
                        }}
                        onClick={() => openNoteDetail(note)}
                    >
                        <div className="flex justify-between gap-3 mb-3">
                            <h3 className="text-2xl font-bold break-words">{note.title}</h3>
                                <span
                                    className="w-5 h-5 rounded-full border-2 border-[var(--bg-primary)] mt-1"
                                    style={{ backgroundColor: note.color || "transparent" }}
                                />
                        </div>
                        <p className="pl-1 pb-2 whitespace-pre-wrap break-words">
                            {note.content}
                        </p>
                        {(note.label || note.date) &&
                            <div className="flex gap-2 pl-1">
                                {note.label &&
                                    <span className="p-2 bg-[var(--fill-primary)] rounded-full text-sm text-center flex gap-2 items-center justify-center">
                                        <BsTag />
                                        {note.label}
                                    </span>
                                }
                                {note.date &&
                                    <span className="p-2 bg-[var(--fill-primary)] rounded-full text-sm text-center flex gap-2 items-center justify-center">
                                        <AiOutlineCalendar />
                                        {formatNoteDisplayDate(note.date)}
                                    </span>
                                }
                            </div>
                        }
                    </article>
                ))}

                {visibleNotes.length === 0 && (
                    <div className="text-center flex justify-center items-center text-2xl font-bold">
                        You have no notes
                    </div>
                )}
            </div>

            <form
                onSubmit={createNote}
                className="absolute bottom-4 left-1/2 -translate-x-1/2 w-[50%] mx-auto h-fit pb-4 pt-3 px-2 bg-[var(--bg-control)] shadow-xl rounded-[3rem]"
            >
                <input
                    type="text"
                    placeholder="New Note Title"
                    className="w-full rounded-full h-12 px-4 outline-none"
                    onFocus={() => setIsWriting(true)}
                    onBlur={() => setIsWriting(false)}
                    onChange={(e) => setNoteForm({ ...noteForm, title: e.target.value })}
                    value={noteForm.title}
                />
                <AnimatePresence>
                    {(isWriting || isModalOpen || noteForm.label !== "" || noteForm.date !== "" || noteForm.color !== initialColor || noteForm.content !== "") && (
                        <motion.textarea
                            placeholder="Write your note"
                            className="w-full rounded-2xl px-4 py-2 text-sm outline-none mb-2 resize-none"
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 96 }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.3 }}
                            onFocus={() => setIsWriting(true)}
                            onBlur={() => setIsWriting(false)}
                            onChange={(e) => setNoteForm({ ...noteForm, content: e.target.value })}
                            value={noteForm.content}
                        />
                    )}
                </AnimatePresence>

                <div className="flex gap-5 pl-4 text-sm relative">
                    <button
                        type="button"
                        className={clsx("bg-[var(--bg-primary)] p-2.5 rounded-full cursor-pointer hover:bg-[var(--fill-primary)]", isModalOpen === "color" && "bg-[var(--fill-primary)]")}
                        onClick={() => {
                            isModalOpen === "color" ? setIsModalOpen(null) : setIsModalOpen("color");
                        }}
                    >
                        <IoColorPaletteOutline style={{ color: noteForm.color }} />
                    </button>
                    <button
                        type="button"
                        className={clsx("bg-[var(--bg-primary)] p-2.5 rounded-full cursor-pointer hover:bg-[var(--fill-primary)]", isModalOpen === "label" && "bg-[var(--fill-primary)]", noteForm.label !== "" && "border-[var(--accent-blue)] text-[var(--accent-blue)]")}
                        onClick={() => {
                            isModalOpen === "label" ? setIsModalOpen(null) : setIsModalOpen("label");
                        }}
                    >
                        <BsTag />
                    </button>
                    <button
                        type="button"
                        className={clsx("bg-[var(--bg-primary)] p-2.5 rounded-full cursor-pointer hover:bg-[var(--fill-primary)]", isModalOpen === "date" && "bg-[var(--fill-primary)]", noteForm.date !== "" && "border-[var(--accent-green)] text-[var(--accent-green)]")}
                        onClick={() => {
                            isModalOpen === "date" ? setIsModalOpen(null) : setIsModalOpen("date");
                        }}
                    >
                        <AiOutlineCalendar />
                    </button>

                    <Button
                        htmlType="submit"
                        kind="button"
                        variant="filled"
                        color="accent-blue"
                        size="manual"
                        classname="p-4 absolute right-2 bottom-0 disabled:opacity-[60%]"
                        disabled={noteForm.title.trim() === "" || noteForm.content.trim() === ""}
                    >
                        <IoIosArrowUp className="rounded-full" />
                    </Button>

                    <AnimatePresence>
                        {isModalOpen &&
                            <motion.ul
                                ref={noteModalRef}
                                initial={{ opacity: 0, scale: 0, y: 70 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0, y: 70 }}
                                className={clsx(
                                    "z-30 absolute left-0 bottom-12 p-2 bg-[var(--fill-primary)]/50 backdrop-blur-[2px] rounded-xl flex flex-col gap-2",
                                    isModalOpen === "date" ? "w-[400px]" : "w-[25%]"
                                )}
                            >
                                {isModalOpen === "color" ?
                                    NOTE_COLORS.map((color, index) => (
                                        <li
                                            key={index}
                                            className={clsx("flex items-center gap-2 cursor-pointer hover:bg-[var(--fill-primary)] p-2 rounded-xl", noteForm.color === color.value && "bg-[var(--fill-primary)]")}
                                            onClick={() => {
                                                setNoteForm({ ...noteForm, color: color.value });
                                                setIsModalOpen(null);
                                            }}
                                        >
                                            <span className="w-4 h-4 rounded-full" style={{ backgroundColor: color.value }} />
                                            {color.name}
                                        </li>
                                    ))
                                    : isModalOpen === "label" ?
                                    labels.map((label, index) => (
                                        <li
                                            key={index}
                                            className={clsx("flex gap-2 hover:bg-[var(--fill-primary)] p-2 rounded-xl", noteForm.label === label.value && "bg-[var(--fill-primary)]", label.name !== "Add new label" && "cursor-pointer")}
                                            onClick={() => {
                                                if (label.value !== "Add new label") {
                                                    setNoteForm({ ...noteForm, label: label.value });
                                                    setIsModalOpen(null);
                                                }
                                            }}
                                        >
                                            {label.value === "Add new label" ?
                                                <FiPlusSquare className={clsx("text-2xl", newLabel.name === "" ? "opacity-[0.5]" : "opacity-[1] cursor-pointer")} onClick={() => { newLabel.name !== "" && handleAddNewlabel(); }} />
                                                :
                                                <FaFlag className={clsx(label.value !== "" && "text-[var(--accent-blue)]")} />
                                            }
                                            {label.value === "Add new label" ?
                                                <input
                                                    type="text"
                                                    placeholder="Add new label"
                                                    className="w-[90%] h-full outline-none pt-0.5"
                                                    value={newLabel.name}
                                                    onChange={(e) => setNewLabel({ name: e.target.value, value: e.target.value })}
                                                />
                                                :
                                                <div className="w-[75%]">
                                                    {label.name}
                                                </div>
                                            }
                                            {(label.value !== "Add new label" && label.value !== "") &&
                                                <FiTrash
                                                    className="text-[red] hover:text-[#913636] cursor-pointer"
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
                                            className={clsx("flex gap-2 cursor-pointer hover:bg-[var(--fill-primary)] p-2 rounded-xl", noteForm.date === "" && "bg-[var(--fill-primary)]")}
                                            onClick={() => {
                                                setNoteForm({ ...noteForm, date: "" });
                                                setIsModalOpen(null);
                                            }}
                                        >
                                            None
                                        </div>
                                        <Calendar
                                            selectedDate={noteForm.date || null}
                                            onDateSelect={(date) => {
                                                setNoteForm({ ...noteForm, date: date || "" });
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

            <AnimatePresence>
                {selectedNote &&
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-[2px] p-4 flex items-center justify-center cursor-pointer"
                        onClick={closeNoteDetail}
                    >
                        <motion.div
                            ref={detailContentRef}
                            initial={{ scale: 0.95, y: 12, opacity: 0 }}
                            animate={{ scale: 1, y: 0, opacity: 1 }}
                            exit={{ scale: 0.95, y: 12, opacity: 0 }}
                            className="relative z-[110] w-full max-w-2xl rounded-3xl border-2 bg-[var(--bg-control)] p-5 shadow-2xl cursor-default overflow-visible"
                            style={{ borderColor: detailForm.color || "var(--fill-primary)" }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex justify-between gap-4 items-start">
                                <input
                                    type="text"
                                    value={detailForm.title}
                                    onChange={(e) => setDetailForm((prev) => ({ ...prev, title: e.target.value }))}
                                    className="w-full text-2xl font-bold bg-transparent outline-none border-b-2 border-[var(--fill-primary)] pb-2"
                                />
                                <button
                                    type="button"
                                    className="cursor-pointer p-2 rounded-full hover:bg-[var(--fill-primary)]"
                                    onClick={closeNoteDetail}
                                >
                                    <HiXMark />
                                </button>
                            </div>

                            <textarea
                                value={detailForm.content}
                                onChange={(e) => setDetailForm((prev) => ({ ...prev, content: e.target.value }))}
                                className="w-full mt-4 min-h-48 bg-transparent outline-none rounded-2xl border-2 border-[var(--fill-primary)] p-3 resize-none"
                            />

                            <div className="flex gap-3 mt-4 relative">
                                <button
                                    type="button"
                                    className="bg-[var(--bg-primary)] p-2.5 rounded-full cursor-pointer hover:bg-[var(--fill-primary)]"
                                    onClick={() => setDetailModalType(detailModalType === "color" ? null : "color")}
                                >
                                    <IoColorPaletteOutline style={{ color: detailForm.color }} />
                                </button>
                                <button
                                    type="button"
                                    className={clsx("bg-[var(--bg-primary)] p-2.5 rounded-full cursor-pointer hover:bg-[var(--fill-primary)]", detailForm.label !== "" && "border-[var(--accent-blue)] text-[var(--accent-blue)]")}
                                    onClick={() => setDetailModalType(detailModalType === "label" ? null : "label")}
                                >
                                    <BsTag />
                                </button>
                                <button
                                    type="button"
                                    className={clsx("bg-[var(--bg-primary)] p-2.5 rounded-full cursor-pointer hover:bg-[var(--fill-primary)]", detailForm.date !== "" && "border-[var(--accent-green)] text-[var(--accent-green)]")}
                                    onClick={() => setDetailModalType(detailModalType === "date" ? null : "date")}
                                >
                                    <AiOutlineCalendar />
                                </button>

                                <AnimatePresence>
                                    {detailModalType &&
                                        <motion.ul
                                            ref={detailPickerRef}
                                            initial={{ opacity: 0, scale: 0, y: 70 }}
                                            animate={{ opacity: 1, scale: 1, y: 0 }}
                                            exit={{ opacity: 0, scale: 0, y: 70 }}
                            className={clsx(
                                                "z-[140] absolute left-0 bottom-12 p-2 bg-[var(--fill-primary)]/70 backdrop-blur-[2px] rounded-xl flex flex-col gap-2",
                                                detailModalType === "date" ? "w-[400px]" : "w-[45%]"
                                            )}
                                        >
                                            {detailModalType === "color" ?
                                                NOTE_COLORS.map((color, index) => (
                                                    <li
                                                        key={index}
                                                        className={clsx("flex items-center gap-2 cursor-pointer hover:bg-[var(--fill-primary)] p-2 rounded-xl", detailForm.color === color.value && "bg-[var(--fill-primary)]")}
                                                        onClick={() => {
                                                            setDetailForm((prev) => ({ ...prev, color: color.value }));
                                                            setDetailModalType(null);
                                                        }}
                                                    >
                                                        <span className="w-4 h-4 rounded-full" style={{ backgroundColor: color.value }} />
                                                        {color.name}
                                                    </li>
                                                ))
                                                : detailModalType === "label" ?
                                                labels.map((label, index) => (
                                                    <li
                                                        key={index}
                                                        className={clsx("flex gap-2 hover:bg-[var(--fill-primary)] p-2 rounded-xl", detailForm.label === label.value && "bg-[var(--fill-primary)]", label.name !== "Add new label" && "cursor-pointer")}
                                                        onClick={() => {
                                                            if (label.value !== "Add new label") {
                                                                setDetailForm((prev) => ({ ...prev, label: label.value }));
                                                                setDetailModalType(null);
                                                            }
                                                        }}
                                                    >
                                                        {label.value === "Add new label" ?
                                                            <FiPlusSquare className={clsx("text-2xl", newLabel.name === "" ? "opacity-[0.5]" : "opacity-[1] cursor-pointer")} onClick={() => { newLabel.name !== "" && handleAddNewlabel(); }} />
                                                            :
                                                            <FaFlag className={clsx(label.value !== "" && "text-[var(--accent-blue)]")} />
                                                        }
                                                        {label.value === "Add new label" ?
                                                            <input
                                                                type="text"
                                                                placeholder="Add new label"
                                                                className="w-[90%] h-full outline-none pt-0.5"
                                                                value={newLabel.name}
                                                                onChange={(e) => setNewLabel({ name: e.target.value, value: e.target.value })}
                                                            />
                                                            :
                                                            <div className="w-[75%]">
                                                                {label.name}
                                                            </div>
                                                        }
                                                        {(label.value !== "Add new label" && label.value !== "") &&
                                                            <FiTrash
                                                                className="text-[red] hover:text-[#913636] cursor-pointer"
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
                                                        className={clsx("flex gap-2 cursor-pointer hover:bg-[var(--fill-primary)] p-2 rounded-xl", detailForm.date === "" && "bg-[var(--fill-primary)]")}
                                                        onClick={() => {
                                                            setDetailForm((prev) => ({ ...prev, date: "" }));
                                                            setDetailModalType(null);
                                                        }}
                                                    >
                                                        None
                                                    </div>
                                                    <Calendar
                                                        selectedDate={detailForm.date || null}
                                                        onDateSelect={(date) => {
                                                            setDetailForm((prev) => ({ ...prev, date: date || "" }));
                                                            setDetailModalType(null);
                                                        }}
                                                    />
                                                </li>
                                            }
                                        </motion.ul>
                                    }
                                </AnimatePresence>
                            </div>

                            <div className="flex gap-2 mt-6">
                                <Button
                                    htmlType="button"
                                    kind="button"
                                    variant="filled"
                                    color="accent-blue"
                                    size="sm"
                                    onClick={saveDetailNote}
                                    disabled={detailForm.title.trim() === "" || detailForm.content.trim() === ""}
                                >
                                    Save Changes
                                </Button>
                                <Button
                                    htmlType="button"
                                    kind="button"
                                    variant="outline"
                                    color="accent-red"
                                    size="sm"
                                    onClick={() => handleDeleteNote(selectedNote.id, true)}
                                >
                                    Delete
                                </Button>
                            </div>
                        </motion.div>
                    </motion.div>
                }
            </AnimatePresence>
        </div>
    );
};

const ToDoNotesWorkspace: React.FC = () => {
    const [activeView, setActiveView] = useState<"todo" | "notes">("todo");

    return (
        <div className="relative">
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 w-[45%] p-1 rounded-full border-2 border-[var(--fill-primary)] bg-[var(--bg-control)]/90 backdrop-blur-md shadow-lg flex gap-1">
                <button
                    type="button"
                    className={clsx(
                        "w-1/2 px-4 py-2 rounded-full text-sm font-semibold transition-colors cursor-pointer text-center",
                        activeView === "todo"
                            ? "bg-[var(--accent-blue)] text-[var(--text-selected)]"
                            : "hover:bg-[var(--fill-primary)]"
                    )}
                    onClick={() => setActiveView("todo")}
                >
                    To-Do List
                </button>
                <button
                    type="button"
                    className={clsx(
                        "w-1/2 px-4 py-2 rounded-full text-sm font-semibold transition-colors cursor-pointer text-center",
                        activeView === "notes"
                            ? "bg-[var(--accent-blue)] text-[var(--text-selected)]"
                            : "hover:bg-[var(--fill-primary)]"
                    )}
                    onClick={() => setActiveView("notes")}
                >
                    Notes
                </button>
            </div>

            <AnimatePresence mode="wait">
                {activeView === "todo" ? (
                    <motion.div
                        key="todo-view"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                    >
                        <ToDoList />
                    </motion.div>
                ) : (
                    <motion.div
                        key="notes-view"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                    >
                        <NotesBoard isActive={activeView === "notes"} />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default ToDoNotesWorkspace;
