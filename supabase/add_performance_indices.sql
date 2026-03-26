-- Performance Optimization Indices
-- Run this script in your Supabase SQL Editor to speed up your frontend queries.

-- 1. Indices on Foreign Keys (Crucial for joins and where clauses)
CREATE INDEX IF NOT EXISTS idx_reviews_author_id ON public.reviews(author_id);
CREATE INDEX IF NOT EXISTS idx_reviews_category_id ON public.reviews(category_id);
CREATE INDEX IF NOT EXISTS idx_comments_review_id ON public.comments(review_id);
CREATE INDEX IF NOT EXISTS idx_comments_author_id ON public.comments(author_id);
CREATE INDEX IF NOT EXISTS idx_likes_review_id ON public.likes(review_id);

-- 2. Indices for Sorting (Crucial for ORDER BY clauses)
CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON public.reviews(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reviews_like_count ON public.reviews(like_count DESC);
CREATE INDEX IF NOT EXISTS idx_reviews_clone_count ON public.reviews(clone_count DESC);

-- 3. Indices for Friendships filter logic
CREATE INDEX IF NOT EXISTS idx_friendships_requester_addressee ON public.friendships(requester_id, addressee_id);
CREATE INDEX IF NOT EXISTS idx_friendships_status ON public.friendships(status);

-- 4. Text search index on Review titles for the search bar (ilike query)
CREATE INDEX IF NOT EXISTS idx_reviews_title_gin ON public.reviews USING gin (title gin_trgm_ops);
-- Note: Requires pg_trgm extension. If it errors out, you can optionally enable the extension via:
-- CREATE EXTENSION IF NOT EXISTS pg_trgm;
