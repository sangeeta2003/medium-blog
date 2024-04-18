import { Hono } from 'hono'
import { Prisma, PrismaClient } from '@prisma/client/edge'
import { withAccelerate } from '@prisma/extension-accelerate'
import { sign, verify } from 'hono/jwt'
import { createBlogInput, updateBlogInput } from '@sangeeta_/medium-blog'

export const blogRouter = new Hono<{
  Bindings: {
    DATABASE_URL: string
    JWT_SECRET: string
  }
  Variables: {
    userId: string
  }
}>()
blogRouter.use('/*', async (c, next) => {
  const authheader = c.req.header('authorization') || ''

  try {
    const user = verify(authheader, c.env.JWT_SECRET)
    if (user) {
      c.set('userId', user.id)
      await next()
    } else {
      c.status(403)
      return c.json({ message: 'you are not logged in' })
    }
  } catch (e) {
    c.status(403)
    return c.json({ message: 'invalid or expired token' })
    console.log(e)
  }
})

blogRouter.post('/', async (c) => {
  const body = await c.req.json()
  const { success } = createBlogInput.safeParse(body)
  if (!success) {
    c.status(411)
    return c.json({
      message: 'Inputs not correct',
    })
  }
  const authorId = c.get('userId')
  console.log(authorId)
  const prisma = new PrismaClient({
    // @ts-ignore
    datasourceUrl: c.env.DATABASE_URL,
  })

  const blog = await prisma.blog.create({
    data: {
      title: body.title,
      content: body.content,
      authorId: Number(authorId),
    },
  })

  return c.json({ id: blog.id })
})
blogRouter.post('/update', async (c) => {
  const body = await c.req.json()
  const { success } = updateBlogInput.safeParse(body)
  if (!success) {
    c.status(411)
    return c.json({
      message: 'Inputs not correct',
    })
  }
  const Prisma = new PrismaClient({
    // @ts-ignore
    datasourceUrl: c.env.DATABASE_URL,
  }).$extends(withAccelerate())

  const blog = await Prisma.blog.update({
    where: {
      id: body.id,
    },
    data: {
      title: body.title,
      content: body.content,
    },
  })
  return c.json({
    id: blog.id,
  })
})

blogRouter.post('/:id', async (c) => {
  const body = c.req.param('id')
  const Prisma = new PrismaClient({
    // @ts-ignore
    datasourceUrl: c.env.DATABASE_URL,
  }).$extends(withAccelerate())

  try {
    const blog = await Prisma.blog.findFirst({
      where: {
        id: Number(id),
      },
    })
    return c.json({
      blog,
    })
  } catch (e) {
    c.status(411)
    return c.json({
      message: 'error while fetching blog post',
    })
  }
})

// pagination
blogRouter.post('/bulk', async (c) => {
  const Prisma = new PrismaClient({
    // @ts-ignore
    datasourceUrl: c.env.DATABASE_URL,
  }).$extends(withAccelerate())
  const blogs = await Prisma.findMany()

  return c.json({
    blogs,
  })
  return c.text('hello hono')
})
