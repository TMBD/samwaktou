import React from "react";
import '../style/popupView.css';
import OptionsBar from "./OptionsBar";
import AudioKeywords from "./AudioKeywords";

class PopupView extends React.Component {
    render() {
        let keywordsElement = null;
        let audioAuthorAndDate = "";
        if(this.props.audioInfosPopup.keywords){
            keywordsElement = <AudioKeywords keywords = {this.props.audioInfosPopup.keywords}/>
        }
        if(this.props.audioInfosPopup.author){
            audioAuthorAndDate += "Par " + this.props.audioInfosPopup.author;
        }
        if(this.props.audioInfosPopup.date){
            audioAuthorAndDate += (audioAuthorAndDate === "") ? "" : ", ";
            audioAuthorAndDate += "le " + new Date(this.props.audioInfosPopup.date).toLocaleDateString("fr-FR");
        }
        return (
            <div className={"custom-model-main " + (this.props.shouldDisplayAudioInfos ? "model-open" : "")}>
                <div className="custom-model-inner">
                    <div className="close-btn" onClick={() => this.props.changePopupStatus(false)}>×</div>
                    <div className="custom-model-wrap">
                        <div className="pop-up-content-wrap">
                            <div className="popupAudioTheme"><b>{this.props.audioInfosPopup.theme}</b></div>
                            <div className="popupAudioDescription">{this.props.audioInfosPopup.description}</div>
                            {keywordsElement}
                            <OptionsBar
                                handleAudioFileDownload = {this.props.handleAudioFileDownload}
                                audioDownloadInfos = {{
                                    uri : this.props.audioInfosPopup.uri,
                                    theme : this.props.audioInfosPopup.theme,
                                    authorName : this.props.audioInfosPopup.author,
                                    recordDate : new Date(this.props.audioInfosPopup.date).toLocaleDateString("fr-FR")
                                }}
                                elementId = {this.props.audioInfosPopup._id}
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