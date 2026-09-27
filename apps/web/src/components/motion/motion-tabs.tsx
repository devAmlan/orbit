import * as React from "react"
import { Tabs as TabsPrimitive } from "radix-ui"
import { AnimatePresence, motion } from "framer-motion"

import { cn } from "@/lib/utils"

export type TabsVariant = "default" | "underline" | "morph" | "icon"

const TabsValueContext = React.createContext<string | undefined>(undefined)
const TabsVariantContext = React.createContext<TabsVariant>("default")

function Tabs({
  value,
  defaultValue,
  onValueChange,
  children,
  className,
  orientation = "horizontal",
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Root>) {
  const [internalValue, setInternalValue] = React.useState(defaultValue)
  const activeValue = value ?? internalValue

  function handleValueChange(next: string) {
    setInternalValue(next)
    onValueChange?.(next)
  }

  return (
    <TabsPrimitive.Root
      data-slot="tabs"
      data-orientation={orientation}
      value={activeValue}
      onValueChange={handleValueChange}
      className={cn("group/tabs flex gap-2 data-horizontal:flex-col", className)}
      {...props}
    >
      <TabsValueContext.Provider value={activeValue}>{children}</TabsValueContext.Provider>
    </TabsPrimitive.Root>
  )
}

function TabsList({
  className,
  variant = "default",
  ...props
}: React.ComponentProps<typeof TabsPrimitive.List> & { variant?: TabsVariant }) {
  return (
    <TabsVariantContext.Provider value={variant}>
      <TabsPrimitive.List
        data-slot="tabs-list"
        data-variant={variant}
        className={cn(
          "inline-flex w-fit items-center justify-center text-muted-foreground group-data-horizontal/tabs:h-10 group-data-vertical/tabs:h-fit group-data-vertical/tabs:flex-col",
          variant === "underline"
            ? "gap-4 border-b group-data-vertical/tabs:border-r group-data-vertical/tabs:border-b-0"
            : variant === "icon"
              ? "gap-1"
              : "rounded-lg bg-muted p-[3px]",
          className
        )}
        {...props}
      />
    </TabsVariantContext.Provider>
  )
}

function TabsTrigger({
  className,
  value,
  children,
  icon,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Trigger> & { icon?: React.ReactNode }) {
  const activeValue = React.useContext(TabsValueContext)
  const variant = React.useContext(TabsVariantContext)
  const isActive = activeValue === value

  if (variant === "icon") {
    return (
      <TabsPrimitive.Trigger value={value} asChild {...props}>
        <motion.button
          data-slot="tabs-trigger"
          layout
          transition={{ type: "spring", stiffness: 260, damping: 28, mass: 0.9 }}
          className={cn(
            "relative z-10 inline-flex items-center justify-center gap-1.5 overflow-hidden rounded-full text-sm font-medium whitespace-nowrap outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0",
            isActive
              ? "bg-accent px-3.5 py-2 text-accent-foreground"
              : "size-9 text-muted-foreground hover:bg-muted hover:text-foreground",
            className
          )}
        >
          {icon}
          <AnimatePresence initial={false}>
            {isActive && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1, transition: { duration: 0.25, delay: 0.12, ease: "easeOut" } }}
                exit={{ opacity: 0, transition: { duration: 0.1, ease: "easeIn" } }}
                className="whitespace-nowrap"
              >
                {children}
              </motion.span>
            )}
          </AnimatePresence>
        </motion.button>
      </TabsPrimitive.Trigger>
    )
  }

  return (
    <TabsPrimitive.Trigger
      data-slot="tabs-trigger"
      value={value}
      className={cn(
        "relative z-10 inline-flex items-center justify-center gap-1.5 text-sm font-medium whitespace-nowrap outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50",
        variant === "underline"
          ? "h-10 px-1 pb-3 group-data-vertical/tabs:h-auto group-data-vertical/tabs:w-full group-data-vertical/tabs:justify-start group-data-vertical/tabs:px-3 group-data-vertical/tabs:py-1.5"
          : "h-[calc(100%-1px)] flex-1 rounded-md px-4 py-1.5 group-data-vertical/tabs:w-full group-data-vertical/tabs:justify-start",
        isActive ? "text-foreground" : "text-foreground/60 hover:text-foreground",
        className
      )}
      {...props}
    >
      {isActive && variant === "default" && (
        <motion.span
          layoutId="tabs-active-pill"
          transition={{ type: "spring", stiffness: 500, damping: 35 }}
          className="absolute inset-0 -z-10 rounded-md bg-background shadow-sm dark:border dark:border-input dark:bg-input/30"
        />
      )}
      {isActive && variant === "morph" && (
        <motion.span
          layoutId="tabs-active-pill-morph"
          transition={{ type: "spring", stiffness: 420, damping: 28 }}
          className="absolute inset-0 -z-10 rounded-md bg-background shadow-sm dark:border dark:border-input dark:bg-input/30"
        />
      )}
      {variant === "morph" ? (
        <span className="relative inline-flex overflow-hidden py-0.5">
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.span
              key={isActive ? "active" : "inactive"}
              initial={{ y: 14, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -14, opacity: 0 }}
              transition={{ type: "spring", stiffness: 420, damping: 28 }}
              className="inline-flex"
            >
              {children}
            </motion.span>
          </AnimatePresence>
        </span>
      ) : (
        children
      )}
      {isActive && variant === "underline" && (
        <motion.span
          layoutId="tabs-active-underline"
          transition={{ type: "spring", stiffness: 500, damping: 35 }}
          className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-foreground"
        />
      )}
    </TabsPrimitive.Trigger>
  )
}

function TabsContent({
  className,
  children,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Content>) {
  return (
    <TabsPrimitive.Content data-slot="tabs-content" asChild {...props}>
      <motion.div
        initial={{ opacity: 0, filter: "blur(6px)" }}
        animate={{ opacity: 1, filter: "blur(0px)" }}
        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
        className={cn("flex-1 text-sm outline-none", className)}
      >
        {children}
      </motion.div>
    </TabsPrimitive.Content>
  )
}

export { Tabs, TabsList, TabsTrigger, TabsContent }
