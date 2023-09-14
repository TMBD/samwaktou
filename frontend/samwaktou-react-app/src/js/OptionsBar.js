import DownloadIcon from '@mui/icons-material/Download';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import { useState } from 'react';
import {SimpleSnackBar, SnackBarAlert} from './SnackBar';



export default function OptionsBar(props){

    const [blinkingClassName, setBlinkingClassName] = useState("");
    const [openSnackBarAlert, setOpenSnackBarAlert] = useState(false);
    const [openSimpleSnackBar, setOpenSimpleSnackBar] = useState(false);
    const [downloadSuccess, setDownloadSuccess] = useState(true);

    const copyAudioLinkToClipboard = (elementId) => {
        navigator.clipboard.writeText(`${process.env.REACT_APP_APP_URL}${process.env.REACT_APP_AUDIO_LINK_PATH}?id=${elementId}`);
        setOpenSimpleSnackBar(true);
    }

    const handleCloseSnackBarAlert = () => {
        setOpenSnackBarAlert(false);
    };

    const handleCloseSimpleSnackBar = () => {
        setOpenSimpleSnackBar(false);
    };

    const handleDownloadFinished = (success) => {
        setBlinkingClassName("");
        setDownloadSuccess(success);
        setOpenSnackBarAlert(true);
    }
    
    const handleAudioDownloadClick = () => {
        if(blinkingClassName) return;
        setBlinkingClassName("waitingBlinker");
        props.handleAudioFileDownload(props.audioDownloadInfos, handleDownloadFinished)
    }
    
    return <div className="optionsBarContainer">
                <Tooltip title="Télécharger l'audio">
                    <IconButton
                        className={"optionIconButton "+blinkingClassName}
                        size='small'
                        sx={{color: '#107B7E', marginLeft: '10px', cursor: blinkingClassName ? 'progress':''}}
                        onClick={() => handleAudioDownloadClick()}
                        >
                        <DownloadIcon
                            style={{width: '20px', height: '20px'}}
                        />
                    </IconButton>
                </Tooltip>

                <Tooltip title="Copier le lien">
                    <IconButton
                        className="optionIconButton"
                        size='small'
                        sx={{color: '#107B7E', marginLeft: '10px'}}
                        onClick={() => copyAudioLinkToClipboard(props.elementId)}
                        >
                        <ContentCopyIcon
                            style={{width: '20px', height: '20px'}}
                        />
                    </IconButton>
                </Tooltip>

                <SnackBarAlert
                    duration = {2000}
                    severity = {downloadSuccess ? "success":"error"}
                    message = {downloadSuccess ? "Audio téléchargé !":"Erreur lors du téléchargement !"}
                    openSnackBarAlert = {openSnackBarAlert}
                    handleCloseSnackBarAlert = {handleCloseSnackBarAlert}
                />

                <SimpleSnackBar
                    duration = {2000}
                    message = "Lien audio copié dans le presse papier !"
                    openSimpleSnackBar = {openSimpleSnackBar}
                    handleCloseSimpleSnackBar = {handleCloseSimpleSnackBar}
                />
                
            </div>
}

