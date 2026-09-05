<script lang="ts">
import I18nKey from "@i18n/i18nKey";
import { i18n } from "@i18n/translation";
import Icon from "@iconify/svelte";
import { url } from "@utils/url-utils.ts";
import { onMount } from "svelte";
import type { SearchResult } from "@/global";

let keywordDesktop = "";
let keywordMobile = "";
let result: SearchResult[] = [];
let isSearching = false;
let pagefindLoaded = false;
let initialized = false;

const fakeResult: SearchResult[] = [
	{
		url: url("/"),
		meta: {
			title: "This Is a Fake Search Result",
		},
		excerpt:
			"Because the search cannot work in the <mark>dev</mark> environment.",
	},
	{
		url: url("/"),
		meta: {
			title: "If You Want to Test the Search",
		},
		excerpt: "Try running <mark>npm build && npm preview</mark> instead.",
	},
];

let searchVersion = 0;
let restoringFocus = false;
const showPanel = (show: boolean) => {
    const panel = document.getElementById("search-panel");
    if (!panel) return;
    panel.classList.toggle("float-panel-closed", !show);
    panel.inert = !show;
    document.getElementById("search-switch")?.setAttribute("aria-expanded", String(show));
};
const togglePanel = () => {
    const opening = document.getElementById("search-panel")?.inert;
    showPanel(!!opening);
    if (opening) {
        document.querySelector<HTMLInputElement>("#search-bar-inside input")?.focus();
        if (keywordMobile.trim()) search(keywordMobile, false);
    } else {
        searchVersion++;
        isSearching = false;
    }
};
const closeOnEscape = (event: KeyboardEvent) => {
    const panel = document.getElementById("search-panel");
    if (event.key !== "Escape" || !panel || panel.inert) return;
    searchVersion++;
    isSearching = false;
    showPanel(false);
    const target = window.matchMedia("(min-width: 1024px)").matches
        ? document.querySelector<HTMLInputElement>("#search-bar input")
        : document.getElementById("search-switch");
    restoringFocus = true;
    target?.focus();
    restoringFocus = false;
};
const setPanelVisibility = (show: boolean, isDesktop: boolean): void => {
    if (isDesktop) showPanel(show);
};

const search = async (keyword: string, isDesktop: boolean): Promise<void> => {
	const version = ++searchVersion;
	if (!keyword.trim()) {
		setPanelVisibility(false, isDesktop);
		result = [];
        isSearching = false;
		return;
	}

	if (!initialized) {
		return;
	}

	isSearching = true;

	try {
		let searchResults: SearchResult[] = [];

		if (import.meta.env.PROD && pagefindLoaded && window.pagefind) {
			const response = await window.pagefind.search(keyword);
			searchResults = await Promise.all(
				response.results.map((item) => item.data()),
			);
		} else if (import.meta.env.DEV) {
			searchResults = fakeResult;
		} else {
			searchResults = [];
			console.error("Pagefind is not available in production environment.");
		}

		if (version !== searchVersion) return;
		result = searchResults;
		setPanelVisibility(true, isDesktop);
	} catch (error) {
        if (version !== searchVersion) return;
		console.error("Search error:", error);
		result = [];
		setPanelVisibility(false, isDesktop);
	} finally {
		if (version === searchVersion) isSearching = false;
	}
};

onMount(() => {
	const initializeSearch = () => {
		initialized = true;
		pagefindLoaded =
			typeof window !== "undefined" &&
			!!window.pagefind &&
			typeof window.pagefind.search === "function";
		console.log("Pagefind status on init:", pagefindLoaded);
		if (keywordDesktop) search(keywordDesktop, true);
		if (keywordMobile) search(keywordMobile, false);
	};

	if (import.meta.env.DEV) {
		console.log(
			"Pagefind is not available in development mode. Using mock data.",
		);
		initializeSearch();
	} else {
		document.addEventListener("pagefindready", () => {
			console.log("Pagefind ready event received.");
			initializeSearch();
		});
		document.addEventListener("pagefindloaderror", () => {
			console.warn(
				"Pagefind load error event received. Search functionality will be limited.",
			);
			initializeSearch(); // Initialize with pagefindLoaded as false
		});

		// Fallback in case events are not caught or pagefind is already loaded by the time this script runs
		setTimeout(() => {
			if (!initialized) {
				console.log("Fallback: Initializing search after timeout.");
				initializeSearch();
			}
		}, 2000); // Adjust timeout as needed
	}
});

$: if (initialized && typeof window !== "undefined" && window.matchMedia("(min-width: 1024px)").matches) search(keywordDesktop, true);

$: if (initialized && typeof window !== "undefined" && !window.matchMedia("(min-width: 1024px)").matches) search(keywordMobile, false);
</script>

<svelte:window on:keydown={closeOnEscape} on:searchclose={() => { searchVersion++; isSearching = false; showPanel(false); }} />

<!-- search bar for desktop view -->
<div id="search-bar" class="hidden lg:flex transition-all items-center h-11 mr-2 rounded-lg
      bg-black/[0.04] hover:bg-black/[0.06] focus-within:bg-black/[0.06]
      dark:bg-white/5 dark:hover:bg-white/10 dark:focus-within:bg-white/10
">
    <Icon icon="material-symbols:search" class="absolute text-[1.25rem] pointer-events-none ml-3 transition my-auto text-black/30 dark:text-white/30"></Icon>
    <input aria-label="搜索文章" placeholder="{i18n(I18nKey.search)}" bind:value={keywordDesktop} on:focus={() => { if (!restoringFocus) search(keywordDesktop, true); }}
           class="transition-all pl-10 text-sm bg-transparent outline-0
         h-full w-40 active:w-60 focus:w-60 text-black/50 dark:text-white/50"
    >
</div>

<!-- toggle btn for phone/tablet view -->
<button on:click={togglePanel} aria-label="搜索文章" aria-controls="search-panel" aria-expanded="false" id="search-switch"
        class="btn-plain text-[#c4cdd8] scale-animation lg:!hidden rounded-lg w-11 h-11 active:scale-90">
    <Icon icon="material-symbols:search" class="text-[1.25rem]"></Icon>
</button>

<!-- search panel -->
<div id="search-panel" inert class="float-panel float-panel-closed search-panel absolute md:w-[30rem]
top-20 left-4 md:left-[unset] right-4 shadow-2xl rounded-2xl p-2">

    <!-- search bar inside panel for phone/tablet -->
    <div id="search-bar-inside" class="flex relative lg:hidden transition-all items-center h-11 rounded-xl
      bg-black/[0.04] hover:bg-black/[0.06] focus-within:bg-black/[0.06]
      dark:bg-white/5 dark:hover:bg-white/10 dark:focus-within:bg-white/10
  ">
        <Icon icon="material-symbols:search" class="absolute text-[1.25rem] pointer-events-none ml-3 transition my-auto text-black/30 dark:text-white/30"></Icon>
        <input aria-label="搜索关键词" placeholder="搜索文章" bind:value={keywordMobile}
               class="pl-10 absolute inset-0 text-sm bg-transparent outline-0
               focus:w-60 text-black/50 dark:text-white/50"
        >
    </div>

    <p class="search-status" role="status" aria-live="polite">
        {#if isSearching}正在搜索…{:else if (keywordDesktop || keywordMobile) && result.length === 0}没有找到相关文章{:else if result.length > 0}找到 {result.length} 篇文章{/if}
    </p>
    <!-- search results -->
    {#each result as item}
        <a href={item.url}
           class="transition first-of-type:mt-2 lg:first-of-type:mt-0 group block
       rounded-xl text-lg px-3 py-2 hover:bg-[var(--btn-plain-bg-hover)] active:bg-[var(--btn-plain-bg-active)]">
            <div class="transition text-90 inline-flex font-bold group-hover:text-[var(--primary)]">
                {item.meta.title}<Icon icon="fa6-solid:chevron-right" class="transition text-[0.75rem] translate-x-1 my-auto text-[var(--primary)]"></Icon>
            </div>
            <div class="transition text-sm text-50">
                {@html item.excerpt}
            </div>
        </a>
    {/each}
</div>

<style>
  input:focus-visible { outline: 2px solid #efb66b; outline-offset: 2px; border-radius: 8px; }
  .search-status:not(:empty) { padding:10px 12px; font-size:12px; color:#9eacc0; }
  .search-panel {
    max-height: calc(100vh - 100px);
    overflow-y: auto;
  }
</style>
