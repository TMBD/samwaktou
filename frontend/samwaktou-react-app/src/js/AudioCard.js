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
            recordDate: this.props.recordDate,
            audioInfos: this.props.audioInfos,
            handleAudioInfoDisplay: this.props.handleAudioInfoDisplay
        }
    }

    handleAudioMetadata = (audioMetadata) => {
        this.setState({
            duration: audioMetadata.duration,
            durationDisplay: this.state.getDurationDisplay(audioMetadata.duration)
        });
    }

    handleClickedCardBody = (elementId) => {
        this.state.audioHandler(
            this.state.audioUri, 
            this.state.durationDisplay, 
            this.state.audioDescription, 
            this.state.authorName, 
            this.state.theme,
            this.state.recordDate,
            this.state.audioInfos,
            elementId);
    }

    render(){
        let audioCardOnPlayClassName = "";
        let cursorClassName = "cursorPointer";
        if(this.props.elementId === this.props.currentPlayingElementId){
            audioCardOnPlayClassName = "audioCardOnPlay";
            cursorClassName = "";
        }
        return(
            <div className={"audioCard "+audioCardOnPlayClassName}> 
                
                <Header 
                    theme={this.state.theme} 
                    durationDisplay={this.state.durationDisplay}
                    audioInfos={this.state.audioInfos}
                    handleAudioInfoDisplay = {this.state.handleAudioInfoDisplay}/>

                <Body 
                    audioDescription={this.state.audioDescription}
                    elementId = {this.props.elementId}
                    handleClickedCardBody = {this.handleClickedCardBody}
                    cursorClassName= {cursorClassName}
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