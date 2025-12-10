interface Props {
    size?: number;
    className?: string;
}

export const Logo: React.FC<Props> = ({size = 24, className = ''}) => {
    return (
        <img
            src={`${import.meta.env.BASE_URL}icon.svg`}
            alt="ReQuizle"
            width={size}
            height={size}
            className={`rounded-xl ${className}`}
        />
    );
};
