import React from "react";
import Header from "./audioCardComponents/card-header.component";
import Bottom from './audioCardComponents/card-bottom.component';
import Body from "./audioCardComponents/card-body.component";
import CardBottomAdmin from "./audioCardComponents/card-bottom-admin.component";
import '../style/audioCards.css';
import { Moment } from "moment";
import { AudioInfos } from "./model/audio.model";
import { AdvanceSearchFormInput } from "./advance-search.component";
import { AdminLoginInfos } from "./model/admin.model";


type AudioCardProps = {
    elementId: string;
    currentPlayingElementId: string;
    theme: string;
    authorName: string;
    audioDescription: string;
    recordDate: Moment;
    audioUri: string;
    audioHandler: (audioInfos: AudioInfos) => void;
    getDurationDisplay: (duration: number) => string;
    audioInfos: AudioInfos;
    handleEditAudio: (audioInfos: AudioInfos) => void;
    handleDeleteAudio: (elementId: string) => void;
    handleThemeFilterClick: (advanceSearchValues: AdvanceSearchFormInput) => void;
    adminLoginInfos: AdminLoginInfos;
    handleAudioFileDownload: (audioInfos: AudioInfos, callback: (success: boolean) => void) => void;
}

type AudioCardState = {
    durationDisplay: string,
    isAudioLoaded: boolean,
    shouldDisplayAudioDetails: boolean
}

class AudioCard extends React.Component<AudioCardProps, AudioCardState>{
    private audioRef = React.createRef<HTMLAudioElement>();
    constructor(props: AudioCardProps){
        super(props);
        this.state = {
            durationDisplay: "",
            isAudioLoaded: false,
            shouldDisplayAudioDetails: false
        }
        this.toggleAudioDetailsDisplay = this.toggleAudioDetailsDisplay.bind(this);
    }

    handleAudioMetadata = () => {
        this.setState({
            durationDisplay: this.props.getDurationDisplay(this.audioRef.current.duration)
        });
    }

    handleLoadedAudio = () => {
        this.handleAudioMetadata();
        this.setState({isAudioLoaded: true});
    }

    handleClickedCardBody = (audioInfos: AudioInfos): void => {
        if(this.state.isAudioLoaded){
            this.props.audioHandler(audioInfos);
        }
    }

    toggleAudioDetailsDisplay = (): void => {
        this.setState({
            shouldDisplayAudioDetails: !this.state.shouldDisplayAudioDetails
        });
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
                    handleClickedCardBody = {this.handleClickedCardBody}
                    cursorClassName = {cursorClassName}
                    shouldDisplayAudioDetails = {this.state.shouldDisplayAudioDetails}
                    handleAudioFileDownload = {this.props.handleAudioFileDownload}
                    audioInfos = {this.props.audioInfos}
                    />

                <Bottom
                    authorName={this.props.authorName} 
                    recordDateDisplay={this.props.recordDate.toDate().toLocaleDateString('fr-FR')}/>
                
                {
                    this.props.adminLoginInfos?.token?.trim() && 
                    <CardBottomAdmin
                        audioInfos = {this.props.audioInfos}
                        handleEditAudio = {this.props.handleEditAudio}
                        handleDeleteAudio = {this.props.handleDeleteAudio}
                    />
                }
                    
                <audio 
                    ref={this.audioRef}
                    hidden={true}
                    preload="metadata"
                    onLoadedMetadata={ _event => this.handleLoadedAudio()}>
                    <source type="audio/mpeg" src={this.props.audioUri}/>
                    Votre navigateur ne prend pas en charge les audios.
                </audio>
            </div>
        );
    }
}

export default AudioCard;