"use client"
import { useEffect, useRef, useState } from "react";
import BookMarkCard from "@/components/BookMarkdCard";
import { bookmarkProp } from "@/components/BookMarkdCard";
import Button from "@/components/Buttons";
import Modal from "@/components/Modal";
import Notodolists from "@/components/Notodolists";
import { undoManager } from "@/lib/undoManager";
import { fetchBookmarksForCurrentUser, replaceBookmarksForCurrentUser } from "@/lib/supabase/userData";

type NotificationState = {
    isOpen: boolean;
    title: string;
    description: string;
    variant: "default" | "success" | "error";
    undoId?: number;
    key: number;
};

const App = () => {
    const [loading, setloading] = useState<boolean>(false);
    const [error, setError] = useState<null | string>(null);
    const [bookmarks, setBookmarks] = useState<bookmarkProp[] | null>([]);
    const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
    const [isEditing, setIsEditing] = useState<boolean>(false);
    const [isDeleteModalopen, setIsdeleteModalOpen] = useState<boolean>(false);
    const [deleteBookMark, setDeleteBookMark] = useState<string>(""); 
    const [notification, setNotification] = useState<NotificationState>({
        isOpen: false,
        title: "",
        description: "",
        variant: "default",
        undoId: undefined,
        key: 0,
    });

    const [bookMarkForm, setBookMarkForm] = useState<bookmarkProp>({
        id: null,
        title: "",
        description: "",
        link: ""
    })
    const hasHydratedRef = useRef<boolean>(false);
    const ensureUuid = (id: string | number | null) => {
        const raw = String(id ?? "");
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(raw);
        return isUuid ? raw : crypto.randomUUID();
    };

    const getItems = () => {
        setloading(true);
        try {
            const stored = localStorage.getItem('bookmarks');
            if (stored) {
                const parsed = JSON.parse(stored);
                if (Array.isArray(parsed)) {
                    const normalized = (parsed as bookmarkProp[]).map((item) => ({ ...item, id: ensureUuid(item.id) }));
                    setBookmarks(normalized);
                    localStorage.setItem("bookmarks", JSON.stringify(normalized));
                } else {
                    setBookmarks([]);
                }
            } else {
                setBookmarks([]);
            }
            setError(null);
        } catch (err) {
            setError('Failed to load bookmarks');
            setBookmarks([]);
        } finally {
            setloading(false);
        }
    }

    useEffect(() => {
        getItems();
    }, [])

    useEffect(() => {
        const loadFromSupabase = async () => {
            try {
                const remote = await fetchBookmarksForCurrentUser();
                if (remote.length > 0) {
                    const mapped: bookmarkProp[] = remote.map((item) => ({
                        id: item.id,
                        title: item.title,
                        description: item.description,
                        link: item.link,
                    }));
                    setBookmarks(mapped);
                    localStorage.setItem("bookmarks", JSON.stringify(mapped));
                }
            } catch {
                // keep local fallback
            } finally {
                hasHydratedRef.current = true;
            }
        };
        void loadFromSupabase();
    }, []);

    useEffect(() => {
        if (!hasHydratedRef.current) return;
        if (!Array.isArray(bookmarks)) return;
        localStorage.setItem("bookmarks", JSON.stringify(bookmarks));
        const payload = bookmarks.map((item) => ({
            id: ensureUuid(item.id),
            title: item.title,
            description: item.description || "",
            link: item.link,
        }));
        void replaceBookmarksForCurrentUser(payload);
    }, [bookmarks]);

    const handleSubmitForm = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        const newBookmark: bookmarkProp = {
            id: crypto.randomUUID(),
            title: bookMarkForm.title,
            description: bookMarkForm.description,
            link: bookMarkForm.link,
        };

        let existing: bookmarkProp[] = [];
        try {
            const stored = localStorage.getItem('bookmarks');
            if (stored) {
                const parsed = JSON.parse(stored);
                if (Array.isArray(parsed)) existing = parsed as bookmarkProp[];
            }
        } catch (_) {
            existing = [];
        }

        const next = [...existing, newBookmark];
        localStorage.setItem('bookmarks', JSON.stringify(next));
        setBookmarks(next);
        const undoId = undoManager.register(() => {
            const stored = localStorage.getItem('bookmarks');
            const parsed: bookmarkProp[] = stored ? JSON.parse(stored) : [];
            const updated = parsed.filter((bm) => bm.id !== newBookmark.id);
            localStorage.setItem('bookmarks', JSON.stringify(updated));
            setBookmarks(updated);
        });
        setNotification({
            isOpen: true,
            title: "Bookmark Added",
            description: `${newBookmark.title} added to bookmarks.`,
            variant: "success",
            undoId,
            key: Date.now(),
        });
        setIsModalOpen(false);
        setBookMarkForm({id: null , title: "", description: "", link: "" });
    }



    const handleDelete = (id: string | number | null) => {
        const existing: bookmarkProp[] = [...(bookmarks ?? [])];
        const toDelete = existing.find(bm => bm.id === id);
        const indexTodelete = existing.findIndex(bm => bm.id === id);
        
        if(indexTodelete !== -1){
            const deletedBookmark = existing[indexTodelete];
            const deletedIndex = indexTodelete;
            existing.splice(indexTodelete, 1);
            localStorage.setItem('bookmarks', JSON.stringify(existing));
            setBookmarks(existing); 
            setIsdeleteModalOpen(false);
            if (toDelete) {
                const undoId = undoManager.register(() => {
                    const stored = localStorage.getItem('bookmarks');
                    const parsed: bookmarkProp[] = stored ? JSON.parse(stored) : [];
                    if (parsed.some((bm) => bm.id === deletedBookmark.id)) return;
                    const next = [...parsed];
                    next.splice(Math.min(deletedIndex, next.length), 0, deletedBookmark);
                    localStorage.setItem('bookmarks', JSON.stringify(next));
                    setBookmarks(next);
                });
                setNotification({
                    isOpen: true,
                    title: "Bookmark Deleted",
                    description: `${toDelete.title} bookmark deleted.`,
                    variant: "error",
                    undoId,
                    key: Date.now(),
                });
            }
        } else {
            console.log("Bookmark not found");
        }
    }
    
    const handleEdit = (bm: bookmarkProp) => {
        setIsEditing(true)
        setBookMarkForm(bm)
        setIsModalOpen(true)
    }

    const handleSubmitEdit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
    
        const updatedBookmark: bookmarkProp = {
            id: bookMarkForm.id,
            title: bookMarkForm.title,
            description: bookMarkForm.description,
            link: bookMarkForm.link,
        };
    
        const existing: bookmarkProp[] = [...(bookmarks ?? [])];
        console.log(bookMarkForm.title)
        const indexToUpdate = existing.findIndex(bm => bm.id === bookMarkForm.id);
    
        if (indexToUpdate !== -1) {
            const previousBookmark = existing[indexToUpdate];
            existing[indexToUpdate] = updatedBookmark;
            localStorage.setItem('bookmarks', JSON.stringify(existing));
            setBookmarks(existing);
            const undoId = undoManager.register(() => {
                const stored = localStorage.getItem('bookmarks');
                const parsed: bookmarkProp[] = stored ? JSON.parse(stored) : [];
                const index = parsed.findIndex((bm) => bm.id === previousBookmark.id);
                if (index === -1) return;
                const next = [...parsed];
                next[index] = previousBookmark;
                localStorage.setItem('bookmarks', JSON.stringify(next));
                setBookmarks(next);
            });
            setNotification({
                isOpen: true,
                title: "Bookmark Updated",
                description: `${updatedBookmark.title} updated in bookmarks.`,
                variant: "success",
                undoId,
                key: Date.now(),
            });
            setIsModalOpen(false);
            setBookMarkForm({ id: null, title: "", description: "", link: "" });
            setIsEditing(false);
        } else {
            console.log("Bookmark not found");
        }
    };
    
    
    const handleCloseModal = () => {
        if (isEditing) {
            setIsModalOpen(false)
            setIsEditing(false)
            setBookMarkForm({
                id: null,
                title: "",
                description: "",
                link: ""
            })
        } else {
            setIsModalOpen(false)
        }
    }

    return  (
        <div 
            className="py-[5vw] px-[10vw] max-w-[80%] mx-auto"
        >
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
                className="flex justify-between items-center w-full"
            >
                <h1
                    className="text-[3rem] max-md:text-[2rem] font-extrabold text-[var(--text-primary)]"
                >
                    My Bookmarks
                </h1>
                <Button
                    size="md"
                    kind="button"
                    variant="filled"
                    color="accent-blue"
                    onClick={() => setIsModalOpen(true)}
                >
                    Add Bookmark
                </Button>
            </div>
            {loading ? 
                <div className="h1">
                    Loading...
                </div> :
                <div
                    className="mt-6 grid grid-cols-3 gap-6 overflow-y-auto max-h-[80vh]"
                >
                    {Array.isArray(bookmarks) && bookmarks.map((bm, index) => (
                        <BookMarkCard
                            key={index}
                            id={bm.id}
                            title={bm.title}
                            description={bm.description}
                            link={bm.link}
                            handleEdit={() => handleEdit(bm)}
                            handleDelete={() => handleDelete(bm.id)}
                        />
                    ))}
                </div>
            }

            <Modal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
            >
                <Button
                    kind="three-dot"
                    color="accent-blue"
                    size="lg" 
                    variant="filled"
                    onClickDotRed={handleCloseModal}
                    className=""
                >
                </Button>
                <h2 className="h2 text-center text-3xl font-bold mt-2 mb-6">
                    Add BookMark
                </h2>
                <form
                    onSubmit={isEditing ? handleSubmitEdit : handleSubmitForm}
                    className="w-[85%] mx-auto flex flex-col gap-3"    
                >
                    <input 
                        type="text" 
                        onChange={(e) => setBookMarkForm({...bookMarkForm, title: e.target.value})}
                        value={bookMarkForm.title}
                        name="title"
                        placeholder="title"
                        required 
                        className="bg-[var(--bg-control)] py-2.5 px-2.5 rounded-full border border-[var(--accent-gray)] outline-none focus:border-[var(--accent-blue)]"   
                    />
                    <input 
                        type="text" 
                        onChange={(e) => setBookMarkForm({...bookMarkForm, description: e.target.value})}
                        value={bookMarkForm.description}
                        name="description"
                        placeholder="description"
                        className="bg-[var(--bg-control)] py-2.5 px-2.5 rounded-full border border-[var(--accent-gray)] outline-none focus:border-[var(--accent-blue)]"   
                    />
                    <input 
                        type="text" 
                        onChange={(e) => setBookMarkForm({...bookMarkForm, link: e.target.value})}
                        value={bookMarkForm.link}
                        name="link"
                        placeholder="link"
                        required 
                        className="bg-[var(--bg-control)] py-2.5 px-2.5 rounded-full border border-[var(--accent-gray)] outline-none focus:border-[var(--accent-blue)]"   
                    />
                    <div className="w-full flex justify-center gap-2">
                        <Button 
                            htmlType="button" 
                            kind="button" 
                            variant="outline" 
                            color="accent-gray" 
                            size="md" 
                            classname="w-full" 
                            onClick={handleCloseModal}
                            >
                            Close
                        </Button>
                        <Button htmlType="submit" kind="button" variant="filled" color="accent-blue" size="md" classname="w-full">
                            {isEditing ? "edit" : "Add"}
                        </Button>
                    </div>
                </form>
            </Modal>
        </div>
    )
}

export default App;
