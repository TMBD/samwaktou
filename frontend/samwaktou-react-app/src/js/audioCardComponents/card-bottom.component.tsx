import React from 'react';


type BottomProps = {
    authorName: string;
    recordDateDisplay: string;
}

class Bottom extends React.Component<BottomProps>{
    constructor(props: BottomProps){
        super(props);
    }

    render(){
        return(
            <div className="cardBottomContainer">
                <div className="cardAuthorContainer">
                    {this.props.authorName}
                </div>
                <div className="cardDateContainer">
                    {this.props.recordDateDisplay}
                </div>
            </div>
        );
    }
}

export default Bottom;