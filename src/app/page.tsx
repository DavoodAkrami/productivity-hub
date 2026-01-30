"use client"
import { useEffect, useState } from "react";
import BookMarkCard from "@/components/BookMarkdCard";
import { bookmarkProp } from "@/components/BookMarkdCard";
import Button from "@/components/Buttons";
import Modal from "@/components/Modal";


const App = () => {
    const [loading, setloading] = useState<boolean>(false);
    const [error, setError] = useState<null | string>(null);
    const [bookmarks, setBookmarks] = useState<bookmarkProp[] | null>([]);
    const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
    const [isEditing, setIsEditing] = useState<boolean>(false);
    const [isDeleteModalopen, setIsdeleteModalOpen] = useState<boolean>(false);
    const [deleteBookMark, setDeleteBookMark] = useState<string>(""); 

    const [bookMarkForm, setBookMarkForm] = useState<bookmarkProp>({
        id: null,
        title: "",
        description: "",
        link: ""
    })

    const getItems = () => {
        setloading(true);
        try {
            const stored = localStorage.getItem('bookmarks');
            if (stored) {
                const parsed = JSON.parse(stored);
                if (Array.isArray(parsed)) {
                    setBookmarks(parsed as bookmarkProp[]);
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

    const handleSubmitForm = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        const newBookmark: bookmarkProp = {
            id: Math.random(),
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
        setIsModalOpen(false);
        setBookMarkForm({id: null , title: "", description: "", link: "" });
    }



    const handleDelete = (id: number | null) => {
        const existing: bookmarkProp[] = [...(bookmarks ?? [])];
        const indexTodelete = existing.findIndex(bm => bm.id === id);
        
        if(indexTodelete !== -1){
            existing.splice(indexTodelete, 1);
            localStorage.setItem('bookmarks', JSON.stringify(existing));
            setBookmarks(existing); 
            setIsdeleteModalOpen(false);
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
            existing[indexToUpdate] = updatedBookmark;
            localStorage.setItem('bookmarks', JSON.stringify(existing));
            setBookmarks(existing);
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