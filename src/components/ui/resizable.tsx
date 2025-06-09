
import { GripVertical, ChevronLeft, ChevronRight } from "lucide-react"
import * as ResizablePrimitive from "react-resizable-panels"

import { cn } from "@/lib/utils"

const ResizablePanelGroup = ({
  className,
  ...props
}: React.ComponentProps<typeof ResizablePrimitive.PanelGroup>) => (
  <ResizablePrimitive.PanelGroup
    className={cn(
      "flex h-full w-full data-[panel-group-direction=vertical]:flex-col",
      className
    )}
    {...props}
  />
)

const ResizablePanel = ResizablePrimitive.Panel

const ResizableHandle = ({
  withHandle,
  withCollapseButton,
  onCollapse,
  isCollapsed,
  className,
  ...props
}: React.ComponentProps<typeof ResizablePrimitive.PanelResizeHandle> & {
  withHandle?: boolean
  withCollapseButton?: boolean
  onCollapse?: () => void
  isCollapsed?: boolean
}) => (
  <ResizablePrimitive.PanelResizeHandle
    className={cn(
      "relative flex w-px items-center justify-center bg-border/30 after:absolute after:inset-y-0 after:left-1/2 after:w-1 after:-translate-x-1/2 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-1 data-[panel-group-direction=vertical]:h-px data-[panel-group-direction=vertical]:w-full data-[panel-group-direction=vertical]:after:left-0 data-[panel-group-direction=vertical]:after:h-1 data-[panel-group-direction=vertical]:after:w-full data-[panel-group-direction=vertical]:after:-translate-y-1/2 data-[panel-group-direction=vertical]:after:translate-x-0 [&[data-panel-group-direction=vertical]>div]:rotate-90 group hover:bg-border/50 transition-colors duration-200 hidden md:flex",
      className
    )}
    {...props}
  >
    {withHandle && (
      <div className="z-10 flex h-4 w-3 items-center justify-center rounded-sm border bg-border/80 group-hover:bg-border transition-colors duration-200">
        <GripVertical className="h-2 w-2" />
      </div>
    )}
    
    {withCollapseButton && (
      <button
        onClick={onCollapse}
        className="absolute z-20 p-1 rounded-full bg-background border border-border shadow-sm opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-accent hover:scale-110 transform"
        style={{
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -50%)'
        }}
      >
        {isCollapsed ? (
          <ChevronRight className="h-2.5 w-2.5" />
        ) : (
          <ChevronLeft className="h-2.5 w-2.5" />
        )}
      </button>
    )}
  </ResizablePrimitive.PanelResizeHandle>
)

export { ResizablePanelGroup, ResizablePanel, ResizableHandle }
