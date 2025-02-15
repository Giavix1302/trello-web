import AccessAlarm from '@mui/icons-material/AccessAlarm'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import useMediaQuery from '@mui/material/useMediaQuery'

import {
  useColorScheme
} from '@mui/material/styles'
import React from 'react'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'

import LightModeIcon from '@mui/icons-material/LightMode'
import SettingsBrightnessIcon from '@mui/icons-material/SettingsBrightness'
import DarkModeOutlinedIcon from '@mui/icons-material/DarkModeOutlined'

import Box from '@mui/material/Box'


function SelectSmall() {
  const { mode, setMode } = useColorScheme()

  const handleChange = (event) => {
    setMode(event.target.value)
  };

  return (
    <FormControl sx={{ m: 1, minWidth: 120 }} size="small">
      <InputLabel id="label-select-dark-light-mode">Mode</InputLabel>
      <Select
        labelId="label-select-dark-light-mode"
        id="select-dark-light-mode"
        value={mode}
        label="Mode"
        onChange={handleChange}
      >
        <MenuItem value='light'>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <LightModeIcon fontSize='small' /> Light
          </div>
        </MenuItem>
        <MenuItem value='dark'>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <DarkModeOutlinedIcon fontSize='small' /> Dark
          </Box>
        </MenuItem>
        <MenuItem value='system'>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <SettingsBrightnessIcon fontSize='small' /> System
          </Box>
        </MenuItem>
      </Select>
    </FormControl>
  );
}


// function ModeToggle() {
//   const { mode, setMode } = useColorScheme()
//   const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)')
//   const prefersLightMode = useMediaQuery('(prefers-color-scheme: light)')
//   console.log('prefersDarkMode:', prefersDarkMode)
//   console.log('prefersLightMode:', prefersLightMode)
//   return (
//     <Button
//       onClick={() => {
//         setMode(mode === 'light' ? 'dark' : 'light')
//       }}
//     >
//       {mode === 'light' ? 'Turn dark' : 'Turn light'}
//     </Button>
//   )
// }

function App() {
  return (
    <>
      <p>Gia vi</p>

      <SelectSmall />

      <Typography variant="body2" color="text.secondary">  h1. Heading </Typography>

      <Button variant="text">Text</Button>
      <Button variant="contained">Contained </Button>
      <Button variant="outlined">Outlined</Button>
      <AccessAlarm />
    </>
  )
}

export default App
