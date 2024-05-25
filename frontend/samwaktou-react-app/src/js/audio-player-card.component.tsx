import React from "react";
import Tooltip from '@mui/material/Tooltip';

class AudioPlayerCard extends React.Component{
    constructor(props){
        super(props);
        this.audioRef = React.createRef();
        this.timeSliderRef = React.createRef();
        this.state = {
            audioMetadata: this.props.audioMetadata,
            playing: false,
            audioPlayPauseClassName: "playAudioDraw",
            sliderProgressValue: 0
        }
    }

    audioHandler = (shouldPlay) => {
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

    static getDerivedStateFromProps(props, current_state) {
        let updatedState = {};
        if (current_state.audioMetadata.audioUri !== props.audioMetadata.audioUri
            && props.audioMetadata.audioUri !== null
            && props.audioMetadata.audioUri !== undefined) {
                updatedState =  {
                    playing: true,
                    audioMetadata: props.audioMetadata
                }
        }

        if(props.showAudioPlayerCard){
            updatedState.displayAudioPlayer = true;
        }
        return updatedState === {} ? null : updatedState;
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
        this.timeSliderRef.current.value = (100*this.audioRef.current.currentTime) / this.audioRef.current.duration;
    }

    handleAudioEnded = () => {
        this.audioHandler(false);
        this.setState({
            sliderProgressValue: 100
        });
    }

    sliderChangeSeek = () => {
        if(this.state.audioMetadata.audioUri !== null 
            && this.state.audioMetadata.audioUri !== undefined){
            this.audioRef.current.currentTime = (this.timeSliderRef.current.value * this.audioRef.current.duration) / 100;
        }
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
                            {this.props.audioMetadata.audioDescription}
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
                                hidden="hidden"
                                onLoadedMetadata={event => {
                                    this.handleAudioChange();
                                    if(!this.state.audioMetadata.durationDisplay){
                                        this.setState({
                                            audioMetadata: {...this.state.audioMetadata, durationDisplay: this.props.getDurationDisplay(event.target.duration)}
                                        });
                                    }
                                }}
                                src={this.props.audioMetadata.audioUri}/>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}

export default AudioPlayerCard;