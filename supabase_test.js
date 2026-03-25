const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ayuowglvbmrsxucltdxt.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF5dW93Z2x2Ym1yc3h1Y2x0ZHh0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMzNTQ5OTEsImV4cCI6MjA4ODkzMDk5MX0.PrVAqIUBAJhpE6aQzGq3kUZa0ymq0fWQIcna9T46TSo';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testFetch() {
  const { data, error } = await supabase
        .from('reviews')
        .select(`
          id,
          author_id,
          category_id,
          title,
          description,
          image_url,
          attributes,
          cloned_from,
          clone_count,
          like_count,
          created_at,
          profiles!reviews_author_id_fkey (id, username, avatar_url),
          categories (id, name, icon)
        `);

  if (error) {
     console.error("ERROR JSON:", JSON.stringify(error, null, 2));
  } else {
     console.log('SUCCESS, fetched ' + data?.length + ' rows');
  }
}

testFetch();
