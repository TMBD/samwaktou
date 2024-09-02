import React from "react";
import { ErrorMessage, InfoMessage } from "../message.component";
import AudioCard from "./audio-card.component";
import AudioPlayerCard from "./audio-player-card.component";
import PopupView from "../popup-view.component";
import { AudioInfos, SerializedAudioInfos, buildAudioInfos, buildAudioInfosArray, buildSerializedAudioInfos } from "../model/audio.model";
import { AnalyticEventsName, initLocalStorageForAnalyticEvents, sendAnalytics } from "../common/analytic-handler";
import { Moment } from "moment";
import { HttpRespTransformer, httpDelete, httpGet } from "../common/http-request-handler";
import { isAdminUser } from "../common/utils/admin-utils";
import { AdminLoginInfos } from "../model/admin.model";
import fileDownload from "js-file-download";
import { Navigate } from "react-router-dom";


type AudiosCardsContainerProps = {
    audioFileIdToPlay: string; //Represents the audioId when the user access a link of a copied audio link
    adminLoginInfos: AdminLoginInfos;
    audioSearchQuery: string;
    handleThemeFilter: (themeSearchInput: {theme: string}) => void;
}

type AudiosCardsContainerState = {
    audioMetadata: AudioInfos,
    audios: AudioInfos[],
    errorMessage: string,
    warningErrorMessage: string, //This can be used to set error messages that shouldn't block the app but can be shown to the user (with popup notifications)
    audioInfosPopup: AudioInfos,
    shouldDisplayAudioInfos: boolean,
    currentPlayingElementId: string,
    searchQuery: string,
    shouldGetAudioResult: boolean,
    isCurrentlyFetchingAudios: boolean,
    audioInfosToUpdate: SerializedAudioInfos,
    showAudioPlayerCard: boolean,
    shouldGoBack: boolean,
    shouldNavigateToCreateAudioPage: boolean
}

const API_SERVER_URL = import.meta.env.VITE_API_SERVER_URL;

class AudiosCardsContainer extends React.Component<AudiosCardsContainerProps, AudiosCardsContainerState>{

    constructor(props: AudiosCardsContainerProps){
        super(props);

        this.state = {
            audioMetadata: null,
            audios: [],
            errorMessage: '',
            warningErrorMessage: '', //This can be used to set error messages that shouldn't block the app but can be shown to the user (with popup notifications)
            audioInfosPopup: null,
            shouldDisplayAudioInfos: false,
            currentPlayingElementId: '',
            searchQuery: '',
            shouldGetAudioResult: false,
            isCurrentlyFetchingAudios: false,
            audioInfosToUpdate: null,
            showAudioPlayerCard: false,
            shouldGoBack: false,
            shouldNavigateToCreateAudioPage: false
        }
        this.audioHandler = this.audioHandler.bind(this);
        this.handleAudioInfoDisplay = this.handleAudioInfoDisplay.bind(this);
        this.changePopupStatus = this.changePopupStatus.bind(this);
        this.handleAudioFileDownload = this.handleAudioFileDownload.bind(this);
    }

    audioHandler(audioInfos: AudioInfos) {
        this.setState({
          audioMetadata: audioInfos,
          showAudioPlayerCard: true,
          currentPlayingElementId: audioInfos.id
        });
        sendAnalytics(AnalyticEventsName.START_LISTENING_AUDIO);
    }

    getDurationDisplay = (duration: number): string => {
        let minutes = Math.floor(duration/60);
        let seconds = Math.floor(duration - minutes*60);
        let minutesToDisplay = minutes >= 10 ? minutes : "0"+minutes;
        let secondsToDisplay = seconds >= 10 ? seconds : "0"+seconds;
        return minutesToDisplay+":"+secondsToDisplay;
    }

    componentDidMount(){
        this.setState({
            errorMessage: ''
        });
        if(!this.props.audioFileIdToPlay){
            this.loadAudiosWithQuery(""); //We shouldn't load audios when the user access a copied audio link
        }
        window.addEventListener('scroll', this.handleScroll);
        window.addEventListener('wheel', this.handleWheelMove);
        this.shouldStartAudio();
        initLocalStorageForAnalyticEvents();
        sendAnalytics(AnalyticEventsName.PAGE_LOAD);
    }

    componentDidUpdate(_: Readonly<AudiosCardsContainerProps>, prevState: Readonly<AudiosCardsContainerState>): void {
        if(this.props.audioSearchQuery !== prevState.searchQuery){
            this.loadAudiosWithQuery(this.props.audioSearchQuery);
        }
    }

    shouldStartAudio(){
        if(!this.props.audioFileIdToPlay) return;
        this.fetchAudioInfo(this.props.audioFileIdToPlay);
    }

    formatDate = (date: Moment) => {
        return date.toDate().toLocaleDateString("fr-FR");
    }

    fetchAudioInfo = (audioId: string) => {
        httpGet<SerializedAudioInfos>('/audios/'+audioId)
        .then(
            (audio: SerializedAudioInfos) => {
                this.setState({
                    audios: [buildAudioInfos(audio)],
                    shouldGetAudioResult: true
                });
            },
            (_: Error) => {
                this.setErrorMessage('Audio introuvable, veuillez vérifier le lien fourni !');
            }
        );
    }

    /**
     * We need to avoid the call of setSate() method in this function as it might lead to an infinite loop.
     * Because this is called from the componentDidUpdate method and that can lead to an endless component re-creation.
     * Use the {@ref this.reloadAudiosWithQuery} if you need to set some states
     */
    loadAudiosWithQuery = (audioSearchQuery: string): void => {
        httpGet<SerializedAudioInfos[]>('/audios?'+audioSearchQuery)
        .then(
            (audios: SerializedAudioInfos[]) => {
                this.setState({
                    audios: buildAudioInfosArray(audios),
                    searchQuery: audioSearchQuery,
                    shouldGetAudioResult: true
                });
            },
            (error: Error) => {
                this.setState({
                    audios: []
                });
                this.setErrorMessage(error.message);
            }
        );
    }

    reloadAudiosWithQuery = (audioSearchQuery: string): void =>{
        this.setState({
            shouldGetAudioResult: false,
            errorMessage: ""
        });

        this.loadAudiosWithQuery(audioSearchQuery);
    }

    handleThemeFilterClick = (theme: string): void => {
        this.props.handleThemeFilter({theme: theme});
    }

    getfileName(uri: string): string {
        const splitedFileUri = (uri !== null) ? uri.split("/"):"";
        const fileName = splitedFileUri[splitedFileUri.length-1];
        return API_SERVER_URL+"/audios/file/"+fileName;
    }

    handleAudioInfoDisplay(element: AudioInfos): void {
        this.setState({
            audioInfosPopup: element,
            shouldDisplayAudioInfos: true
        });
    }

    changePopupStatus(visible: boolean){
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

    handleWheelMove = (event: WheelEvent) => {
        if (event.deltaY > 0) {
            const { clientHeight, scrollHeight } = document.documentElement;
            if (scrollHeight <= clientHeight) {
                this.loadNewAudios();
            }
        }
    }

    loadNewAudios = () => {
        if(this.state.isCurrentlyFetchingAudios) return; //we should prevent fetching audio while audios are already being fetched
        if(this.state.audios.length === 0) return; //it is useless to fetch new audios if the list of audio is already empty as it will return nothing
            
            
        this.setState({isCurrentlyFetchingAudios: true})
        let query = this.state.searchQuery;
        let skipQuery = "skip="+this.state.audios.length;

        query = (query?.trim()) ? query+"&"+skipQuery:skipQuery;

        httpGet<SerializedAudioInfos[]>('/audios?'+query)
        .then(
            (audios: SerializedAudioInfos[]) => {
                if(audios?.length > 0){
                    this.setState({
                        audios: this.state.audios.concat(...buildAudioInfosArray(audios))
                    });
                }
            },
            (error: Error) => {
                this.setWarningErrorMessage(error.message);
            }
        )
        .finally(() => {
            this.setState({isCurrentlyFetchingAudios: false});
        });
        
    }

    setErrorMessage = (message : string) => {
        this.setState({
            errorMessage: message
        });
    }

    setWarningErrorMessage = (message : string): void => {
        this.setState({
            warningErrorMessage: message
        });
    }

    handleNavigateToEditAudioPage = (audioInfos: AudioInfos): void => {
        if(!isAdminUser(this.props.adminLoginInfos)){
            window.alert("Vous n'avez pas la permission !");
            return;
        }
        this.setState({shouldNavigateToCreateAudioPage: true, audioInfosToUpdate: buildSerializedAudioInfos(audioInfos)});
    }

    handleDeleteAudio = (elementId: string): void => {
        if(!isAdminUser(this.props.adminLoginInfos)){
            window.alert("Vous n'avez pas la permission !");
            return;
        }

        httpDelete("/audios/"+elementId, this.props.adminLoginInfos.token)
        .then(
            (_response) => {
                this.setState({audios: this.state.audios.filter(audio => audio.id !== elementId)});
                window.alert("Audio supprimé !");
            },
            (error: Error) => {
                this.setWarningErrorMessage(error.message);
            }
        );
    }

    handleAudioFileDownload = (audioInfos: AudioInfos, callback: (success: boolean) => void): void => {
        const fileKey = audioInfos.uri.split("/").pop();
        const downloadedFileName = this.buildDownloadFileName(audioInfos);

        httpGet<Response>(`/audios/download/${fileKey}`, HttpRespTransformer.NONE)
        .then((response: Response) => {
            return response.blob();
        })
        .then(
            (data: Blob) => {
                fileDownload(data, downloadedFileName);
                sendAnalytics(AnalyticEventsName.AUDIO_DOWNLOADED);
                if (callback) callback(true);
            },
            (_error: Error) => {
                callback(false);
            }
        );
    };

    buildDownloadFileName = (audioInfos: AudioInfos) => {
        return audioInfos.theme.split(" ").join("")
                +"_"+audioInfos.author.split(/\s|\./).join("")
                +"_"+this.formatDate(audioInfos.date).split("/").join("")+".mp3";
    }



    render(){
        return (
            <div className="audioCardContainer"> 
                {
                    this.state.errorMessage && 
                    <ErrorMessage
                        messageText = {this.state.errorMessage}
                    />
                }
                {
                    !this.state.errorMessage && this.state.audios.length <= 0 && this.state.shouldGetAudioResult && 
                    <InfoMessage
                        messageText = "Aucun resultat ne correspond à votre recherche..."
                    />
                }
                {
                    this.state.shouldNavigateToCreateAudioPage &&
                    <Navigate 
                        replace={false}
                        to={import.meta.env.VITE_CREATE_AUDIO_PATH}
                        state={{adminLoginInfos: this.props.adminLoginInfos, serializedAudioInfos: this.state.audioInfosToUpdate}}/>
                }
                {
                    !this.state.errorMessage && 
                    this.state.audios.map(
                        element => 
                            <AudioCard
                                key = {element.id}
                                elementId = {element.id}
                                currentPlayingElementId = {this.state.currentPlayingElementId}
                                theme = {element.theme}
                                authorName = {element.author}
                                audioDescription = {element.description}
                                recordDate = {element.date}
                                audioUri = {this.getfileName(element.uri)}
                                audioHandler = {this.audioHandler}
                                getDurationDisplay = {this.getDurationDisplay}
                                audioInfos = {element}
                                handleNavigateToEditAudioPage = {this.handleNavigateToEditAudioPage}
                                handleDeleteAudio = {this.handleDeleteAudio}
                                handleThemeFilterClick = {this.handleThemeFilterClick}
                                adminLoginInfos = {this.props.adminLoginInfos}
                                handleAudioFileDownload = {this.handleAudioFileDownload}
                                />
                )}

                {
                    !!this.state.audioMetadata &&
                    <AudioPlayerCard
                        audioMetadata = {this.state.audioMetadata}
                        showAudioPlayerCard = {this.state.showAudioPlayerCard}
                        getDurationDisplay = {this.getDurationDisplay}
                        handleAudioInfoDisplay = {this.handleAudioInfoDisplay}
                        handleThemeFilterClick = {this.handleThemeFilterClick}/>
                }

                {
                    this.state.shouldDisplayAudioInfos && 
                    <PopupView
                        audioInfos = {this.state.audioInfosPopup}
                        shouldDisplayAudioInfos = {this.state.shouldDisplayAudioInfos}
                        changePopupStatus = {this.changePopupStatus}
                        handleAudioFileDownload = {this.handleAudioFileDownload}
                    />
                }

            </div>
        );
    };

}

export default AudiosCardsContainer;