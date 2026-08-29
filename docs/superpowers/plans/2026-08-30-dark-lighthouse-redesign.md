# 深夜灯塔重设计 — 实施计划

日期：2026-08-30 ｜ 分支：`redesign/dark-lighthouse` ｜ 设计稿（唯一视觉基准）：`.superpowers/brainstorm/1846-1787972775/content/final-b.html`

**Goal:** 把博客首页与全站视觉升级为「深夜灯塔」暗色设计：真实灯塔照片 hero + 星空鼠标/滚动视差 + 细线文章列表 + 全套轻动效。

**Architecture:** 以 Fuwari 为骨架，全局改暗色调色板与排版（main.css / tailwind 配置），重写首页 hero 与文章列表（index.astro），新增全局背景层与动效脚本（MainGridLayout + 一个全局脚本），照片经 astro:assets 自动压缩为 webp 自托管。

**Tech Stack:** Astro 5 + Fuwari、astro:assets（图片优化）、原生 IntersectionObserver + rAF（动效，无新依赖）。

## Global Constraints

- 设计稿 `final-b.html` 是像素级基准：配色（#0a0c10 底、#ffb454 强调、#8fa0b5 次级文字）、字号档（40/15/13.5/13/12.5/11.5）、间距节奏（8px 倍数）照搬。
- 不新增任何运行时依赖（不用 lenis/GSAP，视差用 rAF lerp 自实现）。
- 动效必须尊重 `prefers-reduced-motion`（禁用视差/浮现/呼吸）。
- 暗色为唯一主题：隐藏主题切换按钮，把 Fuwari 的浅色变量直接覆写为暗色值（切换功能留待以后）。
- 照片自托管：`src/assets/images/hero-night.jpg`（Unsplash photo-1536125434175-6c5657605fb0，可免费商用，页脚已注明）。
- 只在分支上提交；不 merge main，不 push 触发部署（workflow 只监听 main）。

## Tasks

### Task 1: 资产与全局基底

- 照片：把 `.superpowers/brainstorm/1846-1787972775/content/hero-b-2400.jpg` 复制为 `src/assets/images/hero-night.jpg`。
- `src/config.ts`：`banner.enable` 改为 `false`（hero 只在首页实现，别和全站 banner 叠加）。
- `tailwind.config.cjs`：sans 栈改为 `"Segoe UI Variable Text","Segoe UI","Roboto","Noto Sans SC","PingFang SC","Hiragino Sans GB","Microsoft YaHei",sans-serif`（保留原 emoji 栈）。
- `src/styles/main.css`：在 `:root`（浅色变量区）覆写为暗色值——页面底 `#0a0c10`、卡片/面板底 `#101318`、主文字 `#f7f8f8`、次级 `#8fa0b5`、强调 `#ffb454`、发丝线 `rgba(255,255,255,.06)`；`color-scheme: dark`。保留 Fuwari 的 `--hue` 机制不动，只覆写用到的变量。
- 验证：`pnpm build` 通过；全站（含 /about/ /projects/）底色变暗、无浅色残留。

### Task 2: 全局背景层 + 顶栏 + 页脚

- 新建 `src/components/GlobalBackdrop.astro`：固定层——顶部 2px 橙色发丝线、深蓝环境光、三层星空（SVG data-uri，类名 s1/s2/s3，带 `data-depth`/`data-scroll`）。挂到 `MainGridLayout.astro` 最外层。
- `src/components/Navbar.astro`：扁平化——62px 高、底部发丝线、logo 换成灯塔 SVG（设计稿内联 SVG 照搬）+ "Lighthouse" 文字、导航链接 13.5px 次级色 hover 变白、右侧 GitHub 按钮（细边框圆角 6px）。去掉玻璃悬浮效果。
- `src/components/Footer.astro`：发丝线上边框、左右两端排布的小字页脚（保留 © 与 Powered by 署名）。
- 验证：全站可见星空背景与新导航/页脚；`pnpm build` 通过。

### Task 3: 首页 hero + 文章行列表

- `src/pages/index.astro` 重写：
  - hero 区块（`min-height:440px; height:min(66vh,620px)`）：`imgwrap(-30px 内边距、data-depth=13、data-scroll=0.16)` 内嵌 astro:assets `<Image>`（src=hero-night.jpg，format=webp，widths=[1280,1920,2400]，loading=eager，fetchpriority=high，alt="夜海中打着光束的灯塔"）；其上依次 grade(soft-light 蓝橙)、glow(`radial 300x170 at 63% 50%` 暖光 + 6s 呼吸动画)、vig(暗角)、hero-fade(底部渐隐入 #0a0c10)；文字层左下：eyebrow「Lighthouse · 灯塔」+ h1「写技术，也写生活。」+ intro，入场 rise 动画依次延迟 0.15/0.3/0.45s。
  - 文章列表改为细线行（`grid 92px 1fr auto`：日期 tabular-nums｜标题 hover 变橙｜分类），数据沿用 getCollection(posts) 排序取前 8 篇；每行带 `.rv` 类。
  - 列表底部「归档 · 全部文章 →」CTA 卡（细边框圆角 12px，hover 边框泛橙）。
- 验证：首页渲染与设计稿一致；`pnpm build` 通过；旧的文章卡片组件不再被首页引用（其他页面不受影响）。

### Task 4: 动效脚本

- 新建 `src/scripts/motion.ts`（或内联 `<script>` 于 MainGridLayout）：鼠标 rAF-lerp 视差（对 `[data-depth]` 层）、滚动叠加（`data-scroll`）、IntersectionObserver 触发 `.rv → .in`（每行 70ms stagger）、`prefers-reduced-motion` 全禁。
- **必须兼容 Fuwari 的 swup 换页**：参照现有组件脚本的初始化写法（看现有 `<script>` 如何在换页后重跑），确保切页后动效依然工作；在 /about/ /projects/ 等无 hero 页面只跑星空与 .rv。
- 验证：本地 dev 下首页/换页后视差与浮现正常；系统开启「减少动态」时无任何动画。

### Task 5: 验收与提交

- `pnpm build` 无错；curl 检查首页含 hero 文案与 hero 图片引用。
- 浏览器（127.0.0.1:4321）人工过一遍：首页、一篇文章、作品集、关于页、换页后动效。
- 提交到分支（分任务分批提交，commit message 见各任务或合并为 `feat: 深夜灯塔重设计`），**不 merge、不 push 到 main**；可以 push 分支本身。
