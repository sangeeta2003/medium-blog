import { Hono } from 'hono'
import { PrismaClient } from '@prisma/client/edge'
import { withAccelerate } from '@prisma/extension-accelerate' 
import {sign} from 'hono/jwt'
const app = new Hono()

app.use('/api/v1/blog/*',async(c,next)=>{
  const header = c.req.header("authorization") || "";

  
  // @ts-ignore
  const response = await verify(header,c.env.JWT_SECRET)
  if(response.id){
    next()
  }
  else{
    c.status(403)
    return c.json({
      error:"unauthorized"  
    })
  }
})






app.post('/api/v1/signup', async (c) => {
  const prisma = new PrismaClient({
    // @ts-ignore
    datasourceUrl: c.env.DATABASE_URL,
  }).$extends(withAccelerate());

  const body = await c.req.json();

  try {
    const user = await prisma.user.create({
      data: {
        email: body.email,
        password: body.password,
        name: body.name,
      },
    });

    // @ts-ignore
    const token = await sign({ id: user.id }, c.env.JWT_SECRET);

    return c.json({ jwt: token });
  } catch (error) {
    if (error.code === 'P2002' && error.meta?.target?.includes('email')) {
      return c.json({ error: 'Email already exists' }, 400);
    }

    // Handle other errors
    console.error(error);
    return c.json({ error: 'Something went wrong' }, 500);
  } finally {
    await prisma.$disconnect();
  }
});
app.post('/api/v1/signin',async (c) => {
  const prisma = new PrismaClient({
    // @ts-ignore
    datasourceUrl: c.env.DATABASE_URL,
  }).$extends(withAccelerate());

  const body = await c.req.json();

  try {
    const user = await prisma.user.findUnique({
      where: {
        email: body.email,
        password: body.password,
        name: body.name,
      },
    });
    if(!user){
      c.status(403);
      return c.json({error:"user not found"})

    }

    // @ts-ignore
    const jwt = await sign({ id: user.id }, c.env.JWT_SECRET);

    return c.json({ jwt });
  } catch (error) {
    if (error.code === 'P2002' && error.meta?.target?.includes('email')) {
      return c.json({ error: 'Email already exists' }, 400);
    }

    // Handle other errors
    console.error(error);
    return c.json({ error: 'Something went wrong' }, 500);
  } finally {
    await prisma.$disconnect();
  }
});
  
app.post('/api/v1/blog',(c)=>{
  return c.text('blog')
})
app.put('/api/v1/blog',(c)=>{
  return c.text('')
})
app.get('/api/v1/blog/:id',(c)=>{
  return c.text('')
})
app.get('/api/v1/blog/bulk',(c)=>{
  return c.text('')
})
export default app
