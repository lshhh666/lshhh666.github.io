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
