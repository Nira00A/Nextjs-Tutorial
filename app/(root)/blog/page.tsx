import Link from 'next/link'
import React from 'react'

interface Id {
    blogId : number
}

export default function Blog({blogId} : Id) {
  blogId = 1

  return (
    <div>
        <Link href={`/blog/${blogId}`}>To Blog page</Link>
    </div>
  )
}
