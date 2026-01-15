'use client';

const COLOR_VARIANTS = [
  {id: 1, name:    'bg-red-500 border-red-200'},
  {id: 2, name: 'bg-orange-500 border-orange-200'},
  {id: 3, name:  'bg-amber-500 border-amber-200'},
  {id: 4, name:  'bg-green-500 border-green-200'},
  {id: 5, name:   'bg-cyan-500 border-cyan-200'},
  {id: 6, name:   'bg-blue-500 border-blue-200'},
  {id: 7, name: 'bg-purple-500 border-purple-200'},
];

interface ColorPickerProps {
  handleColorPicker: (colorName: string) => void;
}

export default function MorphingColorPicker({ handleColorPicker }: ColorPickerProps) {
  return (
    <div 
      onMouseDown={(e) => e.stopPropagation()}
      className="absolute top-6 -right-10 flex gap-2 p-2 bg-neutral-900/90 backdrop-blur-md rounded-md border border-white/5 shadow-2xl w-fit items-center"
    >
      {COLOR_VARIANTS.map((colorName) => {
        return (
          <button
            key={colorName.id}
            onClick={() => handleColorPicker(colorName.name)}
            className={`
                relative w-4 h-4 border transition-all duration-300 ease-out overflow-hidden rounded-2xl
                hover:rounded-sm hover:scale-110 ${colorName.name}
            `}>
          </button>
        );
      })}
      <div className="relative group">
        <div className="
            relative w-4 h-4 border transition-all duration-300 ease-out overflow-hidden rounded-2xl
            hover:rounded-sm hover:scale-110
            bg-[conic-gradient(from_0deg,#f00,#fa0,#ff0,#0f0,#00f,#4b0082,#f60)]
        ">
        </div>

        <input 
            type="color"
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            onChange={(e) => {
                console.log(e.target.value); 
            }}
        />
        </div>
    </div>
  );
}