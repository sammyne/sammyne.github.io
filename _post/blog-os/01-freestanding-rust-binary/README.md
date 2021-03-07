---
title: "[blog_os] 01. 独立的 Rust 二进制"
date: 2020-07-09
categories:
  - os
tags:
  - blog_os
  - rust
---

> 原文：[A Freestanding Rust Binary](https://os.phil-opp.com/freestanding-rust-binary/)

创建自己操作系统内核的第一步是创建一个不链接标准库的 Rust 可执行文件。 这样在没有基础操作系统的情况下即可在 [裸机][bare metal] 上运行 Rust 代码。

<!-- this md link must be placed here to make it effective on the home page -->

[bare metal]: https://en.wikipedia.org/wiki/Bare_machine

<!-- more -->

此博客已在 [GitHub][github blog-os] 开源。如果您有任何问题或疑问，请在此处打开一个问题。 您也可以在 [底部][valine] 发表评论。这篇文章的完整源代码可以在 [blog-os-cn/01-freestanding-rust-binary][01-freestanding-rust-binary-source-code] 找到。

## 介绍

要编写操作系统（OS）内核，我们需要不依赖于任何操作系统功能的代码。这意味着我们不能使用线程、文件、堆内存、网络、随机数、标准输出或任何其他需要 OS 抽象或特定硬件的功能。这是因为我们正在尝试编写自己的 OS 和驱动程序。

这意味着我们不能使用大多数 [Rust 标准库][rust standard library]，但是还有很多 Rust 功能是可用的。例如，我们可以使用 [迭代器][iterators]、[闭包][closures]、[模式匹配][pattern matching]、[option] 和 [result]，[string formatting]，当然还有 [所有权系统][ownership system]。这些功能使得以一种非常有表现力的高级方式编写内核成为可能，而无需担心 [不确定的行为][undefined behavior] 或 [内存安全][memory safety]。

为了在 Rust 中创建 OS 内核，我们需要创建一个无需底层操作系统即可运行的可执行文件。此类可执行文件通常称为“独立式”或“裸机”可执行文件。

本文描述创建一个独立的 Rust 二进制文件的必要步骤，并解释需要这些步骤的原因。如果您仅对一个最小的示例感兴趣，可以 **[跳转到总结部分](#总结)**。

## 禁用标准库

默认情况下，所有 Rust crate 都链接 [标准库][standard library]，该库依赖操作系统的线程、文件或网络等功能。它还依赖于 C 标准库 `libc`，该库与 OS 服务紧密交互。因为计划是编写一个操作系统，所以我们不能使用任何依赖于 OS 的库。因此，我们必须通过 [`no_std` 属性][`no_std` attribute] 禁用自动包含标准库。

我们首先创建一个新的 cargo 应用项目。 最简单的方法是通过命令行：

```bash
cargo new blog_os --bin --edition 2018
```

我将项目命名为 `blog_os`，但是您当然可以选择自己的名字。`--bin` 标志指定我们要创建一个可执行二进制文件（而不是库），而 `--edition 2018` 标志指定 crate 使用 [2018 版][2018 edition] 的 Rust。运行命令后，cargo 为我们创建以下目录结构：

```
blog_os
├── Cargo.toml
└── src
    └── main.rs
```

在 `Cargo.toml` 包含 crate 配置，例如 crate 名称，作者，[语义化版本][semantic version] 号和依赖关系。`src/main.rs` 文件包含 crate 的根模块和 `main` 函数。您可以通过 `cargo build` 来编译 crate，然后在 `target/debug` 子文件夹中运行已编译的 `blog_os` 二进制文件。

### `no_std` 属性

现在的 crate 隐式链接了标准库。让我们尝试通过添加 [`no_std` 属性][`no_std` attribute] 禁用此功能：

```rust
// main.rs

#![no_std]

fn main() {
    println!("Hello, world!");
}
```

尝试立即构建它（通过运行 `cargo build`）会触发以下错误：

```bash
error: cannot find macro `println!` in this scope
 --> src/main.rs:4:5
  |
4 |     println!("Hello, world!");
  |     ^^^^^^^
```

错误原因是 [`println`宏][`println` macro] 是我们不再包含的标准库的一部分。因此我们无法再打印东西。因为 `println` 写入 [标准输出][standard output] -- 操作系统提供的一个特殊文件描述符，所以错误是合理的。

因此，我们删除打印代码，然后使用空的 `main` 函数重试：

```rust
// main.rs

#![no_std]

fn main() {}
```

```bash
> cargo build
error: `#[panic_handler]` function required, but not found
error: language item required, but not found: `eh_personality`
```

现在，编译器缺少 `#[panic_handler]` 函数和一个 _语言项_（_language item_）。

## Panic 实现

`panic_handler` 属性定义了发生 [panic] 时编译器应调用的函数。标准库提供了自己的 panic 处理函数，但是在 `no_std` 环境中，我们需要自己定义它：

```rust
// in main.rs

use core::panic::PanicInfo;

/// This function is called on panic.
#[panic_handler]
fn panic(_info: &PanicInfo) -> ! {
    loop {}
}
```

[`PanicInfo` 参数][panicinfo] 包含发生异常的文件和行以及可选的异常消息。该函数永远不应该返回，因此返回 [“never” 类型][`never` type] `!` 将其标记为 [发散函数（diverging function）][diverging function]。 目前，此函数还不支持太多操作，所以我们只是执行无限循环。

## `eh_personality` 语言项

语言项是编译器内部所需的特殊功能和类型。例如，[`Copy` trait] 是一种语言项，它告诉编译器哪些类型具有 [_copy 语义_][`copy` trait]。查看其 [实现][copy impl] 可以看到它具有特殊的 `#[lang = "copy"]` 属性，将其定义为语言项。

提供自己的语言项实现是可能的，但这只应该在逼不得已的情况下使用。原因是语言项是十分不稳定的实现细节，甚至没有类型检查（因此编译器甚至不检查函数是否具有正确的参数类型）。好在有更稳定的方法来修复上述语言项错误。

`eh_personality` 语言项标记了用于实现 [堆栈展开][stack unwinding] 的功能。默认情况下，Rust 使用展开来运行所有活跃堆栈变量的析构函数，以防出现 [panic] 情况。这样可以确保释放所有使用的内存，并允许父线程捕获 panic 并继续执行。但是，展开是一个复杂的过程，需要操作系统的某些特定库（例如，Linux 的 [libunwind] 或 Windows 的 [结构化异常处理][structured exception handling]），因此我们不想在我们的操作系统中使用它。

### 禁用展开

有些用例是不希望展开的，因此 Rust 提供了 [一旦 panic 就终止执行][abort on panic] 的选项。 这禁用了展开符号信息的生成，因此大大减小二进制大小。我们可以在多个地方禁用展开功能。最简单的方法是将以下几行添加到 `Cargo.toml`：

```toml
[profile.dev]
panic = "abort"

[profile.release]
panic = "abort"
```

这会将 `dev` 配置（用于 `cargo build` ）和 `release` 配置（用于`cargo build --release`）的 panic 策略设置为`abort`。 这样就不再需要 `eh_personality` 语言项了。

以上两个错误现在修复了。但是现在尝试对其进行编译会触发另一个错误：

```bash
> cargo build
error: requires `start` lang_item
```

我们的程序缺少定义入口函数的 `start` 语言项。

## `start` 属性

我们可能会认为 `main` 函数是运行程序时调用的第一个函数。但是，大多数语言都有一个 [运行时系统][runtime system]，它负责诸如垃圾回收（例如 Java）或软件线程（例如 Go 中的 goroutines）之类的事情。 这个运行时需要在 `main` 之前调用，因为它需要初始化自己。

在链接标准库的典型 Rust 二进制文件中，执行从名为 `crt0`（“C 运行时零”）的 C 运行时库开始，该运行时库为 C 应用程序搭建环境。这包括创建堆栈并将参数放在正确的寄存器中。然后，C 运行时调用 [Rust 运行时的入口函数][rt::lang_start]，该入口由 `start` 语言项标记。Rust 的运行时非常小，它可以处理一些小任务，例如设置堆栈溢出防护或在紧急情况下打印回溯信息。最后，运行时调用 `main` 函数。

我们独立式的可执行文件无法访问 Rust 运行时和 `crt0`，因此，我们需要定义自己的程序入口。由于 `start` 语言项依然需要 `crt0`，所以实现 `start` 语言项起不了什么作用。我们直接覆写 `crt0` 程序入口即可。

### 覆写程序入口

添加 `#![no_main]` 属性来告诉 Rust 编译器我们不想使用常规的程序入口调用链。

```rust
#![no_std]
#![no_main]

use core::panic::PanicInfo;

/// This function is called on panic.
#[panic_handler]
fn panic(_info: &PanicInfo) -> ! {
    loop {}
}
```

细心一看会发现我们移除了 `main` 函数，因为没了底层运行时的调用，`main` 已经没有什么意义了。现在，我们准备用自定义的 `_start` 函数重写操作系统的入口。

```rust
#[no_mangle]
pub extern "C" fn _start() -> ! {
    loop {}
}
```

我们使用 `#[no_mangle]` 属性禁用 [命名改写（name mangling）][name mangling] 使得 Rust 编译器会如实地产出一个名为 `_start` 的函数。少了这个属性的话，编译器会生成形如 `_ZN3blog_os4_start7hb173fedf945531caE` 的晦涩符号作为分配给每个函数的唯一名字。因为下一步我们需要把入口函数的名称告诉链接器，所以这个属性是必须的。

我们还必须标识函数为 `extern "C"`，告诉编译器采用此函数的 [C 语言调用形式][c calling convention]（而不是不明确的 Rust 调用形式）。将这个函数命名为 `_start` 是因为这是大部分系统默认的程序入口名称。

`!` 返回类型表明这个函数是发散的，即绝对不允许返回。因为程序入口不会被任何函数调用，而是由操作系统或引导加载器（bootloader）直接调用的，所以使函数发散是必须的。因此，入口点不直接返回，而应该调用操作系统的 [`exit` 系统调用][`exit` system call]。在当前场景下，独立式的二进制返回后没有其他事需要做的了，因此关闭机器是个合理选择。我们暂且借助死循环来实现这个使函数发散的要求。

再次运行 `cargo build` 会触发难看的 _链接器_ 错误。

## 链接器错误

链接器是一个将生成的代码打包成可执行文件的程序。由于可执行文件的格式因 Linux、Windows 和 macOS 而异，每个系统都有自己的链接器，这些链接器跑出的异常也是不同的。这些错误的根本原因是一样的：链接器的默认配置假定我们的程序依赖于 C 语言运行时，然而程序并没有。

为了解决这个错误，我们需要告诉链接器它不应该包含 C 语言运行时。实现方式可以是给链接器传递特定的参数，或者是基于某个“裸机”目标构建程序。

### 基于某个“裸机”目标构建程序

默认情况下，Rust 会尝试构建能够在我们当前系统环境运行的二进制。例如，如果我们使用的 `x86_64` 上面的 Windows，Rust 会试图基于 `x86_64` 指令集构建一个 `.exe` Windows 可执行文件。这个环境叫做我们的“主机”系统。

Rust 采用一种称为 _[目标三元组（target triple）][target triple]_ 的字符串描述不同的环境。我们执行命令 `rustc --version --verbose` 可以查看自己主机系统的目标三元组。

```bash
rustc 1.52.0-nightly (caca2121f 2021-03-05)
binary: rustc
commit-hash: caca2121ffe4cb47d8ea2d9469c493995f57e0b5
commit-date: 2021-03-05
host: x86_64-unknown-linux-musl
release: 1.52.0-nightly
LLVM version: 12.0.0
```

上述输出源自一个 `x86_64` 的 linux 系统。可见，`host` 三元组是 `x86_64-unknown-linux-musl`，其中包含了 CPU 架构（`x86_64`）、厂商（`unknown`）、操作系统（`linux`）和 [ABI](`musl`)。

基于我们的主机三元组编译，Rust 编译器和链接器假设底层有一个诸如 Linux 或 Windows 的、默认使用 C 语言运行时的操作系统，正是这点触发了链接器错误。因此，为了解决链接错误，我们可以基于没有底层操作系统的其他环境进行编译。

`thumbv7em-none-eabihf` 目标三元组就是这种类型的裸机环境实例之一，描述了一个 [嵌入式][embedded] [ARM] 系统。具体细节不重要，真正有用的是目标三元组里面的 `none` 表明其没有底层操作系统。为了能够基于这个目标进行编译，我们在 rustup 里面添加它：

```bash
rustup target add thumbv7em-none-eabihf
```

上述命令会下载适配这个系统的标准（和核心）库。现在我们就可以开始基于这个目标构建独立的可执行文件了：

```bash
cargo build --target thumbv7em-none-eabihf
```

通过传入 `--target` 参数，我们把二进制 [交叉编译][cross compile] 到一个裸机目标系统。因为目标系统没有操作系统，链接器不会尝试链接 C 语言运行时，构建成功，没有任何链接器错误。

这正是我们用来构建 OS 内核的方式。我们将会利用一个 [自定义目标][custom target] 来描述一个 `x86_64` 裸机环境。具体细节在下一篇文章分解。

### 链接器参数

除了基于某个裸机系统进行编译，给链接器传递特定参数也是能够解决链接器错误的。我们的内核不会采用这种方式，因此，可选的本节是为了完整性而提供的。点击以下*“链接器参数”*显示可选的内容。

::: details 链接器参数
本节，我们讨论出现在 Linux、Windows 和 macOS 的链接器错误，并解释如何通过传入额外的参数给链接器解决他们。值得注意的是，二进制的格式和链接器因操作系统而异，因此，每种操作系统所需的实参是不同的。

#### Linux

在 Linux 上，可以看到的链接器错误如下（简略版）：

```bash
error: linking with `cc` failed: exit code: 1
  |
  = note: "cc" […]
  = note: /usr/lib/gcc/../x86_64-linux-gnu/Scrt1.o: In function `_start':
          (.text+0x12): undefined reference to `__libc_csu_fini'
          /usr/lib/gcc/../x86_64-linux-gnu/Scrt1.o: In function `_start':
          (.text+0x19): undefined reference to `__libc_csu_init'
          /usr/lib/gcc/../x86_64-linux-gnu/Scrt1.o: In function `_start':
          (.text+0x25): undefined reference to `__libc_start_main'
          collect2: error: ld returned 1 exit status
```

问题出在链接器默认包含了 C 语言运行时的启动例程（也被称为 `_start`）。这个例程依赖 C 标准库 `libc` 的某些符号，而这些符号由于 `no_std` 属性没有被包含进来，因此，链接器无法找到这些引用。为了解决这个问题，我们可以通过传入 `_nostartfiles` 标识符来告诉链接器不要链接 C 启动例程。

借助 cargo 传递链接器属性的一种方式是 `cargo rustc` 命令。这个命令和 `cargo build` 命令的效果几乎一致，但是还允许我们往底层的 Rust 编译器 `rustc` 传递选项。`rustc` 支持 `-C link-arg` 标识符传递参数给链接器。综上，新命令如下：

```bash
cargo rustc -- -C link-arg=-nostartfiles
```

至此，我们的 crate 就能构建为 Linux 上的一个独立式的二进制文件了。

因为链接器默认会查找名为 `_start` 的函数作为入口函数，不需要显示地说明入口函数。

#### Windows

Windows 出现不同的链接器错误（已精简）如下：

```bash
error: linking with `link.exe` failed: exit code: 1561
  |
  = note: "C:\\Program Files (x86)\\…\\link.exe" […]
  = note: LINK : fatal error LNK1561: entry point must be defined
```

错误 “entry point must be defined” 意味着链接器无法找到程序入口。Windows 的默认入口函数名 [依赖于具体使用的子系统][windows-subsystems]。对于 `CONSOLE` 子系统，链接查找名为 `mainCRTStartup` 的函数，而对于 `WINDOWS` 子系统，它会查找名为 `WinMainCRTStartup` 的函数。为了覆写默认值，并告诉链接器去使用我们的 `_start` 函数，我们给链接器传递 `/ENTRY` 参数：

```bash
cargo rustc -- -C link-arg=/ENTRY:_start
```

由不同的参数格式可见，Windows 的链接器和 Linux 的链接器是完全不同的程序。

至此，触发的链接器错误变为：

```bash
error: linking with `link.exe` failed: exit code: 1221
  |
  = note: "C:\\Program Files (x86)\\…\\link.exe" […]
  = note: LINK : fatal error LNK1221: a subsystem can't be inferred and must be
          defined
```

错误原因是 Windows 二进制可以使用不同的 [子系统][windows-subsystems]。对于常规程序，子系统可以通过入口函数的名字推断：如果入口名为 `main`，使用的是 `CONSOLE` 子系统；如果入口名为 `WinMain`，使用的是 `WINDOWS` 子系统。由于我们的 `_start` 函数的名称和以上均不同，因此，我们需要显式标明使用的子系统：

```bash
cargo rustc -- -C link-args="/ENTRY:_start /SUBSYSTEM:console"
```

这里使用的是 `CONSOLE` 子系统，但是 `WINDOWS` 子系统也是同样适用的。除了多次使用 `-C link-arg`，还可以使用 `-C link-args` 的方式，其中 `link-args` 是一个空格分割的参数列表。

执行这个命令，我们的二进制应该能够在 Windows 上正常编译了。

#### macOS

macOS 上出现的链接器错误（已精简）如下

```bash
error: linking with `cc` failed: exit code: 1
  |
  = note: "cc" […]
  = note: ld: entry point (_main) undefined. for architecture x86_64
          clang: error: linker command failed with exit code 1 […]
```

错误信息告诉我们链接器没能找到默认名为 `main` 的入口函数（由于某些原因， macOS 下的所有函数都会有 `_` 前缀）。为了把入口函数设置为我们的 `_start` 函数，我们需要传入链接器参数 `-e`：

```bash
cargo rustc -- -C link-args="-e __start"
```

`-e` 标识符注明入口函数的名字。因为 macOS 的所有函数都有一个额外的 `_` 前缀，我们需要设置入口函数为 `__start` 而不是 `_start`。

至此，链接器链接器错误变为：

```bash
error: linking with `cc` failed: exit code: 1
  |
  = note: "cc" […]
  = note: ld: dynamic main executables must link with libSystem.dylib
          for architecture x86_64
          clang: error: linker command failed with exit code 1 […]
```

macOS [官方没有支持静态链接库][does not officially support statically linked binaries]，且默认要求程序链接 `libSystem` 库。为了规避这个限制，连接一个静态二进制，我们往链接器传入 `-static` 标识符：

```bash
cargo rustc -- -C link-args="-e __start -static"
```

但是这还是不够的，链接器错误变为：

```bash
error: linking with `cc` failed: exit code: 1
  |
  = note: "cc" […]
  = note: ld: library not found for -lcrt0.o
          clang: error: linker command failed with exit code 1 […]
```

这个错误的触发是因为 macOS 程序默认链接 `crt0` (“C 语言运行时 0”)。这和我们在 Linux 上看到的错误类似，同理可通过添加 `-nostartfiles` 链接器参数解决：

```bash
cargo rustc -- -C link-args="-e __start -static -nostartfiles"
```

现在，我们的程序应该能在 macOS 上成功构建了。

#### 统一构建命令

现在对于不同的主机系统需要执行不同的构建命令，这是不优雅的。为了避免这个问题，我们可以创建一个名为 `.cargo/config` 的文件用于注明平台专用的参数：

```toml
# in .cargo/config

[target.'cfg(target_os = "linux")']
rustflags = ["-C", "link-arg=-nostartfiles"]

[target.'cfg(target_os = "windows")']
rustflags = ["-C", "link-args=/ENTRY:_start /SUBSYSTEM:console"]

[target.'cfg(target_os = "macos")']
rustflags = ["-C", "link-args=-e __start -static -nostartfiles"]
```

`rustflags` 键包含会在每次调用时自动添加给 `rustc` 的参数。想要了解更多 `.cargo/config` 的信息的话，请移步 [官方文档][official documentation]。

现在我们的程序在三个平台上都可以简单地通过 `cargo build` 命令构建了。

#### 我们应该这样做吗？

虽然我们可以为 Linux、Windows 和 macOS 编译独立式的二进制，但是这不是一个好主意。理由是我们的二进制会期望不少事情，例如，栈在 `_start` 函数调用时被初始化。缺乏 C 语言运行时的话，这些要求可能无法满足，进而使得程序崩溃，触发诸如 segmentation fault 等错误。

如果你想要在现有的操作系统上创建一个包含 `libc` 的最小化二进制，遵循 [这里][no-stdlib] 的描述设置 `#[start]` 属性可能是一个更好的方法。

:::

## 总结

一个最小化的独立式 Rust 二进制看起来是这样的：

`src/main.rs`:

```rust
#![no_std] // don't link the Rust standard library
#![no_main] // disable all Rust-level entry points

use core::panic::PanicInfo;

#[no_mangle] // don't mangle the name of this function
pub extern "C" fn _start() -> ! {
    // this function is the entry point, since the linker looks for a function
    // named `_start` by default
    loop {}
}

/// This function is called on panic.
#[panic_handler]
fn panic(_info: &PanicInfo) -> ! {
    loop {}
}
```

`Cargo.toml`:

```toml
[package]
name = "crate_name"
version = "0.1.0"
authors = ["Author Name <author@example.com>"]

# the profile used for `cargo build`
[profile.dev]
panic = "abort" # disable stack unwinding on panic

# the profile used for `cargo build --release`
[profile.release]
panic = "abort" # disable stack unwinding on panic
```

为了构建这个二进制，我们需要基于一个诸如 `thumbv7em-none-eabihf` 裸机目标进行编译。

```bash
cargo build --target thumbv7em-none-eabihf
```

或者，我们可以通过传入额外的链接器参数基于主机系统进行编译：

```bash
# Linux
cargo rustc -- -C link-arg=-nostartfiles
# Windows
cargo rustc -- -C link-args="/ENTRY:_start /SUBSYSTEM:console"
# macOS
cargo rustc -- -C link-args="-e __start -static -nostartfiles"
```

不要忘了这只是一个最小化的独立式 Rust 二进制样例而已。这个二进制期望很多事情，例如 `_start` 函数调用时栈空间被初始化。**因此，为了实际使用这个二进制，还需要更多步骤**。

## 下篇预告？

[下一篇文章][next post] 会讲解把我们的独立式二进制转化为一个最小化操作系统内核的过程。内容包括创建一个自定义的目标，组合我们的二进制和引导加载器，还有学习往屏幕打印东西。

[abi]: https://en.wikipedia.org/wiki/Application_binary_interface
[arm]: https://en.wikipedia.org/wiki/ARM_architecture
[c calling convention]: https://en.wikipedia.org/wiki/Calling_convention
[panicinfo]: https://doc.rust-lang.org/nightly/core/panic/struct.PanicInfo.html
[rust standard library]: https://doc.rust-lang.org/std/
[abort on panic]: https://github.com/rust-lang/rust/pull/32900
[closures]: https://doc.rust-lang.org/book/ch13-01-closures.html
[copy impl]: https://github.com/rust-lang/rust/blob/485397e49a02a3b7ff77c17e4a3f16c653925cb3/src/libcore/marker.rs#L296-L299
[cross compile]: https://en.wikipedia.org/wiki/Cross_compiler
[custom target]: https://doc.rust-lang.org/rustc/targets/custom.html
[diverging function]: https://doc.rust-lang.org/1.30.0/book/first-edition/functions.html#diverging-functions
[does not officially support statically linked binaries]: https://developer.apple.com/library/content/qa/qa1118/_index.html
[embedded]: https://en.wikipedia.org/wiki/Embedded_system
[github blog-os]: https://github.com/phil-opp/blog_os
[iterators]: https://doc.rust-lang.org/book/ch13-02-iterators.html
[libunwind]: http://www.nongnu.org/libunwind/
[memory safety]: https://tonyarcieri.com/it-s-time-for-a-memory-safety-intervention
[name mangling]: https://en.wikipedia.org/wiki/Name_mangling
[next post]: @/second-edition/posts/02-minimal-rust-kernel/index.md
[no-stdlib]: https://doc.rust-lang.org/1.16.0/book/no-stdlib.html
[option]: https://doc.rust-lang.org/core/option/
[official documentation]: https://doc.rust-lang.org/cargo/reference/config.html
[ownership system]: https://doc.rust-lang.org/book/ch04-00-understanding-ownership.html
[panic]: https://doc.rust-lang.org/stable/book/ch09-01-unrecoverable-errors-with-panic.html
[pattern matching]: https://doc.rust-lang.org/book/ch06-00-enums.html
[post-01]: https://github.com/phil-opp/blog_os/tree/post-01
[result]: https://doc.rust-lang.org/core/result/
[rt::lang_start]: https://github.com/rust-lang/rust/blob/bb4d1491466d8239a7a5fd68bd605e3276e97afb/src/libstd/rt.rs#L32-L73
[runtime system]: https://en.wikipedia.org/wiki/Runtime_system
[semantic version]: http://semver.org/
[stack unwinding]: http://www.bogotobogo.com/cplusplus/stackunwinding.php
[standard library]: https://doc.rust-lang.org/std/
[standard output]: https://en.wikipedia.org/wiki/Standard_streams#Standard_output_.28stdout.29
[string formatting]: https://doc.rust-lang.org/core/macro.write.html
[structured exception handling]: https://msdn.microsoft.com/en-us/library/windows/desktop/ms680657(v=vs.85).aspx
[target triple]: https://clang.llvm.org/docs/CrossCompilation.html#target-triple
[undefined behavior]: https://www.nayuki.io/page/undefined-behavior-in-c-and-cplusplus-programs
[valine]: #valine
[windows-subsystems]: https://docs.microsoft.com/en-us/cpp/build/reference/entry-entry-point-symbol
[01-freestanding-rust-binary-source-code]: https://github.com/sammyne/blog-os-cn/tree/master/01-freestanding-rust-binary
[2018 edition]: https://rust-lang-nursery.github.io/edition-guide/rust-2018/index.html
[`copy` trait]: https://doc.rust-lang.org/nightly/core/marker/trait.Copy.html
[`exit` system call]: https://en.wikipedia.org/wiki/Exit_(system_call)
[`never` type]: https://doc.rust-lang.org/nightly/std/primitive.never.html
[`no_std` attribute]: https://doc.rust-lang.org/1.30.0/book/first-edition/using-rust-without-the-standard-library.html
[`println` macro]: https://doc.rust-lang.org/std/macro.println.html
