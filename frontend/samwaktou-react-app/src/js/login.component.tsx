import React from "react";
import '../style/login.css';
import { ErrorMessage } from "./message.component";
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
import { AdminLoginInfos } from "./model/admin.model";
import { httpPost } from "./common/http-request-handler";


type LoginState = {
    email: string;
    password: string;
    adminLoginInfos: AdminLoginInfos;
    showPassword: boolean;
    loginErrorMessage: string;
}

class Login extends React.Component<{}, LoginState>{

    constructor(props: {}){
        super(props);
        this.state = {
            email: "",
            password: "",
            adminLoginInfos: null,
            showPassword: false,
            loginErrorMessage: ""
        }
    }

    handleClickShowPassword = (): void => {
        this.setState({showPassword: !this.state.showPassword});
    }

    handleSubmitForm = (): void => {
        if(this.state.email?.trim() && this.state.password){
            this.loginUser();
        } else{
            this.setState({loginErrorMessage: "Veuillez renseigner correctement les champs !"})
        }
    }

    loginUser = (): void => {
        this.setState({
            loginErrorMessage: ""
        });

        const postBody = JSON.stringify({
            email: this.state.email?.trim(),
            password: this.state.password
        });

        httpPost<AdminLoginInfos>('/admins/login', postBody)
        .then(
            (adminLoginInfos: AdminLoginInfos) => {
                this.setState({adminLoginInfos: adminLoginInfos})
            },
            (error: Error) => {
                this.setState({
                    loginErrorMessage: error.message
                });
            }
        );
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
                    this.state.adminLoginInfos?.token?.trim() &&
                    <Navigate 
                    replace={true}
                    to={import.meta.env.VITE_ADMIN_PATH} state={{adminLoginInfos: this.state.adminLoginInfos}}  />
                }
            
            </div>)
    }
}

export default Login;