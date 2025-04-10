import Box from '@mui/material/Box'
import ListColumns from './ListColumns/ListColumns'
import { mapOrder } from '~/utils/sorts'
import {
  DndContext,
  // PointerSensor,
  useSensor,
  useSensors,
  MouseSensor,
  TouchSensor,
  DragOverlay,
  defaultDropAnimationSideEffects
} from '@dnd-kit/core'
import { useEffect, useState } from 'react'
import { cloneDeep } from 'lodash'
import { arrayMove } from '@dnd-kit/sortable'

import Column from './ListColumns/Column/Column'
import Card from './ListColumns/Column/ListCards/Card/Card'

const ACTIVE_DRAG_ITEM_TYPE = {
  COLUMN: 'ACTIVE_DRAG_ITEM_TYPE_COLUMN',
  CARD: 'ACTIVE_DRAG_ITEM_TYPE_CARD'
}

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
  // console.log('orderedColumn', orderedColumn);

  // cùng 1 thời điểm chỉ có 1 phần tử được kéo (column hoặc card)
  const [activeDragItemId, setActiveDragItemId] = useState(null)
  const [activeDragItemType, setActiveDragItemType] = useState(null)
  const [activeDragItemData, setActiveDragItemData] = useState(null)

  useEffect(() => {
    setOrderedColumn(mapOrder(board?.columns, board?.columnOrderIds, '_id'))
  }, [board])

  const findColumnByCardId = (cardId) => {
    return orderedColumn.find(column => column.cards.map(card => card._id).includes(cardId))
  }

  // Trigger khi bat dau kéo
  const handleDragStart = (e) => {
    setActiveDragItemId(e?.active?.id)
    setActiveDragItemType(e?.active?.data?.current?.columnId ? ACTIVE_DRAG_ITEM_TYPE.CARD : ACTIVE_DRAG_ITEM_TYPE.COLUMN)
    setActiveDragItemData(e?.active?.data?.current)
  }

  // Trigger trong quá trình kéo 1 phần tử
  const handleDragOver = (e) => {

    // Không làm gì cả neensu như kéo column
    if (activeDragItemType === ACTIVE_DRAG_ITEM_TYPE.COLUMN) return

    // còn nếu kéo card thì xử lí thêm để có thể kéo card qua lại giữa các column
    // console.log('handleDragOver:', e)
    const { active, over } = e
    // Cần đảm bảo nếu không tồn tại active hoặc over (khi kéo ra khỏi phạm vi container) thì không làm gì cả tránh crash trang
    if (!active || !over) return

    // activeDraggingCard: là cái card đang được kéo
    const { id: activeDraggingCardId, data: { current: activeDraggingCardData } } = active
    // overCard là card đang tương tác với với cái card được kéo ở trên
    const { id: overCardId } = over

    // Tìm 2 cái column theo cardId
    const activeColumn = findColumnByCardId(activeDraggingCardId)
    const overColumn = findColumnByCardId(overCardId)
    // console.log('activeColumn', activeColumn)
    // console.log('overColumn', overColumn)

    // Nếu không tồn tại 1 trong 2 column thì không làm gì cả
    if (!activeColumn || !overColumn) return

    // xử lí logic chỉ khi kéo card qua column khác
    // Vì đây đang làm xử lí lúc kéo (dragOver), còn xử lí lúc kéo thả xong xuôi là ở dragEnd
    if (activeColumn._id !== overColumn._id) {
      setOrderedColumn(prevColumn => {
        // tìm vị trí index của cái overCard trong column đích (nơi mà card được kéo tới)
        const overCardIndex = overColumn?.cards.findIndex(c => c._id === overCardId)
        console.log('overCardIndex', overCardIndex);

        // Logic tinhs toans "cardIndex" mới (trên hoặc dưới overCard) lấy chuẩn ra từ code của thư viện
        let newCardIndex
        const isBelowOverItem = active.rect.current.translated &&
          active.rect.current.translated.top > over.rect.top + over.rect.height
        const modifier = isBelowOverItem ? 1 : 0
        newCardIndex = overCardIndex >= 0 ? overCardIndex + modifier : overColumn.cards.length + 1

        // Clone mảng OrderedColumnState cũ ra một cái mới để xử lí data rồi return - cập nhật lại cho OrderedColumnState
        const nextColumns = cloneDeep(prevColumn)
        const nextActiveColumn = nextColumns.find(column => column._id === activeColumn._id)
        const nextOverColumn = nextColumns.find(column => column._id === overColumn._id)

        if(nextActiveColumn) {
          // xóa card ở column active (column cũ) lúc mà kéo card ra khỏi nó để sang column khác
          nextActiveColumn.cards = nextActiveColumn.cards.filter(card => card._id !== activeDraggingCardId)
          // Cập nhật lại columnOrderIds của column active (column cũ) sau khi đã xóa card
          nextActiveColumn.columnOrderIds = nextActiveColumn.cards.map(card => card._id)
        }
        if(nextOverColumn) {
          // kiểm tra xem card đang kéo có tồn tại ở overColumn hay không nếu có thì xóa nó trước
          nextOverColumn.cards = nextOverColumn.cards.filter(card => card._id !== activeDraggingCardId)

          // Thêm card vào column đích (column mới) ở vị trí mới (toSpliced() tạo ra mạng mới)
          nextOverColumn.cards = nextOverColumn.cards.toSpliced(newCardIndex, 0, activeDraggingCardData)

          // Cập nhật lại columnOrderIds của column đích (column mới) sau khi đã thêm card
          nextOverColumn.columnOrderIds = nextOverColumn.cards.map(card => card._id)
        }
        return nextColumns
      })
    }


  }

  // Trigger khi kéo xong
  const handleDragEnd = (e) => {

    if (activeDragItemType === ACTIVE_DRAG_ITEM_TYPE.CARD) {
      // console.log("kéo card")
      return
    }

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
    setActiveDragItemId(null)
    setActiveDragItemType(null)
    setActiveDragItemData(null)
  }
  /**
   * Animation khi thả (drop) phần tử - Test bằng cách kéo xong thả trực tiếp và nhìn phần giữ chỗ Overlay
   */
  const dropAnimation = {
    sideEffects: defaultDropAnimationSideEffects({ styles: { active: { opacity: '0.5' } } })
  }

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <Box sx={{
        backgroundColor: (theme) => (theme.palette.mode === 'dark' ? '#34495e' : '#1976d2'),
        height: (theme) => theme.trello.boardContentHeight,
        width: '100%',
        p: '10px 0'

      }}>
        <ListColumns columns={orderedColumn} />
        <DragOverlay dropAnimation={dropAnimation}>
          {!activeDragItemType && null}
          {(activeDragItemType === ACTIVE_DRAG_ITEM_TYPE.COLUMN) && <Column column={activeDragItemData} />}
          {(activeDragItemType === ACTIVE_DRAG_ITEM_TYPE.CARD) && <Card card={activeDragItemData} />}
        </DragOverlay>
      </Box>
    </DndContext>
  )
}

export default BoardContent