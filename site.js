(function () {
    const config = window.SITE_CONFIG || {};

    const getCurrentPageId = () => document.body.dataset.page || 'home';

    const renderSidebar = () => {
        const sidebar = document.querySelector('[data-site-sidebar]');
        if (!sidebar) {
            return;
        }

        sidebar.id = 'sidebar';
        sidebar.innerHTML = `
            <button id="toggle-sidebar" type="button">☰</button>
            <nav id="toc">
                <b>Contents</b>
                <ul id="toc-list"></ul>
            </nav>
        `;
    };

    const renderHeader = () => {
        const header = document.querySelector('[data-site-header]');
        const profile = config.profile;
        if (!header || !profile) {
            return;
        }

        header.classList.add('header');
        header.innerHTML = '';

        const h1 = document.createElement('h1');
        h1.append(document.createTextNode(`${profile.name} (`));
        const chineseName = document.createElement('span');
        chineseName.lang = 'zh';
        chineseName.textContent = profile.chineseName;
        h1.append(chineseName, document.createTextNode(')'));
        header.appendChild(h1);

        const links = document.createElement('p');
        links.className = 'icon-links';
        profile.links.forEach((profileLink, index) => {
            if (index > 0) {
                links.append(document.createTextNode(' | '));
            }

            const link = document.createElement('a');
            link.href = profileLink.href;
            link.target = '_blank';
            link.rel = 'noopener noreferrer';

            const icon = document.createElement('i');
            icon.className = profileLink.iconClass;
            link.append(icon, document.createTextNode(` ${profileLink.label}`));
            links.appendChild(link);
        });
        header.appendChild(links);

        const nav = document.createElement('nav');
        nav.className = 'page-nav';
        nav.dataset.siteNav = '';
        header.appendChild(nav);
    };

    const renderFooter = () => {
        const footer = document.querySelector('[data-site-footer]');
        if (!footer) {
            return;
        }

        const currentPageId = getCurrentPageId();
        const homeOnlyVisits = currentPageId === 'home' ? `
            <div id="visitor-stats" class="visitor-stats">
                Visits:
            </div>
            <div id="visitor-map" class="visitor-map"></div>
        ` : '';

        footer.innerHTML = `
            <div id="last-updated">
                Last updated: <span id="updated-time">Loading...</span>
            </div>
            ${homeOnlyVisits}
        `;
    };

    const renderPageNav = () => {
        const nav = document.querySelector('[data-site-nav]');
        if (!nav || !Array.isArray(config.pages)) {
            return;
        }

        const currentPageId = getCurrentPageId();
        nav.setAttribute('aria-label', 'Primary');
        nav.innerHTML = '';

        config.pages.forEach((page) => {
            const link = document.createElement('a');
            link.href = page.href;
            link.textContent = page.label;
            if (page.id === currentPageId) {
                link.classList.add('active');
            }
            nav.appendChild(link);
        });
    };

    const generateTOC = () => {
        const tocList = document.getElementById('toc-list');
        if (!tocList) {
            return;
        }

        const headings = Array.from(document.querySelectorAll('h2, h3, h4'));
        const tocLinks = [];
        tocList.innerHTML = '';

        headings.forEach((heading) => {
            const id = heading.textContent.trim().replace(/\s+/g, '_');
            heading.id = id;

            const li = document.createElement('li');
            li.style.marginLeft = heading.tagName === 'H2' ? '0px' :
                heading.tagName === 'H3' ? '10px' : '20px';

            const a = document.createElement('a');
            a.href = `#${id}`;
            a.textContent = heading.textContent;
            tocLinks.push(a);

            li.appendChild(a);
            tocList.appendChild(li);
        });

        const setActiveTocLink = (id) => {
            tocLinks.forEach((link) => {
                link.classList.toggle('active', link.getAttribute('href') === `#${id}`);
            });
        };

        let clickedTocId = null;
        let clickedTocTimer = null;

        const updateActiveTocLink = () => {
            if (clickedTocId) {
                setActiveTocLink(clickedTocId);
                return;
            }

            let activeHeading = headings[0];
            headings.forEach((heading) => {
                if (heading.getBoundingClientRect().top <= 120) {
                    activeHeading = heading;
                }
            });

            if (activeHeading) {
                setActiveTocLink(activeHeading.id);
            }
        };

        tocLinks.forEach((link) => {
            link.addEventListener('click', () => {
                clickedTocId = link.getAttribute('href').slice(1);
                setActiveTocLink(clickedTocId);
                clearTimeout(clickedTocTimer);
                clickedTocTimer = setTimeout(() => {
                    clickedTocId = null;
                }, 700);
            });
        });

        window.addEventListener('scroll', updateActiveTocLink);
        updateActiveTocLink();
    };

    const setupSidebarToggle = () => {
        const toggle = document.getElementById('toggle-sidebar');
        const sidebar = document.getElementById('sidebar');
        if (!toggle || !sidebar) {
            return;
        }

        toggle.addEventListener('click', () => {
            sidebar.classList.toggle('hidden');
        });
    };

    const loadLastUpdated = () => {
        const updatedTimeEl = document.getElementById('updated-time');
        const github = config.github;
        if (!updatedTimeEl || !github) {
            return;
        }

        fetch(`https://api.github.com/repos/${github.user}/${github.repo}/commits/${github.branch}`)
            .then((response) => response.json())
            .then((commit) => {
                if (commit && commit.commit && commit.commit.author) {
                    const updatedAt = new Date(commit.commit.author.date);
                    updatedTimeEl.textContent = updatedAt.toLocaleString();
                } else {
                    updatedTimeEl.textContent = 'No commits yet';
                }
            })
            .catch((err) => {
                console.error(err);
                updatedTimeEl.textContent = 'Error fetching update time';
            });
    };

    const loadAnalytics = () => {
        const analyticsId = config.analytics && config.analytics.googleAnalyticsId;
        if (!analyticsId) {
            return;
        }

        const script = document.createElement('script');
        script.async = true;
        script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(analyticsId)}`;
        document.head.appendChild(script);

        window.dataLayer = window.dataLayer || [];
        function gtag() {
            window.dataLayer.push(arguments);
        }
        window.gtag = window.gtag || gtag;
        gtag('js', new Date());
        gtag('config', analyticsId);
    };

    const loadVisitorMap = () => {
        const visits = config.visits;
        const mapEl = document.getElementById('visitor-map');
        if (!visits || !mapEl || mapEl.dataset.initialized === 'true') {
            return;
        }

        if (!visits.mapMyVisitorsWidgetUrl) {
            mapEl.textContent = 'Visitor map is temporarily unavailable.';
            return;
        }

        mapEl.dataset.initialized = 'true';

        const status = document.createElement('p');
        status.setAttribute('role', 'status');
        status.textContent = 'Loading visitor map...';
        mapEl.appendChild(status);

        const script = document.createElement('script');
        // The provider locates this exact ID and inserts the map beside it.
        // Keep the script in the visible footer, rather than in the head.
        script.id = 'mmvst_globe';
        script.async = true;
        script.src = visits.mapMyVisitorsWidgetUrl.startsWith('//')
            ? `https:${visits.mapMyVisitorsWidgetUrl}`
            : visits.mapMyVisitorsWidgetUrl;
        script.onload = () => {
            status.remove();
        };
        script.onerror = () => {
            status.textContent = 'Visitor map is temporarily unavailable.';
        };
        mapEl.appendChild(script);

        // MapMyVisitors creates its own anchor asynchronously. Replace the
        // provider homepage URL with this site's statistics page after the
        // globe has been inserted, so clicking anywhere on the globe opens
        // the requested visitor report.
        const setGlobeStatsLink = () => {
            const globeLink = mapEl.querySelector('#mmvst_a');
            if (!globeLink || !visits.mapMyVisitorsStatsUrl) {
                return false;
            }
            globeLink.href = visits.mapMyVisitorsStatsUrl;
            globeLink.target = '_self';
            globeLink.rel = 'noopener noreferrer';
            return true;
        };
        // The provider may replace the generated anchor after initial render.
        // Delegate the click so the statistics page remains the destination
        // even when the widget refreshes its markup.
        if (visits.mapMyVisitorsStatsUrl) {
            mapEl.addEventListener('click', (event) => {
                const globeLink = event.target.closest('#mmvst_a');
                if (!globeLink) {
                    return;
                }
                event.preventDefault();
                window.location.assign(visits.mapMyVisitorsStatsUrl);
            });
        }
        const globeLinkObserver = new MutationObserver(() => {
            if (setGlobeStatsLink()) {
                globeLinkObserver.disconnect();
            }
        });
        globeLinkObserver.observe(mapEl, { childList: true, subtree: true });
        setGlobeStatsLink();

        if (visits.mapMyVisitorsStatsUrl) {
            const link = document.createElement('a');
            link.href = visits.mapMyVisitorsStatsUrl;
            link.target = '_blank';
            link.rel = 'noopener noreferrer';
            link.textContent = 'View visitor statistics';
            mapEl.appendChild(link);
        }
    };

    const initSite = () => {
        renderSidebar();
        renderHeader();
        renderFooter();
        renderPageNav();
        generateTOC();
        setupSidebarToggle();
        loadAnalytics();
        loadLastUpdated();
        loadVisitorMap();
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initSite);
    } else {
        initSite();
    }
})();
