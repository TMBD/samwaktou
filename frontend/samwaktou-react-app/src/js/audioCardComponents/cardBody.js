import React from "react";

class Body extends React.Component{
    render(){
        return(
            <div className="audioCardBody">
                <div 
                    className={"cardAudioPlayerContainer " + this.props.cursorClassName} 
                    onClick={() => this.props.handleClickedCardBody(this.props.elementId)}>
                    {this.props.audioDescription}
                </div>
            </div>
        );
    }
}

export default Body;