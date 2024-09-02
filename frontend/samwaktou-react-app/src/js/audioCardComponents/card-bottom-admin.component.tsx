import React from 'react';
import IconButton from '@mui/material/IconButton';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import { AudioInfos } from '../model/audio.model';


type CardBottomAdminProps = {
    audioInfos: AudioInfos;
    handleNavigateToEditAudioPage: (audioInfos: AudioInfos) => void;
    handleDeleteAudio: (elementId: string) => void;
}


const CardBottomAdmin: React.FC<CardBottomAdminProps> = (props: CardBottomAdminProps) => {
    const handleDeleteAudioClick = () => {
        if(window.confirm("Voulez-vous supprimer cet audio ?")){
            props.handleDeleteAudio(props.audioInfos.id)
        }
    }

    return(
        <div className="cardBottomAdminContainer">
            <IconButton
                size='small'
                onClick={() => props.handleNavigateToEditAudioPage(props.audioInfos)}
                >
                <EditOutlinedIcon />
            </IconButton>
            
            <IconButton
                size='small'
                onClick={() => handleDeleteAudioClick()}
                >
                <DeleteOutlinedIcon />
            </IconButton>
        </div>
    );
}

export default CardBottomAdmin;