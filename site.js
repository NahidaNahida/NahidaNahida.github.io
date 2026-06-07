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
        const homeOnlyVisitorStats = currentPageId === 'home' ? `
            <div id="visitor-stats" class="visitor-stats">
                Visits: <span id="visitor-page-views">Loading...</span>
            </div>
            <div id="visitor-map" class="visitor-map" hidden></div>
        ` : '';

        footer.innerHTML = `
            <div id="last-updated">
                Last updated: <span id="updated-time">Loading...</span>
            </div>
            ${homeOnlyVisitorStats}
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

    const loadVisitorStats = () => {
        const pageViewsEl = document.getElementById('visitor-page-views');
        const visits = config.visits;
        if (!visits) {
            return;
        }

        const getExternalScriptUrl = (scriptUrl) => {
            if (!scriptUrl) {
                return '';
            }

            return scriptUrl.startsWith('//') ? `https:${scriptUrl}` : scriptUrl;
        };

        const escapeHtmlAttr = (value) => String(value)
            .replace(/&/g, '&amp;')
            .replace(/"/g, '&quot;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');

        const showVisitorMapFallback = (mapEl) => {
            mapEl.classList.add('visitor-map-fallback');
            mapEl.hidden = false;
            mapEl.innerHTML = '';

            const message = document.createElement('span');
            message.textContent = 'Visitor map unavailable';

            const link = document.createElement('a');
            link.href = visits.clustrmapsFallbackUrl || 'https://clustrmaps.com/';
            link.target = '_blank';
            link.rel = 'noopener noreferrer';
            link.textContent = 'Open map';

            mapEl.append(message, link);
        };

        const loadVisitorMap = () => {
            const mapEl = document.getElementById('visitor-map');
            if (!mapEl || !visits.clustrmapsScriptUrl || mapEl.dataset.initialized === 'true') {
                return;
            }

            mapEl.hidden = false;
            mapEl.dataset.initialized = 'true';

            const scriptSrc = getExternalScriptUrl(visits.clustrmapsScriptUrl);
            const iframe = document.createElement('iframe');
            const frameId = `visitor-map-${Date.now()}`;
            iframe.title = 'Visitor map';
            iframe.loading = 'lazy';
            iframe.sandbox = 'allow-scripts allow-popups allow-popups-to-escape-sandbox';
            iframe.srcdoc = `
                <!doctype html>
                <html>
                <head>
                    <base target="_blank">
                    <style>
                        html,
                        body {
                            margin: 0;
                            width: 100%;
                            min-height: 100%;
                            overflow: hidden;
                            background: transparent;
                            text-align: center;
                        }

                        img,
                        canvas,
                        iframe {
                            max-width: 100%;
                            height: auto;
                        }
                    </style>
                </head>
                <body>
                    <script
                        id="${escapeHtmlAttr(visits.clustrmapsScriptId || 'clustrmaps')}"
                        src="${escapeHtmlAttr(scriptSrc)}"
                        onerror="parent.postMessage({ type: 'visitor-map-error', frameId: '${frameId}' }, '*')">
                    <\/script>
                    <script>
                        window.setTimeout(function () {
                            var rendered = document.querySelector('img, canvas, iframe, a, object, embed');
                            if (rendered) {
                                parent.postMessage({ type: 'visitor-map-ready', frameId: '${frameId}' }, '*');
                            }
                        }, 5000);
                    <\/script>
                </body>
                </html>
            `;
            mapEl.appendChild(iframe);

            let mapLoaded = false;
            const handleMessage = (event) => {
                if (!event.data || event.data.frameId !== frameId) {
                    return;
                }

                if (event.data.type === 'visitor-map-ready') {
                    mapLoaded = true;
                    window.removeEventListener('message', handleMessage);
                }

                if (event.data.type === 'visitor-map-error') {
                    window.removeEventListener('message', handleMessage);
                    showVisitorMapFallback(mapEl);
                }
            };
            window.addEventListener('message', handleMessage);

            window.setTimeout(() => {
                window.removeEventListener('message', handleMessage);
                if (!mapLoaded) {
                    showVisitorMapFallback(mapEl);
                }
            }, 8000);
        };

        if (!pageViewsEl) {
            loadVisitorMap();
            return;
        }

        const isPublishedPage = window.location.hostname === visits.publishedHost;
        const cachedVisitorStats =
            localStorage.getItem(visits.cacheKey) ||
            localStorage.getItem('visitor_stats_site_cache_v1') ||
            localStorage.getItem('visitor_stats_cache_v2');
        const hasCachedVisitorStats = Boolean(cachedVisitorStats);

        const setVisitorStats = (data) => {
            if (data) {
                pageViewsEl.textContent = data.pageViews ?? data.page_pv ?? '-';
            }
        };

        if (cachedVisitorStats) {
            try {
                setVisitorStats(JSON.parse(cachedVisitorStats));
            } catch (err) {
                localStorage.removeItem(visits.cacheKey);
            }
        }

        const readPageViews = () => {
            const pageViews = pageViewsEl.textContent.trim();
            if (!/^\d+$/.test(pageViews)) {
                return null;
            }
            return Number(pageViews);
        };

        const cachePageViews = (pageViews) => {
            localStorage.setItem(visits.cacheKey, JSON.stringify({ pageViews: String(pageViews) }));
        };

        const getVisitorId = () => {
            let visitorId = localStorage.getItem(visits.visitorIdKey);
            if (!visitorId) {
                visitorId = crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`;
                localStorage.setItem(visits.visitorIdKey, visitorId);
            }
            return visitorId;
        };

        const loadBackendVisitorStats = () => {
            const apiUrl = visits.apiUrl;
            if (!apiUrl) {
                return false;
            }

            const visitorId = getVisitorId();
            const siteId = visits.siteId || window.location.hostname;
            const now = Date.now();
            const lastCountedAt = Number(localStorage.getItem(visits.lastCountKey) || 0);
            const shouldCountVisit = isPublishedPage && now - lastCountedAt > visits.countIntervalMs;

            const getUrl = new URL(apiUrl);
            getUrl.searchParams.set('siteId', siteId);

            const fetchVisitCount = (method) => {
                const requestOptions = {
                    method,
                    headers: { 'Content-Type': 'application/json' }
                };
                const url = method === 'POST' ? apiUrl : getUrl.toString();
                if (method === 'POST') {
                    requestOptions.body = JSON.stringify({ siteId, visitorId });
                }

                return fetch(url, requestOptions).then((response) => {
                    if (!response.ok) {
                        throw new Error(`HTTP ${response.status}`);
                    }
                    return response.json();
                })
                .then((data) => {
                    const pageViews = Number(data.pageViews ?? data.visits);
                    if (Number.isFinite(pageViews)) {
                        pageViewsEl.textContent = String(pageViews);
                        cachePageViews(pageViews);
                    }
                    return data;
                });
            };

            const updateOnly = () => {
                fetchVisitCount('GET').catch((err) => {
                    console.error(err);
                    if (!hasCachedVisitorStats) {
                        pageViewsEl.textContent = 'Unavailable';
                    }
                });
            };

            if (shouldCountVisit) {
                localStorage.setItem(visits.lastCountKey, String(now));
                fetchVisitCount('POST').catch((err) => {
                    console.error(err);
                    localStorage.removeItem(visits.lastCountKey);
                    updateOnly();
                });
            } else {
                updateOnly();
            }

            window.setInterval(updateOnly, visits.syncIntervalMs);
            return true;
        };

        if (loadBackendVisitorStats()) {
            loadVisitorMap();
            return;
        }

        loadVisitorMap();

        const now = Date.now();
        const lastCountedAt = Number(localStorage.getItem(visits.lastCountKey) || 0);
        const pendingStartedAt = Number(localStorage.getItem(visits.pendingKey) || 0);
        const hasPendingCount = pendingStartedAt && now - pendingStartedAt < 30000;
        const shouldCountVisit = isPublishedPage && !hasPendingCount && now - lastCountedAt > visits.intervalMs;

        if (!isPublishedPage) {
            if (!hasCachedVisitorStats) {
                pageViewsEl.textContent = 'No cache';
            }
            return;
        }

        if (!shouldCountVisit) {
            if (!hasCachedVisitorStats) {
                pageViewsEl.textContent = 'Loading...';
            }
            return;
        }

        localStorage.setItem(visits.pendingKey, String(now));
        localStorage.setItem(visits.lastCountKey, String(now));

        pageViewsEl.id = 'vercount_value_site_pv';

        const counterScript = document.createElement('script');
        counterScript.defer = true;
        counterScript.src = 'https://events.vercount.one/js';
        counterScript.onload = () => {
            let attempts = 0;
            let bestPageViews = readPageViews();
            const cacheTimer = setInterval(() => {
                attempts += 1;
                const currentPageViews = readPageViews();
                if (currentPageViews !== null) {
                    bestPageViews = bestPageViews === null ? currentPageViews : Math.max(bestPageViews, currentPageViews);
                    pageViewsEl.textContent = String(bestPageViews);
                }
                if (attempts > 24) {
                    if (bestPageViews !== null) {
                        cachePageViews(bestPageViews);
                    }
                    localStorage.removeItem(visits.pendingKey);
                    clearInterval(cacheTimer);
                }
            }, 250);
        };
        counterScript.onerror = () => {
            localStorage.removeItem(visits.pendingKey);
            if (!hasCachedVisitorStats) {
                pageViewsEl.textContent = 'Unavailable';
            }
        };
        document.body.appendChild(counterScript);
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
        loadVisitorStats();
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initSite);
    } else {
        initSite();
    }
})();
