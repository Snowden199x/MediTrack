import '../css/posts.css'
import { IconPosts } from '../AdminIcons'

interface Props {
  onNewAnnouncement: () => void
}

function AnnouncementIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M18 2a3 3 0 0 1 3 3v1l-1 1-4-4 1-1h1Z" fill="currentColor"/>
      <path d="M3 17.25V21h3.75L17 10.75l-3.75-3.75L3 17.25Z" fill="currentColor" opacity=".85"/>
    </svg>
  )
}

export default function PostsPage({ onNewAnnouncement }: Props) {
  return (
    <div className="admin-content">
      <div className="admin-page-header posts-page-header">
        <div>
          <h1>Posts</h1>
          <p>Health announcements and community posts.</p>
        </div>
        <button className="admin-hdr-btn primary" onClick={onNewAnnouncement}>
          <AnnouncementIcon />
          New announcement
        </button>
      </div>

      <div className="posts-empty">
        <IconPosts />
        <p>No posts yet. Health announcements will appear here once published.</p>
      </div>
    </div>
  )
}
