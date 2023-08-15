import React from "react";
import '../style/login.css';
import { ErrorMessage } from "./Message";
import { Button } from "@mui/material";
import IconButton from '@mui/material/IconButton';
import Input from '@mui/material/Input';
import InputLabel from '@mui/material/InputLabel';
import InputAdornment from '@mui/material/InputAdornment';
import FormControl from '@mui/material/FormControl';
import TextField from '@mui/material/TextField';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import { Navigate } from "react-router-dom";

class Login extends React.Component{
    constructor( props ){
        super(props);
        this.state = {
            email: "",
            password: "",
            user: null,
            showPassword: false,
            loginErrorMessage: ""
        }
        this.API_SERVER_URL = process.env.REACT_APP_API_SERVER_URL;
    }

    handleClickShowPassword = () => {
        this.setState({showPassword: !this.state.showPassword});
    }

    handleSubmitForm = () => {
        if(this.state.email?.trim() && this.state.password){
            this.loginUser();
        } else{
            this.setState({loginErrorMessage: "Veuillez renseigner correctement les champs !"})
        }
    }

    loginUser = () => {
        this.setState({
            loginErrorMessage: ""
        });

        fetch(this.API_SERVER_URL+"/admins/login", {
            method: 'POST',
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                email: this.state.email?.trim(),
                password: this.state.password
            })
        })
        .then(res => {
            if (!res.ok) {
                throw new Error(res.status);
            }
            return res.json();
        })
        .then(
            (result) => {
                this.setState({user: result})
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
            if (error?.message === "404") {
                errorMessage = "Email ou mot de passe incorrect";
            } else if (error?.message === "400") {
                errorMessage = "Email ou mot de passe invalide";
            } else if (error?.message?.charAt(0) === "4") {
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
            loginErrorMessage: errorMessage
        });
    }    
    
    render(){
        return (
            <div className='loginContainer'>
                <div style={{textAlign: "center"}}>
                    {
                        this.state.loginErrorMessage &&
                        <ErrorMessage
                            messageText = {this.state.loginErrorMessage}
                        />
                    }
                </div>
                
                <TextField 
                    sx={{ marginTop: "20px", marginBottom: "20px" }}
                    id="username-input"
                    label="Email" 
                    variant="standard"
                    fullWidth
                    value={this.state.email}
                    onChange={(even) => this.setState({email: even.target.value})}/>

                <FormControl fullWidth sx={{ marginTop: "20px", marginBottom: "20px" }} variant="standard">
                    <InputLabel htmlFor="standard-adornment-password">Mot de passe</InputLabel>
                    <Input
                        id="standard-adornment-password"
                        type={this.state.showPassword ? 'text' : 'password'}
                        value={this.state.password}
                        onChange={(even) => this.setState({password: even.target.value})}
                        endAdornment={
                            <InputAdornment position="end">
                                <IconButton
                                    aria-label="toggle password visibility"
                                    onClick={() => this.handleClickShowPassword()}
                                    >
                                    {this.state.showPassword ? <VisibilityOff /> : <Visibility />}
                                </IconButton>
                            </InputAdornment>
                        }
                        />
                </FormControl>
                <Button
                    sx={{textTransform: "none", float: "right", marginTop: "20px", marginBottom: "20px"}} 
                    variant="contained" 
                    size="large"
                    onClick={() => this.handleSubmitForm()}>Se connecter</Button>
                {
                    this.state.user?.token?.trim() &&
                    <Navigate 
                    replace={true}
                    to={process.env.REACT_APP_ADMIN_PATH} state={{user: this.state.user}}  />
                }
            
            </div>)
    }
}

export default Login;