import React from 'react';
import Tooltip from '@mui/material/Tooltip';

type HeaderProps = {
    theme: string;
    durationDisplay: string;
    isOnPlay: boolean;
    shouldDisplayAudioDetails: boolean;
    toggleAudioDetailsDisplay: () => void;
    handleThemeFilterClick: (theme: string) => void;
}

const Header: React.FC<HeaderProps> = (props: HeaderProps) => {
    const cardThemeClassName = props.isOnPlay ? "cardThemeOnPlay" : "";
    const arrowTypeClass = props.shouldDisplayAudioDetails ? "up" : "down";

    return(
        <div className="cardHeaderContainer">
            <div className='themeContainer'>
                <Tooltip title="Filtrer avec ce thème">
                    <div className={`cardTheme ${cardThemeClassName}`} onClick={() => props.handleThemeFilterClick(props.theme)}>
                        {props.theme}
                    </div>
                </Tooltip>
            </div>
            
            <div className="durationContainer">
                {props.durationDisplay}
            </div>

            <div className="helpContainer">
                <Tooltip title="Voir les détails">
                    <i className={`arrow ${arrowTypeClass}`} onClick={() => props.toggleAudioDetailsDisplay()}></i>
                </Tooltip>
            </div>
        </div>
    );
}

export default Header;
