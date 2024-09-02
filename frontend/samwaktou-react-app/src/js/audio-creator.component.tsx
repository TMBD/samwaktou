import React from "react";
import '../style/audioCreator.css';
import TextField from '@mui/material/TextField';
import { Button } from "@mui/material";
import Autocomplete from '@mui/material/Autocomplete';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterMoment } from '@mui/x-date-pickers/AdapterMoment'
import {ErrorMessage, InfoMessage} from './message.component'
import moment from "moment";
import { Navigate } from "react-router-dom";
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import IconButton from '@mui/material/IconButton';
import { AudioInfos, SerializedAudioInfos, buildAudioInfos } from "./model/audio.model";
import { AdminLoginInfos } from "./model/admin.model";
import { httpPost, httpPut } from "./common/http-request-handler";
import { getAuthors, getThemes } from "./common/utils/http-request-utils";


type AudioCreatorProps = {
    serializedAudioInfos: SerializedAudioInfos; //we need to use the serialized version because the date type (of Moment) is not compatible with react routing
    adminLoginInfos: AdminLoginInfos;
}

type AudioCreatorState = {
    audio: File;
    errorMessageText: string;
    warningMessage: string;
    infoMessageText: string;
    audioInfos: AudioInfos;
    authorsOption: {
        options: string[];
    };
    themesOption: {
        options: string[];
    };
    shouldGoBack: boolean;
    isUpdatingAudio: boolean;
}


class AudioCreator extends React.Component<AudioCreatorProps, AudioCreatorState> {
    constructor( props: AudioCreatorProps ){
        super(props);
        this.state = {
            audio: null,
            errorMessageText: null,
            infoMessageText: null,
            warningMessage: null,
            audioInfos: buildAudioInfos(this.props.serializedAudioInfos),
            authorsOption: {
                options: [],
            },
            themesOption: {
                options: [],
            },
            shouldGoBack: false,
            isUpdatingAudio: !!this.props.serializedAudioInfos
        }
    }

    componentDidMount(): void {
        this.loadAudiosAndAuthors();
    }

    loadAudiosAndAuthors = (): void => {
        getAuthors().then(
            (authors: string[]) => {
                this.setState({
                    authorsOption: {
                        options: authors
                    }
                });
            },
            (error: Error) => {
                this.setState({
                    warningMessage: error.message
                });
            }
        );

        getThemes().then(
            (themes: string[]) => {
                this.setState({
                    themesOption: {
                        options: themes
                    }
                });
            },
            (error: Error) => {
                this.setState({
                    warningMessage: error.message
                });
            }
        );
    }

    cleanFields = (): void => {
        this.setState({
            audio: null,
            audioInfos: {
                ...this.state.audioInfos,
                theme: '',
                description: '',
                keywords: ''
            },
            isUpdatingAudio: false
        });
    }

    updateAndCleanFields = (): void => {
        let authors = this.state.authorsOption.options;
        if(authors.indexOf(this.state.audioInfos.author) === -1) authors.push(this.state.audioInfos.author);

        let themes = this.state.themesOption.options;
        if(themes.indexOf(this.state.audioInfos.theme) === -1) themes.push(this.state.audioInfos.theme);

        this.setState({
            authorsOption: {
                options: authors
            },
            themesOption: {
                options: themes
            }
        });

        this.cleanFields();
    }

    handleAddAudio = (): void => {
        this.setState({errorMessageText: null})
        if(
            !this.state.audioInfos.author?.trim() ||
            !this.state.audioInfos.theme?.trim() ||
            !this.state.audioInfos.description?.trim() ||
            !this.state.audioInfos.keywords?.trim() ||
            !this.state.audioInfos.date || !moment(this.state.audioInfos.date, "DD-MM-YYYY").isValid() ||
            !this.state.audio){
            this.setState({errorMessageText: "Veuillez renseigner correctement tous les champs !"})
            return ;
        }
        this.uploadAudio();
    }

    handleUpdateAudio = (): void => {
        this.setState({errorMessageText: null})
        if(
            !this.state.audioInfos.author?.trim() ||
            !this.state.audioInfos.theme?.trim() ||
            !this.state.audioInfos.description?.trim() ||
            !this.state.audioInfos.keywords?.trim() ||
            !this.state.audioInfos.date || !moment(this.state.audioInfos.date, "DD-MM-YYYY").isValid()){
            this.setState({errorMessageText: "Veuillez renseigner correctement tous les champs !"})
            return ;
        }
        this.updateAudio();
    }

    uploadAudio = (): void => {
        this.setState({
            errorMessageText: ""
        });
        let data = new FormData();
        data.append("author", this.state.audioInfos.author.trim());
        data.append("theme", this.state.audioInfos.theme.trim());
        data.append("description", this.state.audioInfos.description.trim());
        data.append("keywords", this.state.audioInfos.keywords.trim());
        data.append("date", this.state.audioInfos.date.format('DD-MM-YYYY'));
        data.append("audio", this.state.audio);

        httpPost('/audios', data, this.props.adminLoginInfos.token)
        .then(
            (_saveAudioResult) => {
                this.updateAndCleanFields();
                this.setState({infoMessageText: "Audio ajouté avec succès !"});
            },
            (error: Error) => {
                this.setState({
                    errorMessageText: error.message
                });
            }
        );
    }


    updateAudio = (): void => {
        this.setState({
            errorMessageText: ""
        });
        let data = new FormData();
        data.append("author", this.state.audioInfos.author.trim());
        data.append("theme", this.state.audioInfos.theme.trim());
        data.append("description", this.state.audioInfos.description.trim());
        data.append("keywords", this.state.audioInfos.keywords.trim());
        data.append("date", this.state.audioInfos.date.format('DD-MM-YYYY'));

        httpPut('/audios/'+this.state.audioInfos.id, data, this.props.adminLoginInfos.token)
        .then(
            (_updateAudioResult) => {
                this.updateAndCleanFields();
                this.setState({infoMessageText: "Audio mis à jour avec succès !"});
            },
            (error: Error) => {
                this.setState({
                    errorMessageText: error.message
                });
            }
        );
    }

    isAdminUser = (): boolean => {
        return !!this.props.adminLoginInfos?.token?.trim();
    }

    render(){
        return(
            <div>
                {
                    !this.isAdminUser() &&
                    <Navigate 
                        replace={true}
                        to="/"
                        state={{}}/>
                }
                {
                    this.state.shouldGoBack &&
                    <Navigate 
                    replace={true}
                    to={import.meta.env.VITE_ADMIN_PATH} state={{adminLoginInfos: this.props.adminLoginInfos}}/>
                }

                <div className="backArrowDiv">
                    <IconButton
                        size='large'
                        onClick={() => this.setState({shouldGoBack: true})}
                        >
                        <ArrowBackIcon/>
                    </IconButton>
                    
                </div>
            
                <div className="formContainer"> 
                    {
                        this.state.infoMessageText &&
                        <InfoMessage messageText={this.state.infoMessageText}/>
                    }
                    {
                        this.state.errorMessageText &&
                        <ErrorMessage messageText={this.state.errorMessageText}/>
                    }

                    <div className="audioFormItemBox">
                        <Autocomplete
                            sx={{ marginTop: "20px", marginBottom: "20px" }}
                            {...this.state.authorsOption}
                            id="author-select"
                            className="searchFilterComponent"
                            autoComplete
                            includeInputInList
                            fullWidth
                            autoSelect
                            freeSolo
                            renderInput={(params) => (
                                <TextField 
                                    {...params} 
                                    label="Auteur" 
                                    variant="standard"
                                />
                            )}
                            value={this.state.audioInfos?.author || ''}
                            onInputChange={(_even, value) => this.setState({
                                audioInfos: {...this.state.audioInfos, author: value.toUpperCase()}
                            })}
                            
                            onFocus={() => this.setState({
                                errorMessageText: null, 
                                infoMessageText: null})
                            }
                        />
                    </div>

                    <div className="audioFormItemBox">
                        <Autocomplete
                            sx={{ marginTop: "20px", marginBottom: "20px" }}
                            {...this.state.themesOption}
                            id="theme-select"
                            className="searchFilterComponent"
                            autoComplete
                            includeInputInList
                            fullWidth
                            autoSelect
                            freeSolo
                            renderInput={(params) => (
                                <TextField 
                                    {...params} 
                                    label="Theme" 
                                    variant="standard" 
                                />
                            )}
                            value={this.state.audioInfos?.theme || ''}
                            onInputChange={(_even, value) => this.setState({
                                audioInfos: {...this.state.audioInfos, theme: value.toUpperCase()}
                            })}
                                
                            onFocus={() => this.setState({
                                errorMessageText: null, 
                                infoMessageText: null})}
                        /> 
                    </div>

                    <div className="audioFormItemBox">
                        <TextField 
                            sx={{ marginTop: "20px", marginBottom: "20px" }}
                            id="description-input"
                            label="Description" 
                            variant="standard"
                            fullWidth
                            multiline
                            rows={3}
                            value={this.state.audioInfos?.description}
                            onChange={(even) => this.setState({
                                audioInfos: {
                                    ...this.state.audioInfos, 
                                    description: even.target.value.charAt(0).toUpperCase() + even.target.value.slice(1)
                                }
                            })}

                            onFocus={() => this.setState({
                                errorMessageText: null, 
                                infoMessageText: null})
                            }
                        />
                    </div>
                    <div className="audioFormItemBox">
                        <TextField 
                            sx={{ marginTop: "20px", marginBottom: "20px" }}
                            id="keywords-input"
                            label="Mots clés" 
                            variant="standard"
                            fullWidth
                            multiline
                            rows={3}
                            value={this.state.audioInfos?.keywords}
                            onChange={(even) => this.setState({
                                audioInfos: {...this.state.audioInfos, keywords: even.target.value}
                            })}

                            onFocus={() => this.setState({
                                errorMessageText: null, 
                                infoMessageText: null})
                            }
                        />
                    </div>

                    <div className="audioFormItemBox">
                        <LocalizationProvider dateAdapter={AdapterMoment}>
                            <DatePicker
                                label="Date"
                                format="DD-MM-YYYY"
                                slotProps={{
                                    textField: {
                                    helperText: 'JJ-MM-AAAA',
                                    sx:{ width: "45%", textTransform: "none", marginTop: "20px", marginBottom: "20px", height: "40px" }
                                    },
                                }}
                                disableFuture
                                value={this.state.audioInfos?.date}
                                onChange={(value) => this.setState({
                                    audioInfos: {...this.state.audioInfos, date: value}
                                })}

                                onOpen={() => this.setState({
                                    errorMessageText: null, 
                                    infoMessageText: null})}
                            />
                        </LocalizationProvider>
                        
                        {
                            !this.state.isUpdatingAudio && 
                            <Button
                                sx={{width: "45%", textTransform: "none", marginTop: "20px", marginBottom: "20px", height: "56px", maxHeight: "56px" }}
                                variant="outlined"
                                component="label">
                                {this.state.audio?.name || "Choisir un audio"}
                                <input
                                    type="file"
                                    hidden
                                    accept="audio/*"
                                    onChange={ (even) => {
                                        this.setState({
                                            audio: even.target.files[0]
                                        })}
                                    }

                                    onFocus={() => this.setState({
                                        errorMessageText: null, 
                                        infoMessageText: null})}
                                />
                            </Button>
                        }
                    </div>

                    <div className="audioFormItemBox submitButton">
                        <Button
                            sx={{textTransform: "none", float: "right", marginTop: "20px", marginBottom: "20px"}} 
                            variant="contained" 
                            size="large"
                            onClick={() => this.state.isUpdatingAudio ? this.handleUpdateAudio() : this.handleAddAudio()}>
                                {this.state.isUpdatingAudio ? "Mettre à jour" : "Ajouter"}
                        </Button>
                    </div>
                </div>
            </div>
        );
    }
}

export default AudioCreator;