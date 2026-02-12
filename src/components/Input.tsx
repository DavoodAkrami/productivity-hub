

export interface InputProp extends React.HtmlHTMLAttributes<HTMLInputElement> {
    type: "textarea" | "input";
}

const Input: React.FC<InputProp> = ({ type="input" }) => {
    return (
        type === "input" && 
            <input
                type="text" 
                className="bg-[var(--bg-control)] w-full"
                
            />
    ) 
}

export default Input;
