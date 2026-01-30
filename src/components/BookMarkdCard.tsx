"use client"
import clsx from "clsx";
import Button from "./Buttons";
import { useRouter } from "next/navigation";


export interface bookmarkProp {
    id: number | null;
    title: string;
    description?: string;
    link: string;
    handleEdit?: () => void;
    handleDelete?: () => void;
}


const BookMarkCard: React.FC<bookmarkProp> = ({id, title, description, link, handleEdit, handleDelete}) => {
    const router = useRouter()
    const handleRouterPush = () => {
        router.push(normalizedLink)
    }

    const normalizedLink = link?.startsWith("http://") || link?.startsWith("https://") ? link : `https://${link}`

    return (
        <div
            className={clsx(
                "bg-[var(--bg-control)]/60 backdrop-blur-xl p-5 rounded-3xl overflow-hidden shadow-xl",
            )}
        >
            <Button 
                size="lg" color="accent-blue" kind="three-dot" variant="filled"
                onClickDotGreen={handleRouterPush}
                onClickDotYellow={handleEdit}
                onClickDotRed={handleDelete}
            />
            <div
                className="mt-3 ml-3"
            >
                <h3
                    className="text-2xl max-md:text-lg"
                >
                    {title}
                </h3>
                <p
                    className="text-[var(--text-secondary)] overflow-hidden"
                >
                    {description}
                </p>
            </div>
        </div>
    )
}


export default BookMarkCard;