'use client'

import React, { JSXElementConstructor, ReactElement, ReactNode, useEffect, useRef, useState } from 'react'
import MorphingColorPicker from './colorboard/page'

interface Camera {
    x: number,
    y: number,
    zoom: number
}

interface Box {
    activeId: string,
    x: number,
    y: number,
    color: string
}

interface DragRef {
    isDragging: boolean ,
    mode: 'NONE' | 'BOX' | 'CAM',
    x: number,
    y: number,
    activeId: string,
    initialBox: {x: number , y: number}
}

interface GetId {
    id: string
}

export default function InfiniteBoard() {
    const [camera , setCamera] = useState<Camera>({x: 0 , y: 0 , zoom: 1})
    const [box , setBox] = useState<Box[]>([])
    const [selectedId , setSelectedId] = useState<string | null>()

    const [isDragging , setIsDragging] = useState<Boolean>(false)
    
    const containerRef = useRef<HTMLDivElement>(null)

    const dragRef = useRef<DragRef>({
        isDragging: false,
        mode: 'NONE',
        x: 0,
        y: 0,
        activeId: '',
        initialBox: {x: 0 , y: 0}
    })

    const GRID_SIZE = camera.zoom > 1 ? 20 : 50

    // component 
    const ShowOptions = ({ id }: GetId) => {
        const [isPalletOpen , setIsPalletOpen] = useState<boolean>(false)


        const handleDelete = () => {
            setBox((prev) => (
                prev.filter((item) => item.activeId !== id)
            ))

            setSelectedId(null)
        }

        const handleColorPicker = (colorName: string) => {
            setBox((prev) => (
                prev.map((item) => {
                    if (item.activeId === id) {
                        return { ...item, color: colorName };
                    }
                    return item;
                })
            ))
        }

        const handlePosition = (id : string) => {
            const filteredBox = box.find((item) => item.activeId === id)

            if(!filteredBox) return

            const boxCenterOffset = 50
            let boxX = filteredBox?.x
            let boxY = filteredBox?.y

            const screenX = window.innerWidth / 2
            const screenY = window.innerHeight / 2

            const newX = screenX - ((boxX + boxCenterOffset) * camera.zoom);
            const newY = screenY - ((boxY + boxCenterOffset) * camera.zoom);

            setCamera((prev) => ({
                ...prev,
                x: newX,
                y: newY,
                zoom: prev.zoom 
            }));
        }

        return (
            <div
            onMouseDown={(e) => e.stopPropagation()} 
            style={{transform: `scale(${camera.zoom < 1 ? 1 / camera.zoom : '1'})`}}
            className='absolute -top-8 py-0.5 px-0.5 flex gap-2 select-none cursor-pointer bg-neutral-900 border border-neutral-800 rounded-sm'>
                <div 
                onClick={handleDelete}
                className='px-2 py-1 text-[8px] text-center rounded-xs hover:bg-red-500'>
                    S
                </div>
                <div
                onClick={() => setIsPalletOpen(v => !v)}
                className={`px-2 py-1 text-[8px] text-center rounded-xs ${isPalletOpen ? 'bg-blue-400' : 'hover:bg-neutral-600'}`}>
                    C
                </div>
                <div
                onClick={()=> handlePosition(id)} 
                className='px-2 py-1 text-[8px] text-center'>
                    V
                </div>
                <div className='px-2 py-1 text-[8px] text-center'>
                    T
                </div>
                {isPalletOpen && <MorphingColorPicker handleColorPicker={handleColorPicker}/>}
            </div>
        )
    }

    useEffect(() => {
        const container = containerRef.current
        if(!container) return

        const handleWheel = (e : WheelEvent) => {
            e.preventDefault()

            if(!e.ctrlKey && !e.metaKey) {
                setCamera(prev => ({...prev , y: prev.y - e.deltaY}))
                return
            }
            
            if((e.ctrlKey && !e.shiftKey) || e.metaKey){
                setCamera((prev) => {
                    const rect = container.getBoundingClientRect();
                    const mouseX = e.clientX - rect.left;
                    const mouseY = e.clientY - rect.top;
                    const mouseWorldX = (mouseX - prev.x) / prev.zoom;
                    const mouseWorldY = (mouseY - prev.y) / prev.zoom;
                    const zoomIntensity = 0.001;
                    const newZoom = Math.min(Math.max(0.4, prev.zoom - e.deltaY * zoomIntensity), 3);
                    const newX = mouseX - (mouseWorldX * newZoom);
                    const newY = mouseY - (mouseWorldY * newZoom);
                    return {x: newX , y: newY , zoom: newZoom}
                })
            }

            if(e.shiftKey){
                setCamera(prev => ({...prev , x: prev.x - e.deltaY}))
            }
        }

        container.addEventListener('wheel' , handleWheel , {passive : false})
        return () => container.removeEventListener('wheel', handleWheel);
    },[])

    const handleMouseDown = (e: React.MouseEvent) => {
        const target = e.target as HTMLElement;
        setIsDragging(true);

        if(e.button === 2){
            if(target === e.currentTarget){
                dragRef.current = {
                    ...dragRef.current,
                    isDragging: true,
                    mode: 'CAM',
                    x: e.clientX,
                    y: e.clientY,
                }
            }
        }

        else if (e.button === 0) {
            const boxElement = target.closest('[data-box-id]');
            if (boxElement) {
                const boxId = boxElement.getAttribute('data-box-id');
                
                // Find the box in state to get its current position
                const inBox = box.find(b => b.activeId === boxId);

                setSelectedId(boxId);
                
                if (inBox) {
                dragRef.current = {
                    isDragging: true,
                    mode: 'BOX',
                    x: e.clientX,
                    y: e.clientY,
                    activeId: boxId as string,
                    initialBox: { x: inBox.x, y: inBox.y } 
                }
                }
            }
            else {
                setSelectedId(null);
            }
            e.stopPropagation();
    }
    }

    const handleMouseMove = (e: React.MouseEvent) => {
        if (dragRef.current.isDragging === false) return

        if (dragRef.current.mode === 'CAM'){
            const dx = e.clientX - dragRef.current.x
            const dy = e.clientY - dragRef.current.y

            setCamera(prev => ({...prev , x: prev.x + dx , y: prev.y + dy}))

            dragRef.current.x = e.clientX
            dragRef.current.y = e.clientY
        }

        else if (dragRef.current.mode === 'BOX' && dragRef.current.activeId) {
            const totalDeltaX = (e.clientX - dragRef.current.x) / camera.zoom;
            const totalDeltaY = (e.clientY - dragRef.current.y) / camera.zoom;

            // 2. Calculate the "Raw" new position (where it would be without snap)
            const rawX = dragRef.current.initialBox.x + totalDeltaX;
            const rawY = dragRef.current.initialBox.y + totalDeltaY;

            // 3. Round the raw position to nearest Grid Size
            const snappedX = Math.round(rawX / GRID_SIZE) * GRID_SIZE;
            const snappedY = Math.round(rawY / GRID_SIZE) * GRID_SIZE;

            setBox(prevBoxes => prevBoxes.map(box => {
                if (box.activeId === dragRef.current.activeId) {
                return { ...box, x: snappedX, y: snappedY };
                }
                return box;
            }));
        }
    }

    const handleMouseUp = () => {
        dragRef.current.isDragging = false
        dragRef.current.mode = 'NONE'

        setIsDragging(false);
    }

    const addBox = () => {
        const viewportCenterX = window.innerWidth / 2;
        const viewportCenterY = window.innerHeight / 2;
        const worldX = (viewportCenterX - camera.x) / camera.zoom;
        const worldY = (viewportCenterY - camera.y) / camera.zoom;

        // Snap the new box spawn position too!
        const snappedX = Math.round(worldX / GRID_SIZE) * GRID_SIZE;
        const snappedY = Math.round(worldY / GRID_SIZE) * GRID_SIZE;

        const newBox: Box = {
        activeId: crypto.randomUUID(),
        x: snappedX,
        y: snappedY,
        color: `bg-cyan-500 border-cyan-200`
        };
        setBox(prev => [...prev, newBox]);
    };

    const fitToScreen = () => {
        if (box.length === 0) return

        const padding = 100
        const cardSize = 100

        let minX = Infinity
        let minY = Infinity
        let maxX = -Infinity
        let maxY = -Infinity

        box.forEach((box)=>{
            if (box.x < minX) minX = box.x
            if (box.y < minY) minY = box.y

            if (box.x + cardSize > minX) maxX = box.x + cardSize
            if (box.y + cardSize > minY) maxY = box.y + cardSize
        })

        const worldX = (maxX - minX) 
        const worldY = (maxY - minY) 
        
        const center_group_x = minX + (worldX / 2)
        const center_group_y = minY + (worldY / 2)

        const scaleX = (window.innerWidth - padding ) / worldX;
        const scaleY = (window.innerHeight - padding ) / worldY;

        let newZoom = Math.min(scaleX, scaleY);
        newZoom = Math.min(Math.max(newZoom, 0.1), 3);

        const newX = (window.innerWidth / 2) - (center_group_x * newZoom);
        const newY = (window.innerHeight / 2) - (center_group_y * newZoom);

        // 6. Update State
        setCamera({
            x: newX,
            y: newY,
            zoom: newZoom
        });
    }

    const handleZoomPlus = () => {
        setCamera((prev) => {
            // 1. Calculate the new zoom first
            const newZoom = Math.min(prev.zoom + 0.5, 3); // Max limit 3

            if (newZoom === prev.zoom) return prev; // Stop if max reached

            // 2. Calculate the center of the screen
            const viewportX = window.innerWidth / 2;
            const viewportY = window.innerHeight / 2;

            // 3. Find where that center points to in the World
            const worldX = (viewportX - prev.x) / prev.zoom;
            const worldY = (viewportY - prev.y) / prev.zoom;

            // 4. Calculate new Camera X/Y to keep that world point centered
            const newX = viewportX - (worldX * newZoom);
            const newY = viewportY - (worldY * newZoom);

            return { x: newX, y: newY, zoom: newZoom };
        });
    };

    const handleZoomReset = () => {
        setCamera((prev) => {
            const newZoom = 1

            if (newZoom === prev.zoom) return prev;

            // 2. Calculate the center of the screen
            const viewportX = window.innerWidth / 2;
            const viewportY = window.innerHeight / 2;

            // 3. Find where that center points to in the World
            const worldX = (viewportX - prev.x) / prev.zoom;
            const worldY = (viewportY - prev.y) / prev.zoom;

            // 4. Calculate new Camera X/Y to keep that world point centered
            const newX = viewportX - (worldX * newZoom);
            const newY = viewportY - (worldY * newZoom);

            return { x: newX, y: newY, zoom: newZoom };
        });
    };

    const handleZoomMinus = () => {
        setCamera((prev) => {
            const newZoom = Math.max(prev.zoom - 0.5 , 0.5)

            if (newZoom === prev.zoom) return prev;

            const viewportX = window.innerWidth / 2
            const viewportY = window.innerHeight / 2

            const worldX = (viewportX - prev.x ) / prev.zoom
            const worldY = (viewportY - prev.y ) / prev.zoom

            const newX =  viewportX - (worldX * newZoom);
            const newY =  viewportY - (worldY * newZoom);
            

            return {x: newX , y: newY , zoom: newZoom}
        })
    }

  return (
    <div 
      ref={containerRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      className="w-full h-screen overflow-hidden bg-[#111] text-white relative"
      onContextMenu={(e) => e.preventDefault()}
      style={{ 
        cursor: 'context-menu',
        // Update background to match GRID_SIZE so snapping looks correct
        backgroundImage: 'radial-gradient(#444 1px, transparent 1px)', 
        backgroundSize: `${GRID_SIZE * camera.zoom}px ${GRID_SIZE * camera.zoom}px`,
        backgroundPosition: `${camera.x}px ${camera.y}px` 
      }}
    >
        <div 
            className={`world-layer absolute top-0 left-0 origin-top-left pointer-events-none transition-transform will-change-transform
        ${isDragging ? 'duration-0' : 'duration-300 ease-out'}`}
            style={{
            transform: `translate(${camera.x}px, ${camera.y}px) scale(${camera.zoom})`,
            width: '100%',
            height: '100%',
            }}
        >
            {box.map(box => {
                const isSelected = box.activeId === selectedId;

                return (
                <div
                    key={box.activeId}
                    data-box-id={box.activeId}
                    className={`${isSelected && 'border-4 border-white'} ${box.color} absolute select-none flex items-center justify-center shadow-xl border border-white/20 rounded cursor-grab active:cursor-grabbing pointer-events-auto transition-transform duration-75`} 
                    style={{
                    // Use the box coordinates directly
                    transform: `translate(${box.x}px, ${box.y}px)`,
                    width: `${50 * 2}px`, // Make box 2x grid cells
                    height: `${50 * 2}px`,
                    }}
                >
                    {isSelected && <ShowOptions id= {box.activeId}/>}

                    <span className="text-xs font-bold pointer-events-none mix-blend-difference">
                    {box.x}, {box.y}
                    </span>
                </div>
            )})}

            <div className="absolute top-0 left-0 w-2 h-2 bg-red-500 rounded-full"></div>
        </div>

        {/* HUD */}
        <div className="absolute bottom-10 right-2 flex flex-col gap-4 pointer-events-auto select-none">
            <div className="bg-gray-800/80 backdrop-blur p-4 rounded shadow-lg border border-gray-700">
                <button 
                    onClick={addBox}
                    className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 px-4 rounded transition-colors mb-4"
                >
                    + Add Box
                </button>
                <div className="text-xs text-gray-400">
                    <p>Grid Size: {GRID_SIZE}px</p>
                </div>
            </div>
        </div>

        <div className='absolute top-10 right-2 flex flex-col gap-4'>
            <div onClick={handleZoomPlus} className='px-2 py-1 cursor-pointer text-white bg-neutral-800 hover:bg-neutral-900'>
                +
            </div>

            <div onClick={handleZoomReset} className='px-2 py-1 cursor-pointer text-white bg-neutral-800 hover:bg-neutral-900 text-center'>
                B
            </div>

            <div onClick={handleZoomMinus} className='px-2 py-1 cursor-pointer text-white bg-neutral-800 hover:bg-neutral-900 text-center'>
                -
            </div>

            <div onClick={fitToScreen} className='px-2 py-1 cursor-pointer text-white bg-neutral-800 hover:bg-neutral-900 text-center'>
                {`[ ]`}
            </div>
        </div>
    </div>
  )
}
