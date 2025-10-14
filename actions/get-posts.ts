import { db } from '@/lib/db'

// Type for Post with relations
type PostWithAuthorAndTags = {
  id: string
  title: string | null
  content: string | null
  published: boolean
  authorId: string
  createdAt: Date
  updatedAt: Date
  author: {
    id: string
    email: string
    name: string | null
    username: string | null
  }
  tags: {
    id: string
    postId: string
    tagId: string
    tag: {
      id: string
      name: string
    }
  }[]
}

interface GetPostsParams {
  userId?: string
  published?: boolean
  searchTerm?: string
  limit?: number
  offset?: number
}

export async function getPosts({
  userId,
  published,
  searchTerm,
  limit = 10,
  offset = 0,
}: GetPostsParams = {}): Promise<{
  posts: PostWithAuthorAndTags[]
  total: number
}> {
  try {
    const where: any = {}

    // Filter by user if specified
    if (userId) {
      where.authorId = userId
    }

    // Filter by published status
    if (published !== undefined) {
      where.published = published
    }

    // Search functionality
    if (searchTerm) {
      where.OR = [
        {
          title: {
            contains: searchTerm,
            mode: 'insensitive',
          },
        },
        {
          content: {
            contains: searchTerm,
            mode: 'insensitive',
          },
        },
      ]
    }

    // Get posts with pagination
    const [posts, total] = await Promise.all([
      db.post.findMany({
        where,
        include: {
          author: {
            select: {
              id: true,
              email: true,
              name: true,
              username: true,
            },
          },
          tags: {
            include: {
              tag: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: limit,
        skip: offset,
      }),
      db.post.count({ where }),
    ])

    return { posts, total }
  } catch (error) {
    console.error('Error fetching posts:', error)
    throw new Error('Failed to fetch posts')
  }
}

export async function getPostById(postId: string): Promise<PostWithAuthorAndTags | null> {
  try {
    const post = await db.post.findUnique({
      where: { id: postId },
      include: {
        author: {
          select: {
            id: true,
            email: true,
            name: true,
            username: true,
          },
        },
        tags: {
          include: {
            tag: true,
          },
        },
      },
    })

    return post
  } catch (error) {
    console.error('Error fetching post:', error)
    return null
  }
}

export async function getUserPosts(userId: string): Promise<PostWithAuthorAndTags[]> {
  try {
    const posts = await db.post.findMany({
      where: {
        authorId: userId,
      },
      include: {
        author: {
          select: {
            id: true,
            email: true,
            name: true,
            username: true,
          },
        },
        tags: {
          include: {
            tag: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return posts
  } catch (error) {
    console.error('Error fetching user posts:', error)
    throw new Error('Failed to fetch user posts')
  }
}

export async function getPublishedPosts(limit?: number): Promise<PostWithAuthorAndTags[]> {
  try {
    const posts = await db.post.findMany({
      where: {
        published: true,
      },
      include: {
        author: {
          select: {
            id: true,
            email: true,
            name: true,
            username: true,
          },
        },
        tags: {
          include: {
            tag: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
    })

    return posts
  } catch (error) {
    console.error('Error fetching published posts:', error)
    throw new Error('Failed to fetch published posts')
  }
}