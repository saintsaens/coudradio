import React from 'react';
import './styles/style.css';
import '@fontsource/roboto/300.css';
import '@fontsource/roboto/400.css';
import '@fontsource/roboto/500.css';
import '@fontsource/roboto/700.css';
import { theme } from "./components/Theme";
import { ThemeProvider, CssBaseline } from "@mui/material";
import { BrowserRouter as Router } from 'react-router-dom';
import AppRoutes from "./components/AppRoutes";

console.log('%cWelcome to Coudradio!', 'color: #ECB365');

const App = () => {
    return (
        <>
            <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
                <ThemeProvider theme={theme}>
                    <CssBaseline />
                    <AppRoutes />
                </ThemeProvider>
            </Router>
        </>
    );
}

export default App;
