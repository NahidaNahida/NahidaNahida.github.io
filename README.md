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

## Analytics

The site supports Google Analytics, following the common AcadHomepage setup. The frontend configuration lives in `site-config.js`:

- `analytics.googleAnalyticsId`: GA4 measurement id, such as `G-XXXXXXXXXX`.

Visitor geography is available in the Google Analytics dashboard, rather than as an embedded map on the page.

## Adding a New Page

1. Create a new HTML file using the existing pages as a template.
2. Set a unique page id on the body, for example `<body data-page="projects">`.
3. Keep the shared hooks in the page:
   - `<div data-site-sidebar></div>`
   - `<div data-site-header></div>`
   - `<div data-site-footer></div>`
   - `site-config.js` and `site.js` script tags before `</div></body>`.
4. Add the page to the `pages` array in `site-config.js` so it appears in the top navigation.
