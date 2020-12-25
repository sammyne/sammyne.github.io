---
title: "国内 macOS/Linux 安装 rust"
date: 2020-12-25
categories:
- dev
tags:
- unix
- rust
---

## 背景
由于 rustup 官方服务器在国外，直接按照 [rust 官网的指南][Install Rust] 安装非常容易失败，即使不失败也慢成狗，换用用国内的镜像则可以分分钟搞定。

## 官方安装方法
- 相关文档： [rust 安装指南][Install Rust]
- 命令

    ```bash
    curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
    ```

## 使用国内镜像加速安装
### 原理
官方的 [rustup-init.sh](https://sh.rustup.rs) 脚本支持配置以下两个变量
  - `RUSTUP_UPDATE_ROOT`：脚本的默认值为 https://static.rust-lang.org/rustup，指定 rust-init 的下载地址，覆写外部同名的环境变量可替换这个值。目前国内可用地址有
    - https://mirrors.ustc.edu.cn/rust-static/rustup
  - `RUSTUP_DIST_SERVER`：默认值为 https://static.rust-lang.org，指定 rust 配套组件的下载地址，覆写同名的环境变量可替换这个值。目前国内可用地址有
    - https://mirrors.sjtug.sjtu.edu.cn/rust-static/
    - https://mirrors.tuna.tsinghua.edu.cn/rustup
    - https://mirrors.ustc.edu.cn/rust-static

### 安装
以清华源为例
  ```bash
  # 可以把以下两行添加到 ~/.bashrc 等文件，使之成为全局环境变量，这样后续所有 rustup 或 cargo 命令均会使用此环境变量
  export RUSTUP_UPDATE_ROOT=https://mirrors.ustc.edu.cn/rust-static/rustup
  export RUSTUP_DIST_SERVER=https://mirrors.tuna.tsinghua.edu.cn/rustup

  curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
  ```

:::tip 温馨提示i

适用于未把 `RUSTUP_UPDATE_ROOT` 和 `RUSTUP_DIST_SERVER` 添加到 ~/.bashrc 的场景  
rust 安装后，会创建文件 `$HOME/.cargo/env`，支持通过此文件配置其包管理工具 cargo。为了以后都从国内镜像源下载包，可以将上面的环境变量加入到
`$HOME/.cargo/env` 文件

```bash
echo "RUSTUP_DIST_SERVER=https://mirrors.tuna.tsinghua.edu.cn/rustup"  >> ~./ .cargo/env
```
:::

## 使用国内镜像加速更新 crate 拉取
### 替换 `crates.io` 源

更新 `~/.cargo/config` 更新如下

```toml
[source.crates-io]
registry = "https://github.com/rust-lang/crates.io-index"

# 替换成你偏好的镜像源
replace-with = 'sjtu'
#replace-with = 'ustc'

# 清华大学
[source.tuna]
registry = "https://mirrors.tuna.tsinghua.edu.cn/git/crates.io-index.git"

# 中国科学技术大学
[source.ustc]
registry = "git://mirrors.ustc.edu.cn/crates.io-index"

# 上海交通大学
[source.sjtu]
registry = "https://mirrors.sjtug.sjtu.edu.cn/git/crates.io-index"

# rustcc社区
[source.rustcc]
registry = "git://crates.rustcc.cn/crates.io-index"
```

> 添加 Github 镜像加速器也能达到类似效果，参见 [国内基于 Github 镜像加速器加快 github.com 的仓库拉取]。

### 替换 github.com 源
借助 git 全局替换 `github.com` 为 [fastgit.org] 等代理服务，或直接修改 `Cargo.toml` 的引用源 url 中的 `github.com` 为 [fastgit.org] 等代理服务的地址，具体参见 [国内基于 Github 镜像加速器加快 github.com 的仓库拉取]。

## 参考文献
- [rust 安装指南][Install Rust]
- [Rustup 镜像安装帮助](https://mirrors.tuna.tsinghua.edu.cn/help/rustup/)

[fastgit.org]: https://doc.fastgit.org/
[Install Rust]: https://www.rust-lang.org/tools/install
[国内基于 Github 镜像加速器加快 github.com 的仓库拉取]: /2020/12/22/speedup-github/
