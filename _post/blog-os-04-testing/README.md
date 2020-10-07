---
title: "[blog os] 04. 测试"
date: 2020-07-27
categories:
- os
tags:
- blog_os
- rust
---

> 原文：[Testing](https://os.phil-opp.com/testing/)

本文主要讲述在 `no_std` 环境下执行单元测试和集成测试的方法。我们将借助 Rust 的自定义测试框架来在内核中执行一些测试函数。为了从 QEMU 将结果反馈出来，我们需要使用 QEMU 的其他功能以及 `bootimage` 工具。

<!-- more -->

此博客在 [GitHub][github blog-os] 上公开开发。如果您有任何问题或疑问，请在此处打开一个问题。 您也可以在 [底部][valine] 发表评论。这篇文章的完整源代码可以在 [blog-os-cn/04-testing][04-testing] 找到。


## 要求

这篇文章替换了（现在已经过时了）[*单元测试*][Unit Testing] 和 [*集成测试*][Integration Tests] 两篇文章。这里假定你已经阅读了 2019-04-27 后的 [_最小化的 Rust 内核_][A Minimal Rust Kernel] 一文。总而言之，本文要求你已经有一个 [设置默认目标][A Minimal Rust Kernel - sets a default target] 的 `.cargo/config` 文件和 [定义了一个 runner 可执行文件][A Minimal Rust Kernel - using cargo run]。


## Rust 的测试

Rust 有一个 [内置的测试框架][built-in test framework]，这个框架无需任何设置就可以进行单元测试。只需要创建一个借助断言检查结果的函数，并在函数的头部加上 `#[test]` 属性即可。然后 `cargo test` 会自动找到并执行 crate 的所有测试函数。


不幸的是，对于诸如我们内核这样的 `no_std` 的应用，情况有点复杂。问题在于 Rust 的测试框架会隐式地调用内置的 [`test`][test crate] 库，但是这个库依赖于标准库。这也就是说 `#[no_std]` 的内核无法使用默认的测试框架。


当我们试图为项目执行 `cargo test` 时，可以看到如下信息:

```bash
> cargo test
   Compiling blog_os v0.1.0 (/…/blog_os)
error[E0463]: can't find crate for `test`
```

`test` 包依赖于标准库，在我们的裸机目标上并不可用。虽然将 `test` 包移植到一个 `#[no_std]` 上下文环境是 [可行的][utest]，但是具体行为相当不稳定且还会需要一些特殊的骚操作，例如重定义 `panic` 宏。 

### 自定义测试框架

幸运的是，Rust 支持启用不稳定的 [自定义测试框架（`custom_test_frameworks`）][custom_test_frameworks] 特性替换默认的测试框架。该功能不需要额外的库，因此可用于 `#[no_std]` 环境。它的工作原理是收集所有标注了 `#[test_case]` 属性的函数，然后将测试函数的列表作为参数传递给用户指定的 runner 函数。因此，它给予了具体实现对测试过程的最大控制。

与默认的测试框架相比，它的缺点是诸如 [`should_panic` 测试][should_panic] 等一些高级功能不可用。如果需要，我们可以自己实现这些功能。非常特殊的环境使得这些高级功能可能没法使用，所以这点对我们来说是好事。举个例子， `#[should_panic]` 属性依赖于堆栈展开来捕获 panic，而我们内核早已将其禁用了。


为内核实现自定义测试框架，需要将如下代码添加到 `main.rs`:

```rust
// in src/main.rs

#![feature(custom_test_frameworks)]
#![test_runner(crate::test_runner)]

#[cfg(test)]
fn test_runner(tests: &[&dyn Fn()]) {
    println!("Running {} tests", tests.len());
    for test in tests {
        test();
    }
}
```

我们的 runner 会打印一个简短的调试信息，然后依次调用列表的每个测试函数。参数类型 `&[&dyn Fn()]` 是 [_Fn()_][Fn()] trait 的 [_trait 对象_][trait object] 引用的一个 [_切片_][slice]。它基本上可以被看做可以像函数般调用的类型的引用列表。由于这个函数在非测试环境下没有什么用，这里我们使用 `#[cfg(test)]` 属性保证它只会出现在测试中。 

现在运行 `cargo test` 可以发现运行成功了（如果没有的话，请查看以下温馨提示）。然而，我们看到的仍然是 "Hello World" 而不是 `test_runner` 传递的信息。这是由于我们的入口点仍然是 `_start` 函数。自定义测试框架会生成一个 `main` 函数来调用`test_runner`，但是由于我们使用了 `#[no_main]` 并提供了自定义的入口点，所以这个 `main` 函数就被忽略了。

::: tip 温馨提示
当前版本的 cargo 有 bug，会在某些运行 `cargo test` 的情况下触发 "duplicate lang item" 错误。触发条件之一是在 `Cargo.toml` 里面为 `profile` 键的值为 `panic = "abort"`。移除之后，`cargo test` 应该能跑通。更多信息参见 [cargo issue][cargo issue#7359]。
:::


为了解决这个问题，我们需要首先通过  `reexport_test_harness_main` 属性来将生成的函数名称更改为与 `main` 不同的名称，然后在 `_start` 函数里调用这个重命名的函数：

```rust
// in src/main.rs

#![reexport_test_harness_main = "test_main"]

#[no_mangle]
pub extern "C" fn _start() -> ! {
    println!("Hello World{}", "!");

    #[cfg(test)]
    test_main();

    loop {}
}
```

将测试框架的入口函数的名字设置为 `test_main`，并在 `_start` 入口函数里调用它。通过使用 [条件编译][conditional compilation]，我们确保只在测试环境下调用 `test_main`，因为非测试环境下不会生成这个函数。


现在执行 `cargo test` 可以看到 `test_runner` 中的 "Running 0 tests" 信息显示在屏幕上了。我们现在可以创建第一个测试函数了:

```rust
// in src/main.rs

#[test_case]
fn trivial_assertion() {
    print!("trivial assertion... ");
    assert_eq!(1, 1);
    println!("[ok]");
}
```

现在，当我们运行 `cargo test` 时，我们可以看到如下输出:

![QEMU 显示 "Hello World!", "Running 1 tests", 和 "trivial assertion... [ok]"](./images/qemu-test-runner-output.png)

传递给 `test_runner` 函数的 `tests` 切片包含一个 `trivial_assertion` 函数的引用。从屏幕上输出的 `trivial assertion... [ok]` 信息可见，我们的测试已被调用并且顺利通过。

执行完测试后， `test_runner` 返回到 `test_main` 函数，而这个函数又返回到 `_start` 入口函数。`_start` 函数的末尾进入一个无限循环，因为入口函数是不允许返回的。问题来了：我们希望 `cargo test` 在所有的测试运行完毕后返回并退出。

## 退出 QEMU

现在的 `_start` 函数末尾有一个死循环，需要每次执行完 `cargo  test` 后需要手动关闭 QEMU。但是我们还想在没有用户交互的脚本环境下执行 `cargo test`。解决这个问题的最佳方式是使用一种简洁的方法来关闭操作系统。不幸的是，这个方式实现起来非常复杂，要求实现对 [APM] 或 [ACPI] 电源管理标准的支持。

好在还有一个绕开这些问题的办法：QEMU 支持一种名为  `isa-debug-exit` 的特殊设备，它提供从客户系统里退出 QEMU 的简单方式。为了使用这个设备，我们需要向 QEMU 传递一个 `-device` 参数。我们也可以将 `package.metadata.bootimage.test-args` 配置关键字添加到我们的 `Cargo.toml` 来达到目的：

```toml
# in Cargo.toml

[package.metadata.bootimage]
test-args = ["-device", "isa-debug-exit,iobase=0xf4,iosize=0x04"]
```

 `bootimage runner` 会为测试环境下的所有二进制在 QEMU 的默认命令后添加 `test-args` 参数。（对于 `cargo run` 命令，这个参数会被忽略。）

在传递设备名（`isa-debug-exit`）的同时，我们还传递了 `iobase` 和 `iosize` 两个参数。这两个参数指定了我们内核能够访问设备的 *I/O 端口*。

### I/O 端口
在 x86 平台上，CPU 和外围硬件通信一般有两种方式，**内存映射 I/O** 和 **端口映射 I/O**。之前，我们已经使用内存映射的方式访问了位于内存地址 `0xb8000` 的 [VGA文本缓冲区][VGA text buffer]。该地址并没有映射到 RAM，而是映射到了 VGA 设备的部分内存。


与内存映射不同，端口映射 I/O 使用独立的 I/O 总线进行通信。每个外围设备都有一个或多个端口号。CPU 采用了特殊的 `in` 和 `out` 指令来和端口通信，这些指令要求一个端口号和一个字节的数据作为参数（有些这种指令的变体也允许发送 `u16` 或是 `u32`）。

`isa-debug-exit` 设备使用的就是端口映射 I/O。其中， `iobase` 参数指定设备对应的端口地址（在 x86 中，`0xf4` 是一个 [通常未被使用的端口][list of x86 I/O ports]），而 `iosize` 则指定端口的大小（`0x04` 代表 4 字节）。


### 使用退出（Exit）设备

 `isa-debug-exit` 设备的功能非常简单。当一个 `value` 写入 `iobase` 指定的端口时，它会导致 QEMU 的 [退出状态][exit status] 为 `(value << 1) | 1`。也就是说，当我们向端口写入 `0`  时，QEMU将以状态码 `(0 << 1) | 1 = 1` 退出，而当我们向端口写入 `1` 时，它将以状态码 `(1 << 1) | 1 = 3` 退出。


这里我们使用 [`x86_64`] crate 提供的抽象，而不是手动调用 `in` 或 `out` 汇编指令。为了添加对该 crate 的依赖，我们将其添加到 `Cargo.toml` 的 `dependencies` 小节:

```toml
# in Cargo.toml

[dependencies]
x86_64 = "0.12.1"
```

现在我们可以使用 crate 提供的 [`Port`][Port] 类型来创建一个 `exit_qemu` 函数了:

```rust
// in src/main.rs

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
#[repr(u32)]
pub enum QemuExitCode {
    Success = 0x10,
    Failed = 0x11,
}

pub fn exit_qemu(exit_code: QemuExitCode) {
    use x86_64::instructions::port::Port;

    unsafe {
        let mut port = Port::new(0xf4);
        port.write(exit_code as u32);
    }
}
```

该函数在 `0xf4` 处创建了一个新的 [端口][Port]，该端口同时也是 `isa-debug-exit` 设备的 `iobase` 。然后函数向端口写入传递的退出状态码。这里使用 `u32` 类型是因为我们之前已经将 `isa-debug-exit` 设备的 `iosize` 指定为 4 字节了。因为I/O端口的写入操作通常会导致一些不可预知的行为，所以上述两个操作都是 `unsafe` 的。

为了指定退出状态，我们创建了一个 `QemuExitCode` 枚举类型。思路大体上是，如果所有的测试均成功，就以成功状态码退出；否则就以失败状态码退出。这个枚举类型被标记为 `#[repr(u32)]`，代表每个变量都是一个 `u32` 的整数类型。我们使用状态代码 `0x10` 表示成功，`0x11` 表示失败。实际的退出代码并不重要，只要它们不与 QEMU 的默认退出代码冲突即可。例如，因为它在转换后就变成了`(0 << 1) | 1 = 1` ，而 `1` 是 QEMU 运行失败时的默认状态码，所以使用状态代码 0 表示成功可能并不是一个好主意。这样，我们就无法将 QEMU 错误与成功的测试运行区分开来了。

现在我们来更新 `test_runner` 的代码，让程序在运行所有测试完毕后退出 QEMU：

```rust
fn test_runner(tests: &[&dyn Fn()]) {
    println!("Running {} tests", tests.len());
    for test in tests {
        test();
    }
    /// new
    exit_qemu(QemuExitCode::Success);
}
```

当我们现在运行 `cargo test` 时，QEMU 会在测试运行后立刻退出。问题出在即使我们传递了表示成功（`Success`）的状态码， `cargo test` 依然会将所有的测试都视为失败：

```bash
> cargo test
    Finished dev [unoptimized + debuginfo] target(s) in 0.03s
     Running target/x86_64-blog_os/debug/deps/blog_os-5804fc7d2dd4c9be
Building bootloader
   Compiling bootloader v0.5.3 (/home/philipp/Documents/bootloader)
    Finished release [optimized + debuginfo] target(s) in 1.07s
Running: `qemu-system-x86_64 -drive format=raw,file=/…/target/x86_64-blog_os/debug/
    deps/bootimage-blog_os-5804fc7d2dd4c9be.bin -device isa-debug-exit,iobase=0xf4,
    iosize=0x04`
error: test failed, to rerun pass '--bin blog_os'
```

这里的问题出在 `cargo test` 会将所有非 `0` 的状态码都视为失败。

### 成功退出（Exit）码

为了解决这个问题， `bootimage` 提供了一个 `test-success-exit-code` 配置项，将指定的退出状态码映射到 `0`:

```toml
[package.metadata.bootimage]
test-args = […]
test-success-exit-code = 33         # (0x10 << 1) | 1
```

有了这个配置，`bootimage` 就会将我们的成功退出码映射到退出码 `0`，使得 `cargo test` 能正确识别出测试成功的情况，而不会将其视为测试失败。

我们的测试 runner 现在会正确报告测试结果后自动关闭 QEMU。我们可以看到 QEMU 的窗口会显示很短的时间，但是不足以让我们看清测试结果。如果测试结果打印在控制台而不是 QEMU 就更好了，这样我们能在 QEMU 退出后仍然能看到测试结果。

## 打印到控制台

要在控制台查看测试输出，我们需要以某种方式将数据从内核发送到宿主系统。可行的方法有多种，例如通过 TCP 网络接口来发送数据。考虑到设置网络栈是一项很复杂的任务，我们选择一个更简单的解决方案。

### 串口

发送数据的一个简单的方式是通过 [串行端口][serial port]，这是一个现代电脑中已经不存在的旧标准接口。串口易于编程，QEMU 可以将串口收到的数据重定向到宿主机的标准输出或是文件。

实现串行接口的芯片被称为 [UARTs]。在 x86 上，有 [很多 UART 模型][UART models]，但是好在它们之间仅有的不同之处都是我们用不到的高级功能。目前通用的 UARTs 都会兼容 [16550 UART]，所以我们的测试框架采用该模型。

我们使用 [`uart_16550`] crate 来初始化 UART，并通过串口来发送数据。为了将该 crate 添加为依赖，我们将 `Cargo.toml` 和 `main.rs` 更新如下:

```toml
# in Cargo.toml

[dependencies]
uart_16550 = "0.2.0"
```

`uart_16550` crate 包含一个代表 UART 寄存器的 `SerialPort` 结构体，但是我们仍然需要自己创建一个相应的实例。我们创建一个新的串口模块 `serial`，包含以下内容:

```rust
// in src/main.rs

mod serial;
```

```rust
// in src/serial.rs

use uart_16550::SerialPort;
use spin::Mutex;
use lazy_static::lazy_static;

lazy_static! {
    pub static ref SERIAL1: Mutex<SerialPort> = {
        let mut serial_port = unsafe { SerialPort::new(0x3F8) };
        serial_port.init();
        Mutex::new(serial_port)
    };
}
```

就像 [VGA 文本缓冲区][vga lazy-static] 一样，我们使用 `lazy_static` 和一个自旋锁来创建一个 `static` 的 writer 实例。`lazy_static` 保证 `init` 方法只会在该实例第一次使用时被调用一次。

和 `isa-debug-exit` 设备一样，UART 也是基于 I/O 端口进行编程的。由于 UART 相对来讲更加复杂，它使用多个 I/O 端口来对不同的设备寄存器进行编程。不安全的 `SerialPort::new` 函数需要 UART 的第一个 I/O 端口作为参数，基于该地址推算所有需要的端口地址。我们传递的端口地址为 `0x3F8`，这是第一个串行接口的标准端口号。


为了使串口更加易用，我们添加了 `serial_print!` 和 `serial_println!` 宏:

```rust
#[doc(hidden)]
pub fn _print(args: ::core::fmt::Arguments) {
    use core::fmt::Write;
    SERIAL1.lock().write_fmt(args).expect("Printing to serial failed");
}

/// Prints to the host through the serial interface.
#[macro_export]
macro_rules! serial_print {
    ($($arg:tt)*) => {
        $crate::serial::_print(format_args!($($arg)*));
    };
}

/// Prints to the host through the serial interface, appending a newline.
#[macro_export]
macro_rules! serial_println {
    () => ($crate::serial_print!("\n"));
    ($fmt:expr) => ($crate::serial_print!(concat!($fmt, "\n")));
    ($fmt:expr, $($arg:tt)*) => ($crate::serial_print!(
        concat!($fmt, "\n"), $($arg)*));
}
```

该实现和我们此前的 `print` 和 `println` 宏的实现非常类似。 由于 `SerialPort` 类型已经实现了 `fmt::Write` trait，所以我们不需要再提供自己的实现。


现在我们可以在测试代码里往串行接口打印而不是向 VGA 文本缓冲区打印了:

```rust
// in src/main.rs

#[cfg(test)]
fn test_runner(tests: &[&dyn Fn()]) {
    serial_println!("Running {} tests", tests.len());
    […]
}

#[test_case]
fn trivial_assertion() {
    serial_print!("trivial assertion... ");
    assert_eq!(1, 1);
    serial_println!("[ok]");
}
```

注意，由于我们使用了 `#[macro_export]` 属性， `serial_println` 宏直接位于根命名空间下，所以无法通过 `use crate::serial::serial_println` 来导入该宏。

### QEMU 参数

为了查看 QEMU 的串行输出，我们需要使用 `-serial` 参数将输出重定向到标准输出：

```toml
# in Cargo.toml

[package.metadata.bootimage]
test-args = [
    "-device", "isa-debug-exit,iobase=0xf4,iosize=0x04", "-serial", "stdio"
]
```

现在运行 `cargo test` 后可以直接在控制台里看到测试输出了:

```bash
> cargo test
    Finished dev [unoptimized + debuginfo] target(s) in 0.02s
     Running target/x86_64-blog_os/debug/deps/blog_os-7b7c37b4ad62551a
Building bootloader
    Finished release [optimized + debuginfo] target(s) in 0.02s
Running: `qemu-system-x86_64 -drive format=raw,file=/…/target/x86_64-blog_os/debug/
    deps/bootimage-blog_os-7b7c37b4ad62551a.bin -device
    isa-debug-exit,iobase=0xf4,iosize=0x04 -serial stdio`
Running 1 tests
trivial assertion... [ok]
```

然而，因为我们的 panic 处理函数还是用了 `println`，所以测试失败的情况下仍然会在 QEMU 内看到输出结果。为了模拟这个过程，我们将 `trivial_assertion` 测试函数的断言修改为 `assert_eq!(0, 1)`：

![QEMU 显示 "Hello World!" and "panicked at 'assertion failed: `(left == right)`
    left: `0`, right: `1`', src/main.rs:55:5](./images/qemu-failed-test.png)

可以看到，panic 信息仍然打印到 VGA 缓冲区，而其他测试输出则被打印到串口上了。panic 信息非常有用，所以我们希望能够在控制台上看到它们。

### panic 时打印错误信息

为了在退出 QEMU 时打印 panic 相关信息，我们可以使用 [条件编译][conditional compilation] 在测试模式下调用（与非测试模式下）不同的 panic 处理函数:


```rust
// our existing panic handler
#[cfg(not(test))] // new attribute
#[panic_handler]
fn panic(info: &PanicInfo) -> ! {
    println!("{}", info);
    loop {}
}

// our panic handler in test mode
#[cfg(test)]
#[panic_handler]
fn panic(info: &PanicInfo) -> ! {
    serial_println!("[failed]\n");
    serial_println!("Error: {}\n", info);
    exit_qemu(QemuExitCode::Failed);
    loop {}
}
```

测试环境下 panic 时，我们用 `serial_println` 来代替 `println` 并使用失败状态码退出 QEMU。注意一下，因为编译器并不知道 `isa-debug-exit`设备会导致程序退出，所以在`exit_qemu` 调用后，我们仍然需要一个无限循环。

至此，测试失败的情况下 QEMU 仍然会退出，并会将一些有用的错误信息打印到控制台：

```bash
> cargo test
    Finished dev [unoptimized + debuginfo] target(s) in 0.02s
     Running target/x86_64-blog_os/debug/deps/blog_os-7b7c37b4ad62551a
Building bootloader
    Finished release [optimized + debuginfo] target(s) in 0.02s
Running: `qemu-system-x86_64 -drive format=raw,file=/…/target/x86_64-blog_os/debug/
    deps/bootimage-blog_os-7b7c37b4ad62551a.bin -device
    isa-debug-exit,iobase=0xf4,iosize=0x04 -serial stdio`
Running 1 tests
trivial assertion... [failed]

Error: panicked at 'assertion failed: `(left == right)`
  left: `0`,
 right: `1`', src/main.rs:65:5
```

由于现在所有的测试输出都打印到控制台，我们不再需要弹出一会的 QEMU 窗口了。是时候完全把窗口藏起来了。

### 隐藏 QEMU

由于我们使用 `isa-debug-exit` 设备和串行端口来报告完整的测试结果，所以我们不再需要 QMEU 窗口了。向 QEMU 传递 `-display none` 参数来将其隐藏:

```toml
# in Cargo.toml

[package.metadata.bootimage]
test-args = [
    "-device", "isa-debug-exit,iobase=0xf4,iosize=0x04", "-serial", "stdio",
    "-display", "none"
]
```

现在 QEMU 完全在后台运行且不会再打开任何窗口。这不仅没那么烦人，还允许我们的测试框架在没有图形界面的环境运行，诸如 CI 服务器或是 [SSH] 连接。

### 超时

由于 `cargo test` 会等待 test runner 退出，一个永不退出的测试会一直阻塞 test runner。好在无限循环通常是很容易避免的，所在实际应用中这并不是一个大问题。在我们的这个例子里，以下几种不同的情况会触发死循环：

- 引导器加载内核失败，导致系统不停重启
- BIOS/UEFI 固件加载引导器失败，同样会导致无限重启
- CPU 在某些函数结束时进入一个 `loop {}` 语句，例如因为 QEMU 的 exit 设备异常工作
- 硬件触发了系统重置，例如未捕获 CPU 异常时（后续的文章将会详细解释）

由于无限循环可能会在如此多种情况下发生，因此， `bootimage` 工具默认为每个可执行测试设置 5 分钟的超时时间。如果测试未在此时间内完成，则将其标记为失败，并向控制台输出 "Timed Out" 错误。这个功能确保了那些卡在无限循环里的测试不会一直阻塞 `cargo test`。

我们可以往 `trivial_assertion` 测试函数添加 `loop` 语句试看一下。当你运行 `cargo test` 时，你可以发现该测试会在 5 分钟后被标记为超时。超时时间可以通过 Cargo.toml 的 `test-timeout` 来进行[配置][bootimage config]：

```toml
# in Cargo.toml

[package.metadata.bootimage]
test-timeout = 300          # (in seconds)
```

如果不想为观察 `trivial_assertion` 测试超时等待 5 分钟之久，我们可以暂时降低上述值。

## 自动插入打印信息

我们的 `trivial_assertion` 测试现在需要借助 `serial_print!` 和 `serial_println!` 打印自身信息：

```rust
#[test_case]
fn trivial_assertion() {
    serial_print!("trivial assertion... ");
    assert_eq!(1, 1);
    serial_println!("[ok]");
}
```

手动地为每个编写的测试函数添加这些打印信息是挺麻烦的，所以让我们更新一些 `test_runner` 来实现这些信息的自动打印。首先，我们需要创建一个新的 `Testable` trait：

```rust
// in src/main.rs

pub trait Testable {
    fn run(&self) -> ();
}
```

高端操作为替每个实现 [`Fn()` trait][Fn() trait] 的类型 `T` 实现这个 `Testable` trait：

```rust
// in src/main.rs

impl<T> Testable for T
where
    T: Fn(),
{
    fn run(&self) {
        serial_print!("{}...\t", core::any::type_name::<T>());
        self();
        serial_println!("[ok]");
    }
}
```

`run` 函数首先调用了 [`any::type_name`][any::type_name] 打印函数名。这个函数由编译器直接实现，返回每个类型的字符串描述。对于函数，这个类型就是它们的名字，所以这正是我们当前场景需要的。`\t` 字符是 [制表符][tab]，用于对齐 `[ok]` 信息。

打印函数名之后，我们通过 `self()` 调用测试函数。只有要求 `self` 实现 `Fn()` trait 之后这项操作才是可行的。函数返回后，我们打印 `[ok]` 提示函数没有 panic。

最后一步是更新 `test_runner` 函数使用 `Testable` trait：

```rust
// in src/main.rs

#[cfg(test)]
pub fn test_runner(tests: &[&dyn Testable]) {
    serial_println!("Running {} tests", tests.len());
    for test in tests {
        test.run(); // new
    }
    exit_qemu(QemuExitCode::Success);
}
```

两个主要变化分别是 `tests` 参数的类型从 `&[&dyn Fn()]` 变成了 `&[&dyn Testable]`，和调用方法从 `test()` 变为 `test.run()`

由于打印语句会自动执行，现在可以删除 trivial_assertion 测试函数的的它们了：

```rust
// in src/main.rs

#[test_case]
fn trivial_assertion() {
    assert_eq!(1, 1);
}
```

cargo test 命令的输出目前变成了一下样子：

```bash
Running 1 tests
blog_os::trivial_assertion...	[ok]
```

现在的函数名包含函数的完整路径，有助于区分不同模块的同名函数。其他方面和以前一样，只是我们不用再手动地为测试函数添加打印语句了。

## 测试 VGA 缓冲区

一个可行的测试框架到手，我们可以创建一些测试函数评估为 VGA 缓冲区的实现了。首先，我们创建一个超简单的测试来验证 `println` 正常运行而不会panic：

```rust
// in src/vga_buffer.rs

#[cfg(test)]
use crate::{serial_print, serial_println};

#[test_case]
fn test_println_simple() {
    serial_print!("test_println... ");
    println!("test_println_simple output");
    serial_println!("[ok]");
}
```

这个测试所做的仅仅是将一些内容打印到 VGA 缓冲区。如果它正常结束并且没有 panic，也就意味着 `println` 调用也没有panic。

为了确保即使打印很多行且有些行超出屏幕的情况下也没有 panic 发生，我们创建另一个测试：

```rust
// in src/vga_buffer.rs

#[test_case]
fn test_println_many() {
    serial_print!("test_println_many... ");
    for _ in 0..200 {
        println!("test_println_many output");
    }
    serial_println!("[ok]");
}
```

我们还可以创建另一个测试函数，来验证打印的几行字符是否真的出现在了屏幕上：

```rust
// in src/vga_buffer.rs

#[test_case]
fn test_println_output() {
    let s = "Some test string that fits on a single line";
    println!("{}", s);
    for (i, c) in s.chars().enumerate() {
        let screen_char = WRITER.lock().buffer.chars[BUFFER_HEIGHT - 2][i].read();
        assert_eq!(char::from(screen_char.ascii_character), c);
    }

    serial_println!("[ok]");
}
```

该函数定义了一个测试字符串，并借助 `println` 打印它，然后遍历静态 `WRITER` 也就是 VGA 文本缓冲区的屏幕字符。由于 `println` 在将字符串打印到屏幕上最后一行后，然后立刻附加一个新行（即输出完后有一个换行符），所以这个字符串应该会出现在第 `BUFFER_HEIGHT - 2` 行。

借助 [`enumerate`][enumerate] 统计迭代次数 `i`，然后用它来加载对应于 `c` 的屏幕字符。通过比较屏幕字符的 `ascii_character` 和 `c`，我们可以确保字符串的每个字符确实出现在 VGA 文本缓冲区。

如你所想，我们可以创建更多的测试函数：例如一个用来测试当打印一个很长行而不会 panic，且会正确换行。或是一个用于测试换行符、不可打印字符、非unicode 字符能被正确处理的函数。

在这篇文章的剩余部分，我们还会解释如何创建 *集成测试* 以测试不同组件之间的交互。 

## 集成测试

Rust 的 [集成测试][integration tests] 约定是将所有测试代码放到项目根目录的 `tests` 文件夹下(即 `src` 的同级目录)。默认测试框架和自定义测试框架都将自动选取并执行该目录下所有的测试。

所有的集成测试都有自己的可执行文件，并且与我们的 `main.rs` 完全独立。这也就意味着每个测试都需要定义它们自己的函数入口点。让我们创建一个名为 `basic_boot` 的例子来看看集成测试的工作细节吧:

```rust
// in tests/basic_boot.rs

#![no_std]
#![no_main]
#![feature(custom_test_frameworks)]
#![test_runner(crate::test_runner)]
#![reexport_test_harness_main = "test_main"]

use core::panic::PanicInfo;

#[no_mangle] // don't mangle the name of this function
pub extern "C" fn _start() -> ! {
    test_main();

    loop {}
}

fn test_runner(tests: &[&dyn Fn()]) {
    unimplemented!();
}

#[panic_handler]
fn panic(info: &PanicInfo) -> ! {
    loop {}
}
```

由于集成测试都是单独的可执行文件，所以我们需要再次提供所有 crate 属性(`no_std`, `no_main`, `test_runner`, 等等)。我们还需要创建一个新的入口函数 `_start`，用于调用测试入口函数 `test_main`。因为集成测试的二进制文件在非测试模式下根本不会被编译构建，所以我们不需要任何的 `cfg(test)` 属性。 

这里我们采用 [`unimplemented`][unimplemented] 宏，充当 `test_runner` 暂未实现的占位符，添加简单的 `loop {}` 循环，作为 `panic` 处理函数的内容。理想情况下，我们希望能和 `main.rs` 一样借助 `serial_println` 宏和 `exit_qemu` 函数来实现这个函数。但问题在于这些测试的构建和 `main.rs` 的可执行文件是完全独立的，我们没有办法使用这些函数。

如果现在就运行 `cargo test`，我们将进入一个无限循环，因为目前 panic 的处理就是进入无限循环。我们需要使用快捷键 `Ctrl+c`，才可以退出 QEMU。

### 创建一个库

为了让集成测试能够使用依赖的函数，我们需要从 `main.rs` 分离出一个库，这个库应当可以被其他的 crate 和集成测试可执行文件使用。因此，我们创建如下新文件 `src/lib.rs`：

```rust
// src/lib.rs

#![no_std]

extern crate rlibc;
```

和 `main.rs` 一样，`lib.rs` 也是一个可以被 cargo 自动识别的特殊文件。该库是一个独立的编译单元，所以需要为其再次指定 `#![no_std]` 属性并添加 `external crate libc` 语句。

为了让我们的库可以和 `cargo test` 一起协同工作，我们还需要添加以下测试函数和属性:

```rust
// in src/lib.rs

#![cfg_attr(test, no_main)]
#![feature(custom_test_frameworks)]
#![test_runner(crate::test_runner)]
#![reexport_test_harness_main = "test_main"]

use core::panic::PanicInfo;

pub trait Testable {
    fn run(&self) -> ();
}

impl<T> Testable for T
where
    T: Fn(),
{
    fn run(&self) {
        serial_print!("{}...\t", core::any::type_name::<T>());
        self();
        serial_println!("[ok]");
    }
}

pub fn test_runner(tests: &[&dyn Testable]) {
    serial_println!("Running {} tests", tests.len());
    for test in tests {
        test.run();
    }
    exit_qemu(QemuExitCode::Success);
}

pub fn test_panic_handler(info: &PanicInfo) -> ! {
    serial_println!("[failed]\n");
    serial_println!("Error: {}\n", info);
    exit_qemu(QemuExitCode::Failed);
    loop {}
}

/// Entry point for `cargo test`
#[cfg(test)]
#[no_mangle]
pub extern "C" fn _start() -> ! {
    test_main();
    loop {}
}

#[cfg(test)]
#[panic_handler]
fn panic(info: &PanicInfo) -> ! {
    test_panic_handler(info)
}
```

为了能在可执行文件和集成测试使用 `test_runner`，我们没有为其添加 `cfg(test)` 属性，并将其设置为公有函数。同时，我们还将 panic 的处理程序分解为公有函数 `test_panic_handler`，这样一来它也可以用于可执行文件了。

由于 `lib.rs` 是独立于 `main.rs` 进行测试的，因此当该库在测试模式下编译时需要添加一个 `_start` 入口函数和一个 panic 处理程序。借助 [`cfg_attr`][cfg_attr] 可以在这种情况下有条件地启用 `no_main` 属性。


我们还将 `QemuExitCode` 枚举类型和 `exit_qemu` 函数从 `main.rs` 挪过来，并将其设置为公有类型：

```rust
// in src/lib.rs

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
#[repr(u32)]
pub enum QemuExitCode {
    Success = 0x10,
    Failed = 0x11,
}

pub fn exit_qemu(exit_code: QemuExitCode) {
    use x86_64::instructions::port::Port;

    unsafe {
        let mut port = Port::new(0xf4);
        port.write(exit_code as u32);
    }
}
```

现在，可执行文件和集成测试都可以从库导入这些函数，而不需要实现自己的定义。为了使 `println` 和 `serial_println` 可用，我们将以下的模块声明代码也移动到 `lib.rs`：

```rust
// in src/lib.rs

pub mod serial;
pub mod vga_buffer;
```

我们将这些模块设置为公有，使得外部代码也可以使用。由于这两者都用了该模块内的 `_print` 函数，所以这也是让 `println` 和 `serial_println` 宏可用的必要条件。

现在我们修改 `main.rs` 的代码来使用该库:

```rust
// src/main.rs

#![no_std]
#![no_main]
#![feature(custom_test_frameworks)]
#![test_runner(blog_os::test_runner)]
#![reexport_test_harness_main = "test_main"]

use core::panic::PanicInfo;
use blog_os::println;

#[no_mangle]
pub extern "C" fn _start() -> ! {
    println!("Hello World{}", "!");

    #[cfg(test)]
    test_main();

    loop {}
}

/// This function is called on panic.
#[cfg(not(test))]
#[panic_handler]
fn panic(info: &PanicInfo) -> ! {
    println!("{}", info);
    loop {}
}

#[cfg(test)]
#[panic_handler]
fn panic(info: &PanicInfo) -> ! {
    blog_os::test_panic_handler(info)
}
```

可以看到，这个库用起来就像一个普通的外部 crate。它的调用方法与其它 crate 无异，当前场景下 crate 名为 `blog_os`。上述代码的 `test_runner` 属性使用了 `blog_os::test_runner` 函数，`cfg(test)` 修饰的的 panic 处理函数使用了 `blog_os::test_panic_handler` 函数。它还导入了 `println` 宏，这样一来，我们可以在 `_start` 和 `panic` 使用它了。

与此同时，`cargo run` 和 `cargo test` 可以再次正常工作了。当然了，`cargo test` 仍然会进入无限循环（可以通过 `ctrl+c` 退出）。接下来让我们在集成测试中借助所需要的库函数来修复这个问题吧。

### 完成集成测试

就像 `src/main.rs`，`tests/basic_boot.rs` 可执行文件同样可以从新库导入类型。这也就意味着我们可以导入缺失的组件来完成测试。

```rust
// in tests/basic_boot.rs

#![test_runner(blog_os::test_runner)]

#[panic_handler]
fn panic(info: &PanicInfo) -> ! {
    blog_os::test_panic_handler(info)
}
```

这里使用我们库的 `test_runner` 函数，而不是重新实现一个 test runner。至于 panic 处理，调用 `blog_os::test_panic_handler` 函数即可，就像我们之前在 `main.rs` 里面做的一样。

现在，`cargo test`又可以正常退出了。运行该命令时，会发现它为我们的` lib.rs`, `main.rs`, 和 `basic_boot.rs` 分别构建并运行了测试。其中，对于 `main.rs` 和 `basic_boot` 的集成测试，它会报告 "Running 0 tests"，因为这些文件里面没有任何用 `#[test_case]` 标注的函数。

现在我们可以在 `basic_boot.rs` 添加测试了。举个例子，我们可以测试 `println` 能够正常工作而不 panic，就像我们之前在 VGA 缓冲区测试做的那样:

```rust
// in tests/basic_boot.rs

use blog_os::{println, serial_print, serial_println};

#[test_case]
fn test_println() {
    serial_print!("test_println... ");
    println!("test_println output");
    serial_println!("[ok]");
}
```

现在运行 `cargo test`，我们可以看到它会寻找并执行这些测试函数。

由于该测试和 VGA 缓冲区测试几乎完全相同，所以目前它看起来似乎没什么用。然而，将来 `main.rs` 和 `lib.rs` 的 `_start` 函数的内容会不断增长，并且在运行 `test_main` 之前需要调用一系列的初始化例程，所以这两个测试将会运行在完全不同的环境中。 

`basic_boot` 环境下，在不调用任何初始化例程的 `_start` 函数中测试 `println`函数，我们可以确保 `println` 在启动后可以正常工作。这一点非常重要，因为我们有很多部分依赖于 `println`，例如打印 panic 信息。

### 未来的测试

集成测试的强大之处在于，它们被看成是完全独立的可执行文件。这也给予它们完全控制环境的能力，使得他们能够测试代码和 CPU 或是其他硬件的交互是否正确。

我们的 `basic_boot` 测试是一个非常简单的集成测试样例。将来的内核的功能会变得更多，和硬件交互的方式也会变得多样。通过添加集成测试，我们可以保证这些交互按预期工作（并一直工作）。下面是一些对于未来测试的设想:

- **CPU异常**：当代码执行非法操作（例如除以零）时，CPU 会抛出异常。内核可以为这些异常注册处理函数。集成测试可以验证在 CPU 异常时是否调用了正确的异常处理程序，或者异常解决之后程序是否能继续执行
- **页表**：页表定义有效且可访问的内存区域。通过修改页表，可以重新分配新的内存区域，例如，当你启动一个软件的时候。集成测试可以在 `_start` 函数中更改页表，并在 `#[test_case]` 函数中确认这些更改产生了预期效果
- **用户空间程序**：用户空间程序是只能访问有限的系统资源的程序。例如，他们无法访问内核数据结构或是其他应用程序的内存。集成测试可以启动执行禁止操作的用户空间程序，以验证内核阻止全部相关操作。

可以想象，我们还会编写更多测试。添加各种各样的测试可以确保在内核添加新功能或是重构代码时，我们不会意外地破坏现有特性。这一点在我们的内核变得更大和更复杂的时候显得尤为重要。

### 那些应该 panic 的测试

标准库的测试框架支持[`#[should_panic]` 属性][should_panic attribute]，这个属性允许构造预期失败的测试。这个功能对于验证传递无效参数时函数是否会失败非常有用。不幸的是，这个属性需要标准库的支持，因此，在 `#[no_std]` 环境下无法使用。


尽管我们不能在内核中使用 `#[should_panic]` 属性，但是可以创建这样一个集成测试达到类似的效果--从 panic 处理程序中返回一个成功错误代码。接下来让我们创建一个如上所述名为 `should_panic` 的测试吧：

```rust
// in tests/should_panic.rs

#![no_std]
#![no_main]

use core::panic::PanicInfo;
use blog_os::{QemuExitCode, exit_qemu, serial_println};

#[panic_handler]
fn panic(_info: &PanicInfo) -> ! {
    serial_println!("[ok]");
    exit_qemu(QemuExitCode::Success);
    loop {}
}
```

这个测试还不完整，因为它尚未定义 `_start` 函数或是其他自定义的 test runner 属性。让我们来补充缺少的内容吧：

```rust
// in tests/should_panic.rs

#![feature(custom_test_frameworks)]
#![test_runner(test_runner)]
#![reexport_test_harness_main = "test_main"]

#[no_mangle]
pub extern "C" fn _start() -> ! {
    test_main();

    loop {}
}

pub fn test_runner(tests: &[&dyn Fn()]) {
    serial_println!("Running {} tests", tests.len());
    for test in tests {
        test();
        serial_println!("[test did not panic]");
        exit_qemu(QemuExitCode::Failed);
    }
    exit_qemu(QemuExitCode::Success);
}
```

没有复用 `lib.rs` 的 `test_runner`，这个测试定义了自己的 `test_runner` 函数，在测试退出没有触发 panic 时返回一个错误状态码（因为这里我们希望测试会 panic）。如果没有定义测试函数，runner 就会以一个成功错误码退出。由于这个 runner 总是在执行完单个的测试就退出，因此没必要定义多个 `#[test_case]` 函数。

现在我们来创建一个应该失败的测试:

```rust
// in tests/should_panic.rs

use blog_os::serial_print;

#[test_case]
fn should_fail() {
    serial_print!("should_fail... ");
    assert_eq!(0, 1);
}
```

该测试用 `assert_eq` 来断言 `0` 和 `1` 是否相等。毫无疑问，这当然会失败，所以测试会按预期 panic。

通过 `cargo test --test should_panic` 运行该测试时，我们会发现成功了--该测试如预期那样 panic 了。将断言部分注释掉，我们就会发现测试失败并返回了 *"test did not panic"* 的信息。

这种方法的缺点是它只适用于单个测试函数。对于多个 `#[test_case]` 函数，因为程序无法在 panic 处理器被调用后继续执行，所以只有第一个函数会被执行。我目前没有想到解决这个问题的好方法，如果你有任何想法，请务必告诉我！

### 无约束测试

对于那些只有单个测试函数的集成测试而言(例如我们的 `should_panic` 测试函数)，其实并不需要 test runner。对于这类情况，我们可以完全禁用 test runner，直接在 `_start` 函数直接运行我们的测试。

这里的关键就是在 `Cargo.toml` 为测试禁用 `harness` 标识。这个标识符决定 runner 是否用于集成测试。如果该标志位被设置为 `false`，那么默认的 test runner 和自定义的 test runner 功能都被禁用，这样一来该测试就会像一个普通的可执行程序般运行了。

现在让我们为 `should_panic` 测试禁用 `harness` 标识吧：

```toml
# in Cargo.toml

[[test]]
name = "should_panic"
harness = false
```

现在我们通过移除 test runner 相关的代码，大大简化 `should_panic` 测试。结果看起来如下：

```rust
// in tests/should_panic.rs

#![no_std]
#![no_main]

use core::panic::PanicInfo;
use blog_os::{QemuExitCode, exit_qemu, serial_println};

#[no_mangle]
pub extern "C" fn _start() -> ! {
    should_fail();
    serial_println!("[test did not panic]");
    exit_qemu(QemuExitCode::Failed);
    loop{}
}

fn should_fail() {
    serial_print!("should_fail... ");
    assert_eq!(0, 1);
}

#[panic_handler]
fn panic(_info: &PanicInfo) -> ! {
    serial_println!("[ok]");
    exit_qemu(QemuExitCode::Success);
    loop {}
}
```

现在我们可以通过 `_start` 函数直接调用 `should_fail` 函数，如果成功返回，则返回一个失败退出代码码并退出。现在执行 `cargo test --test should_panic` 可以发现测试的行为和之前完全一样。

除了创建 `should_panic` 测试，禁用 `harness` 属性对复杂集成测试也很有用，例如，单个测试函数会产生一些副作用并且需要以特定顺序执行。

## 总结

测试是一种非常有用的技能，能确保特定部件的行为符合预期。即使它们不能证明没有 bug，它们仍然是查 bug 的利器，尤其用来避免回归。

本文讲述了如何为我们的 Rust 内核搭建一个测试框架。我们使用 Rust 的自定义框架功能为裸机环境实现了一个简单的 `#[test_case]` 属性支持。通过使用 QEMU 的 `isa-debug-exit` 设备，我们的 test runner 可以在运行测试后退出 QEMU 并报告测试状态。我们还为串行端口实现一个简单的驱动，使得错误信息可以被打印到控制台而不是 VGA 缓冲区。

为 `println` 宏创建了一些测试后，我们在本文的后半部分还探索了集成测试。我们了解到它们位于 `tests` 目录，并被视为完全独立的可执行文件。为了使他们能够使用 `exit_qemu` 函数和 `serial_println` 宏，我们将大部分代码迁移到一个库，使其能够被导入到所有可执行文件和集成测试。集成测试在各自独立的环境运行，所以能够测试与硬件的交互或是创建应该 panic 的测试函数。

我们现在有了一个在 QEMU 内部真实环境运行的测试框架。在未来的文章里，我们会创建更多测试，从而让内核在变得更复杂的同时保持可维护性。

## 下期预告

下一篇文章将会探索 *CPU异常*。这些异常将在一些非法事件发生时由 CPU 抛出，例如除零或是访问没有映射的内存页（通常也被称为 “page fault” 即缺页异常）。能够捕获和检查这些异常，对将来的调试来说是非常重要的。异常处理与支持键盘输入所需的硬件中断处理十分相似。

[ACPI]: https://wiki.osdev.org/ACPI
[APM]: https://wiki.osdev.org/APM
[A Minimal Rust Kernel]: /2020/07/17/blog-os-02-a-minimal-rust-kernel/
[A Minimal Rust Kernel - sets a default target]: /2020/07/17/blog-os-02-a-minimal-rust-kernel/#设置默认目标
[A Minimal Rust Kernel - using cargo run]: /2020/07/17/blog-os-02-a-minimal-rust-kernel/#使用-cargo-run
[Fn()]: https://doc.rust-lang.org/std/ops/trait.Fn.html
[Fn() trait]: https://doc.rust-lang.org/stable/core/ops/trait.Fn.html
[Integration Tests]: https://os.phil-opp.com/integration-tests/
[Port]: https://docs.rs/x86_64/0.12.1/x86_64/instructions/port/struct.Port.html
[SSH]: https://en.wikipedia.org/wiki/Secure_Shell
[UARTs]: https://en.wikipedia.org/wiki/Universal_asynchronous_receiver-transmitter
[UART models]: https://en.wikipedia.org/wiki/Universal_asynchronous_receiver-transmitter#UART_models
[Unit Testing]: https://os.phil-opp.com/unit-testing/
[VGA text buffer]: /2020/07/23/blog-os-03-vga-text-mode

[any::type_name]: https://doc.rust-lang.org/stable/core/any/fn.type_name.html
[bootimage config]: https://github.com/rust-osdev/bootimage#configuration
[built-in test framework]: https://doc.rust-lang.org/book/second-edition/ch11-00-testing.html
[cargo issue#7359]: https://github.com/rust-lang/cargo/issues/7359
[cfg_attr]: https://doc.rust-lang.org/reference/conditional-compilation.html#the-cfg_attr-attribute
[conditional compilation]: https://doc.rust-lang.org/1.30.0/book/first-edition/conditional-compilation.html
[custom_test_frameworks]: https://doc.rust-lang.org/unstable-book/language-features/custom-test-frameworks.html
[enumerate]: https://doc.rust-lang.org/core/iter/trait.Iterator.html#method.enumerate
[exit status]: https://en.wikipedia.org/wiki/Exit_status
[github blog-os]: https://github.com/phil-opp/blog_os
[integration tests]: https://doc.rust-lang.org/book/ch11-03-test-organization.html#integration-tests
[list of x86 I/O ports]: https://wiki.osdev.org/I/O_Ports#The_list
[serial port]: https://en.wikipedia.org/wiki/Serial_port
[should_panic]: https://doc.rust-lang.org/book/ch11-01-writing-tests.html#checking-for-panics-with-should_panic
[should_panic attribute]: https://doc.rust-lang.org/rust-by-example/testing/unit_testing.html#testing-panics
[slice]: https://doc.rust-lang.org/std/primitive.slice.html
[tab]: https://en.wikipedia.org/wiki/Tab_key#Tab_characters
[test crate]: https://doc.rust-lang.org/test/index.html
[trait object]: https://doc.rust-lang.org/1.30.0/book/first-edition/trait-objects.html
[unimplemented]: https://doc.rust-lang.org/core/macro.unimplemented.html
[utest]: https://github.com/japaric/utest
[valine]: #valine
[vga lazy-static]: /2020/07/23/blog-os-03-vga-text-mode/#延迟初始化

[04-testing]: https://github.com/sammyne/blog-os-cn/tree/master/04-testing
[16550 UART]: https://en.wikipedia.org/wiki/16550_UART

[`fmt::Write`]: https://doc.rust-lang.org/nightly/core/fmt/trait.Write.html
[`x86_64`]: https://docs.rs/x86_64/0.12.1/x86_64/
[`uart_16550`]: https://docs.rs/uart_16550
