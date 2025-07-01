import CssBaseline from '@mui/material/CssBaseline'
// import React from 'react'
import ReactDOM from 'react-dom/client'
import { Experimental_CssVarsProvider as CssVarsProvider } from '@mui/material/styles'
import theme from '~/theme.js'
import App from '~/App.jsx'
// cau hinh react-toastify
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
// cau hinh mui dialog
import { ConfirmProvider } from 'material-ui-confirm'

ReactDOM.createRoot(document.getElementById('root')).render(
  // <React.StrictMode>
  <CssVarsProvider theme={theme}>
    <ConfirmProvider
      defaultOptions={{
        dialogProps: { maxWidth: 'xs' },
        confirmationButtonProps: { variant: 'contained', color: 'primary' },
        allowClose: false
      }}>
      <CssBaseline />
      <App />
      <ToastContainer position='bottom-right' />
    </ConfirmProvider>
  </CssVarsProvider>
  // </React.StrictMode>
)
