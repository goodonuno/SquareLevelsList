import { fetchLeaderboard } from '../content.js';
import { localize, markInAppNavigation, setMeta } from '../util.js';

import Spinner from '../components/Spinner.js';

export default {
    components: {
        Spinner,
    },
    data: () => ({
        leaderboard: [],
        loading: true,
        selected: 0,
        err: [],
        lbQuery: '',
        sortMode: 'points',
        sortModes: [
            { key: 'points', label: 'Points' },
            { key: 'victors', label: 'First Victors' },
            { key: 'creations', label: 'Creations' },
        ],
    }),
    template: `
        <main v-if="loading">
            <Spinner></Spinner>
        </main>
        <main v-else class="page-leaderboard-container">
            <div class="page-leaderboard">
                <div class="error-container">
                    <p class="error" v-if="err.length > 0">
                        Leaderboard may be incorrect, as the following levels could not be loaded: {{ err.join(', ') }}
                    </p>
                </div>
                <div class="board-container">
                    <form class="board-search" @submit.prevent>
                        <input
                            class="search"
                            type="text"
                            v-model="lbQuery"
                            placeholder="Search"
                        />
                    </form>
                    <div class="board-sort">
                        <button
                            v-for="mode in sortModes"
                            :key="mode.key"
                            type="button"
                            class="sort-btn type-label-sm"
                            :class="{ active: sortMode === mode.key }"
                            @click="sortMode = mode.key"
                        >{{ mode.label }}</button>
                    </div>
                    <table class="board">
                        <tr v-for="(ientry, i) in filteredPlayers" :key="ientry.user">
                            <td class="rank">
                                <p class="type-label-lg">#{{ i + 1 }}</p>
                            </td>
                            <td class="total">
                                <p class="type-label-lg">{{ metric(ientry) }}</p>
                            </td>
                            <td class="user" :class="{ 'active': selected == leaderboard.indexOf(ientry) }">
                                <button @click="selectPlayer(ientry)">
                                    <span class="type-label-lg">{{ ientry.user }}</span>
                                    <span class="badge type-label-sm" v-if="badgeCount(ientry)">{{ badgeLabel(ientry) }}</span>
                                </button>
                            </td>
                        </tr>
                        <tr v-if="filteredPlayers.length === 0">
                            <td class="no-results type-label-lg" colspan="3">
                                No players match your search.
                            </td>
                        </tr>
                    </table>
                </div>
                <div class="player-container">
                    <div class="player" v-if="entry.user">
                        <h1>#{{ selected + 1 }} {{ entry.user }}</h1>
                        <h3>{{ entry.total }}</h3>
                        <nav class="player-toc type-label-md">
                            <a
                                v-if="entry.firstVictors.length > 0"
                                href="#player-first-victors"
                                @click.prevent="scrollToSection('first-victors')"
                            >First Victor ({{ entry.firstVictors.length }})</a>
                            <a
                                v-if="entry.completed.length > 0"
                                href="#player-completed"
                                @click.prevent="scrollToSection('completed')"
                            >Completed ({{ entry.completed.length }})</a>
                            <a
                                v-if="entry.progressed.length > 0"
                                href="#player-progressed"
                                @click.prevent="scrollToSection('progressed')"
                            >Progressed ({{ entry.progressed.length }})</a>
                            <a
                                v-if="entry.verified.length > 0"
                                href="#player-verified"
                                @click.prevent="scrollToSection('verified')"
                            >Verified ({{ entry.verified.length }})</a>
                            <a
                                v-if="entry.creations.length > 0"
                                href="#player-creations"
                                @click.prevent="scrollToSection('creations')"
                            >Creations ({{ entry.creations.length }})</a>
                        </nav>
                        <h2 v-if="entry.firstVictors.length > 0" id="player-first-victors">First Victor ({{ entry.firstVictors.length }})</h2>
                        <table class="table">
                            <tr v-for="(victor, i) in entry.firstVictors" :key="i">
                                <td class="rank">
                                    <p>#{{ victor.rank }}</p>
                                </td>
                                <td class="level">
                                    <a class="type-label-lg" :href="levelHref(victor.path)" @click="markInAppNavigation(levelHref(victor.path))">{{ victor.level }}</a>
                                    <a class="badge type-label-sm record-video" v-if="victor.link" :href="victor.link" target="_blank">Video</a>
                                </td>
                            </tr>
                        </table>
                        <h2 v-if="entry.verified.length > 0" id="player-verified">Verified ({{ entry.verified.length }})</h2>
                        <table class="table">
                            <tr v-for="(score, i) in entry.verified" :key="i">
                                <td class="rank">
                                    <p>#{{ score.rank }}</p>
                                </td>
                                <td class="level">
                                    <a class="type-label-lg" :href="levelHref(score.path)" @click="markInAppNavigation(levelHref(score.path))">{{ score.level }}</a>
                                    <a class="badge type-label-sm record-video" v-if="score.link" :href="score.link" target="_blank">Video</a>
                                </td>
                                <td class="score">
                                    <p>+{{ localize(score.score) }}</p>
                                </td>
                            </tr>
                        </table>
                        <h2 v-if="entry.completed.length > 0" id="player-completed">Completed ({{ entry.completed.length }})</h2>
                        <table class="table">
                            <tr v-for="(score, i) in entry.completed" :key="i">
                                <td class="rank">
                                    <p>#{{ score.rank }}</p>
                                </td>
                                <td class="level">
                                    <a class="type-label-lg" :href="levelHref(score.path)" @click="markInAppNavigation(levelHref(score.path))">{{ score.level }}</a>
                                    <a class="badge type-label-sm record-video" v-if="score.link" :href="score.link" target="_blank">Video</a>
                                </td>
                                <td class="score">
                                    <p>+{{ localize(score.score) }}</p>
                                </td>
                            </tr>
                        </table>
                        <h2 v-if="entry.progressed.length > 0" id="player-progressed">Progressed ({{entry.progressed.length}})</h2>
                        <table class="table">
                            <tr v-for="(score, i) in entry.progressed" :key="i">
                                <td class="rank">
                                    <p>#{{ score.rank }}</p>
                                </td>
                                <td class="level">
                                    <a class="type-label-lg" :href="levelHref(score.path)" @click="markInAppNavigation(levelHref(score.path))">{{ score.percent }}% {{ score.level }}</a>
                                    <a class="badge type-label-sm record-video" v-if="score.link" :href="score.link" target="_blank">Video</a>
                                </td>
                                <td class="score">
                                    <p>+{{ localize(score.score) }}</p>
                                </td>
                            </tr>
                        </table>
                        <h2 v-if="entry.creations.length > 0" id="player-creations">Creations ({{ entry.creations.length }})</h2>
                        <table class="table">
                            <tr v-for="(creation, i) in entry.creations" :key="i">
                                <td class="rank">
                                    <p>#{{ creation.rank }}</p>
                                </td>
                                <td class="level">
                                    <a class="type-label-lg" :href="levelHref(creation.path)" @click="markInAppNavigation(levelHref(creation.path))">{{ creation.level }}</a>
                                </td>
                            </tr>
                        </table>
                    </div>
                    <div class="player" v-else-if="leaderboard.length === 0">
                        <p class="type-label-lg">The leaderboard is empty or no records could be loaded.</p>
                    </div>
                </div>
            </div>
        </main>
    `,
    watch: {
        $route: {
            immediate: true,
            handler: 'selectFromRoute',
        },
        selected() {
            this.updateMeta();
        },
    },
    computed: {
        filteredPlayers() {
            const q = this.lbQuery.trim().toLowerCase();

            // Searching looks through everyone, so a player with none of the
            // sorted stat can still be found and opened.
            if (q) {
                return this.sortedPlayers(
                    this.leaderboard.filter((entry) =>
                        entry.user.toLowerCase().includes(q),
                    ),
                );
            }

            // Browsing hides anyone with none of the sorted stat
            return this.sortedPlayers(
                this.leaderboard.filter((entry) => this.sortValue(entry) > 0),
            );
        },
        entry() {
            return (
                this.leaderboard[this.selected] || {
                    user: '',
                    total: 0,
                    verified: [],
                    completed: [],
                    progressed: [],
                    creations: [],
                    firstVictors: [],
                }
            );
        },
    },
    async mounted() {
        const [leaderboard, err] = await fetchLeaderboard();
        this.leaderboard = leaderboard || [];
        this.err = err;

        // Select the player from the URL if we deep linked onto a player
        this.selectFromRoute();

        // Hide loading spinner
        this.loading = false;
        this.updateMeta();
    },
    methods: {
        localize,
        markInAppNavigation,
        levelHref(path) {
            return '#/level/' + encodeURIComponent(path);
        },
        sortValue(entry) {
            switch (this.sortMode) {
                case 'victors':
                    return entry.firstVictors.length;
                case 'creations':
                    return entry.creations.length;
                default:
                    return entry.total;
            }
        },
        sortedPlayers(players) {
            return [...players].sort(
                (a, b) => this.sortValue(b) - this.sortValue(a) || b.total - a.total,
            );
        },
        metric(entry) {
            return this.sortMode === 'points'
                ? localize(entry.total)
                : this.sortValue(entry);
        },
        badgeCount(entry) {
            switch (this.sortMode) {
                case 'victors':
                    return entry.firstVictors.length;
                case 'creations':
                    return entry.creations.length;
                default:
                    return entry.completed.length;
            }
        },
        badgeLabel(entry) {
            const count = this.badgeCount(entry);
            if (!count) {
                return '';
            }

            const plural = (singular, pluralForm) =>
                `${count} ${count === 1 ? singular : pluralForm}`;

            switch (this.sortMode) {
                case 'victors':
                    return plural('first victor', 'first victors');
                case 'creations':
                    return plural('creation', 'creations');
                default:
                    return plural('completion', 'completions');
            }
        },
        updateMeta() {
            const player = this.leaderboard[this.selected];
            if (this.loading) {
                return;
            }

            if (!player || this.$route.params.user === undefined) {
                setMeta({
                    title: 'Leaderboard',
                    description: `Points leaderboard for the Square Levels List — ${this.leaderboard.length} players ranked by points, completions, first victors and creations.`,
                    url: '#/leaderboard',
                });
                return;
            }

            setMeta({
                title: `${player.user} — #${this.selected + 1}`,
                description: `#${this.selected + 1} ${player.user}: ${player.total} points, ${player.completed.length} completions, ${player.verified.length} verified, ${player.firstVictors.length} first victors on the Square Levels List.`,
                url: `#/player/${encodeURIComponent(player.user)}`,
            });
        },
        selectPlayer(entry) {
            const i = this.leaderboard.indexOf(entry);
            if (i < 0) {
                return;
            }

            this.selected = i;
            const path = '/player/' + encodeURIComponent(entry.user);
            if (this.$route.path !== path) {
                this.$router.push(path).catch(() => {});
            }
        },
        scrollToSection(section) {
            document
                .getElementById(`player-${section}`)
                ?.scrollIntoView({ block: 'start' });
        },
        selectFromRoute() {
            if (this.$route.params.user === undefined) {
                this.updateMeta();
                return;
            }

            const param = String(this.$route.params.user).toLowerCase();
            const i = this.leaderboard.findIndex(
                (entry) => entry.user.toLowerCase() === param,
            );
            if (i >= 0) {
                this.selected = i;
            }

            this.updateMeta();
        },
    },
};
