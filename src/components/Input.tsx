

export interface InputProp extends React.HtmlHTMLAttributes<HTMLInputElement> {
    type: "textarea" | "input";
}
export interface InputType extends React.HtmlHTMLAttributes<HTMLInputElement> {
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