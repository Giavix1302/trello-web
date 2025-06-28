import Box from '@mui/material/Box'
import ListColumns from './ListColumns/ListColumns'
import { mapOrder } from '~/utils/sorts'
import {
  DndContext,
  // PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  defaultDropAnimationSideEffects,
  closestCorners,
  pointerWithin,
  getFirstCollision
} from '@dnd-kit/core'
import { MouseSensor, TouchSensor } from '~/customLibs/DndKitSensors'
import { useEffect, useState, useCallback, useRef } from 'react'
import { cloneDeep, isEmpty } from 'lodash'
import { arrayMove } from '@dnd-kit/sortable'
import { generatePlaceholderCard } from '~/utils/formatters'

import Column from './ListColumns/Column/Column'
import Card from './ListColumns/Column/ListCards/Card/Card'

const ACTIVE_DRAG_ITEM_TYPE = {
  COLUMN: 'ACTIVE_DRAG_ITEM_TYPE_COLUMN',
  CARD: 'ACTIVE_DRAG_ITEM_TYPE_CARD'
}

function BoardContent({ board, createNewColumn, createNewCard }) {
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

  // điểm va chạm cuối cùng trước đó (thuật toán phát hiện va chạm)
  const lastOverId = useRef(null)

  const [oldColWhenDraggingCard, setOldColWhenDraggingCard] = useState(null)

  useEffect(() => {
    setOrderedColumn(mapOrder(board?.columns, board?.columnOrderIds, '_id'))
  }, [board])

  const findColumnByCardId = (cardId) => {
    return orderedColumn.find(column => column.cards.map(card => card._id).includes(cardId))
  }

  // cập nhật lại state trong trường hợp duy chuyển card giữa các column
  const moveCardBetweenDifferentColumns = (
    overColumn,
    overCardId,
    active,
    over,
    activeColumn,
    activeDraggingCardId,
    activeDraggingCardData
  ) => {
    setOrderedColumn(prevColumn => {
      // tìm vị trí index của cái overCard trong column đích (nơi mà card được kéo tới)
      const overCardIndex = overColumn?.cards?.findIndex(c => c._id === overCardId)

      // Logic tinhs toans "cardIndex" mới (trên hoặc dưới overCard) lấy chuẩn ra từ code của thư viện
      let newCardIndex
      const isBelowOverItem = active.rect.current.translated &&
        active.rect.current.translated.top > over.rect.top + over.rect.height
      const modifier = isBelowOverItem ? 1 : 0
      newCardIndex = overCardIndex >= 0 ? overCardIndex + modifier : overColumn?.cards?.length + 1

      // Clone mảng OrderedColumnState cũ ra một cái mới để xử lí data rồi return - cập nhật lại cho OrderedColumnState
      const nextColumns = cloneDeep(prevColumn)
      const nextActiveColumn = nextColumns.find(column => column._id === activeColumn._id)
      const nextOverColumn = nextColumns.find(column => column._id === overColumn._id)

      if (nextActiveColumn) {
        // xóa card ở column active (column cũ) lúc mà kéo card ra khỏi nó để sang column khác
        nextActiveColumn.cards = nextActiveColumn.cards.filter(card => card._id !== activeDraggingCardId)

        // Thêm placeholder card vào column cũ nếu column cũ rỗng
        if (isEmpty(nextActiveColumn?.cards)) {
          nextActiveColumn.cards = [generatePlaceholderCard(nextActiveColumn)]
        }

        // Cập nhật lại columnOrderIds của column active (column cũ) sau khi đã xóa card
        nextActiveColumn.cardOrderIds = nextActiveColumn.cards.map(card => card._id)
      }
      // column mowis
      if (nextOverColumn) {
        // kiểm tra xem card đang kéo có tồn tại ở overColumn hay không nếu có thì xóa nó trước
        nextOverColumn.cards = nextOverColumn.cards.filter(card => card._id !== activeDraggingCardId)

        // phải cập nhật lại columnId cho card mới vì nó đã được di chuyển sang column khác
        const rebuild_activeDraggingCardData = {
          ...activeDraggingCardData,
          columnId: nextOverColumn._id // cập nhật lại columnId cho card mới
        }

        // Thêm card vào column đích (column mới) ở vị trí mới (toSpliced() tạo ra mạng mới)
        nextOverColumn.cards = nextOverColumn.cards.toSpliced(newCardIndex, 0, rebuild_activeDraggingCardData)

        nextOverColumn.cards = nextOverColumn.cards.filter(card => !card?.FE_PlaceholderCard) // xóa card placeholder đi nếu có

        // Cập nhật lại columnOrderIds của column đích (column mới) sau khi đã thêm card
        nextOverColumn.cardOrderIds = nextOverColumn.cards.map(card => card._id)
      }
      return nextColumns
    })
  }


  // Trigger khi bat dau kéo
  const handleDragStart = (e) => {
    setActiveDragItemId(e?.active?.id)
    setActiveDragItemType(e?.active?.data?.current?.columnId ? ACTIVE_DRAG_ITEM_TYPE.CARD : ACTIVE_DRAG_ITEM_TYPE.COLUMN)
    setActiveDragItemData(e?.active?.data?.current)

    // Nếu là kéo card thì mới thực hiện hành động set oldColWhenDraggingCard
    if (e?.active?.data?.current?.columnId) {
      setOldColWhenDraggingCard(findColumnByCardId(e?.active?.id))
    }
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
      moveCardBetweenDifferentColumns(
        overColumn,
        overCardId,
        active,
        over,
        activeColumn,
        activeDraggingCardId,
        activeDraggingCardData
      )
    }


  }

  // Trigger khi kéo xong
  const handleDragEnd = (e) => {
    const { active, over } = e

    // Nếu không có over thì không làm gì cả (đã kéo ra ngoài khung) tránh lỗi
    if (!over || !active) return

    if (activeDragItemType === ACTIVE_DRAG_ITEM_TYPE.CARD) {
      // activeDraggingCard: là cái card đang được kéo
      const { id: activeDraggingCardId, data: { current: activeDraggingCardData } } = active
      // overCard là card đang tương tác với với cái card được kéo ở trên
      const { id: overCardId } = over

      // Tìm 2 cái column theo cardId
      const activeColumn = findColumnByCardId(activeDraggingCardId)
      const overColumn = findColumnByCardId(overCardId)


      // Nếu không tồn tại 1 trong 2 column thì không làm gì cả
      if (!activeColumn || !overColumn) return

      // Hành động nếu kéo card qua column khác
      // Phải dùng tới activeDragItemData.columnId hoặc oldColWhenDraggingCard._id (set vào state từ bước handleDragStart)
      // chứ không phải activeColumn._id trong scope handleDragEnd này vì sau khi đi qua onDảgOver thì activeColumn đã bị cập nhật lại rồi
      if (oldColWhenDraggingCard._id !== overColumn._id) {
        moveCardBetweenDifferentColumns(
          overColumn,
          overCardId,
          active,
          over,
          activeColumn,
          activeDraggingCardId,
          activeDraggingCardData
        )
      } else {
        // hành động kéo thả card trong cùng 1 column
        // Lấy ra vị trí cũ từ oldColWhenDraggingCard
        const oldCardIndex = oldColWhenDraggingCard?.cards?.findIndex(c => c._id === activeDragItemId)
        // Tìm vị trí mới từ over
        const newCardIndex = overColumn?.cards?.findIndex(c => c._id === overCardId)
        // dùng arrayMove của Dndkit để sắp xếp lại các card trong column (tương tự như column)
        const dndOrderedCard = arrayMove(oldColWhenDraggingCard?.cards, oldCardIndex, newCardIndex)

        setOrderedColumn(prevColumn => {
          // Clone mảng OrderedColumnState cũ ra một cái mới để xử lí data rồi return - cập nhật lại cho OrderedColumnState
          const nextColumns = cloneDeep(prevColumn)

          // Tìm tới column đang thả
          const targetColumn = nextColumns.find(column => column._id === overColumn._id)
          // cập nhật lại 2 giá trị mới là card và cartOrderIds
          targetColumn.cards = dndOrderedCard
          targetColumn.cardOrderIds = dndOrderedCard.map(card => card._id)

          // trả về giá trị state mới chuẩn vị trí
          return nextColumns
        })
      }
    }

    if (activeDragItemType === ACTIVE_DRAG_ITEM_TYPE.COLUMN) {
      if (active.id !== over.id) {
        // Tìm vị trí cũ từ active
        const oldColumnIndex = orderedColumn.findIndex(c => c._id === active.id)
        // Tìm vị trí mới từ over
        const newColumnIndex = orderedColumn.findIndex(c => c._id === over.id)

        // Dùng arrayMove của Dndkit để sắp xếp lại các column ban đầu
        const dndOrderedColumns = arrayMove(orderedColumn, oldColumnIndex, newColumnIndex)
        // 2 clg dữ liệu này dùng để xử lí gọi api
        // const dnsColumnOrderIds = dndOrderedColumns.map(c => c._id)
        // console.log("dndOrderedColumns:" + dndOrderedColumns);
        // console.log("dnsColumnOrderIds:" + dnsColumnOrderIds);

        setOrderedColumn(dndOrderedColumns)
      }
    }

    setActiveDragItemId(null)
    setActiveDragItemType(null)
    setActiveDragItemData(null)
    setOldColWhenDraggingCard(null)
  }
  /**
   * Animation khi thả (drop) phần tử - Test bằng cách kéo xong thả trực tiếp và nhìn phần giữ chỗ Overlay
   */
  const dropAnimation = {
    sideEffects: defaultDropAnimationSideEffects({ styles: { active: { opacity: '0.5' } } })
  }
  // custom lại thuật toán phát hiện va chạm để tốt ưu hóa việc kéo thả card giữa các column
  const collisionDetectionStrategy = useCallback((args) => {
    if (activeDragItemType === ACTIVE_DRAG_ITEM_TYPE.COLUMN) {
      return closestCorners({ ...args })
    }
    // Tìm các điểm giao nhau, va chạm
    const pointerIntersection = pointerWithin(args)
    // ra khỏi khu vực kéo thả thì return
    if (!pointerIntersection?.length) return

    // const intersection = pointerIntersection?.length > 0
    //   ? pointerIntersection
    //   : rectIntersection(args)

    // tìm overId đầu tiên trong đám pointerIntersection ở trên
    let overId = getFirstCollision(pointerIntersection, 'id')
    // console.log('overId', overId)4
    if (overId) {
      // nếu overId là column thì tìm đến card gần nhất trong column đó dựa vào thuật toán phát hiện va chạm closestCorners (mượt hơn)
      const checkColumn = orderedColumn.find(column => column._id === overId)
      if (checkColumn) {
        // console.log('overId before', overId);
        overId = closestCorners({
          ...args,
          droppableContainers: args.droppableContainers.filter(container => {
            return container.id !== overId && checkColumn?.cardOrderIds.includes(container.id)
          })
        })[0]?.id
        // console.log('overId after', overId);
      }

      lastOverId.current = overId
      return [{ id: overId }]
    }

    // nếu overId là null thì trả về mạng rỗng - tránh crash trang
    return lastOverId.current ? [{ id: lastOverId.current }] : []
  }, [activeDragItemType, orderedColumn])

  return (
    <DndContext
      sensors={sensors}
      // Thuật toán phát hiện va chạm

      // dùng closestCorners sẽ có bug flickering + sai lệch dữ liệu
      // collisionDetection={closestCorners}
      // tự custom collisionDetection
      collisionDetection={collisionDetectionStrategy}
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
        <ListColumns
          columns={orderedColumn}
          createNewColumn={createNewColumn}
          createNewCard={createNewCard}
        />
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