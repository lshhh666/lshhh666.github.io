# Lighthouse（灯塔）个人博客 — 设计文档

日期：2026-08-29
状态：待用户审阅

## 1. 目标

搭建一个个人博客，用于发布技术文章、生活随笔，并展示个人作品（作品集）。写作流程要足够简单：写一个 Markdown 文件，git push 后自动发布。

## 2. 已确认的决策

| 项 | 决策 |
|---|---|
| 框架 | Astro 5 |
| 主题 | [Fuwari](https://github.com/saicaca/fuwari)（卡片风、暗色模式、目录侧栏、分类/标签） |
| 部署 | GitHub Pages，仓库 `lshhh666/lshhh666.github.io` |
| 站点名 | Lighthouse（灯塔） |
| 内容方向 | 技术文章 + 生活随笔 + 作品集 |
| 界面语言 | 中文 |

## 3. 站点结构

- **首页**：Fuwari 默认布局（横幅图 + 文章卡片流，按时间倒序混排全部文章）。
- **归档/分类**：使用 Fuwari 内置的归档页与分类（Category）功能；两个一级分类：「技术」「随笔」。标签（Tag）自由使用。
- **作品集页 `/projects/`**：Fuwari 原生没有此页面，需新增。沿用主题的卡片样式，展示项目卡片（名称、简介、外链、可选截图）。数据来自一个内容集合（`src/content/projects/`，每个项目一个 Markdown 文件）。
- **关于页 `/about/`**：个人介绍与联系方式。

## 4. 内容管理

- 文章放在 `src/content/posts/`，每篇一个 `.md` 文件，frontmatter 包含：title、published（日期）、category（技术/随笔）、tags、description（摘要）。
- 作品条目放在 `src/content/projects/`，frontmatter 包含：title、description、link、cover（可选）。
- 站点配置（站名、作者、横幅图、导航、页脚）集中在 Fuwari 的 `src/config.ts`。

## 5. 定制清单（超出主题默认的部分）

1. 站点配置中文化：站名 Lighthouse / 灯塔、界面文案；作者名暂用 GitHub 用户名 `lshhh666`，用户拿到仓库后可自行改成真名或昵称。
2. 新增 `/projects/` 作品集页面及对应内容集合 schema。
3. 新增 `/about/` 关于页（若主题内置样式可复用则直接复用）。
4. 横幅图（banner）：先放一张占位图，用户后续自行替换。
5. GitHub Pages 部署：Astro 官方 GitHub Actions workflow；`site` 配置为 `https://lshhh666.github.io`，`base` 为 `/`（用户名仓库可直接用根路径）。

## 6. 错误处理与边界

- 构建失败（如 frontmatter 缺字段、链接 404）：GitHub Actions 会失败并在 Actions 页面给出日志；本地 `pnpm build` 可在推送前验证。
- 内容集合 schema 校验由 Astro 在构建时强制，缺失必填字段会导致构建报错，从而及早暴露问题。

## 7. 测试 / 验收标准

- `pnpm dev` 本地启动，首页、分类、标签、文章详情、作品集、关于页均可访问。
- `pnpm build` 无错误。
- 推送到 GitHub 后，`https://lshhh666.github.io` 能正常访问，样式与本地一致（含暗色模式）。
- 发表一篇新文章只需新增 Markdown 文件并 push。

## 8. 范围外（暂不做）

- 评论系统、访问统计、自定义域名、RSS 之外的订阅方式。
- Fuwari 深度视觉改造（保持主题原样式，后续按需调整）。
