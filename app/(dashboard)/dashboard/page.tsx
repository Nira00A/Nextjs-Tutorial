'use client';

import React, { useState, useRef, useEffect } from 'react';

type Camera = { x: number; y: number; zoom: number };
type Box = { id: string; x: number; y: number; color: string };

export default function CustomCanvas() {
  const [camera, setCamera] = useState<Camera>({ x: 0, y: 0, zoom: 1 });
  const [boxes, setBoxes] = useState<Box[]>([
    { id: '1', x: 0, y: 0, color: '#3b82f6' }
  ]);
 
  const containerRef = useRef<HTMLDivElement>(null);

  // REFS: Track dragging state
  const dragRef = useRef({
    isDragging: false,
    mode: 'NONE' as 'NONE' | 'CAMERA' | 'BOX',
    startX: 0, // Mouse Start X
    startY: 0, // Mouse Start Y
    activeId: null as string | null,
    // NEW: We track the original position of the box when dragging starts
    initialBox: { x: 0, y: 0 } 
  });

  const GRID_SIZE = camera.zoom > 1 ? 20 : 50;

  // Wheel Logic (Unchanged)
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault(); 
      if (!e.ctrlKey && !e.metaKey) {
        setCamera(prev => ({ ...prev, x: prev.x - e.deltaX, y: prev.y - e.deltaY }));
        return;
      }
      if ((e.ctrlKey && !e.shiftKey ) || e.metaKey) {
        setCamera(prev => {
            const rect = container.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;
            const mouseWorldX = (mouseX - prev.x) / prev.zoom;
            const mouseWorldY = (mouseY - prev.y) / prev.zoom;
            const zoomIntensity = 0.001;
            const newZoom = Math.min(Math.max(0.4, prev.zoom - e.deltaY * zoomIntensity), 3);
            const newX = mouseX - (mouseWorldX * newZoom);
            const newY = mouseY - (mouseWorldY * newZoom);
            return { x: newX, y: newY, zoom: newZoom };
        });
      }
      if (e.shiftKey) {
        setCamera(prev => ({ ...prev, x: prev.x - e.deltaY, y: prev.y }));
      }
    };
    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => container.removeEventListener('wheel', handleWheel);
  }, []);

  const addBox = () => {
    const viewportCenterX = window.innerWidth / 2;
    const viewportCenterY = window.innerHeight / 2;
    const worldX = (viewportCenterX - camera.x) / camera.zoom;
    const worldY = (viewportCenterY - camera.y) / camera.zoom;

    // Snap the new box spawn position too!
    const snappedX = Math.round(worldX / GRID_SIZE) * GRID_SIZE;
    const snappedY = Math.round(worldY / GRID_SIZE) * GRID_SIZE;

    const newBox: Box = {
      id: crypto.randomUUID(),
      x: snappedX,
      y: snappedY,
      color: `hsl(${Math.random() * 360}, 70%, 50%)`
    };
    setBoxes(prev => [...prev, newBox]);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;

    // A. Right Click -> Camera Drag
    if (e.button === 2) {
      if (target === e.currentTarget || target.closest('.world-layer')) {
        dragRef.current = {
          ...dragRef.current, // keep defaults
          isDragging: true,
          mode: 'CAMERA',
          startX: e.clientX,
          startY: e.clientY,
        };
      }
    } 
    // B. Left Click -> Box Drag
    else if (e.button === 0) {
      const boxElement = target.closest('[data-box-id]');
      if (boxElement) {
        const boxId = boxElement.getAttribute('data-box-id');
        
        // Find the box in state to get its current position
        const box = boxes.find(b => b.id === boxId);
        
        if (box) {
          dragRef.current = {
            isDragging: true,
            mode: 'BOX',
            startX: e.clientX,
            startY: e.clientY,
            activeId: boxId,
            initialBox: { x: box.x, y: box.y } // Save "Anchor" position
          };
        }
        e.stopPropagation();
      }
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!dragRef.current.isDragging) return;

    // --- CASE 1: Dragging the Camera ---
    if (dragRef.current.mode === 'CAMERA') {
      // For camera, we use incremental logic (dx from last frame)
      // Note: We need to update startX/Y at the end of this block
      const dx = e.clientX - dragRef.current.startX;
      const dy = e.clientY - dragRef.current.startY;
      
      setCamera(prev => ({ ...prev, x: prev.x + dx, y: prev.y + dy }));
      
      // Update reference for next frame
      dragRef.current.startX = e.clientX;
      dragRef.current.startY = e.clientY;
    } 
    
    // --- CASE 2: Dragging a Box (SNAPPING LOGIC) ---
    else if (dragRef.current.mode === 'BOX' && dragRef.current.activeId) {
      
      // 1. Calculate TOTAL mouse movement since drag started
      const totalDeltaX = (e.clientX - dragRef.current.startX) / camera.zoom;
      const totalDeltaY = (e.clientY - dragRef.current.startY) / camera.zoom;

      // 2. Calculate the "Raw" new position (where it would be without snap)
      const rawX = dragRef.current.initialBox.x + totalDeltaX;
      const rawY = dragRef.current.initialBox.y + totalDeltaY;

      // 3. Round the raw position to nearest Grid Size
      const snappedX = Math.round(rawX / GRID_SIZE) * GRID_SIZE;
      const snappedY = Math.round(rawY / GRID_SIZE) * GRID_SIZE;

      setBoxes(prevBoxes => prevBoxes.map(box => {
        if (box.id === dragRef.current.activeId) {
          return { ...box, x: snappedX, y: snappedY };
        }
        return box;
      }));
    }
  };

  const handleMouseUp = () => {
    dragRef.current.isDragging = false;
    dragRef.current.mode = 'NONE';
    dragRef.current.activeId = null;
  };

  return (
    <div 
      ref={containerRef}
      className="w-full h-screen overflow-hidden bg-[#111] text-white relative"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onContextMenu={(e) => e.preventDefault()}
      style={{ 
        cursor: 'context-menu',
        // Update background to match GRID_SIZE so snapping looks correct
        backgroundImage: 'radial-gradient(#444 1px, transparent 1px)', 
        backgroundSize: `${GRID_SIZE * camera.zoom}px ${GRID_SIZE * camera.zoom}px`,
        backgroundPosition: `${camera.x}px ${camera.y}px` 
      }}
    >
      
      {/* World Layer */}
      <div 
        className="world-layer absolute top-0 left-0 origin-top-left pointer-events-none"
        style={{
          transform: `translate(${camera.x}px, ${camera.y}px) scale(${camera.zoom})`,
          width: '100%',
          height: '100%',
        }}
      >
        {boxes.map(box => (
          <div
            key={box.id}
            data-box-id={box.id}
            className="absolute flex items-center justify-center shadow-xl border border-white/20 rounded cursor-grab active:cursor-grabbing pointer-events-auto transition-transform duration-75" 
            style={{
              // Use the box coordinates directly
              transform: `translate(${box.x}px, ${box.y}px)`,
              width: `${50 * 2}px`, // Make box 2x grid cells
              height: `${50 * 2}px`,
              backgroundColor: box.color,
            }}
          >
             <span className="text-xs font-bold pointer-events-none mix-blend-difference">
               {box.x}, {box.y}
             </span>
          </div>
        ))}
        
        {/* Origin Marker */}
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
  );
}