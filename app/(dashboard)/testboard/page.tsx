'use client'

import React, { useEffect, useRef, useState } from 'react'

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

export default function InfiniteBoard() {

    const [camera , setCamera] = useState<Camera>({x: 0 , y: 0 , zoom: 1})
    const [box , setBox] = useState<Box[]>([])
    
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
    }

    const handleMouseUp = () => {
        dragRef.current.isDragging = false
        dragRef.current.mode = 'NONE'
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
        color: `hsl(${Math.random() * 360}, 70%, 50%)`
        };
        setBox(prev => [...prev, newBox]);
    };

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
            className="world-layer absolute top-0 left-0 origin-top-left pointer-events-none"
            style={{
            transform: `translate(${camera.x}px, ${camera.y}px) scale(${camera.zoom})`,
            width: '100%',
            height: '100%',
            }}
        >


            <div className="absolute top-0 left-0 w-2 h-2 bg-red-500 rounded-full"></div>
        </div>

        {/* HUD */}
        <div className="absolute bottom-10 right-10 flex flex-col gap-4 pointer-events-auto select-none">
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
    </div>
  )
}
