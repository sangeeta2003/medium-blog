import { Hono } from 'hono'
import { PrismaClient } from '@prisma/client/edge'
import { withAccelerate } from '@prisma/extension-accelerate'
import { sign, verify } from 'hono/jwt'
import { signinInput, signupInput } from '@sangeeta_/medium-blog'

export const userRouter = new Hono<{
  Bindings: {
    DATABASE_URL: string
    JWT_SECRET: string
  }
}>()

async function signupHandler(c) {
  const body = await c.req.json()
  const { success } = signupInput.safeParse(body)
  if (!success) {
    c.status(411)
    return c.json({
      message: 'Inputs not correct',
    })
  }
  const prisma = new PrismaClient({
    // @ts-ignore
    datasourceUrl: c.env.DATABASE_URL,
  }).$extends(withAccelerate())

  try {
    const user = await prisma.user.create({
      data: {
        email: body.email,
        username: body.username,
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

userRouter.post('/signup', signupHandler)

// sigin api
userRouter.post('/signin', async (c) => {
  const body = await c.req.json()
  const { success } = signinInput.safeParse(body)
  if (!success) {
    c.status(411)
    return c.json({
      message: 'Inputs not correct',
    })
  }
  const prisma = new PrismaClient({
    // @ts-ignore
    datasourceUrl: c.env.DATABASE_URL,
  }).$extends(withAccelerate())

  try {
    const user = await prisma.user.findUnique({
      where: {
        email: body.email,
        password: body.password,
      },
    })
    if (!user || user.password !== body.password) {
      c.status(403)
      return c.json({ error: 'Invalid email or password' })
    }

    // @ts-ignore
    const jwt = await sign({ id: user.id }, c.env.JWT_SECRET)

    return c.json({ jwt })
  } catch (error) {
    console.error(error)
    return c.json({ error: 'Something went wrong' }, 500)
  }
})
