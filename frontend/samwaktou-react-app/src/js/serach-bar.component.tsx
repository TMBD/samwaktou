import React from "react";
import '../style/searchBar.css';
import '../style/popupView.css'
import AdvanceSearch, { AdvanceSearchFormInput } from "./advance-search.component";


type SearchBarProps = {
    themeSearchInput: AdvanceSearchFormInput;
    handleAudioSearchQueryChange: (audioSearchQuery: string) => void;
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
        this.advanceSearchHandler = this.advanceSearchHandler.bind(this);
        this.state = {
            shouldDisplayAdvanceSearchView: false,
            advanceSearchValues: {},
            searchInputContent: ""
        };
        this.handleSearch = this.handleSearch.bind(this);
    }

    componentDidUpdate(prevProps: Readonly<SearchBarProps>, _: Readonly<SearchBarState>): void {
        if(!!this.props?.themeSearchInput && this.props.themeSearchInput !== prevProps.themeSearchInput){
            this.handleAdvanceSearchInputChange(this.props.themeSearchInput);
        }
    }

    changeAdvanceSearchPopupStatusHandler = (isVisible: boolean): void => {
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
        this.handleInputSearchChange(searchValues);
    }

    handleInputSearchChange = (advanceSearchValues: AdvanceSearchFormInput): void => {
        let query = "";
        let shouldSearch = false;

        if(advanceSearchValues?.keywords?.trim().length >= 3){
            query += "keywords="+advanceSearchValues.keywords.trim();
            shouldSearch = true; 
        }else if(advanceSearchValues?.keywords.length === 0){//we should also perform the query when there is no content in the search bar
            shouldSearch = true;
        }

        if(advanceSearchValues?.author?.trim()){
            const authorQuery = "author="+advanceSearchValues.author.trim();
            query += query ? "&"+authorQuery : authorQuery;
            shouldSearch = true;
        }

        if(advanceSearchValues?.theme?.trim()){
            const themeQuery = "theme="+advanceSearchValues.theme.trim();
            query += query ? "&"+themeQuery : themeQuery;
            shouldSearch = true;
        }

        if(advanceSearchValues?.minDate){
            const minDateQuery = "minDate="+advanceSearchValues.minDate.format('DD-MM-YYYY');
            query += query ? "&"+minDateQuery : minDateQuery;
            shouldSearch = true;
        }

        if(advanceSearchValues?.maxDate){
            const maxDateQuery = "maxDate="+advanceSearchValues.maxDate.format('DD-MM-YYYY');
            query += query ? "&"+maxDateQuery : maxDateQuery;
            shouldSearch = true;
        }
        
        if(!shouldSearch) return;

        this.props.handleAudioSearchQueryChange(query);
    }

    advanceSearchHandler = (advanceSearchValues: AdvanceSearchFormInput): void => {
        this.changeAdvanceSearchPopupStatusHandler(false);
        this.handleInputSearchChange(advanceSearchValues);
        this.handleAdvanceSearchInputChange(advanceSearchValues);
    }

    handleAdvanceSearchInputChange = (advanceSearchValues: AdvanceSearchFormInput) => {
        let input = "";
        if(advanceSearchValues?.keywords) input += "keywords:("+advanceSearchValues.keywords+")";
        if(advanceSearchValues?.author) input += (input ? " " : "") + "author:("+advanceSearchValues.author+")";
        if(advanceSearchValues?.theme) input += (input ? " " : "") + "theme:("+advanceSearchValues.theme+")";
        if(advanceSearchValues?.minDate) input += (input ? " " : "") + "minDate:("+advanceSearchValues.minDate.format('DD-MM-YYYY')+")";
        if(advanceSearchValues?.maxDate) input += (input ? " " : "") + "maxDate:("+advanceSearchValues.maxDate.format('DD-MM-YYYY')+")";

        this.setState({
            searchInputContent: input,
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
                        
                    <button title="Recherche avancée"
                        type = "submit" 
                        className = "searchButton"
                        onClick={() => this.changeAdvanceSearchPopupStatusHandler(true)}>
                        Recherche avancée
                    </button>
                </div>

                {
                    this.state.shouldDisplayAdvanceSearchView && 
                    <AdvanceSearch 
                        shouldDisplayAdvanceSearchView = {this.state.shouldDisplayAdvanceSearchView}
                        advanceSearchValues = {this.state.advanceSearchValues}
                        changeAdvanceSearchPopupStatusHandler = {this.changeAdvanceSearchPopupStatusHandler}
                        advanceSearchHandler = {this.advanceSearchHandler}
                    />
                }
            </div>
        );
    }
}

export default SearchBar;