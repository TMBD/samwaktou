import React from 'react';

class Header extends React.Component{
    render(){
        return(
            <div className="cardHeaderContainer">
                <div className='themeContainer'>
                    <div className="cardTheme" onClick={() => this.props.handleThemeFilterClick({theme: this.props.theme})}>
                        {this.props.theme}
                    </div>
                </div>
                
                <div className="durationContainer">
                    {this.props.durationDisplay}
                </div>
                <div className="cardHelp helpContainer" onClick={() => this.props.handleAudioInfoDisplay(this.props.audioInfos)}>
                    i
                </div>
            </div>
        );
    }
}

export default Header;
