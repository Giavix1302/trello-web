import Box from '@mui/material/Box'
import ListColumns from './ListColumns/ListColumns'
import { mapOrder } from '~/utils/sorts'
import {
  DndContext,
  // PointerSensor,
  useSensor,
  useSensors,
  MouseSensor,
  TouchSensor
} from '@dnd-kit/core'
import { useEffect, useState } from 'react'
import { arrayMove } from '@dnd-kit/sortable'

function BoardContent({ board }) {
  // Yêu cần chuột di chuyển 15px thì mới kích hoạt event, fix trường hợp click vào column
  // Nếu dùng PointerSensor mặc định thì phải kế hợp với thuộc tính css touchAction: 'none' ở những phần tử kéo thả
  // const pointerSensor = useSensor(PointerSensor, { activationConstraint: { distance: 10 } })

  const mouseSensor = useSensor(MouseSensor, { activationConstraint: { distance: 10 } })

  // Nhấn giữ 250ms và dung sai của cảm ứng 500 thì mới kích hoạt event
  const touchSensor = useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 500 } })

  // Ưu tiên sử dụng kết hợp 2 loại sensor Touch và Mouse để có trải nghiệm trên mobile tốt nhất
  //const sensors = useSensors(pointerSensor)
  const sensors = useSensors(mouseSensor, touchSensor)

  const [orderedColumn, setOrderedColumn] = useState([])

  useEffect(() => {
    setOrderedColumn(mapOrder(board?.columns, board?.columnOrderIds, '_id'))
  }, [board])

  const handleDragEnd = (e) => {
    const { active, over } = e

    // Nếu không có over thì không làm gì cả (đã kéo ra ngoài khung) tránh lỗi
    if (!over) return

    if (active.id !== over.id) {
      // Tìm vị trí cũ từ active
      const oldIndex = orderedColumn.findIndex(c => c._id === active.id)
      // Tìm vị trí mới từ over
      const newIndex = orderedColumn.findIndex(c => c._id === over.id)

      // Dùng arrayMove của Dndkit để sắp xếp lại các column ban đầu
      const dndOrderedColumns = arrayMove(orderedColumn, oldIndex, newIndex)
      // 2 clg dữ liệu này dùng để xử lí gọi api
      // const dnsColumnOrderIds = dndOrderedColumns.map(c => c._id)
      // console.log("dndOrderedColumns:" + dndOrderedColumns);
      // console.log("dnsColumnOrderIds:" + dnsColumnOrderIds);

      setOrderedColumn(dndOrderedColumns)
    }
  }

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <Box sx={{
        backgroundColor: (theme) => (theme.palette.mode === 'dark' ? '#34495e' : '#1976d2'),
        height: (theme) => theme.trello.boardContentHeight,
        width: '100%',
        p: '10px 0'

      }}>
        <ListColumns columns={orderedColumn} />
      </Box>
    </DndContext>
  )
}

export default BoardContent