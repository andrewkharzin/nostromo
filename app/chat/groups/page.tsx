'use client'

import { useState, useEffect } from 'react'
import { createClient } from '../../../lib/supabase/client'
import { Group } from '../../../lib/types'
import { useAuth } from '../../auth/AuthProvider'
import { useRouter } from 'next/navigation'

export default function GroupsPage() {
  const [groups, setGroups] = useState<Group[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [groupName, setGroupName] = useState('')
  const [groupDescription, setGroupDescription] = useState('')
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (user) {
      fetchGroups()
    }
  }, [user])

  const fetchGroups = async () => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('groups')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setGroups(data || [])
    } catch (error) {
      console.error('Error fetching groups:', error)
    } finally {
      setLoading(false)
    }
  }

  const createGroup = async () => {
    if (!user || !groupName.trim()) return

    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('groups')
        .insert([
          {
            name: groupName.trim(),
            description: groupDescription.trim() || null,
            created_by: user.id
          }
        ])
        .select()
        .single()

      if (error) throw error

      // Add creator as admin member
      await supabase
        .from('group_members')
        .insert([
          {
            group_id: data.id,
            user_id: user.id,
            role: 'admin'
          }
        ])

      setShowCreateModal(false)
      setGroupName('')
      setGroupDescription('')
      fetchGroups()
      router.push(`/chat/${data.id}`)
    } catch (error) {
      console.error('Error creating group:', error)
    }
  }

  const joinGroup = async (groupId: string) => {
    if (!user) return

    try {
      const supabase = createClient()

      // Check if already a member
      const { data: existing } = await supabase
        .from('group_members')
        .select('id')
        .eq('group_id', groupId)
        .eq('user_id', user.id)
        .single()

      if (existing) {
        router.push(`/chat/${groupId}`)
        return
      }

      // Join as member
      await supabase
        .from('group_members')
        .insert([
          {
            group_id: groupId,
            user_id: user.id,
            role: 'member'
          }
        ])

      router.push(`/chat/${groupId}`)
    } catch (error) {
      console.error('Error joining group:', error)
    }
  }

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-alien-green animate-pulse">Loading communication channels...</div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="text-center py-12">
        <div className="text-alien-green mb-4">Access denied. Authentication required.</div>
      </div>
    )
  }

  return (
    <div className="terminal-container p-6">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-alien-green glow">Communication Channels</h1>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 bg-alien-green text-black font-bold rounded hover:opacity-90 transition"
        >
          + New Channel
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {groups.map((group) => (
          <div
            key={group.id}
            className="border border-alien-green/30 bg-black/50 p-6 rounded-lg hover:border-alien-green transition group"
          >
            <h3 className="text-xl font-bold text-alien-green mb-2">{group.name}</h3>
            {group.description && (
              <p className="text-gray-300 mb-4">{group.description}</p>
            )}
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-400">
                Created {new Date(group.created_at).toLocaleDateString()}
              </span>
              <button
                onClick={() => joinGroup(group.id)}
                className="px-4 py-2 border border-alien-green text-alien-green rounded hover:bg-alien-green/10 transition"
              >
                Enter Channel
              </button>
            </div>
          </div>
        ))}
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-900 border border-alien-green rounded-lg p-6 max-w-md w-full">
            <h2 className="text-2xl font-bold text-alien-green mb-4">Create New Channel</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-alien-green mb-2">Channel Name</label>
                <input
                  type="text"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  className="w-full bg-black border border-alien-green/50 rounded px-3 py-2 text-white focus:outline-none focus:border-alien-green"
                  placeholder="Enter channel name"
                />
              </div>
              <div>
                <label className="block text-alien-green mb-2">Description (Optional)</label>
                <textarea
                  value={groupDescription}
                  onChange={(e) => setGroupDescription(e.target.value)}
                  className="w-full bg-black border border-alien-green/50 rounded px-3 py-2 text-white focus:outline-none focus:border-alien-green"
                  placeholder="Enter channel description"
                  rows={3}
                />
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 border border-gray-600 text-gray-300 rounded hover:bg-gray-800 transition"
              >
                Cancel
              </button>
              <button
                onClick={createGroup}
                disabled={!groupName.trim()}
                className="px-4 py-2 bg-alien-green text-black font-bold rounded hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Create Channel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}