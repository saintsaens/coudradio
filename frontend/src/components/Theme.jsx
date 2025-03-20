import { createTheme } from '@mui/material/styles';

export const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#041C32',
    },
    secondary: {
      main: '#04293A',
    },
    third: {
      main: "#064663",
      fourth: "#ECB365"
    },
    fourth: {
      main: "#ECB365"
    },
    text: {
      primary: '#ECB365',
      secondary: '#041c32',
      third: '#064663',
      fourth: '#ECB365',
    },
    background: {
      default: '#041C32',
      paper: '#02101F',
    },
  },
  typography: {
    fontFamily: "iA Writer Duospace",
  }
});
