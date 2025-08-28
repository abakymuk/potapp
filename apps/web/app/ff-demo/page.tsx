// app/ff-demo/page.tsx
import Client from './client'

export default function Page() {
  // distinctId для демо: из cookies/anon id (в реале — user.id)
  return <Client />
}
