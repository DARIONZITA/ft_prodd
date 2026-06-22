import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { io, Socket } from 'socket.io-client'
import { queryClient } from '../main'
import api from '../api/axios'
import { kanbanKeys } from '../api/kanban'
import { notificationsKeys } from '../api/notifications'
import type { ServerToClientEvents, ClientToServerEvents } from '../ws/types'

interface WebSocketContextType {
  socket: Socket<ServerToClientEvents, ClientToServerEvents> | null
  isConnected: boolean
}

const WebSocketContext = createContext<WebSocketContextType>({
  socket: null,
  isConnected: false,
})

export const useWebSocket = () => useContext(WebSocketContext)

interface WebSocketProviderProps {
  children: ReactNode
}

export function WebSocketProvider({ children }: WebSocketProviderProps) {
  const [socket, setSocket] = useState<Socket<ServerToClientEvents, ClientToServerEvents> | null>(null)
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    let active = true
    let newSocket: Socket<ServerToClientEvents, ClientToServerEvents> | null = null

    const connectSocket = async () => {
      try {
        const res = await api.get<{ success: boolean; token: string }>('/api/auth/token')
        if (!active) return

        const token = res.data.token
        if (!token) return

        newSocket = io(window.location.origin, {
          auth: { token },
          transports: ['websocket'],
        })

        newSocket.on('connect', () => {
          if (active) {
            setIsConnected(true)

          }
        })

        newSocket.on('disconnect', () => {
          if (active) {
            setIsConnected(false)

          }
        })

        // Real-time Comments Sync
        newSocket.on('comment:new', ({ taskId, comment }: { taskId: number; comment: any }) => {

          // Update the cache directly
          queryClient.setQueriesData({ queryKey: kanbanKeys.task(taskId) }, (oldData: any) => {
            if (!oldData || !oldData.success) return oldData
            const items = oldData.data.comments?.items || []
            if (items.some((c: any) => c.id === comment.id)) return oldData
            return {
              ...oldData,
              data: {
                ...oldData.data,
                comments: {
                  ...oldData.data.comments,
                  items: [...items, comment],
                  pagination: {
                    ...oldData.data.comments?.pagination,
                    total: (oldData.data.comments?.pagination?.total || 0) + 1
                  }
                }
              }
            }
          })
          // Invalidate to verify/refresh query
          queryClient.invalidateQueries({ queryKey: kanbanKeys.task(taskId) })
        })

        newSocket.on('comment:updated', ({ taskId, comment }: { taskId: number; comment: any }) => {

          queryClient.setQueriesData({ queryKey: kanbanKeys.task(taskId) }, (oldData: any) => {
            if (!oldData || !oldData.success) return oldData
            const items = oldData.data.comments?.items || []
            return {
              ...oldData,
              data: {
                ...oldData.data,
                comments: {
                  ...oldData.data.comments,
                  items: items.map((c: any) => c.id === comment.id ? comment : c)
                }
              }
            }
          })
          queryClient.invalidateQueries({ queryKey: kanbanKeys.task(taskId) })
        })

        newSocket.on('comment:deleted', ({ taskId, commentId }: { taskId: number; commentId: number }) => {

          queryClient.setQueriesData({ queryKey: kanbanKeys.task(taskId) }, (oldData: any) => {
            if (!oldData || !oldData.success) return oldData
            const items = oldData.data.comments?.items || []
            return {
              ...oldData,
              data: {
                ...oldData.data,
                comments: {
                  ...oldData.data.comments,
                  items: items.filter((c: any) => c.id !== commentId),
                  pagination: {
                    ...oldData.data.comments?.pagination,
                    total: Math.max(0, (oldData.data.comments?.pagination?.total || 0) - 1)
                  }
                }
              }
            }
          })
          queryClient.invalidateQueries({ queryKey: kanbanKeys.task(taskId) })
        })

        // Real-time Notifications Sync
        newSocket.on('notification', ({ payload }: any) => {

          const newNotif = payload.persisted
          if (!newNotif) return

          queryClient.setQueriesData({ queryKey: notificationsKeys.all }, (oldData: any) => {
            if (!oldData || !oldData.success) return oldData
            const list = oldData.data.notifications || []
            if (list.some((n: any) => n.id === newNotif.id)) return oldData
            return {
              ...oldData,
              data: {
                ...oldData.data,
                notifications: [newNotif, ...list],
                pagination: {
                  ...oldData.data.pagination,
                  total: (oldData.data.pagination?.total || 0) + 1
                }
              }
            }
          })
          queryClient.invalidateQueries({ queryKey: notificationsKeys.all })
        })

        newSocket.on('notification:read', ({ notificationId }: { notificationId: number }) => {

          queryClient.setQueriesData({ queryKey: notificationsKeys.all }, (oldData: any) => {
            if (!oldData || !oldData.success) return oldData
            const list = oldData.data.notifications || []
            return {
              ...oldData,
              data: {
                ...oldData.data,
                notifications: list.map((n: any) =>
                  n.id === notificationId ? { ...n, isRead: true } : n
                )
              }
            }
          })
          queryClient.invalidateQueries({ queryKey: notificationsKeys.all })
        })

        newSocket.on('notification:read_all', () => {

          queryClient.setQueriesData({ queryKey: notificationsKeys.all }, (oldData: any) => {
            if (!oldData || !oldData.success) return oldData
            const list = oldData.data.notifications || []
            return {
              ...oldData,
              data: {
                ...oldData.data,
                notifications: list.map((n: any) => ({ ...n, isRead: true }))
              }
            }
          })
          queryClient.invalidateQueries({ queryKey: notificationsKeys.all })
        })

        setSocket(newSocket)
      } catch (err) {
        console.error('[WS] Connection error:', err)
      }
    }

    connectSocket()

    return () => {
      active = false
      if (newSocket) {
        newSocket.disconnect()
      }
    }
  }, [])

  return (
    <WebSocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </WebSocketContext.Provider>
  )
}
