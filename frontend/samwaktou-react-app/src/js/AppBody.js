import React from 'react';
import AudioCard from "./AudioCard";
import AudioPlayerCard from "./AudioPlayerCard";
import PopupView from "./PopupView";
import '../style/audioCards.css';
import '../style/common.css';
import SearchBar from './SerachBar';
import {ErrorMessage, InfoMessage} from './Message';

class AppBody extends React.Component{
    constructor(props){
        super(props);
        this.state = {
            audioMetadata: {},
            audios: [],
            errorMessage: "",
            audioInfos: {},
            shouldDisplayAudioInfos: false,
            currentPlayingElementId: "",
            authors: [],
            themes: [],
            searchQuery: "",
            shouldGetAudioResult: false,
            errorObject: null,
            isCurrentlyFetchingAudios: false
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
        this.setState({
            errorMessage: ""
        });
        this.loadAudios();
        this.loadAuthors();
        this.loadThemes();
        window.addEventListener('scroll', this.handleScroll);
        window.addEventListener('wheel', this.handleWheelMove);
    }

    loadAudios(){
        this.setState({isCurrentlyFetchingAudios: true});
        fetch("http://localhost:8080/audios", {
            method: "GET"
        })
        .then(res => {
            if (!res.ok) {
                throw new Error(res.status);
            }
            return res.json();
        })
        .then(
            (result) => {
                this.setState({
                    audios: result,
                    shouldGetAudioResult: true
                });
            },
            (error) => {
                this.setState({
                    audios: []
                });
                this.setErrorMessage(error);
            }
        )
        .finally(() =>
            this.setState({isCurrentlyFetchingAudios: false})
        );
    }

    loadAuthors(){
        fetch("http://localhost:8080/audios/extra/author", {
            method: "GET"
        })
        .then(res => {
            if (!res.ok) {
                throw new Error(res.status);
            }
            return res.json();
        })
        .then(
            (result) => {
                this.setState({
                    authors: result
                });
            },
            (error) => {
                this.setState({
                    authors: []
                });
                this.setErrorMessage(error);
            }
        );
    }

    loadThemes(){
        fetch("http://localhost:8080/audios/extra/theme", {
            method: "GET"
        })
        .then(res => {
            if (!res.ok) {
                throw new Error(res.status);
            }
            return res.json();
        })
        .then(
            (result) => {
                this.setState({
                    themes: result
                });
            },
            (error) => {
                this.setState({
                    themes: []
                });
                this.setErrorMessage(error);
            }
        );
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

        this.setState({
            shouldGetAudioResult: false,
            errorMessage: ""
        });

        fetch("http://localhost:8080/audios?"+query, {
            method: 'GET',
            headers: {
                "Content-Type": "application/json"
            },
        })
        .then(res => {
            if (!res.ok) {
                throw new Error(res.status);
            }
            return res.json();
        })
        .then(
            (result) => {
                this.setState({
                    audios: result,
                    searchQuery: query,
                    shouldGetAudioResult: true
                });
            },
            (error) => {
                this.setState({
                    audios: []
                });
                this.setErrorMessage(error);
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

    handleScroll = () => {
        const { scrollTop, clientHeight, scrollHeight } = document.documentElement;
        if (scrollTop + clientHeight >= scrollHeight) {
            this.loadNewAudios();
        }
    }

    handleWheelMove = (event) => {
        if (event.deltaY > 0) {
            const { clientHeight, scrollHeight } = document.documentElement;
            if (scrollHeight <= clientHeight) {
                this.loadNewAudios();
            }
        }
    }

    loadNewAudios = () => {
        if(!this.state.isCurrentlyFetchingAudios){
            this.setState({isCurrentlyFetchingAudios: true})
            let query = this.state.searchQuery;
            let skipQuery = "skip="+this.state.audios.length;

            query = (query?.trim()) ? query+"&"+skipQuery:skipQuery;

            this.setState({
                errorMessage: ""
            });
            fetch("http://localhost:8080/audios?"+query, {
                method: 'GET',
                headers: {
                    "Content-Type": "application/json"
                },
            })
            .then(res => {
                if (!res.ok) {
                    throw new Error(res.status);
                }
                return res.json();
            })
            .then(
                (result) => {
                    if(result.length > 0){
                        this.setState({
                            audios: this.state.audios.concat(...result)
                        });
                    }
                },
                (error) => {
                    this.setErrorMessage(error);
                }
            )
            .finally(() => {
                this.setState({isCurrentlyFetchingAudios: false});
            });
        }
    }

    setErrorMessage = (error) => {
        let errorMessage = "Une erreur s'est produite. Veuillez réessayer plus tard.";

        if (error instanceof TypeError) {
            errorMessage = "Erreur réseau. S'il vous plait, vérifiez votre connexion internet.";
        } else if (error instanceof SyntaxError) {
            errorMessage = "Erreur serveur, données non valides.";
        } else if (error instanceof Error) {
            if (error?.message?.charAt(0) === "4") {
                errorMessage = "La ressource demandée n'a pas été trouvée.";
            } else if (error?.message === "503") {
                errorMessage = "Service temporairement indisponible.";
            } else if (error?.message?.charAt(0) === "5") {
                errorMessage = "Erreur interne du serveur.";
            } else {
                errorMessage = "Une erreur inattendue s'est produite.";
            }
        }
        this.setState({
            errorMessage: errorMessage,
            errorObject: error
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
                    {
                        this.state.errorMessage && 
                        <ErrorMessage
                            messageText = {this.state.errorMessage.toString()}
                        />
                    }
                    {
                        !this.state.errorMessage && this.state.audios.length <= 0 && this.state.shouldGetAudioResult && 
                        <InfoMessage
                            messageText = "Aucun resultat à afficher..."
                        />
                    }
                    {
                        !this.state.errorMessage && 
                        this.state.audios.map(
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