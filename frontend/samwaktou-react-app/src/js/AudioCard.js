import React from "react";
import Header from "./audioCardComponents/cardHeader";
import Bottom from './audioCardComponents/cardBottom';
import Body from "./audioCardComponents/cardBody";
import '../style/audioCards.css';

class AudioCard extends React.Component{
    constructor( props ){
        super(props);
        this.state = {
            durationDisplay: ""
        }
    }

    handleAudioMetadata = (audioMetadata) => {
        this.setState({
            durationDisplay: this.props.getDurationDisplay(audioMetadata.duration)
        });
    }

    handleClickedCardBody = (elementId) => {
        this.props.audioHandler(
            this.props.audioUri, 
            this.state.durationDisplay, 
            this.props.audioDescription, 
            this.props.authorName, 
            this.props.theme,
            this.props.recordDate,
            this.props.audioInfos,
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
                    theme={this.props.theme} 
                    durationDisplay={this.state.durationDisplay}
                    audioInfos={this.props.audioInfos}
                    handleAudioInfoDisplay = {this.props.handleAudioInfoDisplay}/>

                <Body 
                    audioDescription={this.props.audioDescription}
                    elementId = {this.props.elementId}
                    handleClickedCardBody = {this.handleClickedCardBody}
                    cursorClassName= {cursorClassName}
                    />

                <Bottom 
                    authorName={this.props.authorName} 
                    recordDate={this.props.recordDate}/>
                    
                <audio 
                    hidden="hidden"
                    onLoadedMetadata={event => this.handleAudioMetadata(event.target)}>
                    <source preload="metadata" type="audio/mpeg" src={this.props.audioUri}/>
                </audio>
            </div>
        );
    }
}

export default AudioCard;