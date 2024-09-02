import React from "react";
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

const Body: React.FC<BodyProps> = (props: BodyProps) => {
    const cardAudioDescriptionStartClass = props.shouldDisplayAudioDetails ? "" : "cardAudioDescriptionStart";

    return(
        <div className="audioCardBody">
            <div 
                className={`cardAudioDescriptionContainer ${cardAudioDescriptionStartClass} ${props.cursorClassName}`} 
                onClick={() => props.handleClickedCardBody(props.audioInfos)}>
                {props.audioInfos.description}
            </div>
            {
                props.shouldDisplayAudioDetails && 
                <div>
                    <AudioKeywords keywords = {props.audioInfos.keywords}/>
                    <OptionsBar
                        handleAudioFileDownload = {props.handleAudioFileDownload}
                        audioInfos = {props.audioInfos}
                    />
                </div>
            }
        </div>
    );
}

export default Body;