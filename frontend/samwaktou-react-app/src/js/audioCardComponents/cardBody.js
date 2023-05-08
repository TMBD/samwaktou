import React from "react";

class Body extends React.Component{
    constructor(props){
        super(props);
        this.state = {
            audioDescription: this.props.audioDescription,
            handleClickedCardBody: this.props.handleClickedCardBody
        }
    }

    render(){
        return(
            <div className="audioCardBody">
                <div className={"cardAudioPlayerContainer " + this.props.cursorClassName} onClick={() => this.props.handleClickedCardBody(this.props.elementId)}>
                    {this.state.audioDescription}
                </div>
            </div>
        );
    }
}


export default Body;