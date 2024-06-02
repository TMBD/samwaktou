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
import moment, { Moment } from 'moment';
import { HttpRespTransformer, httpDelete, httpGet, httpPost } from './common/http-request-handler';
import { AudioInfos, SerializedAudioInfos, buildAudioInfos, buildAudioInfosArray, buildSerializedAudioInfos } from './model/audio.model';
import { AdvanceSearchFormInput } from './advance-search.component';
import { AdminLoginInfos } from './model/admin.model';


type AppBodyProps = {
    audioFileIdToPlay?: string;
    adminLoginInfos?: AdminLoginInfos;
    provider?: 'AdminAppProvider' | 'UserAppProvider' | 'AudioLinkHandlerProvider'
}

type AppBodyState = {
    audioMetadata: AudioInfos,
    audios: AudioInfos[],
    errorMessage: string,
    warningErrorMessage: string, //This can be used to set error messages that shouldn't block the app but can be shown to the user (with popup notifications)
    audioInfos: AudioInfos,
    audioInfosPopup: AudioInfos,
    shouldDisplayAudioInfos: boolean,
    currentPlayingElementId: string,
    authors: string[],
    themes: string[],
    searchQuery: string,
    shouldGetAudioResult: boolean,
    isCurrentlyFetchingAudios: boolean,
    audioInfosToUpdate: SerializedAudioInfos,
    searchInput: AdvanceSearchFormInput,
    showAudioPlayerCard: boolean,
    shouldGoBack: boolean,
    shouldNavigateToCreateAudioPage: boolean,
    // audioMetadataToUpdate: AudioInfos
}

enum EventName {
    PAGE_LOAD,
    START_LISTENING_AUDIO,
    AUDIO_DOWNLOADED
}

const API_SERVER_URL = import.meta.env.VITE_API_SERVER_URL;

class AppBody extends React.Component<AppBodyProps, AppBodyState> {
    constructor(props: AppBodyProps){
        super(props);
        this.state = {
            audioMetadata: null,
            audios: [],
            errorMessage: '',
            warningErrorMessage: '', //This can be used to set error messages that shouldn't block the app but can be shown to the user (with popup notifications)
            audioInfos: null,
            audioInfosPopup: null,
            shouldDisplayAudioInfos: false,
            currentPlayingElementId: '',
            authors: [],
            themes: [],
            searchQuery: '',
            shouldGetAudioResult: false,
            isCurrentlyFetchingAudios: false,
            audioInfosToUpdate: null,
            searchInput: null,
            showAudioPlayerCard: false,
            shouldGoBack: false,
            shouldNavigateToCreateAudioPage: false,
            // audioMetadataToUpdate: null
        }
        this.audioHandler = this.audioHandler.bind(this);
        this.handleAudioInfoDisplay = this.handleAudioInfoDisplay.bind(this);
        this.changePopupStatus = this.changePopupStatus.bind(this);
        this.handleInputSearchChange = this.handleInputSearchChange.bind(this);
        this.handleThemeFilterClick = this.handleThemeFilterClick.bind(this);
        this.handleAudioFileDownload = this.handleAudioFileDownload.bind(this);
    }

    audioHandler(audioInfos: AudioInfos) {
        this.setState({
          audioMetadata: audioInfos,
          showAudioPlayerCard: true,
          audioInfos: audioInfos,
          currentPlayingElementId: audioInfos.id,
          shouldNavigateToCreateAudioPage: false
        });
        this.sendAnalytics(EventName.START_LISTENING_AUDIO);
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
        if(!this.props.audioFileIdToPlay) this.loadAudios();
        this.loadAuthors();
        this.loadThemes();
        window.addEventListener('scroll', this.handleScroll);
        window.addEventListener('wheel', this.handleWheelMove);
        this.shouldStartAudio();
        this.initLocalStorage();
        this.sendAnalytics(EventName.PAGE_LOAD);
    }

    initLocalStorage = () => {
        const clientId: string = JSON.parse(localStorage.getItem("clientId"));
        if(!clientId) {
            localStorage.setItem("clientId", JSON.stringify(crypto.randomUUID()));
        }
    }

    sendAnalytics = (eventName: EventName) => {
        const analyticBody = JSON.stringify({
            clientId: JSON.parse(localStorage.getItem("clientId")),
            date: moment.utc(),
            eventName: eventName,
        });

        httpPost('/analytics', analyticBody);
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
            (error: Error) => {
                this.setErrorMessage(error.message);
            }
        );
    }

    loadAudios(){
        this.setState({isCurrentlyFetchingAudios: true});

        httpGet<SerializedAudioInfos[]>('/audios')
        .then(
            (audios: SerializedAudioInfos[]) => {
                this.setState({
                    audios: buildAudioInfosArray(audios),
                    shouldGetAudioResult: true
                });
            },
            (error: Error) => {
                this.setState({
                    audios: []
                });
                this.setErrorMessage(error.message);
            }
        )
        .finally(() =>
            this.setState({isCurrentlyFetchingAudios: false})
        );
    }

    loadAuthors(){
        httpGet<string[]>('/audios/extra/author')
        .then(
            (result: string[]) => {
                this.setState({
                    authors: result
                });
            },
            (error: Error) => {
                this.setState({
                    authors: []
                });
                this.setWarningErrorMessage(error.message);
            }
        );
    }

    loadThemes(){
        httpGet<string[]>('/audios/extra/theme')
        .then(
            (result: string[]) => {
                this.setState({
                    themes: result
                });
            },
            (error: Error) => {
                this.setState({
                    themes: []
                });
                this.setWarningErrorMessage(error.message);
            }
        );
    }

    handleInputSearchChange = (advanceSearchValues: AdvanceSearchFormInput) => {
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

        httpGet<SerializedAudioInfos[]>('/audios?'+query)
        .then(
            (audios: SerializedAudioInfos[]) => {
                this.setState({
                    audios: buildAudioInfosArray(audios),
                    searchQuery: query,
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

    handleThemeFilterClick = (advanceSearchValues: AdvanceSearchFormInput): void => {
        this.setState({
            searchInput: advanceSearchValues
        });
        this.handleInputSearchChange(advanceSearchValues);
    }

    getfileName(uri: string): string {
        const splitedFileUri = (uri !== null) ? uri.split("/"):"";
        const fileName = splitedFileUri[splitedFileUri.length-1];
        return API_SERVER_URL+"/audios/file/"+fileName;
    }

    handleAudioInfoDisplay(element: AudioInfos): void{
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
        if(!this.state.isCurrentlyFetchingAudios){
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

    handleEditAudio = (audioInfos: AudioInfos): void => {
        if(!this.isAdminUser()){
            window.alert("Vous n'avez pas la permission !");
            return;
        }
        this.setState({shouldNavigateToCreateAudioPage: true, audioInfosToUpdate: buildSerializedAudioInfos(audioInfos)});
    }

    handleDeleteAudio = (elementId: string): void => {
        if(!this.isAdminUser()){
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

    navigateToCreateAudioPage = () => {
        if(!this.isAdminUser()){
            window.alert("Vous n'avez pas la permission !");
            return;
        }
        this.setState({shouldNavigateToCreateAudioPage: true, audioInfosToUpdate: null});
    }

    isAdminUser(){
        return this.props.adminLoginInfos?.token?.trim();
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
                this.sendAnalytics(EventName.AUDIO_DOWNLOADED);
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
                                    handleEditAudio = {this.handleEditAudio}
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
                            audioInfos = {this.state.audioInfos}
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
                {
                    this.props.adminLoginInfos?.token?.trim() && 
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
                        to={import.meta.env.VITE_CREATE_AUDIO_PATH}
                        state={{authors: this.state.authors, themes: this.state.themes, adminLoginInfos: this.props.adminLoginInfos, serializedAudioInfos: this.state.audioInfosToUpdate}}/>
                }
            </div>
        );
    }
}

export default AppBody;