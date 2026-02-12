// aiFunctions.ts

export const functionsDefinitions = [
    {
        type: "function",
        name: "get_tasks",
        description: "Get all tasks",
        parameters: {
            type: "object",
            properties: {}
        }
    },
    {
        type: "function",
        name: "get_labels",
        description: "Get all labels",
        parameters: {
            type: "object",
            properties: {}
        }
    },
    {
        type: "function",
        name: "add_task",
        description: "Add a new task",
        parameters: {
            type: "object",
            properties: {
                task: {
                    type: "object",
                    description: "Task object"
                }
            },
            required: ["task"]
        }
    },
    {
        type: "function",
        name: "delete_task",
        description: "Delete task by id",
        parameters: {
            type: "object",
            properties: {
                id: {
                    type: "number"
                }
            },
            required: ["id"]
        }
    },
    {
        type: "function",
        name: "edit_task",
        description: "Edit task by id",
        parameters: {
            type: "object",
            properties: {
                id: {
                    type: "number"
                }
            },
            required: ["id"]
        }
    },
    {
        type: "function",
        name: "add_label",
        description: "Add new label",
        parameters: {
            type: "object",
            properties: {
                label: {
                    type: "object"
                }
            },
            required: ["label"]
        }
    },
    {
        type: "function",
        name: "delete_label",
        description: "Delete label by value",
        parameters: {
            type: "object",
            properties: {
                value: {
                    type: "string"
                }
            },
            required: ["value"]
        }
    }
];

type TaskRecord = {
    id?: number | string;
    [key: string]: unknown;
};

type LabelRecord = {
    value?: string;
    [key: string]: unknown;
};

type FunctionArgs = {
    id?: number;
    value?: string;
    task?: TaskRecord;
    label?: LabelRecord;
};

export const executeFunction = async (functionName: string, parameters: unknown) => {
    const args: FunctionArgs = typeof parameters === "string"
        ? (JSON.parse(parameters) as FunctionArgs)
        : ((parameters as FunctionArgs) ?? {});

    try {
        switch (functionName) {

            // -------- READ --------

            case "get_tasks": {
                const data = localStorage.getItem("toDos");
                const tasks = data ? JSON.parse(data) : [];
                return { success: true, tasks };
            }

            case "get_labels": {
                const data = localStorage.getItem("labels");
                const labels = data ? JSON.parse(data) : [];
                return { success: true, labels };
            }

            // -------- TASKS --------

            case "add_task": {
                const data = localStorage.getItem("toDos");
                const tasks = data ? JSON.parse(data) : [];

                const newTasks = [...tasks, args.task];
                localStorage.setItem("toDos", JSON.stringify(newTasks));

                return { success: true, tasks: newTasks };
            }

            case "delete_task": {
                const data = localStorage.getItem("toDos");
                const tasks = data ? JSON.parse(data) : [];

                const updated = (tasks as TaskRecord[]).filter(
                    (task) => task.id !== args.id
                );

                localStorage.setItem("toDos", JSON.stringify(updated));

                return { success: true, tasks: updated };
            }

            case "edit_task": {
                const data = localStorage.getItem("toDos");
                const tasks = data ? JSON.parse(data) : [];

                const task = (tasks as TaskRecord[]).find(
                    (taskItem) => taskItem.id === args.id
                );

                const updated = (tasks as TaskRecord[]).filter(
                    (taskItem) => taskItem.id !== args.id
                );

                localStorage.setItem("toDos", JSON.stringify(updated));

                return { success: true, task };
            }

            // -------- LABELS --------

            case "add_label": {
                const data = localStorage.getItem("labels");
                const labels = data ? JSON.parse(data) : [];

                labels.push(args.label);
                localStorage.setItem("labels", JSON.stringify(labels));

                return { success: true, labels };
            }

            case "delete_label": {
                const data = localStorage.getItem("labels");
                const labels = data ? JSON.parse(data) : [];

                const updated = (labels as LabelRecord[]).filter(
                    (label) => label.value !== args.value
                );

                localStorage.setItem("labels", JSON.stringify(updated));

                return { success: true, labels: updated };
            }

            default:
                return { error: `Function ${functionName} not implemented.` };
        }
    } catch (error: unknown) {
        console.error(error);
        return {
            error: error instanceof Error ? error.message : "Unknown error"
        };
    }
};
