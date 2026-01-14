import React from 'react'

interface BlogParams {
    params: Promise<{blogId: string}>

}

export default async function BlogId({ params } : BlogParams) {
  const { blogId} =await params

  return (
    <div>Blog
        {blogId}
    </div>
  )
}