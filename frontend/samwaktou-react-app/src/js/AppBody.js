import React from 'react';
import AudioCard from "./AudioCard";
import AudioPlayerCard from "./AudioPlayerCard";
import PopupView from "./PopupView";
import '../style/audioCards.css';
import '../style/common.css';
import SearchBar from './SerachBar';

class AppBody extends React.Component{
    constructor(props){
        super(props);
        this.state = {
            audioMetadata: {},

            audios: [],
            error: null,
            audioInfos: {},
            shouldDisplayAudioInfos: false,
            currentPlayingElementId: null
        }
        this.player = React.createRef();
        this.audioHandler = this.audioHandler.bind(this);
        this.handleAudioInfoDisplay = this.handleAudioInfoDisplay.bind(this);
        this.changePopupStatus = this.changePopupStatus.bind(this);
        this.handleInputSearchChange = this.handleInputSearchChange.bind(this);
    }

    audioHandler(
        audioUri, 
        durationDisplay, 
        audioDescription, 
        authorName, 
        theme,
        recordDate,
        audioInfos,
        elementId) {
        this.setState({
          audioMetadata: {
            audioUri: audioUri,
            durationDisplay: durationDisplay,
            audioDescription: audioDescription,
            authorName: authorName,
            theme: theme,
            recordDate: recordDate,
          },
          showAudioPlayerCard: true,
          audioInfos: audioInfos,
          currentPlayingElementId: elementId
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
        fetch("http://localhost:8080/audios/filter", {
            method: "POST"
        })
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

    handleInputSearchChange = (searchText) => {
        let keywords = [];
        if(searchText){
            keywords = searchText.split(/,|;| /).filter(word => word);
        }
        
        const data = (keywords.length <= 0) ? {} : {
            "keywordsParams": {
                "keywords": searchText.split(/,|;| /).filter(word => word)
            }
        }
        fetch("http://localhost:8080/audios/filter", {
            method: 'POST',
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(data)
        })
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
        );
    }

    getfileName(uri){
        const splitedFileUri = (uri !== null) ? uri.split("/"):"";
        const fileName = splitedFileUri[splitedFileUri.length-1];
        return "http://localhost:8080/audios/file/"+fileName;
    }

    handleAudioInfoDisplay(element){
        this.setState({
            audioInfos: element,
            shouldDisplayAudioInfos: true
        });
    }

    changePopupStatus(visible){
        this.setState({
            shouldDisplayAudioInfos: visible
        });
    }

    render(){
        return(
            <div className='generalContainer'>
                <SearchBar
                    handleInputSearchChange = {this.handleInputSearchChange}
                />
                <div className="audioCardContainer"> 
                    {this.state.audios.map(
                        element => 
                            <AudioCard 
                                key = {element._id}
                                elementId = {element._id}
                                currentPlayingElementId = {this.state.currentPlayingElementId}
                                theme = {element.theme}
                                authorName = {element.author}
                                audioDescription = {element.description}
                                recordDate = {new Date(element.date).toDateString()}
                                audioUri = {this.getfileName(element.uri)}
                                audioHandler = {this.audioHandler}
                                getDurationDisplay = {this.getDurationDisplay}
                                audioInfos = {element}
                                handleAudioInfoDisplay = {this.handleAudioInfoDisplay}/>
                    )}

                    <AudioPlayerCard
                        audioMetadata = {this.state.audioMetadata}
                        getDurationDisplay = {this.getDurationDisplay}
                        showAudioPlayerCard = {this.state.showAudioPlayerCard}
                        audioInfos = {this.state.audioInfos}
                        handleAudioInfoDisplay = {this.handleAudioInfoDisplay}/>

                    {
                        this.state.shouldDisplayAudioInfos && 
                        <PopupView 
                            audioInfos = {this.state.audioInfos}
                            shouldDisplayAudioInfos = {this.state.shouldDisplayAudioInfos}
                            changePopupStatus = {this.changePopupStatus}/>
                    }

                </div>
            </div>
        );
    }
}

export default AppBody;