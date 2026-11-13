// https://stackoverflow.com/questions/3452546/how-do-i-get-the-youtube-video-id-from-a-url
export function getYoutubeIdFromUrl(url) {
    return url.match(
        /.*(?:youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=)([^#\&\?]*).*/,
    )?.[1] ?? '';
}

export function embed(video) {
    return `https://www.youtube.com/embed/${getYoutubeIdFromUrl(video)}`;
}

export function localize(num) {
    return num.toLocaleString(undefined, { minimumFractionDigits: 3 });
}

let inAppNavigationPath = null;

const routePath = (path) => String(path || '').replace(/^#/, '');

/**
 * Marks the next route change as coming from a click inside the app, so views
 * can skip scrolling when the user opened something they were already looking
 * at. Navigating by URL (address bar, reload) stays unmarked.
 */
export function markInAppNavigation(path) {
    inAppNavigationPath = routePath(path);
}

/** Reads and clears the in-app navigation mark for the given route path. */
export function consumeInAppNavigation(path) {
    const marked =
        !!path && inAppNavigationPath === routePath(path);
    inAppNavigationPath = null;
    return marked;
}

const SITE_NAME = 'Square Levels List';

function upsertMeta(attr, key, content) {
    if (typeof document === 'undefined' || !content) {
        return;
    }

    let tag = document.head.querySelector(`meta[${attr}="${key}"]`);
    if (!tag) {
        tag = document.createElement('meta');
        tag.setAttribute(attr, key);
        document.head.appendChild(tag);
    }
    tag.setAttribute('content', content);
}

/**
 * Update the document title and social preview tags for the current page.
 */
export function setMeta({ title, description, url }) {
    if (typeof document === 'undefined') {
        return;
    }

    const fullTitle = title ? `${title} | ${SITE_NAME}` : SITE_NAME;
    document.title = fullTitle;

    upsertMeta('property', 'og:site_name', SITE_NAME);
    upsertMeta('property', 'og:type', 'website');
    upsertMeta('property', 'og:title', fullTitle);
    upsertMeta('property', 'og:description', description);
    upsertMeta('name', 'description', description);
    upsertMeta('name', 'twitter:card', 'summary');
    upsertMeta('name', 'twitter:title', fullTitle);
    upsertMeta('name', 'twitter:description', description);

    const absolute = url ? new URL(url, location.href).href : location.href;
    upsertMeta('property', 'og:url', absolute);

    let canonical = document.head.querySelector('link[rel="canonical"]');
    if (!canonical) {
        canonical = document.createElement('link');
        canonical.setAttribute('rel', 'canonical');
        document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', absolute);
}

export function getThumbnailFromId(id) {
    return `https://img.youtube.com/vi/${id}/mqdefault.jpg`;
}

// https://stackoverflow.com/questions/2450954/how-to-randomize-shuffle-a-javascript-array
export function shuffle(array) {
    let currentIndex = array.length, randomIndex;

    // While there remain elements to shuffle.
    while (currentIndex != 0) {
        // Pick a remaining element.
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;

        // And swap it with the current element.
        [array[currentIndex], array[randomIndex]] = [
            array[randomIndex],
            array[currentIndex],
        ];
    }

    return array;
}
