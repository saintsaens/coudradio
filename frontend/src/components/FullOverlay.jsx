import React from 'react';
import Box from '@mui/material/Box';

const FullOverlay = React.forwardRef(({ children, sx, ...props }, ref) => {
  return (
    <Box
      ref={ref}
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'background.default',
        ...sx,
      }}
      {...props}
    >
      {children}
    </Box>
  );
});

FullOverlay.displayName = 'FullOverlay';

export default FullOverlay;