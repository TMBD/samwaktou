import React from "react";
import Tooltip from '@mui/material/Tooltip';
import _ from 'lodash';
import { AudioInfos } from "./model/audio.model";
import { AdvanceSearchFormInput } from "./advance-search.component";

type AudioPlayerCardProps = {
    audioMetadata?: AudioInfos;
    showAudioPlayerCard?: boolean;
    audioInfos?: AudioInfos;
    getDurationDisplay?: (duration: number) => string;
    handleAudioInfoDisplay?: (element: AudioInfos) => void;
    handleThemeFilterClick?: (advanceSearchValues: AdvanceSearchFormInput) => void;

}

type AudioPlayerCardState = {
    audioMetadata?: AudioInfos;
    playing?: boolean;
    audioPlayPauseClassName?: 'playAudioDraw' | 'pauseAudioDraw';
    sliderProgressValue?: number;
    displayAudioPlayer?: boolean;
    currentTimeDisplay?: string;
}

const API_SERVER_URL = import.meta.env.VITE_API_SERVER_URL;

class AudioPlayerCard 
    extends React.Component<AudioPlayerCardProps, AudioPlayerCardState>{
    private audioRef = React.createRef<HTMLAudioElement>();
    private timeSliderRef = React.createRef<HTMLInputElement>();
    constructor(props: AudioPlayerCardProps){
        super(props);
        this.state = {
            audioMetadata: this.props.audioMetadata,
            playing: false,
            audioPlayPauseClassName: "playAudioDraw",
            sliderProgressValue: 0,
            displayAudioPlayer: false,
            currentTimeDisplay: ''
        }
    }

    audioHandler = (shouldPlay: boolean) => {
        if(shouldPlay){
            this.audioRef.current.play();
            this.setState({
                playing: true
            }, () => this.handlePlayPauseIcon());
        } 
        else {
            this.audioRef.current.pause();
            this.setState({
                playing: false
            }, () => this.handlePlayPauseIcon());
        }
    }

    static getDerivedStateFromProps(
        props: AudioPlayerCardProps, current_state: AudioPlayerCardState) {
        let updatedState: AudioPlayerCardState = {};
        if (!!props.audioMetadata.uri &&
            current_state.audioMetadata.uri !== props.audioMetadata.uri) {
                updatedState =  {
                    playing: true,
                    audioMetadata: props.audioMetadata
                }
        }

        if(props.showAudioPlayerCard){
            updatedState.displayAudioPlayer = true;
        }
        //to be double checked
        return _.isEmpty(updatedState) ? null : updatedState;
    }

    handleAudioChange = () => {
        this.audioHandler(true);
    }
    
    handlePlayPauseIcon = (playing = this.state.playing) => {
        if(playing){
            this.setState({
                audioPlayPauseClassName: "pauseAudioDraw"
            });
        }else{
            this.setState({
                audioPlayPauseClassName: "playAudioDraw"
            });
        }
    }
    
    handleTimelineUpdate = () => {
        this.setState({
            currentTimeDisplay: this.props.getDurationDisplay(this.audioRef.current.currentTime),
            sliderProgressValue: (100*this.audioRef.current.currentTime) / this.audioRef.current.duration
        });
        this.timeSliderRef.current.value = ''+((100*this.audioRef.current.currentTime) / this.audioRef.current.duration);
    }

    handleAudioEnded = () => {
        this.audioHandler(false);
        this.setState({
            sliderProgressValue: 100
        });
    }

    sliderChangeSeek = () => {
        if(this.state.audioMetadata.uri !== null 
            && this.state.audioMetadata.uri !== undefined){
            this.audioRef.current.currentTime = (+this.timeSliderRef.current.value * this.audioRef.current.duration) / 100;
        }
    }

    getAudioSrc(uri: string): string {
        const splitedFileUri = (uri !== null) ? uri.split("/"):"";
        const fileName = splitedFileUri[splitedFileUri.length-1];
        return API_SERVER_URL+"/audios/file/"+fileName;
    }

    componentDidMount = () => {
        this.audioRef.current.ontimeupdate = this.handleTimelineUpdate;
        this.audioRef.current.onended = this.handleAudioEnded;
        this.setState({
            displayAudioPlayer: false
        });
    }

    render(){
        return(
            <div className={"audioPlayerCardContainer " + (this.state.displayAudioPlayer ? "showElementClassName":"hideElementClassName")}>
                <div className="audioPlayerCard">
                    <div className="audioPlayerCard-header">
                        <div className="audioPlayerCard-cardTheme" onClick={() => this.props.handleThemeFilterClick({theme: this.props.audioMetadata.theme})}>
                            {this.props.audioMetadata.theme}
                        </div>
                        <Tooltip title="Voir les détails">
                            <div className="cardHelp" onClick={() => this.props.handleAudioInfoDisplay(this.props.audioInfos)}>
                                i
                            </div>
                        </Tooltip>
                    </div>

                    <div className="audioPlayerCard-body">
                        <div className="audioPlayerCard-titleContainer">
                            {this.props.audioMetadata.description}
                        </div>
                        
                        <div className="audioPlayerCard-playerContainer">
                            {this.state.currentTimeDisplay||"00:00"}/{this.state.audioMetadata.durationDisplay||"00:00"}
                            <input 
                                ref = {this.timeSliderRef} 
                                type = "range" 
                                min = "0" 
                                max = "100" 
                                value = {this.state.sliderProgressValue ? this.state.sliderProgressValue.toString() : "0"}
                                className = "slider"
                                onChange={this.sliderChangeSeek}/>
                            <div 
                                className={this.state.audioPlayPauseClassName} 
                                onClick={() => this.audioHandler(!this.state.playing)}/>
                            <audio 
                                ref={this.audioRef}
                                hidden={true}
                                onLoadedMetadata={_event => {
                                    this.handleAudioChange();
                                    if(!this.state.audioMetadata.durationDisplay){
                                        this.setState({
                                            audioMetadata: {...this.state.audioMetadata, durationDisplay: this.props.getDurationDisplay(this.audioRef.current.duration)}
                                        });
                                    }
                                }}
                                src={this.getAudioSrc(this.props.audioMetadata.uri)}/>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}

export default AudioPlayerCard;