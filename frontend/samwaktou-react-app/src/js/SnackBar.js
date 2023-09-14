import Snackbar from '@mui/material/Snackbar';
import MuiAlert from '@mui/material/Alert';


export function SnackBarAlert(props){
    return  <Snackbar 
              anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
              open={props.openSnackBarAlert} 
              autoHideDuration={props.duration} 
              onClose={props.handleCloseSnackBarAlert}
            >
              <MuiAlert 
                elevation={6} 
                variant="filled"
                onClose={props.handleCloseSnackBarAlert} 
                severity={props.severity}
              >
                {props.message}
              </MuiAlert>
            </Snackbar>
}


export function SimpleSnackBar(props){
    return <Snackbar 
              ContentProps={{
                sx: {
                  display: 'block',
                  textAlign: "center"
                }
              }}
              anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
              open={props.openSimpleSnackBar} 
              autoHideDuration={props.duration} 
              onClose={props.handleCloseSimpleSnackBar}
              message={props.message}
            />
}
