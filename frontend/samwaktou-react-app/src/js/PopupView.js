import React from "react";
import '../style/popupView.css';

class PopupView extends React.Component {
    render() {
        let keywordsElement = null;
        let audioAuthorAndDate = "";
        if(this.props.audioInfos.keywords){
            keywordsElement = <div className="popupAudioKeywords"><b>Mots clés</b> : {this.props.audioInfos.keywords.join(", ")}</div>;
        }
        if(this.props.audioInfos.author){
            audioAuthorAndDate += "Par " + this.props.audioInfos.author;
        }
        if(this.props.audioInfos.date){
            audioAuthorAndDate += (audioAuthorAndDate === "") ? "" : ", ";
            audioAuthorAndDate += "le " + new Date(this.props.audioInfos.date).toDateString();
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