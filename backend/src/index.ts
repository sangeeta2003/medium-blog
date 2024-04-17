import { Hono } from 'hono'
import { PrismaClient } from '@prisma/client/edge'
import { withAccelerate } from '@prisma/extension-accelerate'
import { sign, verify } from 'hono/jwt'
const app = new Hono()

// app.use('/api/v1/blog/*', async (c, next) => {
//   const header = c.req.header('authorization') || ''

//   // @ts-ignore
//   const response = await verify(header, c.env.JWT_SECRET)
//   if (response.id) {
//     next()
//   } else {
//     c.status(403)
//     return c.json({
//       error: 'unauthorized',
//     })
//   }
// })

async function signupHandler(c) {
  const body = await c.req.json()
  const prisma = new PrismaClient({
    // @ts-ignore
    datasourceUrl: c.env.DATABASE_URL,
  }).$extends(withAccelerate())

  try {
    const user = await prisma.user.create({
      data: {
        email: body.email,
        username: body.username, // Include the username field from the request body
        password: body.password,
        name: body.name,
      },
    })

    const token = await sign({ id: user.id }, c.env.JWT_SECRET)
    return c.json({ jwt: token })
  } catch (error) {
    if (error.code === 'P2002' && error.meta?.target?.includes('email')) {
      return c.json({ error: 'Email already exists' }, 400)
    }

    console.error(error)
    return c.json({ error: 'Something went wrong' }, 500)
  } finally {
    await prisma.$disconnect()
  }
}

app.post('/api/v1/signup', signupHandler)

// app.post('/api/v1/signin', async (c) => {
//   const body = await c.req.json()

//   try {
//     const user = await prisma.user.findUnique({
//       where: {
//         email: body.email,
//       },
//     })
//     if (!user || user.password !== body.password) {
//       c.status(403)
//       return c.json({ error: 'Invalid email or password' })
//     }

//     // @ts-ignore
//     const jwt = await sign({ id: user.id }, c.env.JWT_SECRET)

//     return c.json({ jwt })
//   } catch (error) {
//     console.error(error)
//     return c.json({ error: 'Something went wrong' }, 500)
//   }
// })

export default app
