import React from 'react';


type BottomProps = {
    authorName: string;
    recordDateDisplay: string;
}

const Bottom: React.FC<BottomProps> = (props: BottomProps) => {
    return(
        <div className="cardBottomContainer">
            <div className="cardAuthorContainer">
                {props.authorName}
            </div>

            <div className="cardDateContainer">
                {props.recordDateDisplay}
            </div>
        </div>
    );
}

export default Bottom;