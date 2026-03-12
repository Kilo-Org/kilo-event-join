'use client'

import { useEffect, useState } from 'react'
import { supabase, type Event, type Attendee } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'

// Hardcoded event code for MVP
const EVENT_CODE = 'KILO2024'

export default function JoinPage() {
  const [event, setEvent] = useState<Event | null>(null)
  const [attendeeCount, setAttendeeCount] = useState(0)
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [hasJoined, setHasJoined] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Load event and initial attendee count
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
    }

    loadEvent()
  }, [])

  // Set up realtime subscription
  useEffect(() => {
    if (!event) return

    console.log('Setting up realtime subscription for event:', event.id)

    const channel = supabase
      .channel(`attendees-${event.id}`)
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
          setAttendeeCount((prev) => prev + 1)
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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!event) return

    setIsSubmitting(true)
    setError(null)

    const { error: insertError } = await supabase.from('attendees').insert({
      event_id: event.id,
      email: email.trim(),
      name: name.trim() || null,
    })

    setIsSubmitting(false)

    if (insertError) {
      if (insertError.code === '23505') {
        setError('You have already joined this event!')
      } else {
        setError('Failed to join. Please try again.')
        console.error('Insert error:', insertError)
      }
      return
    }

    setHasJoined(true)
  }

  if (error && !event) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800">
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800">
        <div className="text-white text-xl">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">{event.name}</CardTitle>
          <CardDescription>
            <span className="text-4xl font-bold text-primary block mt-2">
              {attendeeCount}
            </span>
            <span className="text-sm">people have joined</span>
          </CardDescription>
        </CardHeader>
        <CardContent>
          {hasJoined ? (
            <div className="text-center py-8">
              <div className="text-6xl mb-4">🎉</div>
              <h3 className="text-xl font-semibold text-green-600">You&apos;re in!</h3>
              <p className="text-muted-foreground mt-2">
                Welcome to {event.name}
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">Name (optional)</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              {error && (
                <p className="text-sm text-red-500">{error}</p>
              )}
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? 'Joining...' : 'Join Event'}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
