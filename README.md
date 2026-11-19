# Optik Ayşegül Özçelik

University web project for the optical boutique Optik Ayşegül Özçelik in Başakşehir, Istanbul. The public name is a text wordmark. No official logo file has been supplied.

The public boutique pages read categories and products from Supabase. Administrators manage products, categories, and contact messages at `/admin`.

## How to run

Requirements: Node.js 22 or newer. Node 22 is the first LTS release with the native WebSocket that `@supabase/supabase-js` checks when it creates its client.

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
| `SUPABASE_PUBLISHABLE_KEY` | Stored for a future browser client. Not sent to pages |
| `SESSION_SECRET` | Signs the admin session cookie. Required |
| `UPLOAD_STORAGE` | `auto`, `local`, or `supabase`. See `.env.example` |
| `SUPABASE_STORAGE_BUCKET` | Optional. Defaults to `product-images` |

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
| cookie-session | Signed admin cookie. Works across separate Netlify function instances |
| serverless-http | Runs this Express app as a Netlify Function |
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

The admin id, CSRF token, and flash message are stored in a signed `optical.sid` cookie (`HttpOnly`, `SameSite=Lax`, 8 hours). In production the cookie is also `Secure`, so the browser only keeps it on HTTPS. The cookie is not a place for passwords or Supabase keys. Login and contact rate limits still live in process memory. On Netlify each function instance has its own counter, so those limits are best-effort.

Administrators can upload a product image from the product form. JPG, PNG, and WEBP files up to 5 MB are accepted after the file contents are checked. An https image address remains optional.

With `UPLOAD_STORAGE=auto`, `npm run dev` stores files on disk at `public/uploads/products/` and saves that public path in the existing `image_url` column. Netlify cannot keep those files, so the deployed site uploads to the public Supabase Storage bucket `product-images` and saves the public URL instead. The server creates that bucket on the first upload. Existing `/images/...` and `/uploads/products/...` values are left as they are. Disk files in `public/uploads/products/` are gitignored, so a Git-based Netlify deploy does not include them. A product that points at one of those paths will show a missing image until the file is uploaded again from the admin form.

## External libraries

- [Multer](https://github.com/expressjs/multer) (MIT) accepts product image uploads from the admin form.
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

## Netlify demo

Do not commit `.env`. In the Netlify UI, set these environment variables for the site (production and deploy previews):

| Name | Required | Notes |
| --- | --- | --- |
| `SESSION_SECRET` | Yes | Long random string. Different from any password |
| `SUPABASE_URL` | Yes | Server only |
| `SUPABASE_SECRET_KEY` | Yes | Server only. Never add it to the frontend |
| `SUPABASE_PUBLISHABLE_KEY` | No | Not rendered. Safe to omit until a browser client exists |
| `UPLOAD_STORAGE` | No | Leave unset or set `auto`. Netlify then uses Supabase Storage |
| `SUPABASE_STORAGE_BUCKET` | No | Defaults to `product-images` |
| `NODE_ENV` | No | Netlify sets `production` |

`netlify.toml` sets `NODE_VERSION` to 22. Netlify uses that build version as the Function runtime. Do not pin the function runtime to Node 20 in the Netlify UI.

`ADMIN_EMAIL` and `ADMIN_PASSWORD` are only for `npm run admin:create` on your computer. Run that once against this Supabase project before the demo. The Netlify site then accepts that same administrator. Do not add the password to Netlify.

Publish steps, without changing application data:

1. Push the project to a private Git repository when you are ready. Leave `.env` untracked. `.gitignore` already excludes it.
2. In Netlify, import that repository. The `netlify.toml` build command is `npm run build:static`, the publish directory is `public`, and functions live in `netlify/functions`.
3. Add the environment variables above, then deploy.
4. Open the Netlify URL. Check `/`, `/products`, a product page, `/contact`, and `/admin/login`.
5. Sign in and upload a product image. The new `image_url` should be an `https` address on your Supabase project. Older disk paths stay unchanged.

`netlify.toml` sends requests that are not real files to the Express function. CSS, JavaScript, fonts, and pictures in `public/` are served from the CDN. Bootstrap and Tabler are copied into `public/vendor/` by `npm run build:static` (also `postinstall`).

Netlify’s free functions have a short execution limit and a request body of about 6 MB. A product image near 5 MB can exceed that after encoding. Use images under about 4 MB on the demo. The contact form and admin forms are ordinary server-rendered pages; there is no separate API process to keep awake.

## Folder guide

- `app.js` builds Express and starts listening only when it is the main program. Netlify imports it through `netlify/functions/server.js`.
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
