import clsx from "clsx";

type NativeButtonProps = Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "type">;

interface ButtonProps extends NativeButtonProps {
    htmlType?: "button" | "submit" | "reset";
    kind?: "button" | "three-dot";
    variant: "filled" | "outline";
    color: "accent-blue" | "accent-red" | "accent-gray" | "transparent" | 'manual';
    size: "sm" | "md" | "lg" | "manual";
    onClickDotGreen?: () => void;
    onClickDotYellow?: () => void;
    onClickDotRed?: () => void;
    classname?: string;
}


const Button: React.FC<ButtonProps> = ({ htmlType = "button", kind = "button", variant = "filled", color = "accent-blue", size = "md", classname, ...props }) => {
    const sizeClass =
        size === "sm"
            ? "px-5 py-2 text-md"
            : size === "md"
            ? "px-7 py-3 text-lg"
            : size === "lg"
            ? "px-10 py-4 text-xl"
            : ""

    const variantClass =
        variant === "filled"
            ? color === "accent-blue"
                ? "bg-[var(--accent-blue)] text-[var(--text-selected)] hover:bg-[var(--accent-blue)]/60"
                : color === "accent-red"
                ? "bg-[var(--accent-red)] text-[var(--text-selected)] hover:bg-[var(--accent-red)]/60"
                : color === "accent-gray" 
                ? "bg-[var(--accent-gray)] text-[var(--text-selected)] hover:bg-[var(--accent-red)]/60"
                : color === "manual" 
                ? ""
                : "bg-transparent border-2 border-[var(--accent-blue)] text-[var(--text-primary)] hover:border-[var(--accent-blue)]/60"
            : color === "accent-blue"
            ? "bg-transparent border-2 border-[var(--accent-blue)] text-[var(--accent-blue)] hover:border-[var(--accent-blue)]/60"
            : color === "accent-red"
            ? "bg-transparent border-2 border-[var(--accent-red)] text-[var(--accent-red)] hover:border-[var(--accent-red)]/60"
            : color === "accent-gray" 
            ? "bg-transparent border-2 border-[var(--accent-gray)] text-[var(--accent-gray)] hover:border-[var(--accent-gray)]/60"
            : color === "manual" 
            ? ""
            : "bg-transparent border-2 border-[var(--accent-blue)] hover:border-[var(--accent-blue)]/60"

    return (
        <>
            {kind === "button" ? 
                <button 
                    type={htmlType} 
                    className={clsx("cursor-pointer rounded-full transition-colors duration-200", sizeClass, variantClass, classname)}
                    {...props}
                >
                    {props.children}
                </button> : kind === "three-dot" ? 
                <div className={clsx("inline-flex items-center gap-1", props.className)} role="group" aria-label="window controls">
                    <button
                        type="button"
                        onClick={props.onClickDotRed}
                        className={clsx(
                            "rounded-full cursor-pointer transition-colors duration-200",
                            size === "sm" ? "w-2.5 h-2.5" : size === "md" ? "w-3 h-3" : "w-3.5 h-3.5",
                            "bg-[var(--accent-red)]/80 hover:bg-[var(--accent-red)]"
                        )}
                        aria-label="dot-red"
                    />
                    <button
                        type="button"
                        onClick={props.onClickDotYellow}
                        className={clsx(
                            "rounded-full cursor-pointer transition-colors duration-200",
                            size === "sm" ? "w-2.5 h-2.5" : size === "md" ? "w-3 h-3" : "w-3.5 h-3.5",
                            "bg-[var(--accent-yellow)]/80 hover:bg-[var(--accent-yellow)]"
                        )}
                        aria-label="dot-yellow"
                    />
                    <button
                        type="button"
                        onClick={props.onClickDotGreen}
                        className={clsx(
                            "rounded-full cursor-pointer transition-colors duration-200",
                            size === "sm" ? "w-2.5 h-2.5" : size === "md" ? "w-3 h-3" : "w-3.5 h-3.5",
                            "bg-[var(--accent-green)]/80 hover:bg-[var(--accent-green)]"
                        )}
                        aria-label="dot-green"
                    />
                </div> : 
                null
            }
        </>
    )
}

export default Button