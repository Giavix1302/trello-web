import Container from '@mui/material/Container'
import AppBar from '~/components/AppBar/AppBar'
import BoardBar from './BoardBar/BoardBar'
import BoardContent from './BoardContent/BoardContent'
import { generatePlaceholderCard } from '~/utils/formatters'
import { isEmpty } from 'lodash'
// import { mockData } from '~/apis/mock-data'
import { useState, useEffect } from 'react'
import { fetchBoardDetailsAPI, createNewColumnAPI, createNewCardAPI } from '~/apis'

function Board() {
  // console.log(mockData);

  const [board, setBoard] = useState(null)

  useEffect(() => {
    const boardId = '6844047337005c21237d80bf'
    // call api
    fetchBoardDetailsAPI(boardId)
      .then((board) => {
        board.columns.forEach(column => {
          // xử lí kéo thả với column rỗng
          if (isEmpty(column.cards)) {
            column.cards = [generatePlaceholderCard(column)]
            column.cardOrderIds = [generatePlaceholderCard(column)._id]
          }
        })
        setBoard(board)
      })
  }, [])

  // tạo dự liệu column + làm lại dự liệu state board
  const createNewColumn = async (newColumnData) => {
    const createdColumn = await createNewColumnAPI({
      ...newColumnData,
      boardId: board._id
    })
    // thêm card giữ chỗ khi tạo column mới
    createdColumn.cards = [generatePlaceholderCard(createdColumn)]
    createdColumn.cardOrderIds = [generatePlaceholderCard(createdColumn)._id]

    // cập nhật state board
    const newBoard = { ...board }
    newBoard.columns.push(createdColumn)
    newBoard.columnOrderIds.push(createdColumn._id)
    setBoard(newBoard)
  }

  // tạo dự liệu card + làm lại dự liệu state board
  const createNewCard = async (newCardData) => {
    const createdCard = await createNewCardAPI({
      ...newCardData,
      boardId: board._id
    })

    // cập nhật state board
    const newBoard = { ...board }
    const columnToUpdate = newBoard.columns.find(column => column._id === createdCard.columnId)
    if (columnToUpdate) {
      columnToUpdate.cards.push(createdCard)
      columnToUpdate.cardOrderIds.push(createdCard._id)
    }
    setBoard(newBoard)
  }

  return (
    <Container disableGutters maxWidth={false} sx={{ height: '100vh' }}>
      <AppBar />
      <BoardBar board={board} />
      <BoardContent
        board={board}
        createNewColumn={createNewColumn}
        createNewCard={createNewCard}
      />
    </Container>
  )
}

export default Board
