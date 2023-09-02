import React from "react";
import '../style/popupView.css';

class PopupView extends React.Component {
    render() {
        let keywordsElement = null;
        let audioAuthorAndDate = "";
        if(this.props.audioInfosPopup.keywords){
            keywordsElement = <div className="popupAudioKeywords">Mots clés : <i>{this.props.audioInfosPopup.keywords.split(" ").map(word => "#"+word).join(" ")}</i></div>;
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