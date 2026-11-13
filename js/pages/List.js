import { store } from "../main.js";
import {
    consumeInAppNavigation,
    embed,
    markInAppNavigation,
    setMeta,
} from "../util.js";
import { score } from "../score.js";
import { fetchEditors, fetchList, firstVictorOf } from "../content.js";
import { MAIN_LIST_SIZE, LIST_SIZE } from "../constants.js";

import Spinner from "../components/Spinner.js";
import LevelAuthors from "../components/List/LevelAuthors.js";

const roleIconMap = {
    owner: "crown",
    admin: "user-gear",
    helper: "user-shield",
    dev: "code",
    trial: "user-lock",
};

export default {
    components: { Spinner, LevelAuthors },
    template: `
        <main v-if="loading">
            <Spinner></Spinner>
        </main>
        <main v-else class="page-list">
            <div class="list-container">
                <form class="list-controls" @submit.prevent>
                    <input
                        class="search"
                        type="text"
                        v-model="query"
                        placeholder="Search"
                        @keydown.enter="onSearch"
                    />
                </form>
                <p class="jump-error type-label-md" v-if="jumpError">{{ jumpError }}</p>
                <table class="list">
                    <tr v-for="entry in rows" :key="entry.i">
                        <td class="rank">
                            <p v-if="entry.rank <= listSize" class="type-label-lg">#{{ entry.rank }}</p>
                            <p v-else class="type-label-lg">Legacy</p>
                        </td>
                        <td class="level" :class="{ 'active': selected === entry.i, 'error': !entry.level }">
                            <button @mousedown.prevent @click="select(entry.i)">
                                <span class="type-label-lg">{{ entry.level?.name || \`Error (\${entry.err}.json)\` }}</span>
                                <span class="badges" v-if="entry.level">
                                    <span class="badge type-label-sm">{{ entry.level.records?.length || 0 }} records</span>
                                </span>
                            </button>
                        </td>
                    </tr>
                    <tr v-if="rows.length === 0">
                        <td class="no-results type-label-lg" colspan="2">No levels match your search.</td>
                    </tr>
                </table>
            </div>
            <div class="level-container">
                <div class="level" v-if="level">
                    <h1>{{ level.name }}</h1>
                    <LevelAuthors :author="level.author" :creators="level.creators" :verifier="level.verifier"></LevelAuthors>
                    <iframe class="video" id="videoframe" :src="video" frameborder="0"></iframe>
                    <ul class="stats">
                        <li>
                            <div class="type-title-sm">Points when completed</div>
                            <p>{{ score(selected + 1, 100, level.percentToQualify) }}</p>
                        </li>
                        <li>
                            <div class="type-title-sm">ID</div>
                            <p class="stat-value">
                                <span>{{ level.id }}</span>
                                <button type="button" class="copy-btn type-label-sm" @click="copyId">
                                    {{ copied ? 'Copied!' : 'Copy' }}
                                </button>
                            </p>
                        </li>
                        <li>
                            <div class="type-title-sm">Password</div>
                            <p>{{ level.password || 'Free to Copy' }}</p>
                        </li>
                    </ul>
                    <h2>Records</h2>
                    <p v-if="selected + 1 <= mainListSize"><strong>{{ level.percentToQualify }}%</strong> or better to qualify</p>
                    <p v-else-if="selected + 1 <= listSize"><strong>100%</strong> or better to qualify</p>
                    <p v-else>This level does not accept new records.</p>
                    <table class="records">
                        <tr v-for="(record, i) in level.records" :key="i" class="record">
                            <td class="percent">
                                <p>{{ record.percent }}%</p>
                            </td>
                            <td class="user">
                                <a :href="playerHref(record.user)" class="type-label-lg">{{ record.user }}</a>
                                <span class="records-badges" v-if="i === firstVictorIndex">
                                    <span class="badge type-label-sm first-victor">First Victor</span>
                                </span>
                            </td>
                            <td class="mobile">
                                <img v-if="record.mobile" :src="\`/assets/phone-landscape\${store.dark ? '-dark' : ''}.svg\`" alt="Mobile">
                            </td>
                            <td class="hz">
                                <p>{{ record.hz }}Hz</p>
                            </td>
                        </tr>
                        <tr v-if="level.records.length === 0">
                            <td colspan="4" class="no-results type-label-lg">No records match the current filters.</td>
                        </tr>
                    </table>
                </div>
                <div v-else class="level" style="height: 100%; justify-content: center; align-items: center;">
                    <p>(ノಠ益ಠ)ノ彡┻━┻</p>
                </div>
            </div>
            <div class="meta-container">
                <div class="meta">
                    <div class="errors" v-show="errors.length > 0">
                        <p class="error" v-for="error of errors">{{ error }}</p>
                    </div>
                    <div class="og">
                        <p class="type-label-md">Website layout made by <a href="https://tsl.pages.dev/" target="_blank">TheShittyList</a></p>
                    </div>
                    <template v-if="editors">
                        <h3>List Editors</h3>
                        <ol class="editors">
                            <li v-for="editor in editors">
                                <img :src="\`/assets/\${roleIconMap[editor.role]}\${store.dark ? '-dark' : ''}.svg\`" :alt="editor.role">
                                <a v-if="editor.link" class="type-label-lg link" target="_blank" :href="editor.link">{{ editor.name }}</a>
                                <p v-else>{{ editor.name }}</p>
                            </li>
                        </ol>
                    </template>
                    <h3>Submission Requirements</h3>
                    <p>
                        Achieved the record without using hacks (however, FPS bypass is allowed, up to 360fps)
                    </p>
                    <p>
                        Achieved the record on the level that is listed on the site - please check the level ID before you submit a record
                    </p>
                    <p>
                        Have either source audio or clicks/taps in the video. Edited audio only does not count
                    </p>
                    <p>
                        The recording must have a previous attempt and entire death animation shown before the completion, unless the completion is on the first attempt. Everyplay records are exempt from this
                    </p>
                    <p>
                        The recording must also show the player hit the endwall, or the completion will be invalidated.
                    </p>
                    <p>
                        Do not use secret routes or bug routes
                    </p>
                    <p>
                        Do not use easy modes, only a record of the unmodified level qualifies
                    </p>
                    <p>
                        Once a level falls onto the Legacy List, we accept records for it for 24 hours after it falls off, then afterwards we never accept records for said level
                    </p>
                </div>
            </div>
        </main>
    `,
    data: () => ({
        list: [],
        editors: [],
        loading: true,
        selected: 0,
        errors: [],
        query: '',
        jumpError: '',
        copied: false,
        mainListSize: MAIN_LIST_SIZE,
        listSize: LIST_SIZE,
        roleIconMap,
        store
    }),
    watch: {
        $route: {
            immediate: true,
            handler: 'syncFromRoute',
        },
        selected() {
            this.updateMeta();
        },
    },
    computed: {
        rows() {
            const q = this.query.trim().toLowerCase();
            return this.list
                .map(([level, err], i) => ({ level, err, i, rank: i + 1 }))
                .filter(({ level }) => {
                    if (!q) return true;
                    if (!level) return false;
                    const haystack = [
                        level.name,
                        level.author,
                        level.verifier,
                        level.path,
                        ...(level.creators || []),
                    ]
                        .join(' ')
                        .toLowerCase();
                    return haystack.includes(q);
                });
        },
        level() {
            return this.list[this.selected]?.[0] || null;
        },
        video() {
            if (!this.level.showcase) {
                return embed(this.level.verification);
            }

            return embed(
                this.toggledShowcase
                    ? this.level.showcase
                    : this.level.verification
            );
        },
        firstVictorIndex() {
            return (this.level?.records || []).findIndex(
                (record) => record.percent === 100,
            );
        },
    },
    async mounted() {
        // Hide loading spinner
        this.list = (await fetchList()) || [];
        this.editors = await fetchEditors();

        // Error handling
        if (!this.list.length) {
            this.errors = [
                "Failed to load list. Retry in a few minutes or notify list staff.",
            ];
        } else {
            this.errors.push(
                ...this.list
                    .filter(([_, err]) => err)
                    .map(([_, err]) => {
                        return `Failed to load level. (${err}.json)`;
                    })
            );
            if (!this.editors) {
                this.errors.push("Failed to load list editors.");
            }
        }

        // Select the level from the URL if we deep linked onto a level
        this.syncFromRoute();

        this.loading = false;
        this.updateMeta();
    },
    methods: {
        embed,
        score,
        syncFromRoute() {
            if (this.$route.params.level === undefined) {
                this.updateMeta();
                return;
            }

            const param = String(this.$route.params.level);

            // Either a level file name ("Coefficient") or a rank ("5" / "#5")
            let i = this.list.findIndex(
                ([level]) => level && level.path === param,
            );
            if (i < 0 && /^#?\d+$/.test(param)) {
                const rank = parseInt(param.replace('#', ''), 10);
                if (rank >= 1 && rank <= this.list.length) {
                    i = rank - 1;
                }
            }

            if (i >= 0) {
                // Clicking a level inside the app just opens its info; only a
                // URL (address bar / reload) scrolls the list to the level
                const fromClick = consumeInAppNavigation(this.$route.path);

                this.selected = i;
                // A search filter would hide the deep linked level
                this.query = '';
                this.jumpError = '';

                if (!fromClick) {
                    this.$nextTick(() => this.scrollToSelected());
                }
            }

            this.updateMeta();
        },
        select(i, scroll = false) {
            const [level] = this.list[i] || [];
            if (!level) {
                return;
            }

            this.selected = i;
            const path = '/level/' + encodeURIComponent(level.path);
            if (this.$route.path !== path) {
                markInAppNavigation(path);
                this.$router.push(path).catch(() => {});
            }

            this.$nextTick(() => {
                if (scroll) {
                    this.scrollToSelected();
                }
            });
        },
        scrollToSelected() {
            document
                .querySelector('.page-list .list .level.active')
                ?.scrollIntoView({ block: 'start' });
        },
        onSearch() {
            const q = this.query.trim();

            // "#42" or "42" on Enter jumps straight to that rank
            const jumpMatch = q.match(/^#?\d+$/);
            if (jumpMatch) {
                const n = parseInt(q.replace('#', ''), 10);
                if (isNaN(n) || n < 1 || n > this.list.length) {
                    this.jumpError = `No level at #${n}. This list has ${this.list.length} levels.`;
                    return;
                }

                this.jumpError = '';
                this.query = '';
                this.select(n - 1, true);
            }
        },
        copyId() {
            const id = String(this.level.id);

            try {
                navigator.clipboard.writeText(id);
            } catch {
                // Clipboard unavailable, nothing we can do
            }

            this.copied = true;
            clearTimeout(this._copyTimer);
            this._copyTimer = setTimeout(() => (this.copied = false), 1500);
        },
        playerHref(user) {
            return '#/player/' + encodeURIComponent(user);
        },
        updateMeta() {
            const level = this.level;
            if (this.loading) {
                return;
            }

            if (!level || this.$route.params.level === undefined) {
                setMeta({
                    title: 'List',
                    description: `The Square Levels List — ${this.list.length} ranked Geometry Dash levels with records, creators and verifiers.`,
                    url: '#/',
                });
                return;
            }

            const creators = [
                ...new Set([...(level.creators || []), level.author].filter(Boolean)),
            ].join(', ');
            const first = firstVictorOf(level);

            setMeta({
                title: `#${this.selected + 1} ${level.name}`,
                description: `${level.name} — rank #${this.selected + 1}${creators ? ` by ${creators}` : ''}${level.verifier ? `, verified by ${level.verifier}` : ''}${first ? `, first victor ${first.user}` : ''}. ${(level.records || []).length} records on the Square Levels List.`,
                url: `#/level/${encodeURIComponent(level.path)}`,
            });
        },

    },
};
