---
title: 'buildroot 快速入门'
date: 2021-03-18
categories:
- tool
tags:
- optee
- os
---

[buildroot][buildroot.org] 是一个简单、高效、易用的工具，能够利用交叉编译生成嵌入式 Linux 系统。

本文简单介绍 buildroot 的构建流程，以便于快速入门，了解其基本使用方式。

> 为了便于复现，操作环境使用了 [ubuntu 20.04] 的 docker 镜像，具体的 buildroot 版本为 [2021.02][buildroot 2021.02]。

buildroot 从零开始构建的过程还是很复杂的。有机会的话，往后再写文章一步步介绍。我们先来看看如何在现有项目加入新应用的构建方法。详尽的教程可参见 [官方文档][buildroot-adding-packages]。

## 将自己的应用加入 buildroot 打包的系统
本节以加入自己的 hello 应用为例，在 aarch64_efi_defconfig 的项目下，加入 hello 包，将 hello 的应用源代码编译生成到 rootfs 根文件系统。

> aarch64 和 arm64 的关系参见 [这里](https://stackoverflow.com/questions/31851611/differences-between-arm64-and-aarch64/47274698#47274698)。结论为两者是同一个东西。

### 1. 启动容器

```bash
docker run -it --rm -w /buildroot ubuntu:20.04 bash
```

> 后续操作都在这个启动的容器内进行。

### 2. 替换软件源（可选）

此步骤主要用于加速软件安装，主要参考中科大的 [Ubuntu 源使用帮助](http://mirrors.ustc.edu.cn/help/ubuntu.html)。

```bash
sed -i 's/archive.ubuntu.com/mirrors.ustc.edu.cn/g' /etc/apt/sources.list
# sed -i 's/archive.ubuntu.com/mirrors.tuna.tsinghua.edu.cn/g' /etc/apt/sources.list

sed -i 's/security.ubuntu.com/mirrors.ustc.edu.cn/g' /etc/apt/sources.list
# sed -i 's/security.ubuntu.com/mirrors.tuna.tsinghua.edu.cn/g' /etc/apt/sources.list

apt update
```

### 3. 安装依赖

```bash
apt install -y file libncurses5-dev g++ wget cpio unzip rsync bc git tree make
```

### 4. 创建 hello 项目

#### 项目结构
```bash
root@0c6ea3e52ccf:/buildroot# tree 
.
|-- hello-0.1
|   |-- Makefile
|   `-- main.c
`-- package
    |-- Config.in
    `-- hello.mk

2 directories, 4 files
```

> 注意：**文件名很关键**。hello.mk 要小写，而且不能乱取其它名字，因为 buildroot 框架有一套根据命名用于展开 hello 包的规则，所以用 buildroot 构建项目一定要遵守本文的命名规则，否则会有各种报错。

各个文件具体内容如下。

#### hello-0.1/main.c

```c
#include <stdio.h>

int main()
{
  printf("hello world!\n");
  return 0;
}
```

#### hello-0.1/Makefile

```makefile
# 应和 hello.mk 传入的 $(OUT_BIN) 保持一致
app = $(OUT_BIN)

all: $(app)

$(app): main.c
	$(CC) -o $@ $<

clean:
	@rm -rf $(app)
```

#### package/Config.in

这个文件类似 Kconfig 的配置文件，命名格式遵循和 Linux Kernel 的 Kconfig 文件规范。

```
config BR2_PACKAGE_HELLO
bool"hello world"  
help  
  hello world to you
```

这段配置的命名规则也同样重要
- `BR2_PACKAGE_HELLO` 是 hello 可被 buildroot 识别编译成 package 的配置变量。Package 应用一定要以 `BR2_PACKAGE_` 作为开头，以 `HELLO` 即 hello 的大写来填充这个变量名，这样才能被 buildroot 命名框架识别和展开，才能通过 `make nconfig` 来配置。
- `bool` 是变量的类型，有 `true`（编译选中）/`false`（编译未选中）两种值，和 Kconfig 的规则一样，后面的字符串和 `help` 都是在 `make nconfig` 时的提示文本。

实际上，Config.in 可以参考 Linux Kernel 的 Kconfig 文件，根据语法规范，加入自己的配置逻辑和其它可配置的变量（比如 hello 的下载地址链接），在此不再赘述。大家可以参考 /buildroot/package 目录下其它包 Config.in 文件的写法。这里只说重点：**`BR2_PACKAGE_HELLO` 这个变量一定要有，一定要被选上才能编译**。

#### package/hello.mk

按照 Makefile 文件的格式和语法规范，编写 hello 的上层构建规则如下

```makefile
################################################################################  
#  
# hello
#  
################################################################################  
HELLO_VERSION = 0.1
# file/local 后面绝对不能有空格!!!
#HELLO_SITE_METHOD = file
HELLO_SITE_METHOD = local
HELLO_SITE = /buildroot/hello-$(HELLO_VERSION)
HELLO_ALWAYS_BUILD = YES  
HELLO_INSTALL_STAGING = YES  
HELLO_CFLAGS =   
HELLO_LDFLAGS =   
OUT_BIN = hello  
HELLO_MAKE_FLAGS += \
    CROSS_COMPILE="$(CCACHE) $(TARGET_CROSS)"   \
    CC=$(TARGET_CC)                             \
    OUT_BIN=$(OUT_BIN)                          \
    AR=$(TARGET_AR)                             \
    STRIP=$(TARGET_STRIP)                       \
    CFLAGS=$(HELLO_CFLAGS)                      \
    LDFLAGS=$(HELLO_LDFLAGS)                    \
    TARGET_DIR=$(TARGET_DIR)                    \
    STAGING_DIR=$(STAGING_DIR)

#HELLO_MAKE_FLAGS += 
  
define HELLO_BUILD_CMDS  
    $(MAKE) clean  -C $(@D)   
    $(MAKE) $(HELLO_MAKE_FLAGS)  -C $(@D)  
endef  
  
define HELLO_INSTALL_TARGET_CMDS  
    $(INSTALL) -m 0755 -D $(@D)/$(OUT_BIN)  $(TARGET_DIR)/usr/bin  
endef  
  
$(eval $(generic-package))
```

::: warning 注意事项
hello.mk 并不能实际代替 hello 源码的 Makefile 文件。它只是一个上层的 make 文件，告诉 buildroot
- 到哪个地方拿源代码
- 如何解压源代码
- 给源码的 Makefile 变量传递哪些编译参数
- 编译出来的库和可执行文件，应该安装到 rootfs 的哪个路径

具体 hello 源码是如何一步一步编译的，还得靠其源码本身的 Makefile 去做。
:::

这段 Makefile 代码的大致规范如下：
1. 所有的变量都已 `HELLO_` 开头，这样 buildroot 才能够通过命名框架去解析
2. 关于变量
    - `_VERSION` 结尾的变量，是下载 hello 源码的版本号
    - `_SITE_METHOD` 结尾的变量说明 hello 包的下载方法
    - `_SITE` 结尾的变量是 hello 包的下载地址
    - 其它的变量的用途，请移步 [官方手册][The Buildroot user manual]。
3. 所有以 `define` 开头并以 `_CMDS` 结尾的代码块，类似函数的东西，实际上是构建过程会被 buildroot 框架执行的指令。这些指令到底有哪些，具体也得读 [手册][The Buildroot user manual]。当然这些类似函数，开头也得是 `HELLO_`。buildroot 的命名规则很重要，重要的话说三遍。
4. `_BUILD_CMDS` 结尾的函数是构建过程函数，负责给 hello 源代码传递编译和链接选项，调用源代码的 Makefile 执行编译。
5. `INSTALL_TARGET_CMDS` 结尾的函数，负责 hello 编译完之后执行自动安装。一般是让 buildroot 把编译出来库和可执行文件安装到指定的目录。
6. **`$(eval $(generic-package))` 是最核心的东西，一定不能够漏了，不然 hello 编译不出来**。这个函数就是把整个 hello.mk 构建脚本，通过 buildroot 框架的方式，展开到 buildroot/ 目录下的 Makfile，生成 hello 的构建目标（构建目标是什么，还记得 Makefile 的语法吗？）。
7. 实际上这些构建命名框架还有 `$(eval $(generic-package))` 这个黑魔法，源自 package/pkg-generic.mk 这个文件。`generic-package` 是这个文件最后调用的函数生成的。其它 `*_BUILD_CMDS`，`*_INSTALL_TARGET_CMDS` 这些函数如何被 buildroot 框架嵌入的，之前那些变量是如何被调用的，在 package/pkg-generic.mk 都能找到，但还是要一定的 Makefile 功底才能读懂这个的，以后有机会再解释 package/pkg-generic.mk 的框架原理。

讲了这么多条规范，那么这份 Makefile 大概是什么意思呢？这段代码其实描述了这么个流程
1. `local` 指示从本地的 `/buildroot/hello-$(HELLO_VERSION)` 目录拷贝 hello 应用的源码
    - buildroot 还支持 `file`/`git` 等源码拉取方式，详情参见 [官方文档][The Buildroot user manual]。
    - 请务必保证路径不要写错= =
2. `HELLO_BUILD_CMDS` 函数传递编译参数，并且编译 hello 
3. `HELLO_INSTALL_TARGET_CMDS` 把编译出来的可执行文件安装到 `$(TARGET_DIR)/usr/bin` 目录

### 5. 拉取 buildroot 代码

```bash
root@0c6ea3e52ccf:/buildroot# rm -rf buildroot

# 直接从代理节点克隆 buildroot 代码库
root@0c6ea3e52ccf:/buildroot# git clone -b 2021.02 https://hub.fastgit.org/buildroot/buildroot.git

# 移除提交历史，压缩项目大小
root@0c6ea3e52ccf:/buildroot# rm -rf buildroot/.git
```

### 6. 创建工作空间

> 这一步主要是为了防止操作工作出错导致 buildroot 源码被污染后，需要重新拉取 buildroot 源码的问题。

```bash
root@0c6ea3e52ccf:/buildroot# outDir=_packed
root@0c6ea3e52ccf:/buildroot# rm -rf $outDir
root@0c6ea3e52ccf:/buildroot# mkdir $outDir
root@0c6ea3e52ccf:/buildroot# br=$outDir/buildroot
root@0c6ea3e52ccf:/buildroot# rm -rf $br
root@0c6ea3e52ccf:/buildroot# cp -r buildroot $br
root@0c6ea3e52ccf:/buildroot# cp -r package $br/package/hello

# 往 _packed/buildroot/package/Config.in 加入 source "package/hello/Config.in" 
# 以便将 hello 的配置文件纳入 buildroot 的包管理系统
root@0c6ea3e52ccf:/buildroot# sed -i '11s!^!        source "package/hello/Config.in"!g' $br/package/Config.in
```

### 7. 配置编译选项

#### 1. 查询可用的目标系统
```bash
root@0c6ea3e52ccf:~/optee/buildroot/_packed/buildroot# make list-defconfigs
Built-in configs:
  aarch64_efi_defconfig               - Build for aarch64_efi
  acmesystems_aria_g25_128mb_defconfig - Build for acmesystems_aria_g25_128mb
  acmesystems_aria_g25_256mb_defconfig - Build for acmesystems_aria_g25_256mb
  acmesystems_arietta_g25_128mb_defconfig - Build for acmesystems_arietta_g25_128mb
  acmesystems_arietta_g25_256mb_defconfig - Build for acmesystems_arietta_g25_256mb
  amarula_a64_relic_defconfig         - Build for amarula_a64_relic
  amarula_vyasa_rk3288_defconfig      - Build for amarula_vyasa_rk3288
  andes_ae3xx_defconfig               - Build for andes_ae3xx
  arcturus_ucls1012a_defconfig        - Build for arcturus_ucls1012a
  arcturus_ucp1020_defconfig          - Build for arcturus_ucp1020
  arm_foundationv8_defconfig          - Build for arm_foundationv8
  arm_juno_defconfig                  - Build for arm_juno
...
```

> 本文以 `aarch64_efi_defconfig` 为例。

#### 2. 选定目标系统
```bash
root@0c6ea3e52ccf:/buildroot/_packed/buildroot# make aarch64_efi_defconfig
#
# configuration written to /buildroot/_packed/buildroot/.config
#
```

#### 3. 打开配置菜单
```bash
# 采用终端式菜单
root@0c6ea3e52ccf:/buildroot/_packed/buildroot# make nconfig
```

弹出对话窗口如下

```bash

                /buildroot/_packed/buildroot/.config - Buildroot 2021.02 Configuration
┌── Buildroot 2021.02 Configuration ─────────────────────────────────────────────────────────────────┐
│                                                                                                    │
│                                     Target options  --->                                           │
│                                     Build options  --->                                            │
│                                     Toolchain  --->                                                │
│                                     System configuration  --->                                     │
│                                     Kernel  --->                                                   │
│                                     Target packages  --->                                          │
│                                     Filesystem images  --->                                        │
│                                     Bootloaders  --->                                              │
│                                     Host utilities  --->                                           │
│                                     Legacy config options  --->                                    │
│                                                                                                    │
│                                                                                                    │
└F1Help─F2SymInfo─F3Help 2─F4ShowAll─F5Back─F6Save─F7Load─F8SymSearch─F9Exit─────────────────────────┘
```

#### 4. 按下箭头选择 `Target packages`，进入如下界面

```bash

                 /buildroot/_packed/buildroot/.config - Buildroot 2021.02 Configuration
 ┌── Target packages ─────────────────────────────────────────────────────────────────────────────────┐
 │                                                                                                    │
 │          -*- BusyBox                                                                               │
 │              (package/busybox/busybox.config) BusyBox configuration file to use? (NEW)             │
 │              ()    Additional BusyBox configuration fragment files (NEW)                           │
 │          [ ]   Show packages that are also provided by busybox (NEW)                               │
 │          [ ]   Individual binaries (NEW)                                                           │
 │          [ ]   Install the watchdog daemon startup script (NEW)                                    │
 │          [ ] hello world (NEW)                                                                     │
 │              Audio and video applications  --->                                                    │
 │              Compressors and decompressors  --->                                                   │
 │              Debugging, profiling and benchmark  --->                                              │
 │              Development tools  --->                                                               │
 │              Filesystem and flash utilities  --->                                                  │
 │              Fonts, cursors, icons, sounds and themes  --->                                        │
 │              Games  --->                                                                           │
 │              Graphic libraries and applications (graphic/text)  --->                               │
 │              Hardware handling  --->                                                               │
 │              Interpreter languages and scripting  --->                                             │
 │              Libraries  --->                                                                       │
 │              Mail  --->                                                                            │
 │              Miscellaneous  --->                                                                   │
 │              Networking applications  --->                                                         │
 │              Package managers  --->                                                                │
 │              Real-Time  --->                                                                       │
 │              Security  --->                                                                        │
 │              Shell and utilities  --->                                                             │
 │              System tools  --->                                                                    │
 │              Text editors and viewers  --->                                                        │
 │                                                                                                    │
 └F1Help─F2SymInfo─F3Help 2─F4ShowAll─F5Back─F6Save─F7Load─F8SymSearch─F9Exit─────────────────────────┘
```

#### 5. 按下箭头直至 `hello world (New)`，再摁 `y` 将其选为打包目标之一

```bash

                 /buildroot/_packed/buildroot/.config - Buildroot 2021.02 Configuration
 ┌── Target packages ─────────────────────────────────────────────────────────────────────────────────┐
 │                                                                                                    │
 │          -*- BusyBox                                                                               │
 │              (package/busybox/busybox.config) BusyBox configuration file to use? (NEW)             │
 │              ()    Additional BusyBox configuration fragment files (NEW)                           │
 │          [ ]   Show packages that are also provided by busybox (NEW)                               │
 │          [ ]   Individual binaries (NEW)                                                           │
 │          [ ]   Install the watchdog daemon startup script (NEW)                                    │
 │          [*] hello world                                                                           │
 │              Audio and video applications  --->                                                    │
 │              Compressors and decompressors  --->                                                   │
 │              Debugging, profiling and benchmark  --->                                              │
 │              Development tools  --->                                                               │
 │              Filesystem and flash utilities  --->                                                  │
 │              Fonts, cursors, icons, sounds and themes  --->                                        │
 │              Games  --->                                                                           │
 │              Graphic libraries and applications (graphic/text)  --->                               │
 │              Hardware handling  --->                                                               │
 │              Interpreter languages and scripting  --->                                             │
 │              Libraries  --->                                                                       │
 │              Mail  --->                                                                            │
 │              Miscellaneous  --->                                                                   │
 │              Networking applications  --->                                                         │
 │              Package managers  --->                                                                │
 │              Real-Time  --->                                                                       │
 │              Security  --->                                                                        │
 │              Shell and utilities  --->                                                             │
 │              System tools  --->                                                                    │
 │              Text editors and viewers  --->                                                        │
 │                                                                                                    │
 └F1Help─F2SymInfo─F3Help 2─F4ShowAll─F5Back─F6Save─F7Load─F8SymSearch─F9Exit─────────────────────────┘
```

#### 6. 连按 `esc` 两次，弹出询问是否保存配置对话框如下

```bash
 │                                                                                                    │
 │                          ┌─────────────────────────────────────────────┐                           │
 │                          │ Do you wish to save your new configuration? │                           │
 │                          │ <ESC> to cancel and resume nconfig.         │                           │
 │                          │                                             │                           │
 │                          │            <save>    <don't save>           │                           │
 │                          └─────────────────────────────────────────────┘                           │
 │                                                                                                    │
```

#### 7. 上述对话框默认选中 `save`，所以回车即可保存配置并退出

```bash
 │                                                                                                    │
 │                 ┌───────────────────────────────────────────────────────────────┐                  │
 │                 │ configuration written to /buildroot/_packed/buildroot/.config │                  │
 │                 │                                                               │                  │
 │                 │                             <OK>                              │                  │
 │                 └───────────────────────────────────────────────────────────────┘                  │
 │                                                                                                    │
```

#### 8. 此时当前目录下生成的 `.config` 文件指示编译 hello 项目

```bash
root@0c6ea3e52ccf:/buildroot/_packed/buildroot# cat .config | grep HELLO
BR2_PACKAGE_HELLO=y
```

### 8. 更新部分软件源加速编译（可选）

因为默认的软件源（原始配置参见 /buildroot/buildroot/Config.in）大部分对国内不友好，我们可以将其替换为国内源以实现提速。

```bash
root@0c6ea3e52ccf:/buildroot/_packed/buildroot# ustc=http://mirrors.ustc.edu.cn

root@0c6ea3e52ccf:/buildroot/_packed/buildroot# sed -i "s|BR2_KERNEL_MIRROR=.*|BR2_KERNEL_MIRROR=\"$ustc/kernel.org\"|g" .config
root@0c6ea3e52ccf:/buildroot/_packed/buildroot# sed -i "s|BR2_GNU_MIRROR=.*|BR2_GNU_MIRROR=\"$ustc/gnu\"|g" .config
root@0c6ea3e52ccf:/buildroot/_packed/buildroot# sed -i "s|BR2_CPAN_MIRROR=.*|BR2_CPAN_MIRROR=\"$ustc/CPAN\"|g" .config
```

> 其中 `savannah.gnu.org` 的源也挺难搞。

### 9. 编译包含 hello 项目的系统

```bash
root@0c6ea3e52ccf:/buildroot/_packed/buildroot# make hello -j
```

以上命令实际上是只是编译 hello 以及 hello 依赖的 package。当然，toolchain 会被所有 package 依赖，所以 buildroot 会先编译 toolchain。

编译完成后，`/buildroot/_packed/buildroot/output/build` 目录生成的 `hello-0.1` 文件夹即 hello 编译产物路径，`/buildroot/_packed/buildroot/output/target/usr/bin/` 目录可看到编译产出的 hello 文件，并且确实是 ARM 交叉工具链编译出来的。

```bash
root@0c6ea3e52ccf:~/optee/buildroot# ls /buildroot/_packed/buildroot/output/build
build-time.log        host-gcc-initial-9.3.0  host-skeleton          toolchain
buildroot-config      host-gmp-6.2.1          linux-headers-5.10.19  toolchain-buildroot
hello-0.1             host-m4-1.4.18          skeleton               uclibc-1.0.37
host-binutils-2.35.2  host-mpc-1.1.0          skeleton-init-common
host-gcc-final-9.3.0  host-mpfr-4.0.2         skeleton-init-sysv
root@0c6ea3e52ccf:~/optee/buildroot# ls /buildroot/_packed/buildroot/output/target/usr/bin 
getconf  hello  ldd
```

## 编译基于现有项目的最小系统

buildroot 一次 `make all` 会把整个系统编译出来，相当耗时。如果只想要一个可以启动起来的最小系统，不需要什么其它包的话，它有什么快捷方式可以办到吗？不知道怎么办，那就得上教小白的 `help` 命令了。

```bash
root@0c6ea3e52ccf:/buildroot/_packed/buildroot# make help
Cleaning:
  clean                  - delete all files created by build
  distclean              - delete all non-source files (including .config)

Build:
  all                    - make world
  toolchain              - build toolchain
  sdk                    - build relocatable SDK

Configuration:
  menuconfig             - interactive curses-based configurator
  nconfig                - interactive ncurses-based configurator
  xconfig                - interactive Qt-based configurator
  gconfig                - interactive GTK-based configurator
  oldconfig              - resolve any unresolved symbols in .config
  syncconfig             - Same as oldconfig, but quietly, additionally update deps
  olddefconfig           - Same as syncconfig but sets new symbols to their default value
  randconfig             - New config with random answer to all options
  defconfig              - New config with default answer to all options;
                             BR2_DEFCONFIG, if set on the command line, is used as input
  savedefconfig          - Save current config to BR2_DEFCONFIG (minimal config)
  update-defconfig       - Same as savedefconfig
  allyesconfig           - New config where all options are accepted with yes
  allnoconfig            - New config where all options are answered with no
  alldefconfig           - New config where all options are set to default
  randpackageconfig      - New config with random answer to package options
  allyespackageconfig    - New config where pkg options are accepted with yes
  allnopackageconfig     - New config where package options are answered with no

Package-specific:
  <pkg>                  - Build and install <pkg> and all its dependencies
  <pkg>-source           - Only download the source files for <pkg>
...
```

其中 `allnopackageconfig` 可以帮到我们：`make xxx_defconfig` 后执行 `make allnopackageconfig`，再 `make all` 就可以只编译 toolchain，boot，kernel，busybox，rootfs 这个几个能构成系统启动的最小系统模块。

`make aarch64_efi_defconfig` 时，由于 `aarch64_efi` 的工具链是 toolchain-buildroot，即 buildroot 从零开始制作工具链，而不是 toolchain-external--buildroot 使用已经制作好的工具链。这样的话，如果工具链没有预先准备，则 `make allnopackageconfig`+`make all` 之后编译过程会报错。因为制作零制作工具链需要编译某些包作为原材料，而这些包被 `make allnopackageconfig` 屏蔽掉了。

已经制作好工具链或者采用 toolchain-external 模式的情况下，`make allnopackageconfig` 编译最小系统是没用问题的。

## 实用技巧与指令

buildroot 的相关 make 选项如下

|           命令 | 说明                                                                                                                                                                                                                                                                                                |
| -------------: | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
|         `help` | 之前演示过了，打印出帮助菜单                                                                                                                                                                                                                                                                        |
| `show-targets` | 显示出本次配置所要编译所有的目标。这些目标可以单独作为模块，用 `make <pkg-target>` 命令进行单独编译。从这条命令的显示结果来看，`aarch64_efi_defconfig` 需要编译 busybox、uclibc（微型 C 库）等目标，当然 hello 也是一个编译目标，是在 `make nconfig` 时候加进去的，所以可以用 `make hello` 来编译。 |
| \<pkg-target\> | 单独编译某个 pkg 模块以及其依赖的模块，比如 `make hello`                                                                                                                                                                                                                                            |
|  `pkg-rebuild` | 重新编译 pkg                                                                                                                                                                                                                                                                                        |
|  `pkg-extract` | 只下载解压 pkg 但不编译，pkg 解压后放在 output/build/ 目录对应的 pkg-dir 目录下                                                                                                                                                                                                                     |
|   `pkg-source` | 只下载某 pkg，然后不做任何事情                                                                                                                                                                                                                                                                      |

对于本文 buildroot 的 `make show-targets` 的输出如下

```bash
root@182f8619ce91:/buildroot/_packed/buildroot# make show-targets
busybox eudev grub2 hello host-acl host-attr host-autoconf host-automake host-dosfstools host-e2fsprogs host-eudev host-fakeroot host-genimage host-kmod host-libtool host-libzlib host-m4 host-makedevs host-mkpasswd host-mtools host-patchelf host-pkgconf host-skeleton host-util-linux host-zlib ifupdown-scripts initscripts kmod linux linux-headers skeleton skeleton-init-common skeleton-init-sysv toolchain toolchain-buildroot uclibc urandom-scripts util-linux util-linux-libs rootfs-ext2
```

其它更多快捷指令可从 package/pkg-generic.mk 查询。这些快捷指令实际是是由 pkg- 指令这种命名框架合成的，更详细的内容请参考 [手册][The Buildroot user manual] 和 package/pkg-generic.mk。

## 参考文献
- [buildroot 构建指南](https://blog.csdn.net/prike/article/details/79352704)
- [The Buildroot user manual]

[buildroot-adding-packages]: https://buildroot.org/downloads/manual/manual.html#adding-packages
[buildroot 2021.02]: https://github.com/buildroot/buildroot/tree/2021.02
[buildroot.org]: https://buildroot.org/
[ubuntu 20.04]: https://hub.docker.com/layers/ubuntu/library/ubuntu/20.04/images/sha256-c7b16f05260ce7a6a124cbd68cb061795840870e313de902fb6c987d0c7488c5?context=explore
[The Buildroot user manual]: https://buildroot.org/downloads/manual/manual.html
