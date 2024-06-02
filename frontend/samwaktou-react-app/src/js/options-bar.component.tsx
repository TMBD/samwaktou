import DownloadIcon from '@mui/icons-material/Download';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import { useState } from 'react';
import {SimpleSnackBar, SnackBarAlert} from './snack-bar.component';
import { AudioInfos } from './model/audio.model';

type OptionsBarProps = {
    handleAudioFileDownload: (audioInfos: AudioInfos, callback: (success: boolean) => void) => void;
    audioInfos: AudioInfos;
}

export const OptionsBar: React.FC<OptionsBarProps> = (props: OptionsBarProps) => {
    const [blinkingClassName, setBlinkingClassName] = useState("");
    const [openSnackBarAlert, setOpenSnackBarAlert] = useState(false);
    const [openSimpleSnackBar, setOpenSimpleSnackBar] = useState(false);
    const [downloadSuccess, setDownloadSuccess] = useState(true);

    const copyAudioLinkToClipboard = (elementId: string): void => {
        navigator.clipboard.writeText(`${import.meta.env.VITE_APP_URL}${import.meta.env.VITE_AUDIO_LINK_PATH}?id=${elementId}`);
        setOpenSimpleSnackBar(true);
    }

    const handleCloseSnackBarAlert = (): void => {
        setOpenSnackBarAlert(false);
    };

    const handleCloseSimpleSnackBar = (): void => {
        setOpenSimpleSnackBar(false);
    };

    const handleDownloadFinished = (success: boolean): void => {
        setBlinkingClassName("");
        setDownloadSuccess(success);
        setOpenSnackBarAlert(true);
    }
    
    const handleAudioDownloadClick = (): void => {
        if(blinkingClassName) return;
        setBlinkingClassName("waitingBlinker");
        props.handleAudioFileDownload(props.audioInfos, handleDownloadFinished);
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
                        onClick={() => copyAudioLinkToClipboard(props.audioInfos.id)}
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
                    shouldOpen = {openSnackBarAlert}
                    handleCloseSnackBar = {handleCloseSnackBarAlert}
                />

                <SimpleSnackBar
                    duration = {2000}
                    message = "Lien audio copié dans le presse papier !"
                    shouldOpen = {openSimpleSnackBar}
                    handleCloseSnackBar = {handleCloseSimpleSnackBar}
                />
                
            </div>
}

