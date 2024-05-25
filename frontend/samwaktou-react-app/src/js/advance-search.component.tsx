import React from "react";
import TextField from '@mui/material/TextField';
import Autocomplete from '@mui/material/Autocomplete';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterMoment } from '@mui/x-date-pickers/AdapterMoment'
import { Button } from "@mui/material";
import moment from "moment";
import '../style/popupView.css'
import '../style/searchBar.css';

class AdvanceSearch extends React.Component {
    constructor(props){
        super(props);
        this.state = {
            advanceSearchValues: {
                keywords: this.props.advanceSearchValues?.keywords ? this.props.advanceSearchValues.keywords:"",
                author: this.props.advanceSearchValues?.author ? this.props.advanceSearchValues.author:null,
                theme: this.props.advanceSearchValues?.theme ? this.props.advanceSearchValues.theme:null,
                minDate: this.props.advanceSearchValues?.minDate ? this.props.advanceSearchValues.minDate:null,
                maxDate: this.props.advanceSearchValues?.maxDate ? this.props.advanceSearchValues.maxDate:null
            },
            errorMessage: ""
        }
    }

    handleMinDateChange = (date) => {
        this.setState({
            advanceSearchValues:{
                ...this.state.advanceSearchValues,
                minDate: date
            }
        });
    }

    handleMaxDateChange = (date) => {
        this.setState({
            advanceSearchValues:{
                ...this.state.advanceSearchValues,
                maxDate: date
            }
        });
    }

    handleSubmitForm = () => {
        const isMinDateFormatValid = !this.state.advanceSearchValues?.minDate || moment(this.state.advanceSearchValues?.minDate, "DD-MM-YYYY").isValid();
        const isMaxDateFormatValid = !this.state.advanceSearchValues?.maxDate || moment(this.state.advanceSearchValues?.maxDate, "DD-MM-YYYY").isValid();
        const isMinDateBeforeMaxDate = !this.state.advanceSearchValues?.minDate || !this.state.advanceSearchValues?.maxDate || moment(this.state.advanceSearchValues?.minDate).isSameOrBefore(this.state.advanceSearchValues?.maxDate);

        if(!isMinDateFormatValid) this.setState({errorMessage: "Intervale de date initial incorrect"});
        else if(!isMaxDateFormatValid) this.setState({errorMessage: "Intervale de date final incorrect"});
        else if(!isMinDateBeforeMaxDate) this.setState({errorMessage: "Intervale de date incorrect"});
        else {
            this.setState({errorMessage: ""});
            this.props.handleAdvanceSearch(this.state.advanceSearchValues);
        }
    }

    render(){
        const authorsOption = {
            options: this.props.authors,
        };
        const themesOption = {
            options: this.props.themes,
        };

        const fontStyle={
            style: {
                fontSize: "13px"
            }
        }

        return(
            <div className={"custom-model-main " + (this.props.shouldDisplayAdvanceSearchView? "model-open" : "")}>
                <div className="custom-model-inner">
                    <div className="close-btn" onClick={() => this.props.changeAdvanceSearchPopupStatus(false)}>×</div>
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
                                            onChange={(even, value) => this.setState({advanceSearchValues:{...this.state.advanceSearchValues, author: value}})}
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
                                            onChange={(even, value) => this.setState({advanceSearchValues:{...this.state.advanceSearchValues, theme: value}})}
                                        /> 
                                    </div>

                                    <div className="formItemBox">
                                        <LocalizationProvider dateAdapter={AdapterMoment}>
                                            <DatePicker
                                                label="Après le "
                                                id="minDate"
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
                                                onChange={(value) => this.setState({advanceSearchValues:{...this.state.advanceSearchValues, minDate: value}})}
                                            />
                                            <DatePicker
                                                label="Avant le "
                                                id="maxDate"
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
                                                onChange={(value) => this.setState({advanceSearchValues:{...this.state.advanceSearchValues, maxDate: value}})}
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
                <div className="bg-overlay" onClick={() => this.props.changeAdvanceSearchPopupStatus(false)}></div>
            </div>
        );
    }
}

export default AdvanceSearch;