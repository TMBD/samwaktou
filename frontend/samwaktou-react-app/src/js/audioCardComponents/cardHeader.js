import React from 'react';


class Header extends React.Component{

    constructor(props){
        super(props);
        this.state = {
            theme: this.props.theme
        }
    }

    render(){
        return(
            <div className="cardHeaderContainer">
                
                <div className="cardTheme">
                    {this.state.theme}
                </div>
                <div className="cardTheme">
                    {this.props.durationDisplay}
                </div>
                <div className="cardHelp">
                    i
                </div>
            </div>
        );
    }
}

export default Header;
