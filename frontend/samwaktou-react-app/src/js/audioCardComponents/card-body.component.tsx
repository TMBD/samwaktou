import React, { ReactElement } from "react";
import {OptionsBar} from "../options-bar.component";
import {AudioKeywords} from "../audio-keywords.component";
import { AudioInfos } from "../model/audio.model";


type BodyProps = {
    handleClickedCardBody: (audioInfos: AudioInfos) => void;
    cursorClassName: string;
    shouldDisplayAudioDetails: boolean;
    handleAudioFileDownload: (audioInfos: AudioInfos, callback: (success: boolean) => void) => void;
    audioInfos: AudioInfos;
}

class Body extends React.Component<BodyProps>{
    render(){
        let cardAudioDescriptionStartClass = "cardAudioDescriptionStart";
        let detailsElements: ReactElement;
        if(this.props.shouldDisplayAudioDetails){
            cardAudioDescriptionStartClass = "";
            detailsElements = 
            <div>
                <AudioKeywords keywords = {this.props.audioInfos.keywords}/>
                <OptionsBar
                    handleAudioFileDownload = {this.props.handleAudioFileDownload}
                    audioInfos = {this.props.audioInfos}
                />
            </div>
        }
        return(
            <div className="audioCardBody">
                <div 
                    className={"cardAudioDescriptionContainer " + cardAudioDescriptionStartClass + " " + this.props.cursorClassName} 
                    onClick={() => this.props.handleClickedCardBody(this.props.audioInfos)}>
                    {this.props.audioInfos.description}
                </div>
                {detailsElements}
            </div>
        );
    }
}

export default Body;