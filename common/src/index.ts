import z from "zod"

export const signupInput =z.object({
  username:z.string().email(),
  password:z.string().min(6),
  name:z.string().optional()
}) 

// type inference in zod
export type signupInput = z.infer<typeof signupInput>

export const signinInput =z.object({
    username:z.string().email(),
    password:z.string().min(6),
   
  }
)
export type signinInput = z.infer<typeof signinInput>

export const createBlogInput =z.object({
    title:z.string(),
    content:z.string(),
   
  }
)
export type createBlogInput  = z.infer<typeof createBlogInput >


export const updateBlogInput =z.object({
    title:z.string(),
    content:z.string(),
    id:z.number()
   
  }
)
export type updateBlogInput  = z.infer<typeof updateBlogInput >
