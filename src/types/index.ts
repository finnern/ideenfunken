export interface Book {
  id: string
  title: string
  author: string
  description: string | null
  cover_url: string | null
  original_cover_url: string | null
  votes: number
  created_at: string
  updated_at: string
  isbn: string | null
  suggested_by: string | null
  inspiration_quote?: string | null
  suggester_name?: string | null
  is_anonymous?: boolean
  more_info_url?: string | null
  url_good_reads?: string | null
}

export interface BookVote {
  id: string
  book_id: string
  user_id: string
  created_at: string
}

export interface Profile {
  id: string
  email: string
  created_at: string
  updated_at: string
}

export interface User {
  id: string
  email?: string
}