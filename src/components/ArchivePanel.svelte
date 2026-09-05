<script lang="ts">
    import { onMount } from "svelte";
    import { getPostUrlBySlug } from "../utils/url-utils";
    interface Post { slug: string; data: { title: string; tags: string[]; category?: string | null; published: Date; }; }
    interface Group { year: number; posts: Post[]; }
    export let sortedPosts: Post[] = [];
    let activeTags: string[] = [];
    let activeCategories: string[] = [];
    let uncategorized = false;
    let ready = false;

    function countValues(values: string[]) {
        const counts = new Map<string, number>();
        for (const value of values) counts.set(value, (counts.get(value) || 0) + 1);
        return Array.from(counts, ([name, count]) => ({ name, count })).sort((a, b) => a.name.localeCompare(b.name, 'zh-CN'));
    }
    $: categories = countValues(sortedPosts.map(post => post.data.category?.trim() || '').filter(Boolean));
    $: tags = countValues(sortedPosts.flatMap(post => [...new Set(post.data.tags.map(tag => tag.trim()).filter(Boolean))]));
    $: uncategorizedCount = sortedPosts.filter(post => !post.data.category?.trim()).length;
    $: hasFilters = activeTags.length > 0 || activeCategories.length > 0 || uncategorized;
    $: filtered = sortedPosts.filter(post => {
        const category = post.data.category?.trim() || '';
        const matchesCategory = !activeCategories.length && !uncategorized
            || activeCategories.includes(category) || (uncategorized && !category);
        const matchesTags = !activeTags.length || post.data.tags.some(tag => activeTags.includes(tag.trim()));
        return matchesCategory && matchesTags;
    });
    $: groups = groupByYear(filtered);
    function groupByYear(posts: Post[]): Group[] {
        const years = new Map<number, Post[]>();
        for (const post of posts) {
            const year = new Date(post.data.published).getUTCFullYear();
            years.set(year, [...(years.get(year) || []), post]);
        }
        return Array.from(years, ([year, posts]) => ({year, posts})).sort((a,b) => b.year-a.year);
    }
    function readQuery() {
        const params = new URLSearchParams(window.location.search);
        activeTags = [...new Set(params.getAll('tag').map(value => value.trim()).filter(Boolean))];
        activeCategories = [...new Set(params.getAll('category').map(value => value.trim()).filter(Boolean))];
        uncategorized = params.get('uncategorized') === 'true';
    }
    function saveQuery() {
        const location = new URL(window.location.href);
        for (const key of ['tag','category','uncategorized']) location.searchParams.delete(key);
        activeTags.forEach(tag => location.searchParams.append('tag',tag));
        activeCategories.forEach(category => location.searchParams.append('category',category));
        if (uncategorized) location.searchParams.set('uncategorized','true');
        window.history.pushState(null, '', location.pathname + location.search + location.hash);
    }
    function toggleTag(tag: string) { activeTags = activeTags.includes(tag) ? activeTags.filter(value => value !== tag) : [...activeTags, tag]; saveQuery(); }
    function toggleCategory(category: string) { activeCategories = activeCategories.includes(category) ? activeCategories.filter(value => value !== category) : [...activeCategories, category]; saveQuery(); }
    function clearCategories() { activeCategories = []; uncategorized = false; saveQuery(); }
    function clearAll() { activeTags = []; activeCategories = []; uncategorized = false; saveQuery(); }
    function isoDate(date: Date) { return new Date(date).toISOString().slice(0,10); }
    onMount(() => { readQuery(); ready = true; window.addEventListener('popstate', readQuery); return () => window.removeEventListener('popstate', readQuery); });
</script>

<div class="archive-panel" data-ready={ready}>
    <div class="archive-filters">
        <fieldset><legend>分类</legend><div class="filter-options">
            <button type="button" disabled={!ready} aria-pressed={!activeCategories.length && !uncategorized} on:click={clearCategories}>全部 <span>{sortedPosts.length}</span></button>
            {#each categories as category}<button type="button" disabled={!ready} aria-pressed={activeCategories.includes(category.name)} on:click={() => toggleCategory(category.name)}>{category.name} <span>{category.count}</span></button>{/each}
            {#if uncategorizedCount > 0 || uncategorized}<button type="button" disabled={!ready} aria-pressed={uncategorized} on:click={() => { uncategorized = !uncategorized; saveQuery(); }}>未分类 <span>{uncategorizedCount}</span></button>{/if}
        </div></fieldset>
        {#if tags.length > 0}<fieldset><legend>标签</legend><div class="filter-options tag-options">
            <button type="button" disabled={!ready} aria-pressed={!activeTags.length} on:click={() => { activeTags = []; saveQuery(); }}>全部</button>
            {#each tags as tag}<button type="button" disabled={!ready} aria-pressed={activeTags.includes(tag.name)} on:click={() => toggleTag(tag.name)}>#{tag.name} <span>{tag.count}</span></button>{/each}
        </div></fieldset>{/if}
        <noscript><p class="filter-help">以下展示全部文章。启用 JavaScript 后可以按分类和标签筛选。</p></noscript>
    </div>
    <div class="archive-summary">
        <p role="status" aria-live="polite">{#if hasFilters}找到 {filtered.length} 篇文章<span class="active-summary">{[...activeCategories, ...(uncategorized ? ['未分类'] : []), ...activeTags.map(tag => '#' + tag)].join(' · ')}</span>{:else}全部 {sortedPosts.length} 篇文章{/if}</p>
        {#if hasFilters}<button type="button" class="clear-filters" on:click={clearAll}>清空筛选 ×</button>{/if}
    </div>
    <div class="archive-years">
        {#each groups as group}
            <section class="archive-year" aria-labelledby={'year-' + group.year}>
                <header><h2 id={'year-' + group.year}>{group.year}</h2><span>{group.posts.length} 篇</span></header>
                <div class="archive-posts">{#each group.posts as post}
                    <a class="archive-post" href={getPostUrlBySlug(post.slug)}>
                        <time datetime={isoDate(post.data.published)}>{isoDate(post.data.published).slice(5)}</time>
                        <div><h3>{post.data.title}</h3><p>{post.data.category || '未分类'}{#each post.data.tags.filter(tag => tag !== post.data.category) as tag}<span>#{tag}</span>{/each}</p></div>
                        <span class="post-arrow" aria-hidden="true">↗</span>
                    </a>
                {/each}</div>
            </section>
        {:else}
            <div class="archive-empty"><h2>{hasFilters ? '没有符合这些条件的文章' : '文章正在整理中'}</h2><p>{hasFilters ? '试着减少一个筛选条件，或清空筛选查看全部文章。' : '新的记录会按年份出现在这里。'}</p></div>
        {/each}
    </div>
</div>

<style>
    .archive-panel { --archive-line: rgba(188,205,224,.13); color: #e9eef3; }
    .archive-filters { padding: 27px 0; border-bottom: 1px solid var(--archive-line); }
    fieldset { min-width: 0; margin: 0; border: 0; padding: 0; display: grid; grid-template-columns: 55px minmax(0,1fr); }
    fieldset + fieldset { margin-top: 15px; }
    legend { float: left; width: 55px; color: #9daebf; font-size: 12px; padding: 9px 0; }
    .filter-options { display: flex; flex-wrap: wrap; gap: 7px; }
    .filter-options button { padding: 7px 13px; border: 1px solid transparent; border-radius: 4px; color: #a6b3c3; font-size: 12px; line-height: 1.7; }
    .filter-options button span { margin-left: 7px; font-size: 10px; opacity: .8; }
    .filter-options button[aria-pressed='true'] { color: #edc18b; border-color: rgba(234,183,120,.35); background: rgba(234,183,120,.06); }
    .filter-options button:hover:not(:disabled) { color: #edc18b; background: rgba(234,183,120,.06); }
    button:focus-visible, a:focus-visible { outline: 2px solid #eab778; outline-offset: 4px; }
    .filter-help { margin-top: 15px; font-size: 12px; color: #9daebf; }
    .archive-summary { display: flex; align-items: start; justify-content: space-between; gap: 16px; padding: 26px 0 9px; font-size: 12px; color: #a6b3c3; }
    .archive-summary p { margin: 0; line-height: 1.8; }
    .active-summary { margin-left: 17px; color: #eab778; overflow-wrap: anywhere; }
    .clear-filters { color: #eab778; flex-shrink: 0; padding: 3px 0; }
    .archive-year { display: grid; grid-template-columns: 150px minmax(0,1fr); gap: 35px; padding: 26px 0 16px; }
    .archive-year header { padding-top: 4px; }
    .archive-year h2 { font-size: 30px; font-weight: 500; letter-spacing: -.04em; margin: 0 0 6px; }
    .archive-year header > span { color: #98a9bc; font-size: 12px; }
    .archive-posts { min-width: 0; border-left: 1px solid var(--archive-line); padding-left: 27px; }
    .archive-post { position: relative; display: grid; grid-template-columns: 60px minmax(0,1fr) 20px; gap: 16px; padding: 18px 0 23px; border-bottom: 1px solid var(--archive-line); align-items: baseline; }
    .archive-post::before { content: ''; position: absolute; left: -30px; top: 29px; width: 5px; height: 5px; border-radius: 50%; background: #c9a578; }
    .archive-post time { color: #a6b3c3; font: 12px monospace; }
    .archive-post h3 { margin: 0; font-size: 19px; font-weight: 500; line-height: 1.65; overflow-wrap: anywhere; }
    .archive-post p { margin: 8px 0 0; color: #97a8ba; font-size: 11px; display: flex; flex-wrap: wrap; gap: 8px 14px; }
    .post-arrow { color: #9aacc0; }
    .archive-post:hover h3, .archive-post:hover .post-arrow { color: #eab778; }
    .archive-empty { padding: 48px 0 65px; border-bottom: 1px solid var(--archive-line); }
    .archive-empty h2 { font-size: 20px; font-weight: 500; margin: 0 0 13px; }
    .archive-empty p { color: #a6b3c3; font-size: 13px; line-height: 1.8; }
    @media(max-width:760px) {
        fieldset { display: block; }
        legend { float: none; width: auto; padding: 0 0 9px; }
        .archive-filters { padding: 23px 0; }
        .filter-options { gap: 5px; }
        .filter-options button { padding: 7px 10px; }
        .archive-year { grid-template-columns: minmax(0,1fr); gap: 17px; }
        .archive-year header { display: flex; align-items: baseline; gap: 14px; }
        .archive-year h2 { font-size: 26px; }
        .archive-posts { padding-left: 17px; margin-left: 3px; }
        .archive-post { grid-template-columns: minmax(0,1fr) 18px; gap: 8px 12px; }
        .archive-post time { grid-column: 1; grid-row: 1; font-size: 11px; }
        .archive-post > div { grid-column: 1; grid-row: 2; }
        .archive-post h3 { font-size: 17px; }
        .post-arrow { grid-column: 2; grid-row: 2; }
        .archive-post::before { left: -20px; top: 21px; }
        .active-summary { display: block; margin: 3px 0 0; }
    }
</style>
