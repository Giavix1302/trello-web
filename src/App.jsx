import { AccessAlarm, ThreeDRotation } from '@mui/icons-material'
import Button from '@mui/material/Button'
import HomeIcon from '@mui/icons-material/Home'
import { pink } from '@mui/material/colors'

function App() {
  return (
    <>
      <p>Gia vi</p>
      <Button variant="text">Text</Button>
      <Button variant="contained">Contained </Button>
      <Button variant="outlined">Outlined</Button>
      <AccessAlarm />
      <br/>
      <HomeIcon />
      <HomeIcon color="primary" />
      <HomeIcon color="secondary" />
      <HomeIcon color="success" />
      <HomeIcon color="action" />
      <HomeIcon color="disabled" />
      <HomeIcon sx={{ color: pink[500] }} />
    </>
  )
}

export default App
