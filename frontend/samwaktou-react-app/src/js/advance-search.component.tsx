import React from "react";
import TextField from '@mui/material/TextField';
import Autocomplete from '@mui/material/Autocomplete';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterMoment } from '@mui/x-date-pickers/AdapterMoment'
import { Button } from "@mui/material";
import { Moment } from "moment";
import '../style/popupView.css'
import '../style/searchBar.css';
import { getAuthors, getThemes } from "./common/utils/http-request-utils";

export type AdvanceSearchFormInput = {
    keywords?: string;
    author?: string;
    theme?: string;
    minDate?: Moment;
    maxDate?: Moment;
}

type AdvanceSearchProps = {
    shouldDisplayAdvanceSearchView: boolean;
    advanceSearchValues: AdvanceSearchFormInput;
    advanceSearchHandler: (advanceSearchValues: AdvanceSearchFormInput) => void;
    changeAdvanceSearchPopupStatusHandler: (isVisible: boolean) => void;
}

type AdvanceSearchState = {
    advanceSearchValues: AdvanceSearchFormInput;
    authorsList: string[];
    themesList: string[];
    errorMessage: string;
    warningMessage: string
}

class AdvanceSearch extends React.Component<AdvanceSearchProps, AdvanceSearchState> {
    constructor(props: AdvanceSearchProps){
        super(props);
        this.state = {
            advanceSearchValues: {
                keywords: this.props.advanceSearchValues?.keywords ? this.props.advanceSearchValues.keywords:"",
                author: this.props.advanceSearchValues?.author ? this.props.advanceSearchValues.author:null,
                theme: this.props.advanceSearchValues?.theme ? this.props.advanceSearchValues.theme:null,
                minDate: this.props.advanceSearchValues?.minDate ? this.props.advanceSearchValues.minDate:null,
                maxDate: this.props.advanceSearchValues?.maxDate ? this.props.advanceSearchValues.maxDate:null
            },
            authorsList: [],
            themesList: [],
            errorMessage: "",
            warningMessage: ""
        }
    }

    componentDidMount(): void {
        this.loadAudiosAndAuthors();
    }

    loadAudiosAndAuthors = (): void => {
        getAuthors().then(
            (authors: string[]) => {
                this.setState({
                    authorsList: authors
                });
            },
            (error: Error) => {
                this.setState({
                    warningMessage: error.message
                });
            }
        );

        getThemes().then(
            (themes: string[]) => {
                this.setState({
                    themesList: themes
                });
            },
            (error: Error) => {
                this.setState({
                    warningMessage: error.message
                });
            }
        );
    }

    handleMinDateChange = (date: Moment): void => {
        this.setState({
            advanceSearchValues:{
                ...this.state.advanceSearchValues,
                minDate: date
            }
        });
    }

    handleMaxDateChange = (date: Moment): void => {
        this.setState({
            advanceSearchValues:{
                ...this.state.advanceSearchValues,
                maxDate: date
            }
        });
    }

    handleSubmitForm = (): void => {
        const isMinDateFormatValid = !this.state.advanceSearchValues?.minDate || this.state.advanceSearchValues?.minDate.isValid();
        const isMaxDateFormatValid = !this.state.advanceSearchValues?.maxDate || this.state.advanceSearchValues?.maxDate.isValid();
        const isMinDateBeforeMaxDate = 
            !this.state.advanceSearchValues?.minDate 
            || !this.state.advanceSearchValues?.maxDate 
            || this.state.advanceSearchValues.minDate.isSameOrBefore(this.state.advanceSearchValues.maxDate);

        if(!isMinDateFormatValid) this.setState({errorMessage: "Intervale de date initial incorrect"});
        else if(!isMaxDateFormatValid) this.setState({errorMessage: "Intervale de date final incorrect"});
        else if(!isMinDateBeforeMaxDate) this.setState({errorMessage: "Intervale de date incorrect"});
        else {
            this.setState({errorMessage: ""});
            this.props.advanceSearchHandler(this.state.advanceSearchValues);
        }
    }

    render(){
        const authorsOption = {
            options: this.state.authorsList,
        };
        const themesOption = {
            options: this.state.themesList,
        };

        const fontStyle={
            style: {
                fontSize: "13px"
            }
        }

        return(
            <div className={"custom-model-main " + (this.props.shouldDisplayAdvanceSearchView? "model-open" : "")}>
                <div className="custom-model-inner">
                    <div className="close-btn" onClick={() => this.props.changeAdvanceSearchPopupStatusHandler(false)}>×</div>
                    <div className="custom-model-wrap">
                        <div className="pop-up-content-wrap">
                            <div className="advanceSearchContainer">
                                <div>
                                    <div className="formItemBox">
                                        <TextField 
                                            id="keyword-input" 
                                            className="searchFilterComponent"
                                            label="Mots clés" 
                                            variant="standard"
                                            InputProps={fontStyle}
                                            InputLabelProps={fontStyle}
                                            fullWidth
                                            value={this.state.advanceSearchValues?.keywords}
                                            onChange={(even) => this.setState({advanceSearchValues:{...this.state.advanceSearchValues, keywords: even.target.value}})}
                                            onFocus={(e) => e.target.setSelectionRange(0, e.target.value.length)}/>
                                    </div>
                                    <div className="formItemBox">
                                        <Autocomplete
                                            {...authorsOption}
                                            id="author-select"
                                            className="searchFilterComponent"
                                            autoComplete
                                            includeInputInList
                                            fullWidth
                                            renderInput={(params) => (
                                                <TextField 
                                                    {...params} 
                                                    label="Auteur" 
                                                    variant="standard"
                                                    InputLabelProps={fontStyle}
                                                />
                                            )}
                                            value={this.state.advanceSearchValues?.author}
                                            onChange={(_even, value) => this.setState({advanceSearchValues:{...this.state.advanceSearchValues, author: value}})}
                                        />
                                    </div>
                                    <div className="formItemBox">
                                        <Autocomplete
                                            {...themesOption}
                                            id="theme-select"
                                            className="searchFilterComponent"
                                            autoComplete
                                            includeInputInList
                                            fullWidth
                                            renderInput={(params) => (
                                                <TextField 
                                                    {...params} 
                                                    label="Theme" 
                                                    variant="standard" 
                                                    InputLabelProps={fontStyle}
                                                />
                                            )}
                                            value={this.state.advanceSearchValues?.theme}
                                            onChange={(_even, value) => this.setState({advanceSearchValues:{...this.state.advanceSearchValues, theme: value}})}
                                        /> 
                                    </div>

                                    <div className="formItemBox">
                                        <LocalizationProvider dateAdapter={AdapterMoment}>
                                            <DatePicker
                                                label="Après le "
                                                className="searchFilterComponent"
                                                format="DD-MM-YYYY"
                                                slotProps={{
                                                    textField: {
                                                    helperText: 'JJ-MM-AAAA',
                                                    size: "small",
                                                    sx: {width: "35%"}
                                                    },
                                                }}
                                                disableFuture
                                                maxDate={this.state.advanceSearchValues?.maxDate}
                                                value={this.state.advanceSearchValues?.minDate}
                                                onChange={(value: Moment) => this.handleMinDateChange(value)}
                                            />
                                            <DatePicker
                                                label="Avant le "
                                                className="searchFilterComponent"
                                                format="DD-MM-YYYY"
                                                slotProps={{
                                                    textField: {
                                                    helperText: 'JJ-MM-AAAA',
                                                    size: "small",
                                                    sx: {width: "35%"}
                                                    }
                                                }}
                                                disableFuture
                                                minDate={this.state.advanceSearchValues?.minDate}
                                                value={this.state.advanceSearchValues?.maxDate}
                                                onChange={(value: Moment) => this.handleMaxDateChange(value)}
                                            />
                                        </LocalizationProvider>
                                    </div>
                                    <div className="formItemBox errorMessageContainer">
                                        {this.state.errorMessage}
                                    </div>
                                    <div className="formItemBox submitButton">
                                        <Button
                                            sx={{textTransform: "none"}} 
                                            variant="contained" 
                                            size="small"
                                            onClick={() => this.handleSubmitForm()}>Rechercher</Button>
                                    </div>
                                </div>
                            </div>
                            
                        </div>
                    </div>
                </div>
                <div className="bg-overlay" onClick={() => this.props.changeAdvanceSearchPopupStatusHandler(false)}></div>
            </div>
        );
    }
}

export default AdvanceSearch;