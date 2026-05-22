# NahidaNahida's Personal Homepage

This repository hosts the source code for my personal academic homepage:

<https://nahidanahida.github.io/>

The website includes my brief biography, research interests, selected publications, academic service, talks, funding, awards, and contact information.

## Structure

- `index.html`: home page content.
- `news.html`: news page content.
- `publications.html`: selected publications page content.
- `style.css`: shared layout, typography, sidebar, navigation, publication badges, and footer styles.
- `site-config.js`: shared site configuration, including profile links, GitHub repository information, visit-count settings, and page navigation entries.
- `site.js`: shared page behavior, including the header, navigation, table of contents, sidebar toggle, last-updated time, and page-visit counter.

## Visit Counter

The site supports a lightweight self-hosted visit counter API. The frontend configuration lives in `site-config.js`:

- `apiUrl`: visit counter API endpoint. Leave it empty to use the existing Vercount fallback.
- `syncIntervalMs`: how often the page reads the latest visit number without increasing it.
- `countIntervalMs`: how often the same browser visitor is allowed to increase the visit number.

The `workers/` folder contains a Cloudflare Worker example:

- `workers/visit-counter.js`: API implementation.
- `workers/wrangler.toml.example`: deployment template.

To deploy with Cloudflare Workers:

1. Create a Cloudflare KV namespace.
2. Copy `workers/wrangler.toml.example` to `workers/wrangler.toml`.
3. Replace `replace_with_cloudflare_kv_namespace_id` with the KV namespace id.
4. Deploy the Worker with Wrangler.
5. Set `visits.apiUrl` in `site-config.js` to the deployed Worker URL.

The Worker exposes:

- `GET /?siteId=nahidanahida.github.io`: read the current visit count only.
- `POST /`: count a visit if the visitor is outside the backend count interval, then return the latest count.

This separates display synchronization from anti-refresh counting. The pages can read the latest number frequently while the backend only increments the counter after the configured interval.

## Adding a New Page

1. Create a new HTML file using the existing pages as a template.
2. Set a unique page id on the body, for example `<body data-page="projects">`.
3. Keep the shared hooks in the page:
   - `<div data-site-sidebar></div>`
   - `<div data-site-header></div>`
   - `<div data-site-footer></div>`
   - `site-config.js` and `site.js` script tags before `</div></body>`.
4. Add the page to the `pages` array in `site-config.js` so it appears in the top navigation.
