export const ErrorMessage: React.FC<{messageText: string}> = ({messageText}: {messageText: string}) => {
    return <span style={{color: "red", marginTop: "20px", fontStyle: "italic"}} >{messageText}</span>
}

export const InfoMessage: React.FC<{messageText: string}> = ({messageText}: {messageText: string}) => {
    return <span style={{marginTop: "20px", fontStyle: "italic"}}>{messageText}</span>
}