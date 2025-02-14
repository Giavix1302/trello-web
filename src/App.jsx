import AccessAlarm from '@mui/icons-material/AccessAlarm'
import Button from '@mui/material/Button'
import HomeIcon from '@mui/icons-material/Home'
import { pink } from '@mui/material/colors'
import Typography from '@mui/material/Typography'

function App() {
  return (
    <>
      <p>Gia vi</p>

      <Typography variant="body2" color="text.secondary">  h1. Heading </Typography>

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
