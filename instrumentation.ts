let processing = false
export function register() {
  console.info('register...')
  setInterval(
    async () => {
      if (processing)
        return
      processing = true
      try {
        // if (1 + 1 === 2)
        //   return
        // console.info('settle bets...')
        const port = process.env.PORT || 3000
        const result = await fetch(`http://localhost:${port}/api/bet/settle?secret=${process.env.NEXT_INTERNAL_API_SECRET}`, {
          method: 'POST',

        }).then(res => res.json())
        console.info('✅ Interval settle bets success', result)
      }
      catch {

      }
      finally {
        processing = false
      }
    },
    5000,
  )
}
