ALTER TABLE tenants
  ADD COLUMN foundation_date DATE,
  ADD COLUMN description TEXT,
  ADD COLUMN slogan VARCHAR(255),
  ADD COLUMN telefono VARCHAR(50),
  ADD COLUMN email VARCHAR(255),
  ADD COLUMN facebook_url VARCHAR(255),
  ADD COLUMN instagram_url VARCHAR(255),
  ADD COLUMN twitter_url VARCHAR(255),
  ADD COLUMN youtube_url VARCHAR(255),
  ADD COLUMN tiktok_url VARCHAR(255),
  ADD COLUMN primary_color VARCHAR(16),
  ADD COLUMN secondary_color VARCHAR(16); 