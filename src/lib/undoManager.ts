type UndoHandler = () => void;

type UndoEntry = {
    id: number;
    undo: UndoHandler;
    expiresAt: number;
    timerId: number;
};

let counter = 0;
const entries = new Map<number, UndoEntry>();

const removeEntry = (id: number) => {
    const entry = entries.get(id);
    if (!entry) return;
    window.clearTimeout(entry.timerId);
    entries.delete(id);
};

const register = (undo: UndoHandler, ttlMs = 3500): number => {
    const id = ++counter;
    const timerId = window.setTimeout(() => {
        entries.delete(id);
    }, ttlMs);

    entries.set(id, {
        id,
        undo,
        expiresAt: Date.now() + ttlMs,
        timerId,
    });

    return id;
};

const consume = (id?: number): boolean => {
    if (!id) return false;
    const entry = entries.get(id);
    if (!entry) return false;
    removeEntry(id);
    entry.undo();
    return true;
};

export const undoManager = {
    register,
    consume,
};

