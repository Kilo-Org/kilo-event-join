'use client'

import { useEffect, useState } from 'react'
import { supabase, type Event, type Attendee } from '@/lib/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import QRCode from 'react-qr-code'

// Hardcoded event code for MVP
const EVENT_CODE = 'KILO2024'

export default function LivePage() {
  const [event, setEvent] = useState<Event | null>(null)
  const [attendeeCount, setAttendeeCount] = useState(0)
  const [recentAttendees, setRecentAttendees] = useState<Attendee[]>([])
  const [error, setError] = useState<string | null>(null)
  const [joinUrl, setJoinUrl] = useState('')

  useEffect(() => {
    // Set join URL based on current origin
    if (typeof window !== 'undefined') {
      setJoinUrl(`${window.location.origin}/join`)
    }

    // Load event and initial data
    async function loadEvent() {
      const { data: eventData, error: eventError } = await supabase
        .from('events')
        .select('*')
        .eq('code', EVENT_CODE)
        .single()

      if (eventError || !eventData) {
        setError('Event not found')
        return
      }

      setEvent(eventData)

      // Get initial attendee count
      const { count } = await supabase
        .from('attendees')
        .select('*', { count: 'exact', head: true })
        .eq('event_id', eventData.id)

      setAttendeeCount(count || 0)

      // Get recent attendees
      const { data: attendees } = await supabase
        .from('attendees')
        .select('*')
        .eq('event_id', eventData.id)
        .order('joined_at', { ascending: false })
        .limit(10)

      setRecentAttendees(attendees || [])
    }

    loadEvent()
  }, [])

  // Set up realtime subscription
  useEffect(() => {
    if (!event) return

    console.log('Setting up realtime subscription for event:', event.id)

    const channel = supabase
      .channel(`live-attendees-${event.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'attendees',
          filter: `event_id=eq.${event.id}`,
        },
        (payload) => {
          console.log('Realtime INSERT received:', payload)
          const newAttendee = payload.new as Attendee
          setAttendeeCount((prev) => prev + 1)
          setRecentAttendees((prev) => [newAttendee, ...prev.slice(0, 9)])
        }
      )
      .subscribe((status) => {
        console.log('Subscription status:', status)
      })

    return () => {
      console.log('Cleaning up subscription')
      supabase.removeChannel(channel)
    }
  }, [event])

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-900 to-purple-900">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-red-500">Error</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  if (!event) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-900 to-purple-900">
        <div className="text-white text-xl">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 to-purple-900 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-white mb-4">{event.name}</h1>
          <p className="text-xl text-indigo-200">Scan the QR code to join!</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* QR Code & Count */}
          <Card className="bg-white/10 backdrop-blur border-white/20">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center">
                {/* QR Code */}
                <div className="bg-white p-4 rounded-xl mb-8">
                  {joinUrl && (
                    <QRCode value={joinUrl} size={256} />
                  )}
                </div>

                {/* Live Count */}
                <div className="text-center">
                  <div className="text-8xl font-bold text-white mb-2">
                    {attendeeCount}
                  </div>
                  <p className="text-2xl text-indigo-200">
                    {attendeeCount === 1 ? 'person' : 'people'} joined
                  </p>
                </div>

                {/* Join URL */}
                <p className="mt-6 text-sm text-indigo-300 font-mono">
                  {joinUrl}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Recent Signups Feed */}
          <Card className="bg-white/10 backdrop-blur border-white/20">
            <CardHeader>
              <CardTitle className="text-white text-2xl">Recent Signups</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentAttendees.length === 0 ? (
                  <p className="text-indigo-300 text-center py-8">
                    Waiting for attendees...
                  </p>
                ) : (
                  recentAttendees.map((attendee, index) => (
                    <div
                      key={attendee.id}
                      className={`flex items-center gap-3 p-3 rounded-lg transition-all ${
                        index === 0 ? 'bg-green-500/20 animate-pulse' : 'bg-white/5'
                      }`}
                    >
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-500 to-orange-500 flex items-center justify-center text-white font-bold">
                        {(attendee.name || attendee.email)[0].toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-medium truncate">
                          {attendee.name || 'Anonymous'}
                        </p>
                        <p className="text-indigo-300 text-sm truncate">
                          {attendee.email}
                        </p>
                      </div>
                      <span className="text-indigo-400 text-xs">
                        {new Date(attendee.joined_at).toLocaleTimeString()}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Footer */}
        <div className="mt-12 text-center text-indigo-300 text-sm">
          Event Code: <span className="font-mono font-bold">{event.code}</span>
        </div>
      </div>
    </div>
  )
}
