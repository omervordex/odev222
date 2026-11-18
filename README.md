# Optik Ayşegül Özçelik

University web project for the optical boutique Optik Ayşegül Özçelik in Başakşehir, Istanbul. The public name is a text wordmark. No official logo file has been supplied.

This repository is at **stage 3**: the public boutique pages read categories and products from Supabase. Admin login and product editing are not built yet.

## How to run

Requirements: Node.js 18 or newer.

```bash
npm install
copy .env.example .env
npm run dev
```

On macOS or Linux, use `cp .env.example .env` instead of `copy`.

- Site: http://localhost:3000
- Collection: http://localhost:3000/products
- A missing frame: http://localhost:3000/products/not-in-catalog
- Contact: http://localhost:3000/contact
- Health check: http://localhost:3000/health
- Database check, development only: http://localhost:3000/health/db

`npm start` runs the server without auto-reload.

## Environment variables

Copy `.env.example` to `.env`. Real values stay in `.env`, which Git ignores.

| Variable | Where it is used |
| --- | --- |
| `SUPABASE_URL` | Server-side Supabase client |
| `SUPABASE_SECRET_KEY` | Server-side client only. Bypasses Row Level Security |
| `SUPABASE_PUBLISHABLE_KEY` | Stored for a future browser client. Not sent to pages in this stage |

Do not print the secret key, put it in EJS or frontend JavaScript, or commit `.env`.

## Database setup

1. Open the Supabase dashboard and select this project.
2. Open **SQL Editor** and create a new query.
3. Paste the full contents of `database/schema.sql`.
4. Run the query.
5. Check the connection:

```bash
npm run db:check
```

With `npm run dev` already running, you can also open http://localhost:3000/health/db.

`schema_missing` means the key was accepted and the SQL file still needs to be run. `ok` means the `categories` table is reachable. The check is disabled when `NODE_ENV=production`.

The SQL file creates `admins`, `categories`, `products`, and `inquiries`, with primary keys, foreign keys, checks, indexes, an `updated_at` trigger on products, and Row Level Security. `anon` and `authenticated` are denied. The Express secret key uses `service_role`, which bypasses those policies, so application queries must stay on the server.

## Dependencies

| Package | Role in this project |
| --- | --- |
| express | HTTP server and routing |
| ejs | HTML templates |
| helmet | Security headers |
| dotenv | Loads `.env` into `process.env` |
| nodemon | Restarts the server during development |
| @supabase/supabase-js | Server-side database client in `config/supabase.js` |
| express-session | Admin sign-in cookie. The default store is in-memory |
| bcryptjs | Hashes administrator passwords |
| express-validator | Validates public inquiries and admin forms |

## Public catalog

The homepage, collection, product page, and contact page render on the server. Queries live in `models/`. An empty catalog shows an empty state. The site does not insert sample products.

Search and category filters use `GET /products?q=&category=`. A product page that does not match a slug returns 404. “Ask About This Product” opens `/contact?product=slug` and selects that frame.

`POST /contact` validates the inquiry and stores it in Supabase with status `new`. A successful send redirects to `/contact/received`. The form includes a hidden honeypot and allows 10 posts from the same address in 15 minutes. An identical inquiry is not stored twice within 2 minutes.

## Admin

The admin area is `/admin`. There is no public registration. Create the first administrator once:

```bash
# PowerShell
$env:ADMIN_EMAIL="owner@example.com"
$env:ADMIN_PASSWORD="a-long-password-you-choose"
npm run admin:create
```

Use a password of 12 to 200 characters. The script hashes it with bcrypt, stores only the hash, and stops if an administrator already exists. It does not print the password. Remove those two variables from the shell when you are done. They are not required for `npm run dev`.

Also set `SESSION_SECRET` in `.env` to a long random string. The server will not start without it.

Sign in at http://localhost:3000/admin/login. From there you can manage products, categories, and inquiry statuses. Deleting a category is refused while products still use it.

The session store is Express’s built-in memory store. Sessions disappear when the process restarts, and they are not shared by multiple servers. That is a deployment blocker. Do not treat the admin login as production-ready until a shared session store is added.

## External libraries

- [Bootstrap 5.3](https://getbootstrap.com/) (MIT) provides the public responsive grid. It is served at `/vendor/bootstrap`.
- [Tabler Core 1.7](https://github.com/tabler/tabler) (MIT) provides the admin layout, cards, tables, and forms. It is served at `/vendor/tabler` and is not used on the public storefront.
- Photographs in `public/images/` are replaceable stock images, not official store photographs. Fonts in `public/fonts/` are self-hosted Cormorant Garamond and Manrope files.
- Image sources, all used under the Pexels License or the Unsplash License:
  - `hero-editorial.jpg` — user-supplied black-and-white portrait of a person holding round eyeglasses (`public/images/fgdfgdfg.jpg`). It replaces the earlier Pexels photograph.
  - `demo-studio-round.jpg` — https://www.pexels.com/photo/2530391/
  - `demo-mirror-round.jpg` — https://www.pexels.com/photo/701877/
  - `demo-gallery-portrait.jpg` — https://www.pexels.com/photo/6253858/
  - `demo-neon-round.jpg` — https://www.pexels.com/photo/343720/
  - `demo-atelier-cateye.jpg` and `category-kids.jpg` — https://www.pexels.com/photo/7357971/
  - `demo-open-aviator.jpg` — https://www.pexels.com/photo/1054777/
  - `demo-quiet-square.jpg` — https://www.pexels.com/photo/1362558/
  - `category-contacts.jpg` — https://www.pexels.com/photo/5752268/ (clear trial lenses)
  - `demo-archive-browline.jpg` and `category-optical.jpg` — https://unsplash.com/photos/1574258495973-f010dfbb5371
  - `demo-harbor-round.jpg` and `category-sunglasses.jpg` — https://unsplash.com/photos/1511499767150-a48a237f0083

## Folder guide

- `app.js` starts Express.
- `config/` reads environment settings and creates the Supabase client.
- `routes/` maps URLs to controllers.
- `controllers/` prepares the response.
- `middleware/` handles missing pages and errors.
- `views/` holds EJS pages and partials.
- `public/` holds CSS, client JavaScript, and images.
- `database/schema.sql` is the Supabase setup script.
- `database/testConnection.js` is the development connection check.
- `models/` reads categories and products, and stores inquiries.
- `middleware/inquiryGuard.js` limits repeated contact posts.
- `middleware/requireAdmin.js` protects the admin area.
- `scripts/create-admin.js` creates the first administrator from environment variables.
