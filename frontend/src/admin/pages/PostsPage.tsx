import '../css/posts.css'
import { IconPosts } from '../AdminIcons'

export default function PostsPage() {
  return (
    <div className="admin-content">
      <div className="admin-page-header">
        <h1>Posts</h1>
        <p>Health announcements and community posts.</p>
      </div>
      <div className="posts-empty">
        <IconPosts />
        <p>No posts yet. Health announcements will appear here once published.</p>
      </div>
    </div>
  )
}
