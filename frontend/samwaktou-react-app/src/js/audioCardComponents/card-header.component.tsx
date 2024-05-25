import React from 'react';
import Tooltip from '@mui/material/Tooltip';

class Header extends React.Component{
    render(){
        let cardThemeClassName = "";
        let arrowTypeClass = "down";
        if(this.props.isOnPlay){
            cardThemeClassName = "cardThemeOnPlay";
        }
        if(this.props.shouldDisplayAudioDetails){
            arrowTypeClass = "up";
        }
        return(
            <div className="cardHeaderContainer">
                <div className='themeContainer'>
                <Tooltip title="Filtrer avec ce thème">
                    <div className={"cardTheme "+cardThemeClassName} onClick={() => this.props.handleThemeFilterClick({theme: this.props.theme})}>
                        {this.props.theme}
                    </div>
                </Tooltip>
                </div>
                
                <div className="durationContainer">
                    {this.props.durationDisplay}
                </div>
                <div className="helpContainer">
                    <Tooltip title="Voir les détails">
                        <i className={"arrow "+arrowTypeClass} onClick={() => this.props.toggleAudioDetailsDisplay()}></i>
                    </Tooltip>
                </div>
            </div>
        );
    }
}

export default Header;
