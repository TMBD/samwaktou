import React from 'react';
import '../style/audioCards.css';
import '../style/common.css';
import SearchBar from './serach-bar.component';
import IconButton from '@mui/material/IconButton';
import AddCircleOutlineOutlinedIcon from '@mui/icons-material/AddCircleOutlineOutlined';
import { Navigate } from "react-router-dom";
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import Tooltip from '@mui/material/Tooltip';
import { AdvanceSearchFormInput } from './advance-search.component';
import { AdminLoginInfos } from './model/admin.model';
import AudiosCardsContainer from './audioCardComponents/audios-cards-container.component';
import { isAdminUser } from './common/utils/admin-utils';


type AppBodyProps = {
    audioFileIdToPlay?: string;
    adminLoginInfos?: AdminLoginInfos;
    provider?: 'AdminAppProvider' | 'UserAppProvider' | 'AudioLinkHandlerProvider'
}

type AppBodyState = {
    shouldGoBack: boolean,
    shouldNavigateToCreateAudioPage: boolean,
    themeSearchInput: AdvanceSearchFormInput,
    audioSearchQuery: string
}

class AppBody extends React.Component<AppBodyProps, AppBodyState> {
    constructor(props: AppBodyProps){
        super(props);
        this.state = {
            shouldGoBack: false,
            shouldNavigateToCreateAudioPage: false,
            themeSearchInput: null,
            audioSearchQuery: ''
        }
    }

    handleThemeFilter = (themeSearchInput: {theme: string}): void => {
        this.setState({
            themeSearchInput: themeSearchInput,
            audioSearchQuery: `theme=${themeSearchInput.theme}`
        });
    }

    handleNavigateToCreateAudioPage = () => {
        if(!isAdminUser(this.props.adminLoginInfos)){
            window.alert("Vous n'avez pas la permission !");
            return;
        }
        this.setState({shouldNavigateToCreateAudioPage: true});
    }
    
    handleAudioSearchQueryChange = (audioSearchQuery: string) => {
        this.setState({
            audioSearchQuery: audioSearchQuery
        });
    }

    render(){
        return(
            <div className='generalContainer'>
                {
                    ((this.props.provider === "AdminAppProvider" && !isAdminUser(this.props.adminLoginInfos)) || (this.state.shouldGoBack)) &&
                    <Navigate 
                        replace={true}
                        to="/"
                    />
                }

                {
                    this.state.shouldNavigateToCreateAudioPage &&
                    <Navigate 
                        replace={false}
                        to={import.meta.env.VITE_CREATE_AUDIO_PATH}
                        state={{
                            adminLoginInfos: this.props.adminLoginInfos,
                        }}/>
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
                        themeSearchInput = {this.state.themeSearchInput}
                        handleAudioSearchQueryChange = {this.handleAudioSearchQueryChange}
                    />
                }

                <AudiosCardsContainer
                    audioFileIdToPlay = {this.props.audioFileIdToPlay}
                    adminLoginInfos = {this.props.adminLoginInfos}
                    audioSearchQuery = {this.state.audioSearchQuery}
                    handleThemeFilter = {this.handleThemeFilter}
                />
                {
                    this.props.adminLoginInfos?.token?.trim() && 
                    <div className='addAudioIconContainer'>
                        <IconButton
                            size='large'
                            color='primary'
                            onClick={() => this.handleNavigateToCreateAudioPage()}
                            >
                            <AddCircleOutlineOutlinedIcon />
                        </IconButton>
                    </div>
                }
            </div>
        );
    }
}

export default AppBody;