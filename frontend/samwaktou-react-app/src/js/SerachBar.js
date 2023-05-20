import React from "react";
import '../style/searchBar.css';

class SearchBar extends React.Component{

    constructor(props){
        super(props);
        this.searchInputRef = React.createRef();
        this.state = {
            audios: this.props.audios
        };
    }

    changefocus = () => {
        this.searchInputRef.current.focus();
    }

    render(){
        return(
            <div className="wrap">
                <div className="search">
                    <input
                        ref = {this.searchInputRef} 
                        type = "text" 
                        className = "searchTerm" 
                        placeholder = "Rechercher par mots clés"
                        onChange={() => this.props.handleInputSearchChange(this.searchInputRef.current.value)}/>
                    <button 
                        type = "submit" 
                        className = "searchButton"
                        onClick={() => this.changefocus()}>
                        <i className="fa fa-search"></i>
                    </button>
                </div>
            </div>
        );
    }
}

export default SearchBar;