### This is the Readme of Nextjs-Tutorial 

1. How to run the nextjs - pnpm run dev

### layout.tsx (wraps all the children) is the the mother and the rest acts like children like react layouts 

### File based Routing-
- First make a folder in app folder and name the first first in the folder as page.tsx.
- The file based routing only depends on the name of the folder like eg - if a folder name is HealthyRoute then http://localhost:3000/HealthyRoute then on;y we will get the page.tsx rendered on the screen.
- Only use Export Default Functions

### Layout inside HealthRoute (Custom Layouts)
- just a layout.tsx like page in HealthyRoute

Custom layout syntax - 
```
import React from "react";

export default function layout({ children }:{children: React.ReactNode}) {
  return (
    <div>
        {children}
    </div>
  )
}
```

### Link in next/Link is a powerful Client Side Rendering way where we dont need to rerender the whole page but just the component

### No need to create export default for components

### pnpm install babel-plugin-react-compiler@latest
- This works by removing re-renders within their code analysing and can get rid of useMemo and useCallback

### error.tsx file is a client side rendered component





