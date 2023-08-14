import React from "react";
import '../style/searchBar.css';
import '../style/popupView.css'
import AdvanceSearch from "./AdvanceSearch";
import moment from "moment";

class SearchBar extends React.Component{
    constructor(props){
        super(props);
        this.searchInputRef = React.createRef();
        this.handleSearch = this.handleSearch.bind(this);
        this.handleAdvanceSearch = this.handleAdvanceSearch.bind(this);
        this.state = {
            shouldDisplayAdvanceSearchView: false,
            advanceSearchValues: {},
            searchInputContent: ""
        };
    }

    changeAdvanceSearchPopupStatus = (isVisible) => {
        this.setState({
            shouldDisplayAdvanceSearchView: isVisible
        });
    }

    handleSearch = (searchValues) => {
        this.setState({
            advanceSearchValues: {
                ...this.state.advanceSearchValues,
                keywords: searchValues?.keywords
            },
            searchInputContent: searchValues?.keywords
        });
        this.props.handleInputSearchChange(searchValues);
    }

    handleAdvanceSearch = (advanceSearchValues) => {
        this.changeAdvanceSearchPopupStatus(false);
        let input = "";
        if(advanceSearchValues?.keywords) input += "keywords:("+advanceSearchValues.keywords+")";
        if(advanceSearchValues?.author) input += " author:("+advanceSearchValues.author+")";
        if(advanceSearchValues?.theme) input += " theme:("+advanceSearchValues.theme+")";
        if(advanceSearchValues?.minDate) input += " minDate:("+moment(advanceSearchValues.minDate).format('DD-MM-YYYY')+")";
        if(advanceSearchValues?.maxDate) input += " maxDate:("+moment(advanceSearchValues.maxDate).format('DD-MM-YYYY')+")";

        this.setState({
            searchInputContent: input
        });
        this.setState({
            advanceSearchValues: {
                keywords: advanceSearchValues?.keywords,
                author: advanceSearchValues?.author,
                theme: advanceSearchValues?.theme,
                minDate: advanceSearchValues?.minDate,
                maxDate: advanceSearchValues?.maxDate
            }
        });
        this.props.handleInputSearchChange(advanceSearchValues);
    }

    render(){
        return(
            <div className="wrap">
                <div className="search">
                    <input
                        ref = {this.searchInputRef} 
                        type = "text" 
                        className = "searchTerm" 
                        name="searchInput"
                        placeholder = "Rechercher par mots clés"
                        value={this.state.searchInputContent}
                        onChange={() => this.handleSearch({keywords: this.searchInputRef.current.value})}
                        onFocus={(e) => this.searchInputRef.current.setSelectionRange(0, this.searchInputRef.current.value.length)}/>
                        
                    <button title="Recherches avancées"
                        type = "submit" 
                        className = "searchButton"
                        onClick={() => this.changeAdvanceSearchPopupStatus(true)}>
                        Recherche avancée
                    </button>
                </div>

                {
                    this.state.shouldDisplayAdvanceSearchView && 
                    <AdvanceSearch 
                        shouldDisplayAdvanceSearchView = {this.state.shouldDisplayAdvanceSearchView}
                        changeAdvanceSearchPopupStatus = {this.changeAdvanceSearchPopupStatus}
                        handleAdvanceSearch = {this.handleAdvanceSearch}
                        advanceSearchValues = {this.state.advanceSearchValues}
                        authors = {this.props.authors}
                        themes = {this.props.themes}/>
                }
            </div>
        );
    }
}

export default SearchBar;