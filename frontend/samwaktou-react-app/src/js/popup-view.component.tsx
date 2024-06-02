import React from "react";
import '../style/popupView.css';
import {OptionsBar} from "./options-bar.component";
import {AudioKeywords} from "./audio-keywords.component";
import { AudioInfos } from "./model/audio.model";

type PopupViewProps = {
    audioInfos: AudioInfos;
    shouldDisplayAudioInfos: boolean;
    changePopupStatus: (visible: boolean) => void;
    handleAudioFileDownload: (audioInfos: AudioInfos, callback: (success: boolean) => void) => void;
}

class PopupView extends React.Component<PopupViewProps> {
    render() {
        let keywordsElement = null;
        let audioAuthorAndDate = "";
        if(this.props.audioInfos.keywords){
            keywordsElement = <AudioKeywords keywords = {this.props.audioInfos.keywords}/>
        }
        if(this.props.audioInfos.author){
            audioAuthorAndDate += "Par " + this.props.audioInfos.author;
        }
        if(this.props.audioInfos.date){
            audioAuthorAndDate += (audioAuthorAndDate === "") ? "" : ", ";
            audioAuthorAndDate += "le " + this.props.audioInfos.date.toDate().toLocaleDateString("fr-FR");
        }
        return (
            <div className={"custom-model-main " + (this.props.shouldDisplayAudioInfos ? "model-open" : "")}>
                <div className="custom-model-inner">
                    <div className="close-btn" onClick={() => this.props.changePopupStatus(false)}>×</div>
                    <div className="custom-model-wrap">
                        <div className="pop-up-content-wrap">
                            <div className="popupAudioTheme"><b>{this.props.audioInfos.theme}</b></div>
                            <div className="popupAudioDescription">{this.props.audioInfos.description}</div>
                            {keywordsElement}
                            <OptionsBar
                                handleAudioFileDownload = {this.props.handleAudioFileDownload}
                                audioInfos = {this.props.audioInfos}
                            />
                            <div className="popupAudioAuthorDate"> {audioAuthorAndDate}</div>
                        </div>
                    </div>
                </div>
                <div className="bg-overlay" onClick={() => this.props.changePopupStatus(false)}></div>
            </div>
        );
    }
}

export default PopupView;