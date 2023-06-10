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
            error: "",
            audioInfos: {},
            shouldDisplayAudioInfos: false,
            currentPlayingElementId: "",
            authors: [],
            themes: []
        }
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
        this.loadAudios();
        this.loadAuthors();
        this.loadThemes();
    }

    loadAudios(){
        fetch("http://localhost:8080/audios", {
            method: "GET"
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
                    error: "Une erreur s'est produite lors de la recherche des audios"
                });
            }
        )
    }

    loadAuthors(){
        fetch("http://localhost:8080/audios/extra/author", {
            method: "GET"
        })
        .then(res => res.json())
        .then(
            (result) => {
                this.setState({
                    authors: result
                });
            },
            (error) => {
                this.setState({
                    error: "Une erreur s'est produite lors de la recherche de la list des autheurs"
                });
            }
        )
    }

    loadThemes(){
        fetch("http://localhost:8080/audios/extra/theme", {
            method: "GET"
        })
        .then(res => res.json())
        .then(
            (result) => {
                this.setState({
                    themes: result
                });
            },
            (error) => {
                this.setState({
                    error: "Une erreur s'est produite lors de la recherche de la list des themes"
                });
            }
        )
    }

    handleInputSearchChange = (advanceSearchValues) => {
        let query = "";
        if(advanceSearchValues?.keywords?.trim()){
            query += "keywords="+advanceSearchValues.keywords.trim();
        }
        if(advanceSearchValues?.author?.trim()){
            const authorQuery = "author="+advanceSearchValues.author.trim();
            query += query ? "&"+authorQuery : authorQuery;
        }
        if(advanceSearchValues?.theme?.trim()){
            const themeQuery = "theme="+advanceSearchValues.theme.trim();
            query += query ? "&"+themeQuery : themeQuery;
        }
        if(advanceSearchValues?.minDate){
            const minDateQuery = "minDate="+advanceSearchValues.minDate.format('DD-MM-YYYY');
            query += query ? "&"+minDateQuery : minDateQuery;
        }
        if(advanceSearchValues?.maxDate){
            const maxDateQuery = "maxDate="+advanceSearchValues.maxDate.format('DD-MM-YYYY');
            query += query ? "&"+maxDateQuery : maxDateQuery;
        }

        fetch("http://localhost:8080/audios?"+query, {
            method: 'GET',
            headers: {
                "Content-Type": "application/json"
            },
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
                    authors = {this.state.authors}
                    themes = {this.state.themes}
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