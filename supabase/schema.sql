-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- PROFILES (extends Supabase Auth)
create table profiles (
  id uuid references auth.users on delete cascade primary key,
  username text unique not null,
  avatar_url text,
  bio text,
  created_at timestamptz default now()
);

-- Auto-create profile on sign-up
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, username, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- CATEGORIES (user-created)
create table categories (
  id uuid default gen_random_uuid() primary key,
  name text unique not null,
  icon text not null default '🏷️',
  created_by uuid references profiles(id) on delete set null,
  created_at timestamptz default now()
);

-- Seed default categories
insert into categories (name, icon) values
  ('Games', '🎮'),
  ('Movies', '🎬'),
  ('Series', '📺'),
  ('Music', '🎵'),
  ('Books', '📚'),
  ('Animes', '⛩️'),
  ('Cars', '🚗'),
  ('Restaurants', '🍽️'),
  ('Products', '📦'),
  ('People', '👤'),
  ('Places', '📍'),
  ('Sports', '⚽');

-- ATTRIBUTE TEMPLATES (suggested attributes per category)
create table attribute_templates (
  id uuid default gen_random_uuid() primary key,
  category_id uuid references categories(id) on delete cascade not null,
  label text not null,
  created_by uuid references profiles(id) on delete set null,
  unique(category_id, label)
);

-- REVIEWS
create table reviews (
  id uuid default gen_random_uuid() primary key,
  author_id uuid references profiles(id) on delete cascade not null,
  category_id uuid references categories(id) on delete set null,
  title text not null,
  description text,
  image_url text,
  attributes jsonb default '[]'::jsonb,
  -- attributes format: [{"label": "Graphics", "value": 8}, ...]
  cloned_from uuid references reviews(id) on delete set null,
  clone_count integer default 0,
  like_count integer default 0,
  created_at timestamptz default now()
);

-- COMMENTS
create table comments (
  id uuid default gen_random_uuid() primary key,
  review_id uuid references reviews(id) on delete cascade not null,
  author_id uuid references profiles(id) on delete cascade not null,
  content text not null,
  created_at timestamptz default now()
);

-- LIKES
create table likes (
  user_id uuid references profiles(id) on delete cascade,
  review_id uuid references reviews(id) on delete cascade,
  primary key (user_id, review_id)
);

-- Update like_count automatically
create or replace function update_like_count()
returns trigger as $$
begin
  if TG_OP = 'INSERT' then
    update reviews set like_count = like_count + 1 where id = NEW.review_id;
  elsif TG_OP = 'DELETE' then
    update reviews set like_count = like_count - 1 where id = OLD.review_id;
  end if;
  return null;
end;
$$ language plpgsql;

create trigger on_like_change
  after insert or delete on likes
  for each row execute procedure update_like_count();

-- Update clone_count automatically
create or replace function update_clone_count()
returns trigger as $$
begin
  if NEW.cloned_from is not null then
    update reviews set clone_count = clone_count + 1 where id = NEW.cloned_from;
  end if;
  return new;
end;
$$ language plpgsql;

create trigger on_review_cloned
  after insert on reviews
  for each row execute procedure update_clone_count();

-- FRIENDSHIPS
create table friendships (
  id uuid default gen_random_uuid() primary key,
  requester_id uuid references profiles(id) on delete cascade not null,
  addressee_id uuid references profiles(id) on delete cascade not null,
  status text check (status in ('pending', 'accepted', 'blocked')) default 'pending',
  created_at timestamptz default now(),
  unique(requester_id, addressee_id)
);

-- ROW LEVEL SECURITY
alter table profiles enable row level security;
alter table reviews enable row level security;
alter table categories enable row level security;
alter table attribute_templates enable row level security;
alter table comments enable row level security;
alter table likes enable row level security;
alter table friendships enable row level security;

-- Profiles policies
create policy "Public profiles are viewable by everyone" on profiles for select using (true);
create policy "Users can insert their own profile" on profiles for insert with check (auth.uid() = id);
create policy "Users can update their own profile" on profiles for update using (auth.uid() = id);

-- Reviews policies
create policy "Reviews are viewable by everyone" on reviews for select using (true);
create policy "Authenticated users can insert reviews" on reviews for insert with check (auth.uid() = author_id);
create policy "Users can update their own reviews" on reviews for update using (auth.uid() = author_id);
create policy "Users can delete their own reviews" on reviews for delete using (auth.uid() = author_id);

-- Categories policies
create policy "Categories are viewable by everyone" on categories for select using (true);
create policy "Authenticated users can create categories" on categories for insert with check (auth.role() = 'authenticated');

-- Attribute templates policies
create policy "Attribute templates are viewable by everyone" on attribute_templates for select using (true);
create policy "Authenticated users can create attribute templates" on attribute_templates for insert with check (auth.role() = 'authenticated');

-- Comments policies
create policy "Comments are viewable by everyone" on comments for select using (true);
create policy "Authenticated users can insert comments" on comments for insert with check (auth.uid() = author_id);
create policy "Users can delete their own comments" on comments for delete using (auth.uid() = author_id);

-- Likes policies
create policy "Likes are viewable by everyone" on likes for select using (true);
create policy "Authenticated users can like" on likes for insert with check (auth.uid() = user_id);
create policy "Users can unlike" on likes for delete using (auth.uid() = user_id);

-- Friendships policies
create policy "Users can view their own friendships" on friendships for select using (auth.uid() = requester_id or auth.uid() = addressee_id);
create policy "Users can send friend requests" on friendships for insert with check (auth.uid() = requester_id);
create policy "Users can update friendship status" on friendships for update using (auth.uid() = addressee_id or auth.uid() = requester_id);
create policy "Users can remove friendships" on friendships for delete using (auth.uid() = requester_id or auth.uid() = addressee_id);

-- Supabase Storage: create bucket 'review-images' (public)
insert into storage.buckets (id, name, public) values ('review-images', 'review-images', true);
create policy "Anyone can view review images" on storage.objects for select using (bucket_id = 'review-images');
create policy "Authenticated users can upload review images" on storage.objects for insert with check (bucket_id = 'review-images' and auth.role() = 'authenticated');
create policy "Users can delete their own review images" on storage.objects for delete using (bucket_id = 'review-images' and auth.uid()::text = (storage.foldername(name))[1]);
