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
                {/* <div className="cardTitleContainer">
                    {this.state.durationDisplay}
                </div> */}
                
                {/* <div className="cardAudioPlayerContainer">
                    {this.state.heure}  
                    <input type="range" min="0" className="slider"/>
                    <div className="playAudioDraw" onClick={() => this.props.audioHandler(this.state.audioUri, true)}></div>
                    <div className="stopAudioDraw" onClick={() => this.props.audioHandler(this.state.audioUri, null)}></div>
                    <div className="pauseAudioDraw" onClick={() => this.props.audioHandler(this.state.audioUri, false)}></div>
                </div> */}

                <div className="cardAudioPlayerContainer" onClick={() => this.props.handleClickedCardBody()}>
                    {this.state.audioDescription}
                </div>

                {/* <audio 
                    hidden="hidden"
                    onLoadedMetadata={event => this.handleAudioMetadata(event.target)}>
                    <source preload="metadata" type="audio/mpeg" src={this.state.audioUri}/>
                </audio> */}
                {/* <ReactPlayer url='http://localhost:8080/audios/file/62fbde7886125c3e2cd544e5.mp3' playing={false}/> */}
            </div>
        );
    }
}


export default Body;