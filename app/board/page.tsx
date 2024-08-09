import { auth } from '@/auth'

export default async function BoardPage() {
  const sess = await auth()
  return (
    <div>
      Welcome!
      {' '}
      {sess?.user?.name}
    </div>
  )
}
