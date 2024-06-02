import Snackbar from '@mui/material/Snackbar';
import MuiAlert from '@mui/material/Alert';


type BaseSnackBarProps = {
  duration?: number;
  message: string;
  shouldOpen: boolean;
  handleCloseSnackBar: () => void;
}

type SnackBarAlertProps = BaseSnackBarProps & {
  severity : "success" | "error";
}

export const SnackBarAlert: React.FC<SnackBarAlertProps> = (props: SnackBarAlertProps) => {
    return  <Snackbar 
              anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
              open={props.shouldOpen} 
              autoHideDuration={props.duration?? 2000} 
              onClose={props.handleCloseSnackBar}
            >
              <MuiAlert 
                elevation={6} 
                variant="filled"
                onClose={props.handleCloseSnackBar} 
                severity={props.severity}
              >
                {props.message}
              </MuiAlert>
            </Snackbar>
}

export const SimpleSnackBar: React.FC<BaseSnackBarProps> = (props: BaseSnackBarProps) => {
    return <Snackbar 
              ContentProps={{
                sx: {
                  display: 'block',
                  textAlign: "center"
                }
              }}
              anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
              open={props.shouldOpen} 
              autoHideDuration={props.duration} 
              onClose={props.handleCloseSnackBar}
              message={props.message}
            />
}
