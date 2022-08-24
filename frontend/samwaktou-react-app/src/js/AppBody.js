import React from 'react';
import AudioCard from "./AudioCard";
import AudioPlayerCard from "./AudioPlayerCard";
import '../style/audioCards.css';
// import AudioPlayer from "./AudioPlayer";
// import ReactPlayer from 'react-player/lazy'

class AppBody extends React.Component{
    constructor(props){
        super(props);
        this.state = {
            audioMetadata: {},

            audios: [],
            error: null
        }
        this.player = React.createRef();
        this.audioHandler = this.audioHandler.bind(this)
    }

    audioHandler(
        audioUri, 
        durationDisplay, 
        audioDescription, 
        authorName, 
        theme,
        recordDate) {
        this.setState({
          audioMetadata: {
            audioUri: audioUri,
            durationDisplay: durationDisplay,
            audioDescription: audioDescription,
            authorName: authorName,
            theme: theme,
            recordDate: recordDate
          },
          showAudioPlayerCard: true
        })
      }

      getDurationDisplay = (duration) => {
        let minutes = Math.floor(duration/60);
        let seconds = Math.floor(duration - minutes*60);
        let minutesToDisplay = minutes >= 10 ? minutes : "0"+minutes;
        let secondsToDisplay = seconds >= 10 ? seconds : "0"+seconds;
        return minutesToDisplay+":"+secondsToDisplay;
    }

    componentDidMount(){
        fetch("http://localhost:8080/audios/")
        .then(res => res.json())
        .then(
            (result) => {
                this.setState({
                    audios: result
                });
            },
            (error) => {
                this.setState({
                    error: "Une erreur s'est produite"
                });
            }
        )
    }

    getfileName(uri){
        const splitedFileUri = (uri !== null) ? uri.split("/"):"";
        const fileName = splitedFileUri[splitedFileUri.length-1];
        return "http://localhost:8080/audios/file/"+fileName;
    }

    render(){
        return(
            <div className="audioCardContainer"> 
            {/* <ReactPlayer ref={this.player} onDuration={this.handleDuration} width={0} height={0} url={this.getfileName(this.state.currentAudioUri)} playing={this.state.isAudioPlaying}/> */}
            {/* <ReactPlayer url={"http://localhost:8080/audios/file/62fbde7886125c3e2cd544e5.mp3"} playing={true}/> */}
            {this.state.audios.map(
                element => 
                    <AudioCard 
                        key = {element._id}
                        theme = {element.theme}
                        authorName = {element.author}
                        audioDescription = {element.description}
                        recordDate = {new Date(element.date).toDateString()}
                        audioUri = {this.getfileName(element.uri)}
                        audioHandler = {this.audioHandler}
                        getDurationDisplay = {this.getDurationDisplay}
                    />)}

                {/* <AudioCard time="02:18 " title={this.state.title}/>
                <AudioCard time="05:18 " title={this.state.title}/>
                <AudioCard time="04:18 " title={this.state.title}/>
                <AudioCard time="07:18 " title={this.state.title}/> */}

                <AudioPlayerCard
                    audioMetadata = {this.state.audioMetadata}
                    getDurationDisplay = {this.getDurationDisplay}
                    showAudioPlayerCard = {this.state.showAudioPlayerCard}
                />
            </div>
        );
    }
}

export default AppBody;