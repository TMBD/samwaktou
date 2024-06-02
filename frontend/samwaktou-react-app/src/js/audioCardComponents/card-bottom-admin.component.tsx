import React from 'react';
import IconButton from '@mui/material/IconButton';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import { AudioInfos } from '../model/audio.model';


type CardBottomAdminProps = {
    audioInfos: AudioInfos;
    handleEditAudio: (audioInfos: AudioInfos) => void;
    handleDeleteAudio: (elementId: string) => void;
}

class CardBottomAdmin extends React.Component<CardBottomAdminProps>{

    handleDeleteAudioClick = () => {
        if(window.confirm("Voulez-vous supprimer cet audio ?")){
            this.props.handleDeleteAudio(this.props.audioInfos.id)
        }
    }

    render(){
        return(
            <div className="cardBottomAdminContainer">
                <IconButton
                    size='small'
                    onClick={() => this.props.handleEditAudio(this.props.audioInfos)}
                    >
                    <EditOutlinedIcon />
                </IconButton>
                <IconButton
                    size='small'
                    onClick={() => this.handleDeleteAudioClick()}
                    >
                    <DeleteOutlinedIcon />
                </IconButton>
            </div>
        );
    }
}

export default CardBottomAdmin;