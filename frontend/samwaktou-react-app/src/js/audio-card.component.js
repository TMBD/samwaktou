import React from "react";
import Header from "./audioCardComponents/card-header.component";
import Bottom from './audioCardComponents/card-bottom.component';
import Body from "./audioCardComponents/card-body.component";
import CardBottomAdmin from "./audioCardComponents/card-bottom-admin.component";
import '../style/audioCards.css';

class AudioCard extends React.Component{
    constructor( props ){
        super(props);
        this.state = {
            durationDisplay: "",
            isAudioLoaded: false,
            shouldDisplayAudioDetails: false
        }
        this.toggleAudioDetailsDisplay = this.toggleAudioDetailsDisplay.bind(this);
    }

    handleAudioMetadata = (audioMetadata) => {
        this.setState({
            durationDisplay: this.props.getDurationDisplay(audioMetadata.duration)
        });
    }

    handleLoadedAudio = (audioMetadata) => {
        this.handleAudioMetadata(audioMetadata);
        this.setState({isAudioLoaded: true});
    }

    handleClickedCardBody = (elementId) => {
        if(this.state.isAudioLoaded){
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
        
    }

    toggleAudioDetailsDisplay(){
        this.setState({shouldDisplayAudioDetails: !this.state.shouldDisplayAudioDetails});
    }

    render(){
        let audioCardOnPlayClassName = "";
        let isOnPlay = false;
        let cursorClassName = "cursorWait";
        let audioLoadStateClassName = "audioCardLoading";
        if(this.state.isAudioLoaded){
            audioLoadStateClassName = "audioCardLoaded";
            cursorClassName = "cursorPointer";
            if(this.props.elementId === this.props.currentPlayingElementId){
                isOnPlay = true;
                audioCardOnPlayClassName = "audioCardOnPlay";
                cursorClassName = "";
            }
        }
        return(
            <div className={"audioCard "+audioCardOnPlayClassName+" "+audioLoadStateClassName}> 
                <Header 
                    theme={this.props.theme} 
                    durationDisplay={this.state.durationDisplay}
                    toggleAudioDetailsDisplay = {this.toggleAudioDetailsDisplay}
                    handleThemeFilterClick={this.props.handleThemeFilterClick}
                    isOnPlay = {isOnPlay}
                    shouldDisplayAudioDetails = {this.state.shouldDisplayAudioDetails}
                    />

                <Body 
                    audioDescription={this.props.audioDescription}
                    elementId = {this.props.elementId}
                    handleClickedCardBody = {this.handleClickedCardBody}
                    cursorClassName = {cursorClassName}
                    shouldDisplayAudioDetails = {this.state.shouldDisplayAudioDetails}
                    handleAudioFileDownload = {this.props.handleAudioFileDownload}
                    audioDownloadInfos = {{
                        uri : this.props.audioInfos.uri,
                        theme : this.props.theme,
                        authorName : this.props.authorName,
                        recordDate : this.props.recordDate
                    }}
                    fullAudioUrl = {this.props.audioUri}
                    keywords = {this.props.audioInfos.keywords}
                    />

                <Bottom 
                    authorName={this.props.authorName} 
                    recordDate={this.props.recordDate}/>
                
                {
                    this.props.user?.token?.trim() && 
                    <CardBottomAdmin
                        audioInfos = {this.props.audioInfos}
                        handleEditAudio = {this.props.handleEditAudio}
                        handleDeleteAudio = {this.props.handleDeleteAudio}
                    />
                } 
                    
                <audio 
                    hidden="hidden"
                    onLoadedMetadata={event => this.handleLoadedAudio(event.target)}>
                    <source preload="metadata" type="audio/mpeg" src={this.props.audioUri}/>
                </audio>
            </div>
        );
    }
}

export default AudioCard;