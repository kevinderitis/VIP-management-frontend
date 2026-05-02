import { ReactNode, createContext, useContext, useEffect, useId } from 'react'

export const AdminToolbarContext = createContext<{
  setToolbar: (id: string, content: ReactNode | null) => void
} | null>(null)

export const AdminToolbar = ({ children }: { children: ReactNode }) => {
  const toolbarContext = useContext(AdminToolbarContext)
  const toolbarId = useId()

  useEffect(() => {
    if (!toolbarContext) return
    toolbarContext.setToolbar(toolbarId, children)
    return () => toolbarContext.setToolbar(toolbarId, null)
  }, [children, toolbarContext, toolbarId])

  if (toolbarContext) return null

  return <>{children}</>
}
