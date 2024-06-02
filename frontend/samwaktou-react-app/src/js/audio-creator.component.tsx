import React from "react";
import '../style/audioCreator.css';
import TextField from '@mui/material/TextField';
import { Button } from "@mui/material";
import Autocomplete from '@mui/material/Autocomplete';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterMoment } from '@mui/x-date-pickers/AdapterMoment'
import {ErrorMessage, InfoMessage} from './message.component'
import moment, { Moment } from "moment";
import { Navigate } from "react-router-dom";
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import IconButton from '@mui/material/IconButton';
import { AudioInfos, SerializedAudioInfos, buildAudioInfos } from "./model/audio.model";
import { AdminLoginInfos } from "./model/admin.model";
import { httpPost, httpPut } from "./common/http-request-handler";


type AudioCreatorProps = {
    serializedAudioInfos: SerializedAudioInfos; //we need to used the serialized version because the date type (of Moment) is not compatible with react routing
    authors: string[];
    themes: string[];
    adminLoginInfos: AdminLoginInfos;
}

type AudioCreatorState = {
    theme: string;
    author: string;
    description: string;
    keywords: string;
    date: Moment;
    audio: File;
    errorMessageText: string;
    infoMessageText: string;
    audioInfos: AudioInfos;
    authorsOption: {
        options: string[];
    };
    themesOption: {
        options: string[];
    };
    shouldGoBack: boolean;
}

class AudioCreator extends React.Component<AudioCreatorProps, AudioCreatorState> {
    constructor( props: AudioCreatorProps ){
        super(props);
        this.state = {
            theme: this.props.serializedAudioInfos?.theme || "",
            author: this.props.serializedAudioInfos?.author || "",
            description: this.props.serializedAudioInfos?.description || "",
            keywords: this.props.serializedAudioInfos?.keywords || "",
            date: this.props.serializedAudioInfos?.date ? moment(this.props.serializedAudioInfos.date) : null,
            audio: null,
            errorMessageText: null,
            infoMessageText: null,
            audioInfos: buildAudioInfos(this.props.serializedAudioInfos),
            authorsOption: {
                options: this.props.authors || [],
            },
            themesOption: {
                options: this.props.themes || [],
            },
            shouldGoBack: false
        }
    }

    cleanFields = (): void => {
        this.setState({
            theme: "",
            description: "",
            keywords: "",
            audio: null,
            audioInfos: null
        });
    }

    updateAndCleanFields = (): void => {
        let authors = this.state.authorsOption.options;
        if(authors.indexOf(this.state.author) === -1) authors.push(this.state.author);
        let themes = this.state.themesOption.options;
        if(themes.indexOf(this.state.theme) === -1) themes.push(this.state.theme);

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
            !this.state.author?.trim() ||
            !this.state.theme?.trim() ||
            !this.state.description?.trim() ||
            !this.state.keywords?.trim() ||
            !this.state.date || !moment(this.state.date, "DD-MM-YYYY").isValid() ||
            !this.state.audio){
            this.setState({errorMessageText: "Veuillez renseigner correctement tous les champs !"})
            return ;
        }
        this.uploadAudio();
    }

    handleUpdateAudio = (): void => {
        this.setState({errorMessageText: null})
        if(
            !this.state.author?.trim() ||
            !this.state.theme?.trim() ||
            !this.state.description?.trim() ||
            !this.state.keywords?.trim() ||
            !this.state.date || !moment(this.state.date, "DD-MM-YYYY").isValid()){
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
        data.append("author", this.state.author.trim());
        data.append("theme", this.state.theme.trim());
        data.append("description", this.state.description.trim());
        data.append("keywords", this.state.keywords.trim());
        data.append("date", this.state.date.format('DD-MM-YYYY'));
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
        data.append("author", this.state.author.trim());
        data.append("theme", this.state.theme.trim());
        data.append("description", this.state.description.trim());
        data.append("keywords", this.state.keywords.trim());
        data.append("date", this.state.date.format('DD-MM-YYYY'));

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
                            value={this.state.author}
                            onInputChange={(_even, value) => this.setState({author: value.toUpperCase()})}
                            
                            onFocus={() => this.setState({
                                errorMessageText: null, 
                                infoMessageText: null})}
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
                            value={this.state.theme}
                            onInputChange={(_even, value) => this.setState({theme: value.toUpperCase()})}
                                
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
                            value={this.state.description}
                            onChange={(even) => this.setState({
                                description: even.target.value.charAt(0).toUpperCase() + even.target.value.slice(1)})}

                            onFocus={() => this.setState({
                                errorMessageText: null, 
                                infoMessageText: null})}
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
                            value={this.state.keywords}
                            onChange={(even) => this.setState({
                                keywords: even.target.value})}

                            onFocus={() => this.setState({
                                errorMessageText: null, 
                                infoMessageText: null})}
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
                                value={this.state.date}
                                onChange={(value) => this.setState({date: value})}

                                onOpen={() => this.setState({
                                    errorMessageText: null, 
                                    infoMessageText: null})}
                            />
                        </LocalizationProvider>
                        
                        {
                            !this.state.audioInfos && 
                            <Button
                                sx={{width: "45%", textTransform: "none", marginTop: "20px", marginBottom: "20px", height: "56px", maxHeight: "56px" }}
                                variant="outlined"
                                component="label">
                                {this.state.audio?.name || "Choisir un audio"}
                                <input
                                    type="file"
                                    hidden
                                    accept="audio/*"
                                    onChange={ (even) => { this.setState({
                                        audio: even.target.files[0]})}}

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
                            onClick={() => this.state.audioInfos ? this.handleUpdateAudio() : this.handleAddAudio()}>
                                {this.state.audioInfos ? "Mettre à jour" : "Ajouter"}
                        </Button>
                    </div>
                </div>
            </div>
        );
    }
}

export default AudioCreator;