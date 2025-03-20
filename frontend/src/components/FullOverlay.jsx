import React from 'react';
import Box from '@mui/material/Box';

const FullOverlay = ({ children, sx, ...props }) => {
  return (
    <Box
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        display: 'flex',
        justifyContent: 'center', // Center horizontally
        alignItems: 'center', // Center vertically
        ...sx, // Allow additional styles to override the default ones
      }}
      {...props}
    >
      {children}
    </Box>
  );
};

export default FullOverlay;