---
title: "国内基于 Github 镜像加速器加快 github.com 的仓库拉取"
date: 2020-12-22
categories:
- dev
tags:
- github
- proxy
---

## 简介
Github 镜像加速器作为 GitHub 代理，能够为我们本地和 github.com 之间的中转服务器，使得仓库的克隆请求先到达镜像加速器，然后镜像加速器利用其强大的网络资源从 Github 拉取指定仓库，最后返回给我们。

由于加速器节点在国内，我们访问不需要挂 VPN 代理翻墙，所以能够加速 Github 仓库的推拉速度。

## 镜像加速器列表
- [fastgit.org]
- [gitclone.com](https://gitclone.com/)
- [gitee](https://gitee.com/mirrors)
- [cnpmjs.org](https://github.com.cnpmjs.org/)

## 使用方式

> 本节以 [fastgit.org] 为例。

### 方式 1. 直接替换域名 `github.com` 为 `hub.fastgit.org`

```bash
# 加速 git clone
## 原地址
git clone https://github.com/kubernetes/kubernetes.git

## 新地址
git clone https://hub.fastgit.org/kubernetes/kubernetes.git


# 加速下载 release
## 原地址
wget https://github.com/A/A/releases/download/1.0/1.0.tar.gz

## 新地址
wget https://download.fastgit.org/A/A/releases/download/1.0/1.0.tar.gz

# 加速下载 raw 文件
## 原地址：
wget https://raw.githubusercontent.com/kubernetes/kubernetes/master/README.md

## 新地址
wget https://raw.fastgit.org//kubernetes/kubernetes/master/README.md
```

### 方式 2. 将源替换操作添加 git 的全局配置

::: tip
这种方法的好处是不用手动替换 `github.com` 域名，**适用于所有依赖 git 的命令**，例如，`go get`，`cargo vendor` 等。
:::

```bash
git config --global url."https://hub.fastgit.org".insteadOf https://github.com

# 可通过以下命令删除此配置
# git config --global --unset url."https://hub.fastgit.org".insteadOf
```

## 参考文献
- [Github 国内 mirror 加速]

[fastgit.org]: https://doc.fastgit.org/
[Github 国内 mirror 加速]: https://blog.csdn.net/networken/article/details/105122778
