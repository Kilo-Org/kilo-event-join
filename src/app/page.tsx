import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl">Kilo Event Join</CardTitle>
          <CardDescription className="text-lg">
            Kahoot-style realtime event participation
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Link href="/join" className="block">
            <Button className="w-full" size="lg">
              📱 Join an Event
            </Button>
          </Link>
          <Link href="/live" className="block">
            <Button className="w-full" variant="outline" size="lg">
              📊 Presenter View
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}
