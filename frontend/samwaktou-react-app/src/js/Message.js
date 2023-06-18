function ErrorMessage(props){
    return <span style={{color: "red", marginTop: "20px", fontStyle: "italic"}} >{props.messageText}</span>
}

function InfoMessage(props){
    return <span style={{marginTop: "20px", fontStyle: "italic"}}>{props.messageText}</span>
}

export {
    ErrorMessage,
    InfoMessage
};