import React from "react";
import '../style/searchBar.css';
import '../style/popupView.css'
import AdvanceSearch, { AdvanceSearchFormInput } from "./advance-search.component";


type SearchBarProps = {
    handleInputSearchChange: (advanceSearchValues: AdvanceSearchFormInput) => void;
    authors: string[];
    themes: string[];
    searchInput: AdvanceSearchFormInput
}

type SearchBarState = {
    shouldDisplayAdvanceSearchView: boolean;
    advanceSearchValues: AdvanceSearchFormInput;
    searchInputContent: string;
}

class SearchBar extends React.Component<SearchBarProps, SearchBarState> {
    private searchInputRef = React.createRef<HTMLInputElement>();

    constructor(props: SearchBarProps){
        super(props);
        this.handleAdvanceSearch = this.handleAdvanceSearch.bind(this);
        this.state = {
            shouldDisplayAdvanceSearchView: false,
            advanceSearchValues: {},
            searchInputContent: ""
        };
        this.handleSearch = this.handleSearch.bind(this);
    }

    componentDidUpdate(prevProps: SearchBarProps): void{
        if(this.props.searchInput && this.props.searchInput !== prevProps.searchInput){
            this.handleAdvanceSearchInputChange(this.props.searchInput);
        }
    }

    changeAdvanceSearchPopupStatus = (isVisible: boolean): void => {
        this.setState({
            shouldDisplayAdvanceSearchView: isVisible
        });
    }

    handleSearch = (searchValues: {keywords: string}) => {
        this.setState({
            advanceSearchValues: {
                ...this.state.advanceSearchValues,
                keywords: searchValues?.keywords
            },
            searchInputContent: searchValues?.keywords
        });
        this.props.handleInputSearchChange(searchValues);
    }

    handleAdvanceSearch = (advanceSearchValues: AdvanceSearchFormInput): void => {
        this.changeAdvanceSearchPopupStatus(false);
        this.props.handleInputSearchChange(advanceSearchValues);
        this.handleAdvanceSearchInputChange(advanceSearchValues);
    }

    handleAdvanceSearchInputChange = (advanceSearchValues: AdvanceSearchFormInput) => {
        let input = "";
        if(advanceSearchValues?.keywords) input += "keywords:("+advanceSearchValues.keywords+")";
        if(advanceSearchValues?.author) input += " author:("+advanceSearchValues.author+")";
        if(advanceSearchValues?.theme) input += " theme:("+advanceSearchValues.theme+")";
        if(advanceSearchValues?.minDate) input += " minDate:("+advanceSearchValues.minDate.format('DD-MM-YYYY')+")";
        if(advanceSearchValues?.maxDate) input += " maxDate:("+advanceSearchValues.maxDate.format('DD-MM-YYYY')+")";

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
                        onFocus={(_e) => this.searchInputRef.current.setSelectionRange(0, this.searchInputRef.current.value.length)}/>
                        
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