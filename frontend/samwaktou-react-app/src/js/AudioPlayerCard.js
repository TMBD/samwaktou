import React from "react";

class AudioPlayerCard extends React.Component{
    constructor(props){
        super(props);
        this.audioRef = React.createRef();
        this.timeSliderRef = React.createRef();
        this.state = {
            audioMetadata: this.props.audioMetadata,
            getDurationDisplay: this.props.getDurationDisplay,
            playing: false,
            audioPlayPauseClassName: "playAudioDraw"
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

    handleAudioChange = (audioMetadata) => {
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
            currentTimeDisplay: this.state.getDurationDisplay(this.audioRef.current.currentTime)
        });
        this.timeSliderRef.current.value = (100*this.audioRef.current.currentTime) / this.audioRef.current.duration;
    }

    handleAudioEnded = () => {
        this.audioHandler(false);
        this.timeSliderRef.current.value = 100;
    }

    sliderChangeSeek = () => {
        if(this.state.audioMetadata.audioUri !== null 
            && this.state.audioMetadata.audioUri !== undefined){
            const time = (this.timeSliderRef.current.value * this.audioRef.current.duration) / 100;
            this.audioRef.current.currentTime = time;
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
            <div className={"audioPlayerCard "+ (this.state.displayAudioPlayer ? "showElementClassName":"hideElementClassName")}>
                <div className="audioPlayerCard-header">
                    <div className="audioPlayerCard-cardTheme">
                        {this.props.audioMetadata.theme}
                    </div>
                    <div className="cardHelp">
                        i
                    </div>
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
                            value = "0" 
                            className = "slider"
                            onChange={this.sliderChangeSeek}/>
                        <div 
                            className={this.state.audioPlayPauseClassName} 
                            onClick={() => this.audioHandler(!this.state.playing)}/>
                    
                        <audio 
                            ref={this.audioRef}
                            hidden="hidden"
                            onLoadedMetadata={event => this.handleAudioChange(event.target)}
                            src={this.props.audioMetadata.audioUri}/>
                    
                    </div>

                </div>

            </div>
        );
    }
}


export default AudioPlayerCard;