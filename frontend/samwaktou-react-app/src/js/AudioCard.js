import React from "react";
import Header from "./audioCardComponents/cardHeader";
import Bottom from './audioCardComponents/cardBottom';
import Body from "./audioCardComponents/cardBody";
import '../style/audioCards.css';

class AudioCard extends React.Component{
    constructor( props ){
        super(props);
        this.state = {
            audioUri: this.props.audioUri,
            audioDescription: this.props.audioDescription,
            theme: this.props.theme,
            audioHandler: this.props.audioHandler,
            getDurationDisplay: this.props.getDurationDisplay,
            authorName: this.props.authorName,
            recordDate: this.props.recordDate
        }
    }

    handleAudioMetadata = (audioMetadata) => {
        this.setState({
            duration: audioMetadata.duration,
            durationDisplay: this.state.getDurationDisplay(audioMetadata.duration)
        });
    }

    // getDurationDisplay = (duration) => {
    //     let minutes = Math.floor(duration/60);
    //     let seconds = Math.floor(duration - minutes*60);
    //     let minutesToDisplay = minutes > 10 ? minutes : "0"+minutes;
    //     let secondsToDisplay = seconds > 10 ? seconds : "0"+seconds;
    //     return minutesToDisplay+":"+secondsToDisplay;
    // }

    handleClickedCardBody = () => {
        this.state.audioHandler(
            this.state.audioUri, 
            this.state.durationDisplay, 
            this.state.audioDescription, 
            this.state.authorName, 
            this.state.theme,
            this.state.recordDate)
    }

    render(){
        return(
            <div className="audioCard"> 
                
                <Header 
                    theme={this.state.theme} 
                    durationDisplay={this.state.durationDisplay}/>

                <Body 
                    audioDescription={this.state.audioDescription}
                    handleClickedCardBody = {this.handleClickedCardBody}
                    />

                <Bottom 
                    authorName={this.state.authorName} 
                    recordDate={this.state.recordDate}/>
                    
                <audio 
                    hidden="hidden"
                    onLoadedMetadata={event => this.handleAudioMetadata(event.target)}>
                    <source preload="metadata" type="audio/mpeg" src={this.state.audioUri}/>
                </audio>
                
            </div>
        );
    }
}

export default AudioCard;