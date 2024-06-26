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

class AudioCreator extends React.Component{
    constructor( props ){
        super(props);
        this.state = {
            theme: this.props.audioInfos?.theme || "",
            author: this.props.audioInfos?.author || "",
            description: this.props.audioInfos?.description || "",
            keywords: this.props.audioInfos?.keywords || "",
            date: this.props.audioInfos?.date ? moment(this.props.audioInfos.date) : null,
            audio: null,
            errorMessageText: null,
            infoMessageText: null,
            audioInfos: this.props.audioInfos,
            authorsOption: {
                options: this.props.authors || [],
            },
            themesOption: {
                options: this.props.themes || [],
            },
            shouldGoBack: false
        }
        this.API_SERVER_URL = process.env.REACT_APP_API_SERVER_URL;
    }

    cleanFields = () => {
        this.setState({
            theme: "",
            description: "",
            keywords: "",
            audio: null,
            audioInfos: null
        });
    }

    updateAndCleanFields = () => {
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

    handleAddAudio = () => {
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

    handleUpdateAudio = () => {
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

    uploadAudio = () => {
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

        fetch(this.API_SERVER_URL+"/audios", {
            method: 'POST',
            headers: {
                "auth-token": this.props.user.token
            },
            body: data
        })
        .then(res => {
            if (!res.ok) {
                throw new Error(res.status);
            }
            return res.json();
        })
        .then(
            (result) => {
                this.updateAndCleanFields();
                this.setState({infoMessageText: "Audio ajouté avec succès !"});
            },
            (error) => {
                this.setErrorMessage(error);
            }
        );
    }


    updateAudio = () => {
        this.setState({
            errorMessageText: ""
        });
        let data = new FormData();
        data.append("author", this.state.author.trim());
        data.append("theme", this.state.theme.trim());
        data.append("description", this.state.description.trim());
        data.append("keywords", this.state.keywords.trim());
        data.append("date", this.state.date.format('DD-MM-YYYY'));

        fetch(this.API_SERVER_URL+"/audios/"+this.state.audioInfos.id, {
            method: 'PUT',
            headers: {
                "auth-token": this.props.user.token
            },
            body: data
        })
        .then(res => {
            if (!res.ok) {
                throw new Error(res.status);
            }
            return res.json();
        })
        .then(
            (result) => {
                this.updateAndCleanFields();
                this.setState({infoMessageText: "Audio mis à jour avec succès !"});
            },
            (error) => {
                this.setErrorMessage(error);
            }
        );
    }

    setErrorMessage = (error) => {
        let errorMessage = "Une erreur s'est produite. Veuillez réessayer plus tard.";
        if (error instanceof TypeError) {
            errorMessage = "Erreur réseau. S'il vous plait, vérifiez votre connexion internet.";
        } else if (error instanceof SyntaxError) {
            errorMessage = "Erreur serveur, données non valides.";
        } else if (error instanceof Error) {
            if (error?.message === "404" && this.state.audioInfos) {
                errorMessage = "Audio introuvable !";
            } else if (error?.message === "401") {
                errorMessage = "Accès non autorisé";
            } else if (error?.message === "400") {
                errorMessage = "Veuillez renseigner convenablement les champs";
            } else if (error?.message?.charAt(0) === "4") {
                errorMessage = "La ressource demandée n'a pas été trouvée.";
            }else if (error?.message === "500" && this.state.audioInfos) {
                errorMessage = "Une erreur s'est produite lors de la recherche de l'audio à mettre à jour dans la base de donnée";
            } else if (error?.message === "500") {
                errorMessage = "Une erreur s'est produite lors de la sauvegard des informations";
            } else if (error?.message?.charAt(0) === "5") {
                errorMessage = "Erreur interne du serveur.";
            } else {
                errorMessage = "Une erreur inattendue s'est produite.";
            }
        }
        this.setState({
            errorMessageText: errorMessage
        });
    }    

    isAdminUser(){
        return this.props.user?.token?.trim();
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
                    to={process.env.REACT_APP_ADMIN_PATH} state={{user: this.props.user}}  />
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
                            onInputChange={(even, value) => this.setState({author: value.toUpperCase()})}
                            
                            onFocus={(even, value) => this.setState({
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
                            onInputChange={(even, value) => this.setState({theme: value.toUpperCase()})}
                                
                            onFocus={(even, value) => this.setState({
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

                            onFocus={(even, value) => this.setState({
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

                            onFocus={(even, value) => this.setState({
                                errorMessageText: null, 
                                infoMessageText: null})}
                        />
                    </div>

                    <div className="audioFormItemBox">
                        <LocalizationProvider dateAdapter={AdapterMoment}>
                            <DatePicker
                                label="Date"
                                id="audioDateInput"
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

                                onFocus={(even, value) => this.setState({
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

                                    onFocus={(even, value) => this.setState({
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