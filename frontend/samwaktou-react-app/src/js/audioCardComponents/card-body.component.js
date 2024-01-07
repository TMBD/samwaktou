import React from "react";
import OptionsBar from "../options-bar.component";
import AudioKeywords from "../audio-keywords.component";

class Body extends React.Component{
    render(){
        let cardAudioDescriptionStartClass = "cardAudioDescriptionStart";
        let detailsElements = "";
        if(this.props.shouldDisplayAudioDetails){
            cardAudioDescriptionStartClass = "";
            detailsElements = 
            <div> 
                <AudioKeywords keywords = {this.props.keywords}/>
                <OptionsBar
                    handleAudioFileDownload = {this.props.handleAudioFileDownload}
                    audioDownloadInfos = {this.props.audioDownloadInfos}
                    elementId = {this.props.elementId}
                />
            </div>
        }
        return(
            <div className="audioCardBody">
                <div 
                    className={"cardAudioDescriptionContainer " + cardAudioDescriptionStartClass + " " + this.props.cursorClassName} 
                    onClick={() => this.props.handleClickedCardBody(this.props.elementId)}>
                    {this.props.audioDescription}
                </div>
                {detailsElements}
            </div>
        );
    }
}

export default Body;