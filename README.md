---
layout: PostsHome
permalink: /
isSummary: true
---

# Vuepress for sammy

[![CircleCI](https://circleci.com/gh/sammyne/sammyne.github.io/tree/vuepress.svg?style=svg)](https://circleci.com/gh/sammyne/sammyne.github.io/tree/vuepress)

## 安装  

```bash
git clone https://github.com/sammyne/sammyne.github.io.git
yarn 
```

## 发布  

### Github Page

```bash
yarn deploy
```

### 预发布
预发布主要用于本地检查例如主题更新等变更是否符合预期

1. 构建项目并启动 nginx 服务容器部署静态的页面
```bash
yarn pre-deploy
```
2. 打开浏览器，通过 9090 端口浏览构建好的网页即可

## 注意事项  
- CI必须使用circleci官方的镜像，否则`git push`一大堆问题
