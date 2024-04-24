import React from 'react';
import AudioCard from "./audio-card.component";
import AudioPlayerCard from "./audio-player-card.component";
import PopupView from "./popup-view.component";
import '../style/audioCards.css';
import '../style/common.css';
import SearchBar from './serach-bar.component';
import {ErrorMessage, InfoMessage} from './message.component';
import IconButton from '@mui/material/IconButton';
import AddCircleOutlineOutlinedIcon from '@mui/icons-material/AddCircleOutlineOutlined';
import { Navigate } from "react-router-dom";
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import Tooltip from '@mui/material/Tooltip';
import fileDownload from 'js-file-download';
import moment from 'moment';

class AppBody extends React.Component{
    constructor(props){
        super(props);
        this.state = {
            audioMetadata: {},
            audios: [],
            errorMessage: "",
            audioInfos: {},
            audioInfosPopup: {},
            shouldDisplayAudioInfos: false,
            currentPlayingElementId: "",
            authors: [],
            themes: [],
            searchQuery: "",
            shouldGetAudioResult: false,
            errorObject: null,
            isCurrentlyFetchingAudios: false,
            audioInfosToUpdate: null,
            searchInput: "",
            showAudioPlayerCard: false,
            shouldGoBack: false
        }
        this.audioHandler = this.audioHandler.bind(this);
        this.handleAudioInfoDisplay = this.handleAudioInfoDisplay.bind(this);
        this.changePopupStatus = this.changePopupStatus.bind(this);
        this.handleInputSearchChange = this.handleInputSearchChange.bind(this);
        this.handleThemeFilterClick = this.handleThemeFilterClick.bind(this);
        this.handleAudioFileDownload = this.handleAudioFileDownload.bind(this);
        this.API_SERVER_URL = process.env.REACT_APP_API_SERVER_URL;
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
          currentPlayingElementId: elementId,
          shouldNavigateToCreateAudioPage: false
        });
        this.sendAnalytics("START_LISTENING_AUDIO");
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
        if(!this.props.audioFileIdToPlay) this.loadAudios();
        this.loadAuthors();
        this.loadThemes();
        window.addEventListener('scroll', this.handleScroll);
        window.addEventListener('wheel', this.handleWheelMove);
        this.shouldStartAudio();
        this.initLocalStorage();
        this.sendAnalytics("PAGE_LOAD");
    }

    initLocalStorage = () => {
        const clientId = JSON.parse(localStorage.getItem("clientId"));
        if(!clientId) {
            localStorage.setItem("clientId", JSON.stringify(crypto.randomUUID()));
        }
    }

    sendAnalytics = (eventName) => {
        fetch(this.API_SERVER_URL+"/analytics", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                clientId: JSON.parse(localStorage.getItem("clientId")),
                date: moment.utc(),
                eventName: eventName,
            })
        });
    }

    shouldStartAudio(){
        if(!this.props.audioFileIdToPlay) return;

        this.fetchAudioInfo(this.props.audioFileIdToPlay);

    }

    formatDate = (date) => {
        return new Date(date).toLocaleDateString("fr-FR")
    }

    fetchAudioInfo = (audioId) => {
        fetch(this.API_SERVER_URL+"/audios/"+audioId, {
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
                    audios: [result],
                    shouldGetAudioResult: true
                });
            },
            (error) => {
                this.setErrorMessage(error);
            }
        )
    }

    loadAudios(){
        this.setState({isCurrentlyFetchingAudios: true});
        fetch(this.API_SERVER_URL+"/audios", {
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
        fetch(this.API_SERVER_URL+"/audios/extra/author", {
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
        fetch(this.API_SERVER_URL+"/audios/extra/theme", {
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
        let shouldSearch = false;
        if(advanceSearchValues?.keywords?.trim()){
            query += "keywords="+advanceSearchValues.keywords.trim();
            shouldSearch = advanceSearchValues.keywords.trim().length >= 3
        }
        if(advanceSearchValues?.author?.trim()){
            const authorQuery = "author="+advanceSearchValues.author.trim();
            query += query ? "&"+authorQuery : authorQuery;
            shouldSearch = true;
        }
        if(advanceSearchValues?.theme?.trim()){
            const themeQuery = "theme="+advanceSearchValues.theme.trim();
            query += query ? "&"+themeQuery : themeQuery;
            shouldSearch = true;
        }
        if(advanceSearchValues?.minDate){
            const minDateQuery = "minDate="+advanceSearchValues.minDate.format('DD-MM-YYYY');
            query += query ? "&"+minDateQuery : minDateQuery;
            shouldSearch = true;
        }
        if(advanceSearchValues?.maxDate){
            const maxDateQuery = "maxDate="+advanceSearchValues.maxDate.format('DD-MM-YYYY');
            query += query ? "&"+maxDateQuery : maxDateQuery;
            shouldSearch = true;
        }
        
        if(!shouldSearch && query) return;

        this.setState({
            shouldGetAudioResult: false,
            errorMessage: ""
        });

        fetch(this.API_SERVER_URL+"/audios?"+query, {
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

    handleThemeFilterClick = (advanceSearchValues) => {
        this.setState({
            searchInput: advanceSearchValues
        });
        this.handleInputSearchChange(advanceSearchValues);
    }

    getfileName(uri){
        const splitedFileUri = (uri !== null) ? uri.split("/"):"";
        const fileName = splitedFileUri[splitedFileUri.length-1];
        return this.API_SERVER_URL+"/audios/file/"+fileName;
    }

    handleAudioInfoDisplay(element){
        this.setState({
            audioInfosPopup: element,
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
        if (scrollTop + clientHeight >= scrollHeight - clientHeight) {
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
            fetch(this.API_SERVER_URL+"/audios?"+query, {
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

    handleEditAudio = (audioInfos) => {
        if(!this.isAdminUser()){
            window.alert("Vous n'avez pas la permission !");
            return;
        }
        this.setState({shouldNavigateToCreateAudioPage: true, audioInfosToUpdate: audioInfos});
    }

    handleDeleteAudio = (elementId) => {
        if(!this.isAdminUser()){
            window.alert("Vous n'avez pas la permission !");
            return;
        }
        fetch(this.API_SERVER_URL+"/audios/"+elementId, {
            method: 'DELETE',
            headers: {
                "auth-token": this.props.user.token
            }
        })
        .then(res => {
            if (!res.ok) {
                throw new Error(res.status);
            }
            return res.json();
        })
        .then(
            (result) => {
                this.setState({audios: this.state.audios.filter(audio => audio._id !== elementId)});
                window.alert("Audio supprimé !")
            },
            (error) => {
                let errorMessage = "Une erreur s'est produite. Veuillez réessayer plus tard.";
                if (error instanceof TypeError) {
                    errorMessage = "Erreur réseau. S'il vous plait, vérifiez votre connexion internet.";
                } else if (error instanceof SyntaxError) {
                    errorMessage = "Erreur serveur, données non valides.";
                } else if (error instanceof Error) {
                    if (error?.message === "404") {
                        errorMessage = "Audio introuvable !";
                    } else if (error?.message === "401") {
                        errorMessage = "Accès non autorisé";
                    } else if (error?.message?.charAt(0) === "4") {
                        errorMessage = "La ressource demandée n'a pas été trouvée.";
                    }else if (error?.message === "500") {
                        errorMessage = "Une erreur s'est produite lors de la recherche de l'audio à supprimer dans la base de donnée";
                    } else if (error?.message?.charAt(0) === "5") {
                        errorMessage = "Erreur interne du serveur.";
                    } else {
                        errorMessage = "Une erreur inattendue s'est produite.";
                    }
                }
                this.setState({
                    errorMessage: errorMessage
                });
            }
        );
    }

    navigateToCreateAudioPage = () => {
        if(!this.isAdminUser()){
            window.alert("Vous n'avez pas la permission !");
            return;
        }
        this.setState({shouldNavigateToCreateAudioPage: true, audioMetadataToUpdate: null});
    }

    isAdminUser(){
        return this.props.user?.token?.trim();
    }

    handleAudioFileDownload = (audioInfos, callback) => {
        const fileKey = audioInfos.uri.split("/").pop();
        const downloadedFileName = this.buildDownloadFileName(audioInfos);
        fetch(`${this.API_SERVER_URL}/audios/download/${fileKey}`)
        .then((response) => {
        // Trigger the download by creating a Blob
            return response.blob();
        })
        .then((blob) => {
            fileDownload(blob, downloadedFileName);
            this.sendAnalytics("AUDIO_DOWNLOADED");
            if (callback) callback(true);
        })
        .catch(error => {
            callback(false);
        });
    };

    buildDownloadFileName = (audioInfos) => {
        return audioInfos.theme.split(" ").join("")
                +"_"+audioInfos.authorName.split(/\s|\./).join("")
                +"_"+audioInfos.recordDate.split("/").join("")+".mp3";
    }

    render(){
        return(
            <div className='generalContainer'>
                {
                    ((this.props.provider === "AdminAppProvider" && !this.isAdminUser()) || (this.state.shouldGoBack)) &&
                    <Navigate 
                        replace={true}
                        to="/"
                    />
                }

                {
                    this.props.audioFileIdToPlay &&
                    <div className="backArrowDiv">
                        <Tooltip title="Retourner à la liste des audios">
                            <IconButton
                                size='large'
                                onClick={() => this.setState({shouldGoBack: true})}
                                sx={{color: '#107B7E'}}
                                >
                                <ArrowBackIcon/>
                            </IconButton>
                        </Tooltip>
                    </div>
                }

                {
                    !this.props.audioFileIdToPlay &&
                    <SearchBar
                        handleInputSearchChange = {this.handleInputSearchChange}
                        authors = {this.state.authors}
                        themes = {this.state.themes}
                        searchInput = {this.state.searchInput}
                    />
                }

                
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
                            messageText = "Aucun resultat ne correspond à votre recherche..."
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
                                    recordDate = {this.formatDate(element.date)}
                                    audioUri = {this.getfileName(element.uri)}
                                    audioHandler = {this.audioHandler}
                                    getDurationDisplay = {this.getDurationDisplay}
                                    audioInfos = {element}
                                    handleEditAudio = {this.handleEditAudio}
                                    handleDeleteAudio = {this.handleDeleteAudio}
                                    handleThemeFilterClick = {this.handleThemeFilterClick}
                                    user = {this.props.user}
                                    handleAudioFileDownload = {this.handleAudioFileDownload}
                                    />
                    )}

                    <AudioPlayerCard
                        audioMetadata = {this.state.audioMetadata}
                        getDurationDisplay = {this.getDurationDisplay}
                        showAudioPlayerCard = {this.state.showAudioPlayerCard}
                        audioInfos = {this.state.audioInfos}
                        handleAudioInfoDisplay = {this.handleAudioInfoDisplay}
                        handleThemeFilterClick = {this.handleThemeFilterClick}/>

                    {
                        this.state.shouldDisplayAudioInfos && 
                        <PopupView 
                            audioInfosPopup = {this.state.audioInfosPopup}
                            shouldDisplayAudioInfos = {this.state.shouldDisplayAudioInfos}
                            changePopupStatus = {this.changePopupStatus}
                            handleAudioFileDownload = {this.handleAudioFileDownload}
                        />
                    }

                </div>
                {
                    this.props.user?.token?.trim() && 
                    <div className='addAudioIconContainer'>
                        <IconButton
                            size='large'
                            color='primary'
                            
                            onClick={() => this.navigateToCreateAudioPage()}
                            >
                            <AddCircleOutlineOutlinedIcon />
                        </IconButton>
                    </div>
                }
                
                {
                    this.state.shouldNavigateToCreateAudioPage &&
                    <Navigate 
                        replace={false}
                        to={process.env.REACT_APP_CREATE_AUDIO_PATH}
                        state={{authors: this.state.authors, themes: this.state.themes, user: this.props.user, audioInfos: this.state.audioInfosToUpdate}}/>
                }
            </div>
        );
    }
}

export default AppBody;