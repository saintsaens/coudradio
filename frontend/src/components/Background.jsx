import React from 'react';
import Box from '@mui/material/Box';

export default function Background({ children, sx, ...props }){
  return (
    <Box
      sx={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        zIndex: -1, // Ensures it stays behind everything
        ...sx, // Allow additional styles to override the default ones
      }}
      {...props}
    >
      {children}
    </Box>
  );
}
