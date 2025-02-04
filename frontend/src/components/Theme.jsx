import { createTheme } from '@mui/material/styles';

export const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#041c32',
    },
    secondary: {
      main: '#ECB365',
    },
    typography: {
      h2: {
        color: "grey",
        fontFamily: "monospace"
      },
    }
  },
});
