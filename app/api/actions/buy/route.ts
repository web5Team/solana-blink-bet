export async function POST(_req: Request) {
  try {
    const body = await _req.json()
    const { account } = body
    return Response.json({ account })
  }
  catch (err) {
    return new Response(`😓 Internal Server Error: ${err}`)
  }
}
