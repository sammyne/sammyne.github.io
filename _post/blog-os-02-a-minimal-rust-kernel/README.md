---
title: "[blog os] 02. 最小化的内核"
date: 2020-07-17
categories:
  - os
  - blog_os
tags:
  - rust
---

> 原文连接：[A Minimal Rust Kernel](https://os.phil-opp.com/minimal-rust-kernel/)

在这篇文章中，我们将基于 x86 架构，使用 Rust 语言编写一个最小化的 64 位内核。我们将从上一章中构建的独立式可执行程序开始，构建自己的内核；它将向显示器打印字符串，并能被打包为一个能够引导启动的磁盘镜像。

## 引导启动
当我们启动电脑时，主板 ROM 内存储的固件代码将会运行。这份代码负责电脑的[加电自检][power-on self-test]，检测可用[内存][ROM]的检测，预加载 CPU 和其它硬件。这之后，它将寻找一个可引导的存储磁盘，并开始启动其中的内核操作系统内核。

x86 架构支持两种固件标准：[BIOS]（Basic Input/Output System）和 [UEFI]（Unified Extensible Firmware Interface）。其中，BIOS 标准虽然古老和落伍了，但实现简单，并很好得到 1980 年代后的所有 x86 设备所支持；相反地，UEFI 更现代化，功能也更全面，但环境搭建比较复杂（至少从我的角度看是如此）。

在这篇文章中，我们暂时只提供 BIOS 的引导启动方式，对 UEFI 的支持也在规划中。如果你乐于助人的话，请加入到这个 [Github issue] 吧。

## BIOS 启动
几乎所有的 x86 硬件系统都支持 BIOS 启动，这也包含使用 BIOS 仿真模式的新型基于 UEFI 的机器。这可以说是一件好事情，因为无论是上世纪还是现在的硬件系统，都可以使用相同的引导启动逻辑；但这种兼容性同时也是 BIOS 引导启动最大的缺点，因为这意味着在系统启动前，你的 CPU 必须先进入一个 16 位系统兼容的 [实模式][real mode]，这样 1980 年代古老的引导固件才能够继续使用。

让我们从头开始，理解一遍 BIOS 启动的过程。

当电脑启动时，主板上的特殊闪存中存储的 BIOS 固件将被加载。BIOS 固件将会加电自检、初始化硬件，然后它将寻找一个可引导启动的磁盘。如果找到了，那电脑的控制权将被转交给*引导程序*（bootloader）：一段存储在磁盘开头的、512 字节长度的可执行代码片段。大多数的引导程序长度都大于 512 字节，所以通常情况下，引导程序都被切分为长度不超过 512 字节的第一阶段引导程序，和一段随后由第一阶段引导程序加载的第二阶段引导程序。

引导程序必须决定内核的位置，并将内核加载到内存。引导程序还需要将 CPU 从 16 位的 [实模式][real mode]，先切换到 32 位的 [保护模式][protected mode]，最终切换到 64 位的 [长模式][long mode]：此时，所有的 64 位寄存器和整个主内存才能被访问。引导程序的第三个作用，是从 BIOS 查询特定的信息（如内存映射表），并将其传递到操作系统内核。

编写一个引导程序并不是一个简单的任务，因为这需要使用汇编语言，而且必须经过许多晦涩的步骤——比如，把一些魔术数字（magic number）写入某个处理器寄存器。因此，这篇博文不会讲解如何创建引导程序，而是提供一个名为 bootimage 的工具——它能够自动为我们的内核添加引导程序作为前缀。

### Multiboot 标准
为了避免每个操作系统都实现只兼容自己单个操作系统的引导程序，[自由软件基金会][Free Software Foundation]在 1995 年颁布了一个开源的引导程序标准——[Multiboot]。这个标准定义了引导程序和操作系统间的统一接口，所以任何适配 Multiboot 的引导程序，都能用来加载任何同样适配了 Multiboot 的操作系统。[GNU GRUB] 是一个可供参考的 Multiboot 实现，它也是最热门的 Linux 系统引导程序之一。

要编写一款适配 Multiboot 的内核，我们只需要在内核文件开头插入被称作 [Multiboot 头][Multiboot header] 的数据片段。这让 GRUB 很容易引导任何操作系统，但是，GRUB 和 Multiboot 标准也有一些问题：

- 它们只支持 32 位的保护模式。这意味着，在引导之后，你依然需要配置你的 CPU，让它切换到 64 位的长模式
- 它们被设计为精简引导程序，而不是精简内核。举个例子，内核需要连接到 [调整过的默认页大小][adjusted default page size]，否则 GRUB 将无法找到内核的 Multiboot 头。另一个例子是传给内核的 [引导信息][boot information]，它包含着大量与架构有关的数据，而没有提供一层简洁的抽象
- GRUB 和 Multiboot 标准并没有被详细地解释，阅读相关文档需要一定经验
- 为了创建一个能够被引导的磁盘映像，我们在开发时必须安装 GRUB：这加大了基于 Windows 或 macOS 开发内核的难度

出于这些考虑，我们决定不使用 GRUB 或者 Multiboot 标准。然而，[bootimage] 工具支持 Multiboot 也在规划中，使得在 GRUB 系统上加载我们的内核成为可能。如果你对编写一个 Multiboot 兼容的内核感兴趣的话，参见这个博客系列的 [第一版][first edition]

### UEFI
（目前我们尚未支持 UEFI，但是很乐于支持！如果你能帮忙的话，请再 [Github issue] 提醒我们）

## 最小化内核
现在我们已经明白电脑是如何启动的，那也是时候编写我们自己的内核了。我们的小目标是创建一个内核的磁盘映像，它能够在启动时，向屏幕输出一行“Hello World!”。我们的工作将基于上一篇博文构建的 [独立式 Rust 二进制]。

如果没忘记的话，我们使用 `cargo` 构建了一个独立的二进制程序，但是构建过程因操作系统而异，需要不通的入口函数名和编译选项。这是因为 `cargo` 默认会基于*宿主系统*进行构建，即我们当前运行的系统。这并不是我们内核想要的，因为运行在诸如 Windows 上的内核意义不大。确切地说，我们想要基于一个明确定义的*目标系统*编译我们的内核。

### 安装 Rust Nightly
Rust 语言有三种发行版：*stable*、*beta* 和 *nightly*。《Rust 程序设计语言》对这三种版本的区别解释得很详细，可以花点时间自行 [了解一下][nightly-rust]。为了构建一个操作系统，我们需要一些只有 nightly 版提供的实验性特性，所以需要安装一个 nightly 版本的 Rust。

为了管理 Rust 的安装，我强烈建议使用 [rustup]。它允许你同时安装 nightly、beta 和 stable 版本的编译器，而且让更新它们变得容易。你可以执行 `rustup override add nightly` 使得当前目录使用 nightly 版本的 Rust。或者，你也可以在项目根目录添加一个内容为 `nightly` 的、名为 `rust-toolchain` 的文件。要检查你是否已经安装了一个 nightly，你可以运行 `rustc --version`：返回的版本号末尾应该包含 `-nightly`。

Nightly 版本的编译器允许我们在源码开头插入*特性标签*，来自由选择并使用大量实验性的功能。举个例子，要使用实验性的 [`asm!` 宏] 启用内联汇编，我们可以在 `main.rs` 的顶部添加 `#![feature(asm)]`。要注意的是，这样的实验性功能不稳定，意味着未来的 Rust 版本可能会在毫无预警的情况下修改或移除这些功能。因此，除非绝对必要，否则不要使用这些特性。

### 目标配置
Cargo 借助 `--target` 参数支持不同的目标系统。这个目标系统可以使用一个所谓的 [目标三元组][target triple] 来描述，它描述了 CPU 架构、平台供应商、操作系统和 [ABI]。比方说，目标三元组 `x86_64-unknown-linux-gnu` 描述一个基于 `x86_64` 架构 CPU 的、没有明确的平台供应商的 linux 系统，它遵循 GNU 风格的 ABI。Rust 支持 [许多不同的目标三元组][rust platform support]，包括安卓系统对应的 `arm-linux-androideabi` 和 WebAssembly 使用的 [wasm32-unknown-unknown]。

为了编写我们的目标系统，并且鉴于我们需要做一些特殊的配置（比如没有依赖的底层操作系统），现有的 [目标三元组][rust platform support] 不能满足我们的要求。好在 Rust 允许我们利用 JSON 文件 自定义自己的目标。比如，一个描述 `x86_64-unknown-linux-gnu` 目标系统的配置清单大概长这样：

```json
{
    "llvm-target": "x86_64-unknown-linux-gnu",
    "data-layout": "e-m:e-i64:64-f80:128-n8:16:32:64-S128",
    "arch": "x86_64",
    "target-endian": "little",
    "target-pointer-width": "64",
    "target-c-int-width": "32",
    "os": "linux",
    "executables": true,
    "linker-flavor": "gcc",
    "pre-link-args": ["-m64"],
    "morestack": false
}
```

多数字段都被 LLVM 用于为这个平台生成代码。例如，[data-layout] 配置项定义了不同的整数、浮点数和指针类型的长度。另外，还有一些 Rust 用作条件编译的配置项，如 `target-pointer-width`。还有一些类型的配置项定义了这个包该如何编译。例如，`pre-link-args` 配置项指定了应该向 [链接器][linker] 传入的参数。


我们将基于 `x86_64` 架构构建我们的内核，所以配置清单将和上面的例子非常相似。现在，我们来创建一个名为 `x86_64-blog_os.json` 的文件（名字根据个人喜好调整），里面包含这样的内容：

```json
{
    "llvm-target": "x86_64-unknown-none",
    "data-layout": "e-m:e-i64:64-f80:128-n8:16:32:64-S128",
    "arch": "x86_64",
    "target-endian": "little",
    "target-pointer-width": "64",
    "target-c-int-width": "32",
    "os": "none",
    "executables": true,
}
```

值得注意的是，因为要在裸机上运行内核，我们修改了 `llvm-target` 的内容，将 `os` 配置项的值改为 `none`。

我们还添加下面与编译相关的配置项：

```json
"linker-flavor": "ld.lld",
"linker": "rust-lld",
```

在这里，我们不使用平台的默认链接器（它可能不支持 Linux 目标系统），而是使用随 Rust 一起打包发布的跨平台的 [LLD] 链接器。


```json
"panic-strategy": "abort",
```

这个配置项的意思是，我们的编译目标不支持 panic 时的 [栈展开]，所以我们选择直接在 panic 时中止。这和在 Cargo.toml 文件中添加 `panic = "abort"` 选项的作用是相同的，所以我们可以从配置清单中移除这一项（需要注意的是，与 Cargo.toml 的选项相比，这个目标选项在文章的后续部分重新编译 `core` 库时同样适用。因此，即使我们偏爱保留 Cargo.toml 中的选项，请务必添加这个选项）。


```json
"disable-redzone": true,
```

我们正在编写一个内核，所以将来某个时候我们应该需要处理中断。要安全地实现这一点，我们必须禁用成为红灯区的栈指针优化，否则这个优化会污染栈。详情参见另外一篇解释 [禁用红灯区][disabling the read zone] 的博文。


```json
"features": "-mmx,-sse,+soft-float",
```

`features` 字段用于启用或禁用某个目标特性。通过在它们前面添加减号，我们将 `mmx` 和 `sse` 特性禁用；添加前缀加号，我们启用了 `soft-float` 特性。

`mmx` 和 `sse` 特性决定了是否支持 [单指令多数据流][SIMD] 相关指令，这些指令常常能显著地提高程序性能。然而，在内核中使用庞大的 SIMD 寄存器会造成较大的性能问题。因为继续执行每次程序中断前，内核不得不储存整个庞大的 SIMD 寄存器以备恢复。这意味着，每次硬件中断或系统调用，完整的 SIMD 状态必须转存到主存。由于 SIMD 状态可能相当大（512~1600 个字节），而中断可能时常发生，这些额外的存储与恢复操作会显著地降低性能。为解决这个问题，我们在内核中禁用 SIMD（但这不意味着禁用内核之上的应用程序的 SIMD 支持）。


禁用 SIMD 产生的一个问题是，`x86_64` 架构的浮点数指针运算默认依赖 SIMD 寄存器。我们的解决方法是，启用 `soft-float` 特性，它将使用基于常规整数的软件函数模拟浮点数指针运算。

更多详情参见我们关于 [禁用 SIMD][disabling SIMD] 的博文。


### 串到一起

现在，我们将各个配置项整合在一起。我们的目标配置清单应该长这样：

```json
{
  "llvm-target": "x86_64-unknown-none",
  "data-layout": "e-m:e-i64:64-f80:128-n8:16:32:64-S128",
  "arch": "x86_64",
  "target-endian": "little",
  "target-pointer-width": "64",
  "target-c-int-width": "32",
  "os": "none",
  "executables": true,
  "linker-flavor": "ld.lld",
  "linker": "rust-lld",
  "panic-strategy": "abort",
  "disable-redzone": true,
  "features": "-mmx,-sse,+soft-float"
}
```

### 构建我们的内核
要编译我们的新目标环境会使用 Linux 系统的编写风格（这可能是 LLVM 的默认风格）。这意味着，我们需要 [前一篇文章][freestanding Rust binary] 编写的名为 `_start` 的入口函数：

```rust
// src/main.rs

#![no_std] // 不链接 Rust 标准库
#![no_main] // 禁用所有 Rust 层级的入口点

use core::panic::PanicInfo;

/// 这个函数将在 panic 时被调用
#[panic_handler]
fn panic(_info: &PanicInfo) -> ! {
    loop {}
}

#[no_mangle] // 不重整函数名
pub extern "C" fn _start() -> ! {
    // 因为编译器会寻找一个名为 `_start` 的函数，所以这个函数就是入口点
    // 默认命名为 `_start`
    loop {}
}
```

注意的是，无论开发时的宿主操作系统是哪种，你都需要将入口函数命名为 `_start`。

通过把 JSON 文件名传入 `--target` 选项，我们现在可以基于新目标编译内核了。

```bash
> cargo build --target x86_64-blog_os.json

error[E0463]: can't find crate for `core` 
```

哇哦，编译失败了！输出的错误提示我们，Rust 编译器找不到 [core 库][core library]。而所有 `no_std` 类型的 crate 都隐式链接这个库，这个库包含基础的 Rust 类型，如 `Result`、`Option` 和迭代器等。


问题出在，core 库以*预编译*库的形式与 Rust 编译器一同发布。所以，core 库只对支持的宿主系统有用（例如，`x86_64-unknown-linux-gnu`），而对我们自定义的目标系统无效。如果我们想为其它目标编译代码，我们需要首先为这些目标重新编译整个 core 库。

#### Cargo xbuild

这就是为什么我们需要 [cargo xbuild] 工具。这个工具封装了 `cargo build`；但不同的是，它将自动交叉编译 core 库和内置库。我们可以用下面的命令安装它：


```bash
cargo install cargo-xbuild
```

这个工具依赖的 Rust 源代码可以使用 `rustup component add rust-src` 安装。

现在我们可以使用 `xbuild` 代替 `build` 重新编译：

```bash
> cargo xbuild --target x86_64-blog_os.json
   Compiling core v0.0.0 (/…/rust/src/libcore)
   Compiling compiler_builtins v0.1.5
   Compiling rustc-std-workspace-core v1.0.0 (/…/rust/src/tools/rustc-std-workspace-core)
   Compiling alloc v0.0.0 (/tmp/xargo.PB7fj9KZJhAI)
    Finished release [optimized + debuginfo] target(s) in 45.18s
   Compiling blog_os v0.1.0 (file:///…/blog_os)
    Finished dev [unoptimized + debuginfo] target(s) in 0.29 secs
```

我们能看到，`cargo xbuild` 为我们自定义的目标交叉编译了 `core`、`compiler_builtin` 和 `alloc` 三个部件。这些部件使用了大量的不稳定特性，所以编译只能利用 [nightly 版本的 Rust 编译器](https://os.phil-opp.com/minimal-rust-kernel/#installing-rust-nightly) 进行。这之后，`cargo xbuild` 成功地编译了我们的 `blog_os` 包。

现在我们可以为裸机编译内核了。但是，我们提供给引导程序的入口函数 `_start` 还是空的。所以，让我们在这里先打点东西到屏幕看看。

### 设置默认目标
为了避免每次执行 `cargo xbuild` 时传递 `--target` 参数，我们可以覆写默认的编译目标。我们创建一个名为 `.cargo/config` 的 cargo配置文件，添加下面的内容：


```toml
# in .cargo/config

[build]
target = "x86_64-blog_os.json"
```

这里的配置告诉 `cargo` 在没有显式声明目标的情况下，使用我们提供的 `x86_64-blog_os.json` 作为目标配置。这意味着我们可以直接使用 `cargo xbuild` 构建内核了。[官方文档][cargo doc] 对 cargo 配置项有更详细的说明。


### 向屏幕打印字符
要做到这一步，最简单的方式是写入 [VGA 文本缓冲区][VGA text buffer]。这是一段映射到 VGA 硬件的特殊内存片段，包含着显示在屏幕上的内容。通常情况下，它能够存储 25 行、80 列共 2000 个字符单元。每个字符单元能够显示一个有特定前景色和背景色的 ASCII 字符。输出到屏幕的字符大概长这样：


![屏幕输出样例](./images/vga-sample-output.png)

我们将在下篇文章中详细讨论 VGA 字符缓冲区的内存布局，并为其编写第一个驱动程序。对于打印“Hello World”，目前我们只需要知道这段缓冲区的地址是 `0xb8000`，且每个字符单元包含一个 ASCII 码字节和一个颜色字节。

我们的实现就像这样：

```rust
static HELLO: &[u8] = b"Hello World!";

#[no_mangle]
pub extern "C" fn _start() -> ! {
    let vga_buffer = 0xb8000 as *mut u8;

    for (i, &byte) in HELLO.iter().enumerate() {
        unsafe {
            *vga_buffer.offset(i as isize * 2) = byte;
            *vga_buffer.offset(i as isize * 2 + 1) = 0xb;
        }
    }

    loop {}
}
```

首先，我们将整数 `0xb8000` 转换为一个 [裸指针][raw pointer]。然后，我们 [遍历][iterate] [静态][static] [字节字符串][byte string] `HELLO` 的字节。我们还使用 [enumerate] 方法获得一个额外的序号变量 `i`。在 for 循环体的主体内，我们使用 [offset] 方法来将字符串的每个字节和对应的颜色字节（`0xb` 代表淡青色）写入内存位置。


要注意的是，所有的内存写操作都被一个 [unsafe] 语句块包围。这是因为，编译器不能确保我们创建的裸指针是有效的。裸指针可能指向任何一个任意位置，并引发数据污染问题。使用 `unsafe` 语句块包裹这些操作，我们其实是在告诉编译器，自己相当肯定语句块内的操作是有效的。事实上，`unsafe` 语句块并不会关闭 Rust 的安全检查机制；它允许你多做的事情只有 [五件][five additional things]。


我想要强调的是：**这不是我们使用 Rust 的正确姿势！**。在 unsafe 语句块里面操弄裸指针很容易搞得一地鸡毛，例如，稍不留神我们很容易就会越过缓冲区边界进行写操作。

所以，我们希望尽可能少地使用 `unsafe` 语句块。Rust 语言允许我们将不安全操作将包装为一个安全的抽象模块。举个例子，我们可以创建一个 VGA 缓冲区类型，把所有的不安全语句封装起来，来确保从类型外部操作时，*不可能*触发错误。通过这种方式，我们只需要最少 `unsafe` 语句块来确保我们不破坏内存安全。在下一篇文章中，我们将会创建这样的 VGA 缓冲区封装。


## 启动内核
既然我们已经有了一个有视觉效果的可执行程序，是时候把它运行起来试试看了。首先，我们将编译好的内核与引导程序链接来创建一个引导镜像。然后，我们可以在 [QEMU] 虚拟机中运行这个镜像，或者通过 U 盘在真机上运行。


### 创建引导映像
要将可执行程序转换为可引导的镜像，我们需要把它和引导程序链接。正如我们在 [描述启动的小节]@TODO（补充链接） 所学，引导程序将负责初始化 CPU 并加载我们的内核。

自己手码引导程序有点难，可以独立成一个项目，所以我们在此直接使用 [bootloader] 包。这个包实现基本的 BIOS 引导程序，不依赖 C 语言，只依赖 Rust 代码和内联汇编。为了用它启动我们的内核，我们需要将它添加为一个依赖项：


```toml
# in Cargo.toml

[dependencies]
bootloader = "0.9.3"
```

只添加 `bootloader` 为依赖项不足以创建一个可引导的磁盘镜像。问题出在我们需要在内核编译完成之后，将内核和引导程序组合在一起，然而 cargo 并不支持 [后处理脚本][post-build scripts]。


为了解决这个问题，我们创建了一个 bootimage 工具。它会先编译内核，然后将内核和引导程序组合在一起，从而创建一个能够引导的磁盘镜像。我们可以在终端执行以下命令来安装这款工具：

```bash
cargo install bootimage
```

为了运行 `bootimage` 以及编译引导程序，我们需要安装 `rustup` 模块 `llvm-tools-preview`。执行 `rustup component add llvm-tools-preview` 即可安装这个工具。


成功安装 `bootimage` 并添加 `llvm-tools-preview` 模块后执行以下命令即可创建一个可引导的磁盘镜像：

```bash
> cargo bootimage
```

可以看到，bootimage 工具使用 `cargo xbuild` 编译内核，所以它将增量编译我们修改后的源码。在这之后，它会编译内核的引导程序，这可能将花费一定的时间。但和所有其它依赖包相似的是，编译只会发生一次，然后产物被缓存，让后续编译明显加速。最终，`bootimage` 将把内核和引导程序组合为一个可引导的磁盘镜像。

运行上述命令之后，我们应该能在 `target/x86_64-blog_os/debug` 目录内找到可引导的映像文件 `bootimage-blog_os.bin`。这个镜像可以在虚拟机启动，也可以刻录到 U 盘上以便在真机上启动。（需要注意的是，因为文件格式不同，这里的 bin 文件并不是一个光驱镜像，所以将它刻录到光盘不会起作用）

#### 具体是如何实现的？
`bootimage` 工具背地里执行了以下三个步骤：

- 编译我们的内核为一个 ELF文件
- 编译引导程序为独立的可执行文件
- 将内核 ELF 文件链接到引导程序的末端

当机器启动时，引导程序将会读取并解析拼接在其后的 ELF 文件。然后，它将把程序片段映射到页表的虚拟地址，清零 BSS 段，将初始化栈空间。最后，它将读取并跳转到程序入口地址（我们的 `_start` 函数）。

### 在 QEMU 中启动内核
现在我们可以在虚拟机中启动内核了。为了在 [QEMU] 中启动内核，我们使用下面的命令：

```bash
> qemu-system-x86_64 -drive format=raw,file=bootimage-blog_os.bin
```

这会打开一个类似下图的独立窗口：

![样例输出](./images/vga-sample-output.png)

我们可以看到，屏幕窗口已经显示出 “Hello World!” 字符串。

### 在真机上运行内核
我们也可以镜像写入 U 盘，然后放到真机上启动：

```bash
> dd if=target/x86_64-blog_os/debug/bootimage-blog_os.bin of=/dev/sdX && sync
```

在这里，`sdX` 是 U 盘的设备名。因为目标设备上已有的数据将全部被擦除，所以请务必**仔细**选择正确的设备。

写入到 U 盘之后，你可以在真机上通过引导启动你的系统。视情况而定，你可能需要使用特俗的启动菜单，或者调整 BIOS 配置中的启动顺序来实现从 U 盘启动。需要注意的是，`bootloader` 包暂不支持 UEFI，所以我们并不能在 UEFI 机器上启动。

### 使用 `cargo run`
要让在 QEMU 中运行内核更轻松，我们可以设置在 cargo 配置文件中设置 `runner` 配置项：

```toml
# in .cargo/config

[target.'cfg(target_os = "none")']
runner = "bootimage runner"
```

`target.'cfg(target_os = "none")'` 囊括了所有目标配置文件 `"os"` 字段设置为 `"none"` 的目标。这包含我们的 `x86_64-blog_os.json` 目标。另外，`runner` 的值指定运行 `cargo run` 具体执行的命令。这个命令将在成功编译后执行，而且会传递可执行文件的路径为第一个参数。更多详情参见 [cargo 的文档][cargo doc]。

`bootimage runner` 命令特意设计为可用做 `runner` 二进制的形式。它将给定的可执行文件与项目的引导程序依赖项链接，然后在 QEMU 中启动它。[`bootimage` 的 README][bootimage README] 文档提供了更多细节和可以传入的配置参数。

现在我们可以使用 `cargo xrun` 来编译内核并在 QEMU 中启动了。和 `xbuild` 类似，`xrun` 子命令将在调用 `cargo` 命令前编译内核所需的包。这个子命令也由 `cargo-xbuild` 工具提供，所以你不需要安装额外的工具。

## 下篇预告
在下篇文章中，我们将更加细致地探索 VGA 文本缓冲区，并包装它为一个安全的接口。我们还将基于它实现 `println!` 宏。

[ABI]: https://stackoverflow.com/a/2456882
[adjusted default page size]: https://wiki.osdev.org/Multiboot#Multiboot_2
[`asm!` 宏]: https://doc.rust-lang.org/unstable-book/library-features/asm.html
[BIOS]: https://en.wikipedia.org/wiki/BIOS
[bootimage]: https://github.com/rust-osdev/bootimage
[bootimage README]: https://github.com/rust-osdev/bootimage
[bootloader]: https://crates.io/crates/bootloader
[boot information]: https://www.gnu.org/software/grub/manual/multiboot/multiboot.html#Boot-information-format
[byte string]: https://doc.rust-lang.org/reference/tokens.html#byte-string-literals
[cargo configuration]: https://doc.rust-lang.org/cargo/reference/config.html
[cargo doc]: https://doc.rust-lang.org/cargo/reference/config.html
[cargo xbuild]: https://github.com/rust-osdev/cargo-xbuild
[core library]: https://doc.rust-lang.org/nightly/core/index.html
[data-layout]: https://llvm.org/docs/LangRef.html#data-layout
[disabling SIMD]: https://os.phil-opp.com/disable-simd/
[disabling the read zone]: https://os.phil-opp.com/red-zone/
[ELF]: https://en.wikipedia.org/wiki/Executable_and_Linkable_Format
[enumerate]: https://doc.rust-lang.org/core/iter/trait.Iterator.html#method.enumerate
[first-edition]: https://os.phil-opp.com/first-edition/
[five additional things]: https://doc.rust-lang.org/stable/book/ch19-01-unsafe-rust.html#unsafe-superpowers
[freestanding Rust binary]: https://sammyne.github.io/2020/07/09/blog-os-01-freestanding-rust-binary/
[Free Software Foundation]: https://en.wikipedia.org/wiki/Free_Software_Foundation
[Github issue]: https://github.com/phil-opp/blog_os/issues/349
[GNU GRUB]: https://en.wikipedia.org/wiki/GNU_GRUB
[iterate]: https://doc.rust-lang.org/stable/book/ch13-02-iterators.html
[linker]: https://en.wikipedia.org/wiki/Linker_(computing)
[LLD]: https://lld.llvm.org/
[long mode]: https://en.wikipedia.org/wiki/Long_mode
[memory safety]: https://en.wikipedia.org/wiki/Memory_safety
[Multiboot]: https://wiki.osdev.org/Multiboot
[Multiboot header]: https://www.gnu.org/software/grub/manual/multiboot/multiboot.html#OS-image-format
[nightly-rust]: https://doc.rust-lang.org/book/appendix-07-nightly-rust.html#choo-choo-release-channels-and-riding-the-trains
[offset]: https://doc.rust-lang.org/std/primitive.pointer.html#method.offset
[post-build scripts]: https://github.com/rust-lang/cargo/issues/545
[power-on self-test]: https://en.wikipedia.org/wiki/Power-on_self-test
[protected mode]: https://en.wikipedia.org/wiki/Protected_mode
[QEMU]: https://www.qemu.org/
[raw pointer]: https://doc.rust-lang.org/stable/book/ch19-01-unsafe-rust.html#dereferencing-a-raw-pointer
[real mode]: https://en.wikipedia.org/wiki/Real_mode
[ROM]: https://en.wikipedia.org/wiki/Read-only_memory
[rustup]: https://www.rustup.rs/
[rust platform support]: https://forge.rust-lang.org/release/platform-support.html
[SIMD]: https://en.wikipedia.org/wiki/SIMD
[stack unwinding]: https://www.bogotobogo.com/cplusplus/stackunwinding.php
[static]: https://doc.rust-lang.org/book/ch10-03-lifetime-syntax.html#the-static-lifetime
[target triple]: https://clang.llvm.org/docs/CrossCompilation.html#target-triple
[UEFI]: https://en.wikipedia.org/wiki/Unified_Extensible_Firmware_Interface
[unsafe]: https://doc.rust-lang.org/stable/book/ch19-01-unsafe-rust.html
[VGA text buffer]: https://en.wikipedia.org/wiki/VGA-compatible_text_mode
[wasm32-unknown-unknown]: https://www.hellorust.com/setup/wasm-target/
