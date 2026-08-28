# Lighthouse 博客实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 用 Astro 5 + Fuwari 主题搭建个人博客「Lighthouse（灯塔）」，含技术/随笔分类、作品集页、关于页，部署到 GitHub Pages。

**Architecture:** 直接引入 Fuwari 主题源码作为项目基座（非 npm 依赖），在其上做少量定制：改 `src/config.ts` 站点信息、新增 `projects` 内容集合与 `/projects/` 页面、GitHub Actions 自动构建发布。内容全部为 Markdown，构建时由 Astro zod schema 校验。

**Tech Stack:** Astro 5、Fuwari 主题（Tailwind + Svelte）、pnpm、GitHub Pages + withastro/action。

## Global Constraints

- Node 版本 ≥ 20（Astro 5 要求），包管理器固定为 pnpm（Fuwari 用 `pnpm-lock.yaml` + `packageManager` 字段）。
- 站点 URL：`https://lshhh666.github.io`，base 为 `/`（用户名仓库，根路径部署）。
- 界面语言：中文（`siteConfig.lang` 设为 Fuwari 支持的 `zh_CN`）。
- 站名：Lighthouse，副标题：灯塔；作者名暂用 `lshhh666`。
- 文章分类只用两个：「技术」「随笔」（Fuwari 的 category 是自由字符串）。
- 只改本计划列出的文件，不做其他主题改造；评论/统计/自定义域名不在范围。
- 仓库：`lshhh666/lshhh666.github.io`（公开仓库）。
- 工作目录：`C:\Users\lishenghui\Desktop\blog`（Windows，Git Bash）。

---

### Task 1: 环境准备（Node + pnpm）

**Files:** 无文件改动，只验证工具链。

**Interfaces:**
- Produces: 可用的 `node >= 20` 和 `pnpm`，后续所有任务的命令依赖它。

- [ ] **Step 1: 检查 Node 版本**

Run: `node -v`
Expected: 输出 `v20.x` 或更高。若低于 20，停止并告知用户安装 Node 20 LTS（https://nodejs.org）后再继续。

- [ ] **Step 2: 启用 pnpm**

Run: `corepack enable && pnpm -v`
Expected: 输出 pnpm 版本号（如 `9.x`）。

若 `corepack` 不可用或报错，改用：`npm install -g pnpm && pnpm -v`。

---

### Task 2: 引入 Fuwari 主题并跑起来

**Files:**
- Create: 仓库根目录（Fuwari 全部源码，含 `package.json`、`astro.config.mjs`、`src/`、`public/`、`pnpm-lock.yaml`、`.gitignore`）

**Interfaces:**
- Produces: 可本地运行的 Astro 项目；后续任务都基于其中的 `src/config.ts`、`src/content/config.ts`、`src/pages/`、`src/components/widget/Navbar.astro`。

- [ ] **Step 1: 克隆 Fuwari 到临时目录并拷入仓库**

```bash
git clone --depth=1 https://github.com/saicaca/fuwari /tmp/fuwari
tar -C /tmp/fuwari --exclude=.git -cf - . | tar -xf - -C .
rm -rf /tmp/fuwari
```

必须用 tar 方式拷贝（`--exclude=.git`）：直接 `cp -r /tmp/fuwari/. .` 会把克隆源的 `.git` 一并复制进来，覆盖本仓库的 `.git`。拷贝后验证本仓库 git 完好：

```bash
cat .git/HEAD
```

Expected: 输出 `ref: refs/heads/main`。若输出异常（指向 fuwari 或报错），执行 `rm -rf .git && git init -b main` 重建，并重新提交 `docs/` 下已存在的设计文档与计划文件（`git add docs && git commit -m "docs: 设计文档与实施计划"`）。

- [ ] **Step 2: 确认 .gitignore 存在**

Run: `cat .gitignore`
Expected: 包含 `node_modules`、`dist`、`.astro` 等条目。

- [ ] **Step 3: 安装依赖**

Run: `pnpm install`
Expected: 安装完成、无 ERR。首次安装较慢属正常。

- [ ] **Step 4: 启动开发服务器验证**

Run: `pnpm dev &`，等 5 秒后 `curl -s -o /dev/null -w "%{http_code}" http://localhost:4321/`
Expected: 输出 `200`，页面是 Fuwari 演示站。验证后 `kill %1` 停掉。

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: 引入 Fuwari 主题基座"
```

---

### Task 3: 站点配置 — 中文化 + 站点 URL

**Files:**
- Modify: `src/config.ts`
- Modify: `astro.config.mjs`

**Interfaces:**
- Consumes: Task 2 的 Fuwari 源码。
- Produces: 站点名/语言/作者配置生效；`site`/`base` 供 sitemap、RSS、部署使用。

- [ ] **Step 1: 修改 `src/config.ts`**

打开文件，将其中的 `siteConfig` 与 `profileConfig` 改为（`licenseConfig` 保持不动）：

```ts
export const siteConfig: SiteConfig = {
  title: "Lighthouse",
  subtitle: "灯塔",
  lang: "zh_CN",
};

export const profileConfig: ProfileConfig = {
  avatar: "assets/images/avatar.png",
  name: "lshhh666",
  bio: "记录技术与生活的随笔",
  links: [
    {
      name: "GitHub",
      icon: "fa6-brands:github",
      url: "https://github.com/lshhh666",
    },
  ],
};
```

注意：以克隆到的版本实际字段为准——若 `profileConfig` 中还有其他字段（如 `interests`），保留原字段名，只替换值。`avatar` 先用主题自带占位头像，不做替换。

- [ ] **Step 2: 修改 `astro.config.mjs` 的 URL**

将 `defineConfig({...})` 里的 `site` 改为：

```mjs
site: "https://lshhh666.github.io",
base: "/",
```

`trailingSlash` 及其余配置保持不动。

- [ ] **Step 3: 构建验证**

Run: `pnpm build && grep -o "<title>[^<]*</title>" dist/index.html | head -1`
Expected: 构建成功，输出包含 `Lighthouse`。

- [ ] **Step 4: Commit**

```bash
git add src/config.ts astro.config.mjs
git commit -m "feat: 站点配置中文化并指向 lshhh666.github.io"
```

---

### Task 4: 内容就绪 — 示例文章 + 关于页

**Files:**
- Delete: `src/content/posts/*.md`（主题自带的演示文章）
- Create: `src/content/posts/hello-lighthouse.md`
- Create: `src/content/posts/build-this-blog.md`
- Modify: `src/pages/about.md`（或克隆版本中实际存在的关于页文件）

**Interfaces:**
- Consumes: Task 2 的 posts 内容集合 schema（title/published/category/tags/description）。
- Produces: 「技术」「随笔」两个分类各有一篇文章；关于页内容为中文。

- [ ] **Step 1: 删除演示文章**

Run: `rm src/content/posts/*.md && ls src/content/posts`
Expected: 目录为空。

- [ ] **Step 2: 新建 `src/content/posts/hello-lighthouse.md`**

```markdown
---
title: 你好，灯塔
published: 2026-08-29
category: 随笔
tags:
  - 随笔
  - 开端
description: 博客的第一篇文章：为什么叫「灯塔」，以及我想在这里写点什么。
---

博客的第一篇文章，总要交代一下来历。

为什么叫「灯塔」？我的 GitHub 用户名是 lshhh666，开头三个字母 lsh 恰好是 Lighthouse 的缩写。灯塔安静地立在海边，不做声，但一直亮着——希望这个博客也是这样：不定时更新，但每一篇都认真写。

我打算在这里写两类东西：

1. **技术**：学习笔记、踩坑记录、折腾过的工具。
2. **随笔**：生活的碎片、看过的书和电影。

如果你恰好路过，欢迎去 [关于页](/about/) 认识一下我。
```

- [ ] **Step 3: 新建 `src/content/posts/build-this-blog.md`**

````markdown
---
title: 把博客搭起来：Astro + Fuwari + GitHub Pages
published: 2026-08-29
category: 技术
tags:
  - Astro
  - 博客
description: 本站的完整搭建记录：选型、定制和部署方案。
---

## 选型

框架选了 Astro 5，主题选了 [Fuwari](https://github.com/saicaca/fuwari)。理由很简单：

- Astro 以内容为先，默认零 JS，构建出来的是纯静态页面，速度快。
- Fuwari 的卡片式布局和暗色模式很合眼缘，功能也齐：分类、标签、目录、RSS、全文搜索都有。
- 部署到 GitHub Pages 完全免费。

## 写作流程

写一篇文章 = 在 `src/content/posts/` 下新建一个 Markdown 文件，写好 frontmatter：

```yaml
---
title: 文章标题
published: 2026-08-29
category: 技术
tags:
  - Astro
description: 一句话摘要。
---
```

然后 `git push`，GitHub Actions 自动构建发布，全程无需登录服务器。

## 部署

使用官方的 `withastro/action` 构建，产物交给 `actions/deploy-pages` 发布到 GitHub Pages。仓库就是用户名仓库 `lshhh666.github.io`，所以博客地址就是根路径 `https://lshhh666.github.io`。
````

- [ ] **Step 4: 改写关于页**

先读文件确认结构：`cat src/pages/about.md`。保留文件原有 frontmatter/layout 引用不动（如果顶部有 `---` 块，一字不改），只替换正文部分为：

```markdown
## 你好，我是 lshhh666 👋

这里是「灯塔 Lighthouse」，我的个人博客——名字来自我的 GitHub 用户名 lshhh666 的前三个字母。

- 💻 **技术**：学习笔记与踩坑记录
- ✍️ **随笔**：生活的碎片
- 🛠️ **作品**：我做过的小东西都在[作品集](/projects/)

联系我：[GitHub - lshhh666](https://github.com/lshhh666)
```

- [ ] **Step 5: 构建验证**

Run: `pnpm build && ls dist/posts/ dist/about/`
Expected: 构建成功；`dist/posts/hello-lighthouse/index.html`、`dist/posts/build-this-blog/index.html`、`dist/about/index.html` 均存在。

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: 示例文章与中文关于页，移除主题演示文章"
```

---

### Task 5: 作品集 — projects 内容集合 + /projects/ 页面 + 导航入口

**Files:**
- Modify: `src/content/config.ts`（若为 `src/content.config.ts` 则改后者）
- Create: `src/content/projects/lighthouse-blog.md`
- Create: `src/pages/projects.astro`
- Modify: `src/components/widget/Navbar.astro`

**Interfaces:**
- Consumes: Task 2 的 Fuwari 布局组件（`MainGridLayout`、卡片样式）与 posts 集合的既有写法。
- Produces: `projects` 内容集合（schema：title/description/link/cover/order）；`/projects/` 页面；导航「作品」入口。

- [ ] **Step 1: 确认内容集合定义方式**

Run: `ls src/content/config.ts src/content.config.ts 2>/dev/null`，然后打开存在的那个文件，看 posts 集合用的是哪种写法：

- **Astro 5 写法**（含 `loader: glob({...})`）→ Step 2a
- **旧写法**（`type: 'content'`）→ Step 2b

- [ ] **Step 2a: 按 Astro 5 写法新增 projects 集合**

在现有 `collections` 定义旁新增（import 行若已有 `glob` 则不重复）：

```ts
import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const projects = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/projects' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    link: z.string().url(),
    cover: z.string().optional(),
    order: z.number().default(0),
  }),
});

// 并把 projects 加进已有的 collections 导出：
export const collections = { posts, projects };
```

- [ ] **Step 2b: 按旧写法新增 projects 集合**（仅当 Step 1 发现旧写法时执行）

```ts
const projects = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string(),
    link: z.string().url(),
    cover: z.string().optional(),
    order: z.number().default(0),
  }),
});

export const collections = { posts, projects };
```

- [ ] **Step 3: 新建示例条目 `src/content/projects/lighthouse-blog.md`**

```markdown
---
title: Lighthouse 博客
description: 本站本身——用 Astro + Fuwari 搭建，部署在 GitHub Pages 上。
link: https://lshhh666.github.io
order: 1
---
```

- [ ] **Step 4: 新建 `src/pages/projects.astro`**

先看一眼 `src/pages/index.astro` 开头的 import（确认 `MainGridLayout` 与卡片组件的实际路径），然后创建：

```astro
---
import { getCollection } from 'astro:content';
import MainGridLayout from '../layouts/MainGridLayout.astro';

const projects = (await getCollection('projects')).sort(
  (a, b) => (a.data.order ?? 0) - (b.data.order ?? 0)
);
---

<MainGridLayout title="作品" description="个人作品集">
  <div class="flex w-full flex-col gap-4">
    <div class="card-base p-6">
      <h1 class="text-3xl font-bold">作品</h1>
      <p class="mt-2 text-[var(--secondary)]">我做过的和正在做的东西。</p>
    </div>
    {projects.map((project) => (
      <a
        href={project.data.link}
        target="_blank"
        rel="noopener noreferrer"
        class="card-base group p-6 transition hover:-translate-y-0.5"
      >
        <div class="flex items-center justify-between">
          <h2 class="text-2xl font-bold transition group-hover:text-[var(--primary)]">
            {project.data.title}
          </h2>
          <span class="text-sm text-[var(--primary)]">前往 ↗</span>
        </div>
        <p class="mt-2 text-[var(--secondary)]">{project.data.description}</p>
      </a>
    ))}
  </div>
</MainGridLayout>
```

说明：`card-base`、`var(--primary)`、`var(--secondary)` 是 Fuwari 的既有工具类与 CSS 变量，可在 `src/pages/index.astro` 里对照确认；若变量名有出入，以 index.astro 里实际用法为准替换。若克隆版本中 `getCollection('projects')` 返回的条目带 `id` 字段而非 `slug`，本页面未用到 slug，不受影响。

- [ ] **Step 5: 导航加入口**

打开 `src/components/widget/Navbar.astro`，找到页面顶部定义链接的数组（形如 `{ text: ..., target: ... }` 的列表），在「关于（about）」那一项**之前**插入：

```ts
{
  text: '作品',
  target: '/projects/',
},
```

其余项保持不变。

- [ ] **Step 6: 构建验证**

Run: `pnpm build && ls dist/projects/ && grep -c "projects" dist/index.html`
Expected: 构建成功；`dist/projects/index.html` 存在。

- [ ] **Step 7: 页面手检**

Run: `pnpm dev &`，浏览器或 `curl -s http://localhost:4321/projects/ | grep -o "Lighthouse 博客"`
Expected: 输出包含 `Lighthouse 博客`；导航栏能看到「作品」且点击进入该页。验证后停掉 dev server。

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat: 新增作品集页面与导航入口"
```

---

### Task 6: 部署 — GitHub Actions + 建仓库上线

**Files:**
- Create: `.github/workflows/deploy.yml`
- Modify: 无（推送现有代码）

**Interfaces:**
- Consumes: 前面所有任务产出的完整站点。
- Produces: `https://lshhh666.github.io` 上线，后续 push 自动发布。

- [ ] **Step 1: 新建 `.github/workflows/deploy.yml`**

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4
      - name: Install, build, and upload site
        uses: withastro/action@v3

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

- [ ] **Step 2: 本地最终构建验证**

Run: `pnpm build`
Expected: 构建成功、无警告级错误。

- [ ] **Step 3: Commit**

```bash
git add .github
git commit -m "ci: GitHub Pages 自动部署"
```

- [ ] **Step 4: 创建 GitHub 仓库并推送**

Run: `gh auth status`

- **若已登录**：

```bash
gh repo create lshhh666/lshhh666.github.io --public --source=. --push
gh api -X POST repos/lshhh666/lshhh666.github.io/pages -f build_type=workflow
```

- **若未登录**：请用户到 https://github.com/new 手动创建名为 `lshhh666.github.io` 的公开仓库（不要勾选初始化 README），然后：

```bash
git remote add origin https://github.com/lshhh666/lshhh666.github.io.git
git push -u origin main
```

并在仓库页面 Settings → Pages → Build and deployment → Source 选择 **GitHub Actions**。

- [ ] **Step 5: 验证 Actions 与线上站点**

Run: 等 Actions 跑完（约 2-3 分钟）后 `curl -s -o /dev/null -w "%{http_code}" https://lshhh666.github.io/`
Expected: Actions 绿勾；HTTP 状态码 `200`。

再用浏览器检查：首页、一篇技术文章、一篇随笔、`/projects/`、`/about/`、暗色模式切换均正常。

- [ ] **Step 6: 收尾说明**

向用户交代日常写作流程：在 `src/content/posts/` 新建 Markdown 文件 → `git add/commit/push` → 自动发布；横幅图/头像/签名以后可通过 `src/config.ts` 与 `src/assets/images/` 自行替换。

---

### Task 7: 轻度个性化 — 主题色 / 字体 / 文案 / 头像横幅

在 Task 6 上线之后执行（用户决策：先上线，再个性化；push 后自动更新）。

**Files:**
- Modify: `src/config.ts`（themeColor 色相、头像路径）
- Modify: `src/styles/main.css`（或字体实际定义处：中文字体栈）
- Modify: 页脚组件（页脚署名，保留 Fuwari credit）
- Create: `src/assets/images/avatar.svg`（灯塔占位头像，若图片管线支持）
- Create: `src/assets/images/banner.svg`（灯塔渐变横幅占位，若启用 banner 且图片管线支持）

**Interfaces:**
- Consumes: Task 2-6 的完整站点。
- Produces: 与原版 Fuwari 有可辨识差异的轻量视觉：海蓝色调、中文友好的字体栈、中文页脚署名。

- [ ] **Step 1: 主题色**

在 `src/config.ts` 找到 `themeColor`（形如 `{ hue: 250 }`），改为 `{ hue: 210 }`（海蓝）。若还有 `banner` 配置项（`{ enable, src }`），先保持 `enable: false`，在 Step 3 测试后再决定开启。

- [ ] **Step 2: 中文字体栈**

找到字体定义（`src/styles/main.css` 或 tailwind 配置中的 font-family），在字体栈中加入中文字体，例如：

```css
font-family: "Roboto", "Noto Sans SC", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif;
```

保持原栈里的西文字体在前面不变，只把中文回退字体补进 sans 栈；不要引入外部字体文件（保持零依赖、加载快）。

- [ ] **Step 3: 占位头像与横幅（带验证的可选步骤）**

生成灯塔主题的简单 SVG（圆形深蓝底 + 白色灯塔剪影 + 黄色灯光；横幅为深蓝→浅蓝渐变 + 灯塔剪影 + "LIGHTHOUSE" 文字）。写入 `src/assets/images/avatar.svg` 与 `src/assets/images/banner.svg`，然后：

1. 将 `profileConfig.avatar` 指向 `assets/images/avatar.svg`，运行 `pnpm build`。
2. 构建成功且 `pnpm dev` 页面可见头像（curl 首页 HTML 能看到 avatar.svg 引用）→ 保留；若构建失败或图片服务报错 → 回退为 `demo-avatar.png` 并删除 svg，记录原因。
3. 若 `siteConfig.banner` 存在：同样方式测试启用 `banner.svg`；不支持则保持关闭。
4. 后续用户拿到真实头像/横幅图片后，替换 `src/assets/images/` 下的文件即可。

- [ ] **Step 4: 页脚署名**

在页脚组件中保留 "Powered by Fuwari" 与 Astro 的原有署名，在其旁补一行中文版权：`© 2026 lshhh666 · 灯塔 Lighthouse`。不删除原作者署名（MIT 礼仪）。

- [ ] **Step 5: 构建与页面验证**

Run: `pnpm build`，期望成功；`pnpm dev` 后 curl 首页确认 hue 生效（HTML/CSS 中颜色变量变化）且页脚包含新署名。

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: 轻度个性化——海蓝主题色、中文字体栈、页脚署名、占位头像横幅"
```
