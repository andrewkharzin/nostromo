'use client'

import { useState, useEffect, useRef, KeyboardEvent } from 'react'
import { createClient } from '../../../../lib/supabase/client'
import { useAuth } from '../../../auth/AuthProvider'
import { useParams, useRouter } from 'next/navigation'

interface GroupInfo {
  name: string
  description: string | null
}

interface MessageRead {
  id: string
  message_id: string
  user_id: string
  group_id: string
  read_at: string
  created_at: string
}

interface Message {
  id: string
  group_id: string
  author_id: string | null
  body: string
  metadata: any
  created_at: string
  reads?: MessageRead[]
  read_by_user_ids?: string[]
}

interface GroupMember {
  id: string
  user_id: string
  group_id: string
  role: string
  profiles?: {
    id: string
    username: string
    avatar_url: string | null
  }
}

export default function ChatRoomPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [groupInfo, setGroupInfo] = useState<GroupInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isTyping, setIsTyping] = useState(false)
  const [subscriptionActive, setSubscriptionActive] = useState(false)
  const [sendingAnimations, setSendingAnimations] = useState<{[key: string]: boolean}>({})
  const [messageStatus, setMessageStatus] = useState<{id: string, status: 'sending' | 'sent' | 'error'} | null>(null)
  const [groupMembers, setGroupMembers] = useState<GroupMember[]>([])
  const [unreadMessageIds, setUnreadMessageIds] = useState<string[]>([])
  const [lastReadMessageId, setLastReadMessageId] = useState<string | null>(null)
  const [isScrolledToBottom, setIsScrolledToBottom] = useState(true)
  const { user } = useAuth()
  const params = useParams()
  const router = useRouter()

  const groupId = Array.isArray(params.groupId)
    ? params.groupId[0]
    : (params.groupId as string) || ''

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const subscriptionRef = useRef<any>(null)
  const statusTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const readReceiptTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const lastScrollPositionRef = useRef(0)

  // Scroll event handler for read receipts
  useEffect(() => {
    const container = messagesContainerRef.current
    if (!container) return

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container
      const isAtBottom = scrollHeight - scrollTop - clientHeight < 100
      setIsScrolledToBottom(isAtBottom)

      if (scrollTop > lastScrollPositionRef.current && unreadMessageIds.length > 0) {
        checkAndMarkMessagesAsRead()
      }
      lastScrollPositionRef.current = scrollTop
    }

    container.addEventListener('scroll', handleScroll, { passive: true })
    return () => container.removeEventListener('scroll', handleScroll)
  }, [unreadMessageIds])

  // Mark messages as read when scrolled to bottom
  useEffect(() => {
    if (isScrolledToBottom && unreadMessageIds.length > 0) {
      markAllMessagesAsRead()
    }
  }, [isScrolledToBottom, unreadMessageIds])

  // Auto-scroll to bottom when new message arrives
  useEffect(() => {
    if (isScrolledToBottom) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, isScrolledToBottom])

  // Initialize and clean up
  useEffect(() => {
    if (groupId && user) {
      loadChatRoom()
    } else if (!user) {
      setLoading(false)
      setError('CREW AUTHENTICATION REQUIRED')
    }

    return () => {
      cleanupSubscriptions()
      markAllMessagesAsRead() // Mark any remaining as read on leave
    }
  }, [groupId, user])

  const cleanupSubscriptions = () => {
    if (subscriptionRef.current) {
      const supabase = createClient()
      supabase.removeChannel(subscriptionRef.current)
      subscriptionRef.current = null
      setSubscriptionActive(false)
    }
    if (statusTimeoutRef.current) clearTimeout(statusTimeoutRef.current)
    if (readReceiptTimeoutRef.current) clearTimeout(readReceiptTimeoutRef.current)
  }

  const loadChatRoom = async () => {
    setLoading(true)
    setError(null)

    try {
      await ensureGroupMembership();
      await fetchGroupDetails();
      await fetchGroupMembers();
      await fetchMessages();
      setupRealtimeSubscription();
      // Initial mark as read for any existing messages
      setTimeout(() => markAllMessagesAsRead(), 1000)
    } catch (err: any) {
      console.error('Error loading chat room:', err)
      setError(err.message || 'FAILED TO ESTABLISH CONNECTION')
    } finally {
      setLoading(false)
    }
  }

  const ensureGroupMembership = async () => {
    if (!user) return;

    const supabase = createClient();

    const { data: existingMember, error: checkError } = await supabase
      .from('group_members')
      .select('id')
      .eq('group_id', groupId)
      .eq('user_id', user.id)
      .single();

    if (checkError || !existingMember) {
      const { error: insertError } = await supabase
        .from('group_members')
        .insert([
          {
            group_id: groupId,
            user_id: user.id,
            role: 'member'
          }
        ]);

      if (insertError) {
        throw new Error(`ACCESS DENIED: ${insertError.message}`);
      }
    }
  };

  const fetchGroupDetails = async () => {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('groups')
      .select('name, description')
      .eq('id', groupId)
      .single()

    if (error) {
      throw new Error(`CONNECTION ERROR: ${error.message}`)
    }

    setGroupInfo(data)
  }

  const fetchGroupMembers = async () => {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('group_members')
      .select(`
        *,
        profiles (
          id,
          username,
          avatar_url
        )
      `)
      .eq('group_id', groupId)

    if (!error) {
      setGroupMembers(data || [])
    }
  }

  const fetchMessages = async () => {
    const supabase = createClient()

    const { data: messagesData, error: messagesError } = await supabase
      .from('messages')
      .select('*')
      .eq('group_id', groupId)
      .order('created_at', { ascending: true })

    if (messagesError) {
      throw new Error(`DATA RETRIEVAL ERROR: ${messagesError.message}`)
    }

    const messageIds = messagesData?.map(m => m.id) || []
    let readsData: MessageRead[] = []

    if (messageIds.length > 0 && user) {
      const { data: reads, error: readsError } = await supabase
        .from('message_reads')
        .select('*')
        .in('message_id', messageIds)

      if (!readsError && reads) {
        readsData = reads
      }
    }

    const messagesWithReads = messagesData?.map(message => ({
      ...message,
      reads: readsData.filter(read => read.message_id === message.id),
      read_by_user_ids: readsData
        .filter(read => read.message_id === message.id)
        .map(read => read.user_id)
    })) || []

    setMessages(messagesWithReads)

    if (user) {
      const unreadIds = messagesWithReads
        .filter(msg =>
          msg.author_id !== user?.id &&
          (!msg.read_by_user_ids || !msg.read_by_user_ids.includes(user?.id))
        )
        .map(msg => msg.id)

      setUnreadMessageIds(unreadIds)

      const userReads = readsData.filter(read => read.user_id === user?.id)
      if (userReads.length > 0) {
        const lastRead = userReads.reduce((latest, read) =>
          new Date(read.read_at) > new Date(latest.read_at) ? read : latest
        )
        setLastReadMessageId(lastRead.message_id)
      }
    }
  }

  const setupRealtimeSubscription = () => {
    const supabase = createClient()

    if (subscriptionRef.current) {
      supabase.removeChannel(subscriptionRef.current)
    }

    const channel = supabase
      .channel(`realtime:messages:${groupId}:${user?.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `group_id=eq.${groupId}`
        },
        (payload) => {
          const newMessage = payload.new as Message
          console.log('📨 New message received via realtime:', newMessage)

          // Don't show animation for our own messages (they already show in UI)
          if (newMessage.author_id !== user?.id) {
            setSendingAnimations(prev => ({ ...prev, [newMessage.id]: true }))
            setTimeout(() => {
              setSendingAnimations(prev => ({ ...prev, [newMessage.id]: false }))
            }, 1500)
          }

          setMessages(prev => {
            const exists = prev.some(msg => msg.id === newMessage.id)
            if (exists) return prev

            // Mark as unread if from another user
            if (newMessage.author_id !== user?.id) {
              setUnreadMessageIds(prev => [...prev, newMessage.id])
            }

            return [...prev, {
              ...newMessage,
              reads: [],
              read_by_user_ids: newMessage.author_id === user?.id ? [user.id] : []
            }]
          })

          // Auto-mark as read if user is at bottom and message is from another user
          if (newMessage.author_id !== user?.id && isScrolledToBottom) {
            markMessageAsRead(newMessage.id)
          }

          // Show notification for messages from other users
          if (newMessage.author_id !== user?.id) {
            playNotificationSound()
            flashNotification()
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'message_reads',
          filter: `group_id=eq.${groupId}`
        },
        (payload) => {
          const newRead = payload.new as MessageRead
          console.log('👁️ Read receipt received:', newRead)

          setMessages(prev => prev.map(message => {
            if (message.id === newRead.message_id) {
              const existingReads = message.reads || []
              const existingReadByIds = message.read_by_user_ids || []

              // Avoid duplicates
              if (!existingReadByIds.includes(newRead.user_id)) {
                return {
                  ...message,
                  reads: [...existingReads, newRead],
                  read_by_user_ids: [...existingReadByIds, newRead.user_id]
                }
              }
            }
            return message
          }))

          // Remove from unread if it's this user's read
          if (newRead.user_id === user?.id) {
            setUnreadMessageIds(prev => prev.filter(id => id !== newRead.message_id))
            setLastReadMessageId(newRead.message_id)
          }
        }
      )
      .subscribe((status) => {
        console.log('📡 Realtime subscription status:', status)
        setSubscriptionActive(status === 'SUBSCRIBED')

        if (status === 'SUBSCRIBED') {
          console.log('✅ Realtime subscription active for group:', groupId)
        } else if (status === 'CHANNEL_ERROR') {
          console.error('❌ Realtime subscription failed')
          // Attempt to resubscribe after delay
          setTimeout(() => {
            setupRealtimeSubscription()
          }, 3000)
        }
      })

    subscriptionRef.current = channel
    return channel
  }

  const showIncomingMessageEffect = (messageId: string) => {
    setSendingAnimations(prev => ({ ...prev, [messageId]: true }))
    setTimeout(() => {
      setSendingAnimations(prev => ({ ...prev, [messageId]: false }))
    }, 1500)
  }

  const showSentStatus = () => {
    setMessageStatus({ id: `status-${Date.now()}`, status: 'sent' })
    if (statusTimeoutRef.current) {
      clearTimeout(statusTimeoutRef.current)
    }
    statusTimeoutRef.current = setTimeout(() => {
      setMessageStatus(null)
    }, 2000)
  }

  const showErrorStatus = () => {
    setMessageStatus({ id: `status-${Date.now()}`, status: 'error' })
    if (statusTimeoutRef.current) {
      clearTimeout(statusTimeoutRef.current)
    }
    statusTimeoutRef.current = setTimeout(() => {
      setMessageStatus(null)
    }, 3000)
  }

  const markMessageAsRead = async (messageId: string) => {
    if (!user || !messageId) return

    const supabase = createClient()

    try {
      const { error } = await supabase
        .from('message_reads')
        .upsert({
          message_id: messageId,
          user_id: user.id,
          group_id: groupId,
          read_at: new Date().toISOString()
        }, {
          onConflict: 'message_id,user_id'
        })

      if (error) {
        console.error('Error marking message as read:', error)
        return false
      }
      return true
    } catch (error) {
      console.error('Error marking message as read:', error)
      return false
    }
  }

  const markAllMessagesAsRead = async () => {
    if (!user || unreadMessageIds.length === 0) return

    console.log('📖 Marking all messages as read:', unreadMessageIds.length, 'messages')

    // Mark messages individually to avoid batch errors
    const results = await Promise.allSettled(
      unreadMessageIds.map(messageId => markMessageAsRead(messageId))
    )

    // Check which ones succeeded
    const successfulIds = results
      .map((result, index) => result.status === 'fulfilled' && result.value ? unreadMessageIds[index] : null)
      .filter(Boolean) as string[]

    // Remove successful ones from unread list
    if (successfulIds.length > 0) {
      setUnreadMessageIds(prev => prev.filter(id => !successfulIds.includes(id)))
    }

    console.log('✅ Successfully marked', successfulIds.length, 'messages as read')
  }

  const checkAndMarkMessagesAsRead = () => {
    if (!messagesContainerRef.current || unreadMessageIds.length === 0) return

    const container = messagesContainerRef.current
    const messageElements = container.querySelectorAll('[data-message-id]')

    const messagesToMark: string[] = []

    messageElements.forEach(element => {
      const rect = element.getBoundingClientRect()
      const containerRect = container.getBoundingClientRect()

      const isInViewport = (
        rect.top >= containerRect.top - 50 &&
        rect.bottom <= containerRect.bottom + 50
      )

      if (isInViewport) {
        const messageId = element.getAttribute('data-message-id')
        if (messageId && unreadMessageIds.includes(messageId)) {
          messagesToMark.push(messageId)
        }
      }
    })

    if (messagesToMark.length > 0) {
      if (readReceiptTimeoutRef.current) {
        clearTimeout(readReceiptTimeoutRef.current)
      }

      readReceiptTimeoutRef.current = setTimeout(() => {
        messagesToMark.forEach(messageId => markMessageAsRead(messageId))
      }, 500)
    }
  }

  const playNotificationSound = () => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()

      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)

      oscillator.frequency.value = 600
      oscillator.type = 'sawtooth'

      gainNode.gain.setValueAtTime(0.15, audioContext.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2)

      oscillator.start(audioContext.currentTime)
      oscillator.stop(audioContext.currentTime + 0.2)
    } catch (error) {
      console.log('Audio notification failed:', error)
    }
  }

  const flashNotification = () => {
    let flashCount = 0
    const originalTitle = document.title

    const flash = () => {
      if (flashCount < 3) {
        document.title = flashCount % 2 === 0 ? '⚡' : originalTitle
        flashCount++
        setTimeout(flash, 300)
      } else {
        document.title = originalTitle
      }
    }

    flash()
  }

  const sendMessage = async () => {
    if (!newMessage.trim() || !user) return

    // Mark all unread messages as read when user sends a message
    if (unreadMessageIds.length > 0) {
      await markAllMessagesAsRead()
    }

    // Add temporary message immediately
    const tempMessageId = `temp-${Date.now()}`
    const tempMessage: Message = {
      id: tempMessageId,
      group_id: groupId,
      author_id: user.id,
      body: newMessage.trim(),
      metadata: null,
      created_at: new Date().toISOString(),
      reads: [],
      read_by_user_ids: [user.id]
    }

    setMessages(prev => [...prev, tempMessage])
    setSendingAnimations(prev => ({ ...prev, [tempMessageId]: true }))
    setMessageStatus({ id: tempMessageId, status: 'sending' })

    const messageToSend = newMessage.trim()
    setNewMessage('')
    inputRef.current?.focus()

    const supabase = createClient()
    const { data, error } = await supabase
      .from('messages')
      .insert([
        {
          group_id: groupId,
          author_id: user.id,
          body: messageToSend
        }
      ])
      .select()
      .single()

    if (error) {
      console.error('TRANSMISSION ERROR:', error)
      showErrorStatus()

      setMessages(prev => prev.filter(msg => msg.id !== tempMessageId))
      setSendingAnimations(prev => ({ ...prev, [tempMessageId]: false }))

      setNewMessage(messageToSend)
    } else {
      console.log('✅ Message sent successfully:', data)
      setTimeout(() => {
        if (messageStatus?.id === tempMessageId) {
          setMessageStatus({ id: tempMessageId, status: 'sent' })
        }
      }, 500)
    }
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }

    if (e.key === 'Escape') {
      setNewMessage('')
    }
  }

  const renderReadReceipts = (message: Message) => {
    if (!message.reads || message.reads.length === 0) return null

    const otherUserReads = message.reads.filter(read => read.user_id !== message.author_id)
    const readCount = otherUserReads.length

    if (readCount === 0) return null

    const lastRead = otherUserReads.reduce((latest, read) =>
      new Date(read.read_at) > new Date(latest.read_at) ? read : latest
    )

    const totalMembers = groupMembers.filter(m => m.user_id !== message.author_id).length
    const readPercentage = Math.round((readCount / Math.max(totalMembers, 1)) * 100)

    return (
      <div className="mt-2 pt-2 border-t border-green-900/20">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <div className="text-green-600 text-xs">
              {readCount === totalMembers ? 'ALL CREW READ' : `${readCount}/${totalMembers} CREW READ`}
            </div>
            {readCount > 0 && readCount < totalMembers && (
              <div className="h-1 w-16 bg-green-900/30 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-green-600 to-green-400 rounded-full"
                  style={{ width: `${readPercentage}%` }}
                ></div>
              </div>
            )}
          </div>
          <div className="text-green-800 text-xs">
            Last: {new Date(lastRead.read_at).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit'
            })}
          </div>
        </div>

        {groupMembers.length > 1 && (
          <div className="flex items-center gap-1">
            {otherUserReads.slice(0, 5).map((read, index) => {
              const member = groupMembers.find(m => m.user_id === read.user_id)
              return (
                <div
                  key={read.id}
                  className="relative group"
                  style={{ marginLeft: index > 0 ? '-6px' : '0' }}
                >
                  <div
                    className="w-5 h-5 rounded-full bg-green-800 border border-green-900 flex items-center justify-center text-[8px] text-green-300 transition-transform group-hover:scale-110"
                    title={`${member?.profiles?.username || 'Unknown'} • Read at ${new Date(read.read_at).toLocaleTimeString()}`}
                  >
                    {member?.profiles?.username?.charAt(0).toUpperCase() || '?'}
                  </div>
                </div>
              )
            })}
            {readCount > 5 && (
              <div className="text-green-800 text-xs ml-2">
                +{readCount - 5} more
              </div>
            )}
          </div>
        )}
      </div>
    )
  }

  // Loading State
  if (loading) {
    return (
      <div className="relative min-h-screen bg-black text-green-400 font-mono overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="h-screen" style={{
            backgroundImage: `repeating-linear-gradient(
              0deg,
              transparent,
              transparent 2px,
              rgba(0, 255, 0, 0.1) 2px,
              rgba(0, 255, 0, 0.1) 4px
            )`,
            animation: 'scan 10s linear infinite'
          }} />
        </div>

        <div className="relative z-10 flex flex-col items-center justify-center min-h-screen p-8">
          <div className="border border-green-800/50 rounded-lg p-1 bg-black/90 w-full max-w-2xl">
            <div className="border border-green-900/30 rounded p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse"></div>
                <div className="text-green-500 text-sm tracking-widest">WEYLAND-YUTANI CORPORATION</div>
              </div>

              <div className="text-center py-12">
                <div className="relative mb-6">
                  <div className="w-16 h-16 border-4 border-green-800 border-t-green-500 rounded-full animate-spin"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-8 h-8 bg-black rounded-full"></div>
                  </div>
                </div>
                <div className="text-xl text-green-300 mb-2 tracking-widest animate-pulse">
                  ESTABLISHING QUANTUM LINK...
                </div>
                <p className="text-green-700 text-sm font-mono">
                  Channel ID: {groupId.slice(0, 8)}...
                </p>
                <div className="mt-6 h-1 bg-gradient-to-r from-green-900/30 via-green-700/20 to-green-900/30 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-green-600 to-green-400 animate-pulse"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Error State
  if (error) {
    return (
      <div className="relative min-h-screen bg-black text-green-400 font-mono overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="h-screen" style={{
            backgroundImage: `repeating-linear-gradient(
              0deg,
              transparent,
              transparent 2px,
              rgba(0, 255, 0, 0.1) 2px,
              rgba(0, 255, 0, 0.1) 4px
            )`,
            animation: 'scan 10s linear infinite'
          }} />
        </div>

        <div className="relative z-10 flex flex-col items-center justify-center min-h-screen p-8">
          <div className="border border-green-800/50 rounded-lg p-1 bg-black/90 w-full max-w-lg">
            <div className="border border-green-900/30 rounded p-6">
              <div className="text-center">
                <div className="w-12 h-12 mx-auto mb-4 rounded-full border-2 border-red-500/50 flex items-center justify-center">
                  <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="text-red-400 text-xl mb-2 tracking-widest">CONNECTION FAILED</div>
                <p className="text-green-700 text-sm mb-6">{error}</p>
                <button
                  onClick={() => router.push('/chat')}
                  className="px-6 py-2 border border-green-700 text-green-300 rounded hover:bg-green-900/30 transition-all duration-300 hover:scale-105 active:scale-95 font-mono text-sm"
                >
                  ← RETURN TO CHANNELS
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Authentication Required
  if (!user) {
    return (
      <div className="relative min-h-screen bg-black text-green-400 font-mono overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="h-screen" style={{
            backgroundImage: `repeating-linear-gradient(
              0deg,
              transparent,
              transparent 2px,
              rgba(0, 255, 0, 0.1) 2px,
              rgba(0, 255, 0, 0.1) 4px
            )`,
            animation: 'scan 10s linear infinite'
          }} />
        </div>

        <div className="relative z-10 flex flex-col items-center justify-center min-h-screen p-8">
          <div className="border border-green-800/50 rounded-lg p-1 bg-black/90 w-full max-w-lg">
            <div className="border border-green-900/30 rounded p-6">
              <div className="text-center">
                <div className="w-12 h-12 mx-auto mb-4 rounded-full border-2 border-yellow-500/50 flex items-center justify-center">
                  <svg className="w-6 h-6 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <div className="text-yellow-400 text-xl mb-2 tracking-widest">ACCESS DENIED</div>
                <p className="text-green-700 text-sm mb-6">
                  Crew authentication required for secure communication
                </p>
                <button
                  onClick={() => router.push('/chat')}
                  className="px-6 py-2 border border-green-700 text-green-300 rounded hover:bg-green-900/30 transition-all duration-300 hover:scale-105 active:scale-95 font-mono text-sm"
                >
                  ← AUTHENTICATE
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Main Chat Interface
  return (
    <div className="relative min-h-screen bg-black text-green-400 font-mono overflow-hidden">
      {/* CRT Effects */}
      <div className="absolute inset-0 opacity-10">
        <div className="h-screen" style={{
          backgroundImage: `repeating-linear-gradient(
            0deg,
            transparent,
            transparent 2px,
            rgba(0, 255, 0, 0.1) 2px,
            rgba(0, 255, 0, 0.1) 4px
          )`,
          animation: 'scan 10s linear infinite'
        }} />
      </div>

      {/* Status Indicator */}
      {messageStatus && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-40">
          <div className={`px-4 py-2 rounded-lg border backdrop-blur-sm flex items-center gap-2 animate-slide-down ${
            messageStatus.status === 'sending'
              ? 'bg-yellow-900/30 border-yellow-700 text-yellow-400'
              : messageStatus.status === 'sent'
              ? 'bg-green-900/30 border-green-700 text-green-400'
              : 'bg-red-900/30 border-red-700 text-red-400'
          }`}>
            <div className={`w-2 h-2 rounded-full animate-pulse ${
              messageStatus.status === 'sending' ? 'bg-yellow-500' :
              messageStatus.status === 'sent' ? 'bg-green-500' : 'bg-red-500'
            }`}></div>
            <span className="text-sm font-mono">
              {messageStatus.status === 'sending' ? 'TRANSMITTING...' :
               messageStatus.status === 'sent' ? '✓ TRANSMISSION SENT' :
               '✗ TRANSMISSION FAILED'}
            </span>
          </div>
        </div>
      )}

      {/* Realtime Connection Status */}
      {!subscriptionActive && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-30">
          <div className="px-4 py-2 bg-yellow-900/30 border border-yellow-700/50 text-yellow-400 text-xs rounded-lg backdrop-blur-sm flex items-center gap-2 animate-pulse">
            <div className="w-1.5 h-1.5 rounded-full bg-yellow-500"></div>
            <span>CONNECTING TO REALTIME SERVER...</span>
          </div>
        </div>
      )}

      {/* Unread Messages Indicator */}
      {unreadMessageIds.length > 0 && !isScrolledToBottom && (
        <div className="fixed bottom-24 left-1/2 transform -translate-x-1/2 z-40">
          <button
            onClick={() => {
              messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
              setTimeout(() => markAllMessagesAsRead(), 300)
            }}
            className="px-4 py-2 bg-gradient-to-r from-yellow-600 to-yellow-500 text-black font-bold text-sm rounded-lg border border-yellow-400/30 hover:shadow-lg hover:shadow-yellow-500/20 hover:scale-105 active:scale-95 transition-all duration-300 flex items-center gap-2 group"
          >
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-black animate-ping"></div>
              <span>{unreadMessageIds.length} UNREAD TRANSMISSION{unreadMessageIds.length !== 1 ? 'S' : ''}</span>
              <svg className="w-4 h-4 group-hover:animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
            </div>
          </button>
        </div>
      )}

      <div className="relative z-10 container mx-auto px-4 py-8 h-screen flex flex-col">
        {/* Header */}
        <div className="border border-green-800/50 rounded-lg p-1 mb-4 bg-black/90">
          <div className="border border-green-900/30 rounded p-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <button
                    onClick={() => router.push('/chat')}
                    className="px-3 py-1 border border-green-700 text-green-300 rounded hover:bg-green-900/30 transition-all duration-300 hover:scale-105 active:scale-95 font-mono text-sm flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    CHANNELS
                  </button>
                  <div className={`w-2 h-2 rounded-full ${subscriptionActive ? 'bg-green-500 animate-pulse' : 'bg-yellow-500 animate-pulse'}`}></div>
                  <div className="text-green-500 text-sm tracking-widest truncate">
                    {groupInfo?.name || 'UNKNOWN CHANNEL'}
                  </div>
                </div>
                {groupInfo?.description && (
                  <div className="text-green-600 text-xs mt-1">
                    {groupInfo.description}
                  </div>
                )}
              </div>

              {/* Channel Stats */}
              <div className="flex items-center gap-4 text-green-700 text-xs">
                <span className="hidden sm:inline">ID: {groupId.slice(0, 8)}...</span>
                <span>•</span>
                <span>{messages.filter(m => !m.id.startsWith('temp-')).length} TRANSMISSIONS</span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <div className="flex -space-x-2">
                    {groupMembers.slice(0, 3).map((member, index) => (
                      <div
                        key={member.id}
                        className="w-4 h-4 rounded-full bg-green-700 border border-green-900 flex items-center justify-center text-[6px] text-green-300"
                        title={member.profiles?.username || 'Crew Member'}
                      >
                        {member.profiles?.username?.charAt(0).toUpperCase() || 'C'}
                      </div>
                    ))}
                  </div>
                  <span>{groupMembers.length} CREW</span>
                </span>
                <span>•</span>
                <div className="flex items-center gap-1">
                  <div className={`w-1.5 h-1.5 rounded-full ${subscriptionActive ? 'bg-green-500 animate-pulse' : 'bg-yellow-500 animate-pulse'}`}></div>
                  <span>{subscriptionActive ? 'REALTIME' : 'CONNECTING...'}</span>
                </div>
              </div>
            </div>

            {/* Unread Status Bar */}
            {unreadMessageIds.length > 0 && (
              <div className="mt-3 pt-3 border-t border-green-900/30">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse"></div>
                    <span className="text-yellow-400 text-xs">
                      {unreadMessageIds.length} UNREAD TRANSMISSION{unreadMessageIds.length !== 1 ? 'S' : ''}
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
                      setTimeout(() => markAllMessagesAsRead(), 300)
                    }}
                    className="text-green-600 text-xs hover:text-green-400 transition-colors"
                  >
                    MARK ALL AS READ →
                  </button>
                </div>
                <div className="mt-1 h-1 w-full bg-green-900/20 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-yellow-600 to-yellow-400"
                    style={{ width: `${Math.min((unreadMessageIds.length / Math.max(messages.length, 1)) * 100, 100)}%` }}
                  ></div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Messages Container */}
        <div className="flex-1 border border-green-800/50 rounded-lg p-1 bg-black/90 mb-4 overflow-hidden">
          <div className="border border-green-900/30 rounded h-full flex flex-col">
            {/* Messages Header */}
            <div className="p-4 border-b border-green-900/30 bg-green-900/10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  <span className="text-green-400 text-sm tracking-wider">QUANTUM COMMUNICATIONS</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-green-700 text-xs">
                    {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  {!subscriptionActive && (
                    <div className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse"></div>
                  )}
                </div>
              </div>
            </div>

            {/* Messages Area */}
            <div
              ref={messagesContainerRef}
              className="flex-1 overflow-y-auto p-4 space-y-3"
              id="messages-container"
            >
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center">
                  <div className="w-16 h-16 mb-4 rounded-full border-2 border-green-800/50 flex items-center justify-center">
                    <svg className="w-8 h-8 text-green-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                    </svg>
                  </div>
                  <div className="text-green-600 text-lg mb-2">CHANNEL SILENT</div>
                  <p className="text-green-700 text-sm max-w-md">
                    Initiate secure communication. This channel is end-to-end encrypted.
                  </p>
                  {!subscriptionActive && (
                    <div className="mt-4 px-4 py-2 border border-yellow-700 text-yellow-500 rounded text-xs">
                      🔄 REALTIME CONNECTION PENDING
                    </div>
                  )}
                </div>
              ) : (
                messages.map((message) => (
                  <div
                    key={message.id}
                    data-message-id={message.id}
                    className={`p-4 rounded-lg border transition-all duration-300 max-w-[85%] relative overflow-hidden animate-message-in ${
                      message.id.startsWith('temp-') ? 'opacity-70' : ''
                    } ${
                      message.author_id === user?.id
                        ? 'ml-auto bg-green-900/20 border-green-700/30'
                        : 'bg-black/30 border-green-800/30'
                    } ${
                      unreadMessageIds.includes(message.id) && message.author_id !== user?.id
                        ? 'ring-1 ring-yellow-500/30 animate-pulse-glow'
                        : ''
                    }`}
                  >
                    {/* Unread indicator */}
                    {unreadMessageIds.includes(message.id) && message.author_id !== user?.id && (
                      <div className="absolute -left-2 top-1/2 transform -translate-y-1/2">
                        <div className="w-2 h-2 rounded-full bg-yellow-500 animate-ping"></div>
                      </div>
                    )}

                    {/* Message Header */}
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${
                          message.author_id === user?.id ? 'bg-green-500' : 'bg-blue-500'
                        }`}></div>
                        <span className={`text-xs ${
                          message.author_id === user?.id ? 'text-green-400' : 'text-blue-400'
                        } font-medium`}>
                          {message.author_id === user?.id
                            ? 'YOU'
                            : groupMembers.find(m => m.user_id === message.author_id)?.profiles?.username || 'CREW MEMBER'}
                        </span>
                      </div>
                      <span className="text-green-700 text-xs">
                        {new Date(message.created_at).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>

                    {/* Message Body */}
                    <p className="text-green-300 text-sm leading-relaxed">
                      {message.body}
                    </p>

                    {/* Message Footer with Read Receipts */}
                    <div className="mt-2 pt-2 border-t border-green-900/20">
                      <div className="flex items-center justify-between mb-1">
                        <div className="text-green-800 text-xs">
                          ID: {message.id.slice(0, 8)}
                        </div>

                        {/* Read status for user's own messages */}
                        {message.author_id === user?.id && (
                          <div className="flex items-center gap-1 text-xs">
                            {message.read_by_user_ids && message.read_by_user_ids.length > 1 ? (
                              <>
                                <span className="text-green-500 animate-pulse">✓✓</span>
                                <span className="text-green-600">
                                  Read by {message.read_by_user_ids.length - 1}
                                </span>
                              </>
                            ) : message.read_by_user_ids && message.read_by_user_ids.length === 1 ? (
                              <>
                                <span className="text-green-700">✓</span>
                                <span className="text-green-800">Sent</span>
                              </>
                            ) : (
                              <>
                                <span className="text-yellow-500 animate-pulse">●</span>
                                <span className="text-yellow-600">Sending...</span>
                              </>
                            )}
                          </div>
                        )}

                        {/* Read status for others' messages */}
                        {message.author_id !== user?.id && message.read_by_user_ids && (
                          <div className="flex items-center gap-1 text-xs">
                            {message.read_by_user_ids.includes(user?.id || '') ? (
                              <>
                                <span className="text-green-600">✓ Read</span>
                              </>
                            ) : (
                              <>
                                <span className="text-yellow-600">● Unread</span>
                              </>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Render read receipts */}
                      {message.author_id !== user?.id ? renderReadReceipts(message) : (
                        message.reads && message.reads.length > 1 && (
                          <div className="mt-2 pt-2 border-t border-green-900/20">
                            <div className="text-green-600 text-xs mb-1">
                              Read by {message.reads.length - 1} crew member{message.reads.length - 1 !== 1 ? 's' : ''}
                            </div>
                            <div className="flex items-center gap-1">
                              {message.reads
                                .filter(read => read.user_id !== user?.id)
                                .slice(0, 5)
                                .map((read, index) => {
                                  const member = groupMembers.find(m => m.user_id === read.user_id)
                                  return (
                                    <div
                                      key={read.id}
                                      className="relative"
                                      style={{ marginLeft: index > 0 ? '-6px' : '0' }}
                                      title={`${member?.profiles?.username || 'Unknown'} • Read at ${new Date(read.read_at).toLocaleTimeString()}`}
                                    >
                                      <div className="w-4 h-4 rounded-full bg-green-700 border border-green-900 flex items-center justify-center text-[8px] text-green-300">
                                        {member?.profiles?.username?.charAt(0).toUpperCase() || '?'}
                                      </div>
                                    </div>
                                  )
                                })}
                              {message.reads.length - 1 > 5 && (
                                <div className="text-green-800 text-xs ml-2">
                                  +{message.reads.length - 6} more
                                </div>
                              )}
                            </div>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>
        </div>

        {/* Message Input */}
        <div className="border border-green-800/50 rounded-lg p-1 bg-black/90">
          <div className="border border-green-900/30 rounded p-4">
            {/* Status Bar */}
            {messageStatus && (
              <div className="mb-3">
                <div className={`px-3 py-1.5 rounded border text-xs flex items-center justify-between ${
                  messageStatus.status === 'sending'
                    ? 'bg-yellow-900/20 border-yellow-700/50 text-yellow-400'
                    : messageStatus.status === 'sent'
                    ? 'bg-green-900/20 border-green-700/50 text-green-400'
                    : 'bg-red-900/20 border-red-700/50 text-red-400'
                }`}>
                  <div className="flex items-center gap-2">
                    <div className={`w-1.5 h-1.5 rounded-full ${
                      messageStatus.status === 'sending' ? 'bg-yellow-500 animate-pulse' :
                      messageStatus.status === 'sent' ? 'bg-green-500' : 'bg-red-500'
                    }`}></div>
                    <span>
                      {messageStatus.status === 'sending' ? 'Encrypting transmission...' :
                       messageStatus.status === 'sent' ? 'Message delivered to network' :
                       'Transmission failed. Message restored to input'}
                    </span>
                  </div>
                  {messageStatus.status === 'sent' && (
                    <span className="animate-pulse">✓</span>
                  )}
                </div>
              </div>
            )}

            <div className="flex items-center gap-3">
              {/* User Indicator */}
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                <span className="text-green-500 text-xs">YOU</span>
              </div>

              {/* Input Field */}
              <div className="flex-1 relative">
                <input
                  ref={inputRef}
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={handleKeyDown}
                  onFocus={() => setIsTyping(true)}
                  onBlur={() => setIsTyping(false)}
                  placeholder="ENTER TRANSMISSION (PRESS ENTER TO SEND)"
                  className="w-full bg-transparent border-none outline-none text-green-300 placeholder-green-800 text-sm tracking-wider"
                  autoComplete="off"
                  spellCheck="false"
                />

                {/* Typing indicator */}
                {isTyping && (
                  <div className="absolute top-full left-0 mt-1 text-green-700 text-xs animate-pulse">
                    <div className="flex items-center gap-1">
                      <div className="w-1 h-1 rounded-full bg-green-500 animate-ping"></div>
                      <span>TRANSMITTING...</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Send Button */}
              <button
                onClick={sendMessage}
                disabled={!newMessage.trim()}
                className="px-5 py-2 bg-gradient-to-r from-green-600 to-green-500 text-black font-bold text-sm rounded border border-green-400/30 hover:shadow-lg hover:shadow-green-500/20 hover:scale-105 active:scale-95 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center gap-2 relative overflow-hidden group"
              >
                <span className="relative z-10 flex items-center gap-2">
                  SEND
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                </span>
                {/* Button Active State */}
                {newMessage.trim() && (
                  <div className="absolute inset-0 bg-gradient-to-r from-green-400/20 to-green-500/20 animate-pulse-glow"></div>
                )}
                {/* Button Hover Effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 pointer-events-none"></div>
              </button>
            </div>

            {/* Input Help */}
            <div className="mt-3 flex items-center justify-between text-green-700 text-xs">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 border border-green-800/50 rounded text-xs bg-green-900/30">ENTER</kbd>
                  <span>SEND</span>
                </span>
                <span className="text-green-900">•</span>
                <span className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 border border-green-800/50 rounded text-xs bg-green-900/30">ESC</kbd>
                  <span>CLEAR</span>
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className={`w-1.5 h-1.5 rounded-full ${subscriptionActive ? 'bg-green-500 animate-pulse' : 'bg-yellow-500 animate-pulse'}`}></div>
                <span className="text-green-800">
                  {subscriptionActive ? 'REALTIME ACTIVE' : 'CONNECTING...'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* System Status Bar */}
        <div className="mt-4 p-3 border border-green-800/30 rounded bg-black/50">
          <div className="flex items-center justify-between text-green-700 text-xs">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
                <span>CONNECTED</span>
              </span>
              <span className="text-green-900">•</span>
              <span>{messages.filter(m => !m.id.startsWith('temp-')).length} TRANSMISSIONS</span>
              <span className="text-green-900">•</span>
              <span>{unreadMessageIds.length} UNREAD</span>
              <span className="text-green-900">•</span>
              <span>{groupMembers.length} CREW ONLINE</span>
            </div>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${subscriptionActive ? 'bg-green-500 animate-pulse' : 'bg-yellow-500 animate-pulse'}`}></div>
              <span>{subscriptionActive ? 'SECURE REALTIME' : 'CONNECTING...'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Inline styles */}
      <style jsx>{`
        @keyframes scan {
          0% { transform: translateY(0); }
          100% { transform: translateY(4px); }
        }

        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }

        @keyframes message-in {
          0% {
            opacity: 0;
            transform: translateY(10px) scale(0.95);
          }
          100% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @keyframes pulse-glow {
          0%, 100% {
            box-shadow: 0 0 5px rgba(0, 255, 0, 0.3);
            border-color: rgba(0, 255, 0, 0.5);
          }
          50% {
            box-shadow: 0 0 15px rgba(0, 255, 0, 0.5);
            border-color: rgba(0, 255, 0, 0.8);
          }
        }

        @keyframes slide-down {
          0% {
            opacity: 0;
            transform: translate(-50%, -20px);
          }
          100% {
            opacity: 1;
            transform: translate(-50%, 0);
          }
        }

        .animate-scan {
          animation: scan 10s linear infinite;
        }

        .animate-shimmer {
          animation: shimmer 3s infinite;
        }

        .animate-message-in {
          animation: message-in 0.3s ease-out;
        }

        .animate-pulse-glow {
          animation: pulse-glow 2s infinite;
        }

        .animate-slide-down {
          animation: slide-down 0.3s ease-out;
        }

        /* Custom scrollbar */
        #messages-container::-webkit-scrollbar {
          width: 6px;
        }

        #messages-container::-webkit-scrollbar-track {
          background: rgba(0, 255, 0, 0.05);
          border-radius: 3px;
        }

        #messages-container::-webkit-scrollbar-thumb {
          background: rgba(0, 255, 0, 0.2);
          border-radius: 3px;
        }

        #messages-container::-webkit-scrollbar-thumb:hover {
          background: rgba(0, 255, 0, 0.3);
        }
      `}</style>
    </div>
  )
}