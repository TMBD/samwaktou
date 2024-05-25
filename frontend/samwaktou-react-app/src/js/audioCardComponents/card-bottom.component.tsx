import React from 'react';

class Bottom extends React.Component{
    constructor(props){
        super(props);
        this.state = {
            authorName: this.props.authorName,
            recordDate: this.props.recordDate
        }
    }

    render(){
        return(
            <div className="cardBottomContainer">
                <div className="cardAuthorContainer">
                    {this.state.authorName}
                </div>
                <div className="cardDateContainer">
                    {this.state.recordDate}
                </div>
            </div>
        );
    }
}

export default Bottom;