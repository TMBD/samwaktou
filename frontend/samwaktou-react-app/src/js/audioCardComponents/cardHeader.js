import React from 'react';

class Header extends React.Component{
    render(){
        return(
            <div className="cardHeaderContainer">
                <div className="cardTheme themeContainer">
                    {this.props.theme}
                </div>
                <div className="cardTheme durationContainer">
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
