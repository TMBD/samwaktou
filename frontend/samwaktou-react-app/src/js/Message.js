function ErrorMessage(props){
    return <h4 style={{color: "red"}} >{props.messageText}</h4>
}

function InfoMessage(props){
    return <h4>{props.messageText}</h4>
}

export {
    ErrorMessage,
    InfoMessage
};