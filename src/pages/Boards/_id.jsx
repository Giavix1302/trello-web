import Container from '@mui/material/Container'
import AppBar from '~/components/AppBar/AppBar'
import BoardBar from './BoardBar/BoardBar'
import BoardContent from './BoardContent/BoardContent'
import { mockData } from '~/apis/mock-data'
import { useState, useEffect } from 'react'
import { fetchBoardDetailsAPI } from '~/apis'

function Board() {
  console.log(mockData);

  const [board, setBoard] = useState(null)

  useEffect(() => {
    const boardId = '6844047337005c21237d80bf'
    // call api
    fetchBoardDetailsAPI(boardId)
      .then((board) => {
        setBoard(board)
      })
  }, [])

  return (
    <Container disableGutters maxWidth={false} sx={{ height: '100vh' }}>
      <AppBar />
      <BoardBar board={mockData.board} />
      <BoardContent board={mockData.board} />
    </Container>
  )
}

export default Board
