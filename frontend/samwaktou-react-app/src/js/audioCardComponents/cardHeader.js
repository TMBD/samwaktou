import React from 'react';

class Header extends React.Component{
    render(){
        return(
            <div className="cardHeaderContainer">
                <div className="cardTheme">
                    {this.props.theme}
                </div>
                <div className="cardTheme">
                    {this.props.durationDisplay}
                </div>
                <div className="cardHelp" onClick={() => this.props.handleAudioInfoDisplay(this.props.audioInfos)}>
                    i
                </div>
            </div>
        );
    }
}

export default Header;
