---
title: "[blog os] 05. CPU 异常"
date: 2020-07-27
categories:
- os
tags:
- blog_os
- rust
---

> 原文：[CPU Exceptions](https://os.phil-opp.com/cpu-exceptions/)

CPU 异常会在多种出错情况下出现，例如访问非法内存地址或者除 0。为了处理这些异常，我们需要设置好提供处理函数的 *中断描述符表*。本文结束之后，我们的内核应该能够捕获 [断点异常][breakpoint exception]，并恢复继续执行。

[breakpoint exception]: https://wiki.osdev.org/Exceptions#Breakpoint

<!-- more -->

此博客在 [GitHub][github blog-os] 上公开开发。如果您有任何问题或疑问，请在此处打开一个问题。 您也可以在 [底部][valine] 发表评论。这篇文章的完整源代码可以在 [blog-os-cn/05-cpu-exceptions][05-cpu-exceptions] 找到。

## 概览
异常说明当前指令工作不正常。例如，CPU 会在当前指令试图除零时抛出一个异常。异常出现后，CPU 中断手头工作，根据异常类型立即调用特定的异常处理函数。

x86 架构大约有 20 种不同类型的 CPU 异常。其中最重要的是：

- **缺页异常**：非法内存访问会触发缺页异常。例如，当前指令试图读取没有映射的页或者写入只读页面
- **非法操作码**：当前指令异常会触发这个异常，例如在不支持 [SSE 指令][SSE instructions] 的旧版 CPU 使用这些指令
- **通用保护异常**：这是诱因最多的异常类型，会在多种非法访问时触发，例如用户代码试图执行特权指令或者往配置寄存器的预留字段写入
- **二级异常**：异常触发时，CPU 会尝试调用相应的处理函数。如果 *在调用这个异常处理函数* 过程中又触发了异常，CPU 会抛出二级异常。触发的异常没有相应的处理函数时也会抛出这个异常
- **三级异常**：如果 *在调用二级异常处理函数* 过程中又触发了异常，CPU 会抛出严重的 *三级异常*。我们无法捕获或处理三级异常。大多数处理器的处理方式为重置或重启操作系统

完整的异常列表参见 [OSDev wiki][exceptions]。

### 中断描述符表

为了捕获和处理异常，我们需要配置一个称为 *中断描述符表*（IDT）的结构。我们在表里面设定每种 CPU 异常的处理函数。硬件会直接使用这个表，所以要求我们遵循预定义格式。每个表项必须符合以下 16 字节的结构：

| 类型 | 名称             | 含义                                                   |
| ---- | ---------------- | ------------------------------------------------------ |
| u16  | 函数指针 [0:15]  | 处理函数指针的低位                                     |
| u16  | GDT 选择器       | [全局描述符表][global descriptor table] 代码段的选择符 |
| u16  | 选项             | 往下看                                                 |
| u16  | 函数指针 [16:31] | 处理函数指针的中位                                     |
| u32  | 函数指针 [32:63] | 处理函数指针的高位                                     |
| u32  | 预留             |


选项字段的格式如下：

| 位    | 名称                  | 含义                                                         |
| ----- | --------------------- | ------------------------------------------------------------ |
| 0-2   | 中断栈表索引          | 0：不要切换栈 ，1-7：这个处理函数调用时切换到栈表的第 n 个栈 |
| 3-7   | 预留                  |
| 8     | 0：中断门，1：陷入门  | 这位为 0 时，处理函数调用时禁止中断                          |
| 9-11  | 必须为 0              |
| 12    | 必须为 0              |
| 13-14 | 描述符特权级别（DPL） | 调用这个处理函数所需的最小特权级别                           |
| 15    | 存在                  |

每种异常都有预定义的 IDT 索引。例如，非法操作码异常表项索引为 6，缺页异常表项索引为 14。因此，硬件可以为每种异常自动加载对应的 IDT 表项。OSDev wiki 的 [异常表][exceptions] 在 “Vector nr.” 列展示了所有异常的索引。

异常触发时，CPU 大致会执行以下操作：
1. 将某些寄存器入栈，包括指令指针和 [RFLAGS] 寄存器（我们会在本文的后续部分用到）
2. 从 IDT 读取对应的表项。例如，缺页异常时 CPU 会读取第 14 个表项
3. 检查表项是否存在。如果不存在则抛出二级异常
4. 如果表项对应一个中断门（第 40 位没有设置），禁用硬件中断
5. 加载特定的 [GDT] 选择器到 CS 段
6. 跳转到指定的处理函数


暂且不用纠结第 4 和第 5 步，我们会在后续文章学到全局描述符表和硬件中断的知识。

## IDT 类型
与其创建自己的 IDT 类型，我们直接使用 `x86_64` 包的 [`InterruptDescriptorTable` 结构体][InterruptDescriptorTable struct]，形式如下：

``` rust
#[repr(C)]
pub struct InterruptDescriptorTable {
    pub divide_by_zero: Entry<HandlerFunc>,
    pub debug: Entry<HandlerFunc>,
    pub non_maskable_interrupt: Entry<HandlerFunc>,
    pub breakpoint: Entry<HandlerFunc>,
    pub overflow: Entry<HandlerFunc>,
    pub bound_range_exceeded: Entry<HandlerFunc>,
    pub invalid_opcode: Entry<HandlerFunc>,
    pub device_not_available: Entry<HandlerFunc>,
    pub double_fault: Entry<HandlerFuncWithErrCode>,
    pub invalid_tss: Entry<HandlerFuncWithErrCode>,
    pub segment_not_present: Entry<HandlerFuncWithErrCode>,
    pub stack_segment_fault: Entry<HandlerFuncWithErrCode>,
    pub general_protection_fault: Entry<HandlerFuncWithErrCode>,
    pub page_fault: Entry<PageFaultHandlerFunc>,
    pub x87_floating_point: Entry<HandlerFunc>,
    pub alignment_check: Entry<HandlerFuncWithErrCode>,
    pub machine_check: Entry<HandlerFunc>,
    pub simd_floating_point: Entry<HandlerFunc>,
    pub virtualization: Entry<HandlerFunc>,
    pub security_exception: Entry<HandlerFuncWithErrCode>,
    // some fields omitted
}
```

字段类型为 [`idt::Entry<F>`][idt::Entry]，是一个代表 IDT 表项字段的结构体（如上表）。类型参数 `F` 定义预期的处理函数类型，可以看到，有些表项需要 [`HandlerFunc`][HandlerFunc]，另一些则需要 [`HandlerFuncWithErrCode`][HandlerFuncWithErrCode]。缺页异常甚至有专用的 [`PageFaultHandlerFunc`][PageFaultHandlerFunc] 类型。

我们先看看 `HandlerFunc` 类型：

```rust
type HandlerFunc = extern "x86-interrupt" fn(_: &mut InterruptStackFrame);
```

它是 `extern "x86-interrupt" fn` 类型的 [别名][type alias]。`extern` 关键字定义这个函数使用 [外部调用风格][foreign calling convention]，通常用于和 C 代码交互（`extern "C" fn`）。这个 `x86-interrupt` 调用风格又是什么鬼？

## 中断调用风格
异常处理和函数调用非常类似：CPU 跳转到被调函数的第一个指令，然后执行它。完成后，CPU 跳转到返回地址，继续执行父函数。

然而，异常和函数调用的一个主要区别是：函数调用由编译器插入 `call` 指令自愿调用，而异常则在 *任何* 指令执行时都可能触发。为了理解这种区别的后果，我们需要更加深入地了解一下函数调用。

[调用风格][Calling conventions] 规定函数调用的细节。例如，它们规定函数参数的存放位置（例如，寄存器或栈），以及结果如何存储。在 x86_64 Linux 上，C 函数会采用以下调用风格（在 [System V ABI] 有说明）

- 前 6 个整数参数传入寄存器 `rdi`、`rsi`、`rdx`、`rcx`、`r8` 和 `r9`
- 额外参数传到栈上
- 结果返回到 `rax` 和 `rdx`

需要注意的是 Rust 没有遵循 C ABI（事实上，[Rust 目前甚至没有 ABI][rust abi]），所以上述规则只适用于声明为 `extern "C" fn` 的函数。

### 保留和暂存寄存器

调用风格将寄存器分为两类：*保留* 和 *暂存* 寄存器。

*保留* 寄存器在函数调用间必须保持不变，所以被调函数（*callee*）只允许在返回前还原它们原始值的情况下覆写这些寄存器。因此，这些寄存器被称为 “callee-saved”。常见模式为在函数开头将这些寄存器保存到栈上，然后在函数返回前还原它们。

相反，被调函数可以不受限制地覆写 *暂存* 寄存器。调用者如果想要跨函数调用过程保留暂存寄存器的值，需要备份并在函数调用前还原它们的值（例如，把他们压入栈）。所以暂存寄存器被 *调用者负责保存的（caller-saved）*。

在 x86_64 架构下，C 调用风格规定以下保留和暂存寄存器：

| 保留寄存器                                      | 暂存寄存器                                                  |
| ----------------------------------------------- | ----------------------------------------------------------- |
| `rbp`, `rbx`, `rsp`, `r12`, `r13`, `r14`, `r15` | `rax`, `rcx`, `rdx`, `rsi`, `rdi`, `r8`, `r9`, `r10`, `r11` |
| _callee-saved_                                  | _caller-saved_                                              |

编译器知晓这些规则，所以它会生成相应的代码。例如，大部分函数都会以 `push rbp` 开始，把 `rbp` 备份到栈上（因为这是个 callee-saved 寄存器）。

### 保留所有寄存器

和函数调用不同，异常在 *任何* 指令执行时都有可能发生。大部分情况下，我们在编译时甚至不知道产出的代码是否会触发异常。例如，编译器不知道一个指令是否会触发栈溢出或缺页异常。

由于不知道异常的发生时间，我们无法在这之前备份。这意味着异常处理函数无法使用依赖 caller-saved 寄存器的调用风格。我们需要的是一个会保留 *所有寄存器* 的调用风格。`x86-interrupt` 调用风格正是我们所需，它保证函数返回时所有寄存器都会还原到它们的原始值。

需要注意的是不是说所有寄存器都会在进入函数时保存到栈上。而是编译器只会备份被函数覆写过的寄存器。这样一来，只用少量寄存器的函数就会产出非常高效的代码。

### 中断栈帧

常规函数调用时（使用 `call` 指令），CPU 在跳转到目标函数前往栈压入返回地址。一旦函数返回（使用 `ret` 指令），CPU 会把这个返回地址出栈，跳转到它那里。所以，常规函数调用的栈帧如下：

![函数栈帧](./images/function-stack-frame.svg)

对于异常和中断处理函数，因为中断处理函数通常在不同上下文（栈指针，CPU 标识符等）运行，压入返回地址是不够的。CPU 会在中断出现时执行以下操作：

1. **对齐栈指针**：任何指令都可能触发中断，所以栈指针的值是不定的。然而，一些 CPU 指令（例如，某些 SSE 指令）要求栈指针对齐到 16 字节，因此 CPU 在中断之前会执行对齐操作
2. **切换栈**（某些情况下）：CPU 特权级别变化会触发栈切换，例如出现在用户模式程序的 CPU 异常。借助所谓的 *中断栈表*（下篇文章描述） 为特定中断配置栈切换也是可能的
3. **压入旧的栈指针**：中断发生后、对齐操作前，CPU 会把栈指针（`rsp`）和栈段（`ss`）压入栈。这样就可以在中断处理函数返回后还原原本的栈指针了
4. **压入并更新 `RFLAGS` 寄存器**：[`RFLAGS`] 寄存器保存多个控制和状态位。进入中断时，CPU 会改变某些位并压入旧值
5. **压入指令指针**：跳转到中断处理函数前，CPU 会把指令指针（`rip`）和代码段（`cs`）压入栈。这可以类比到常规函数调用时压入返回地址
6. **压入错误码**（为某些异常）：对于某些诸如缺页异常的特定异常，CPU 会往栈压入错误码，描述异常原因
7. **调用中断处理函数**：CPU 从 IDT 的对应字段读入中断处理函数的地址和段描述符。然后把值加载到 `rip` 和 `cs` 寄存器后调用这个处理函数

[`RFLAGS`]: https://en.wikipedia.org/wiki/FLAGS_register

因此，一个中断栈帧的格式如下：

![中断栈帧](./images/exception-stack-frame.svg)

`x86_64` 包中，中断栈帧用 [`InterruptStackFrame`] 结构体表示。它以 `&mut` 的形式传给中断处理函数，可用于提取异常原因的更多信息。由于只有少数异常会压入错误码，所以这个结构体没有包含错误码字段。需要错误码的异常使用 [`HandlerFuncWithErrCode`] 函数类型，这个函数类型有一个额外的 `error_code` 参数。

### 底层

`x86-interrupt` 调用风格是一个非常强大的抽象，隐藏了异常处理流程的几乎全部乱七八糟的细节。然而，有时了解一些背后的原理也不坏。以下是 `x86-interrupt` 调用风格负责的一些工作的概览：

- **提取参数**：大多数调用风格期望参数会传入寄存器。这对异常处理函数来说是不可能的，因为我们在把他们备份到栈上前必须不能覆盖任何寄存器的值。`x86-interrupt` 调用风格知道参数已经在栈的特定偏移处
- **使用指令 `iretq` 返回**：由于中断栈帧和常规函数的完全不同，我们无法用 `ret` 指令从中断处理函数返回。必须使用的指令是 `iretq`
- **处理错误码**：某些异常压入的错误码使得情况要复杂很多。它改变了栈的对齐（继续看下一点）并且需要在返回前出栈。`x86-interrupt` 调用风格处理了所有这些复杂流程。然而，它依然不知道每种异常对应的处理函数，需要程序猿负责为每种异常使用正确的函数类型。好在，`x86_64` 包定义的 `InterruptDescriptorTable` 表确保了正确的函数类型
- **对齐栈**：某些指令（尤其是 SSE 指令）要求 16 字节对齐的栈。CPU 在每次异常触发时能够确保这一点，但是某些异常后续压入错误码时会再次破坏对齐结构。`x86-interrupt` 调用风格负责在这种情况下重新对齐栈。

如需更多细节：我们在 [文章末尾][too-much-magic] 贴了一系列使用 [裸函数][naked functions] 解释异常处理的文章链接。

## 实现

了解理论之后，现在可以动手在我们的内核处理 CPU 异常了。首先在 `src/interrupts.rs` 文件创建一个新的中断模块，这个文件会创建一个 `init_idt` 函数用于新建一个新的 `InterruptDescriptorTable`：

``` rust
// in src/lib.rs

pub mod interrupts;

// in src/interrupts.rs

use x86_64::structures::idt::InterruptDescriptorTable;

pub fn init_idt() {
    let mut idt = InterruptDescriptorTable::new();
}
```

现在我们可以添加处理函数了。首先为 [断点异常][breakpoint exception] 添加处理函数。断点异常是测试异常处理的完美选择。它的唯一作用是断点异常指令 `int3` 执行时临时暂停程序运行。

断点异常通常用于调试器：用户设置断点时，调试器用 `int3` 指令覆盖对应的指令，使得 CPU 运行到这一行时抛出断点异常。用户想要继续执行程序时，调试器再次把 `int3` 指令换回原始指令，使得程序继续执行。更多细节参见 [*调试是如何工作的*][How debuggers work] 系列文章。

当前场景不需要覆写任何指令。只是想要断点指令执行时打印一条信息然后继续执行程序。所以，让我们创建一个简单的 `breakpoint_handler` 函数，并将其添加到 IDT：

```rust
// in src/interrupts.rs

use x86_64::structures::idt::{InterruptDescriptorTable, InterruptStackFrame};
use crate::println;

pub fn init_idt() {
    let mut idt = InterruptDescriptorTable::new();
    idt.breakpoint.set_handler_fn(breakpoint_handler);
}

extern "x86-interrupt" fn breakpoint_handler(
    stack_frame: &mut InterruptStackFrame)
{
    println!("EXCEPTION: BREAKPOINT\n{:#?}", stack_frame);
}
```

我们的处理函数只是打印一条信息，并以美化风格打印中断栈帧。

尝试编译会触发以下错误：

```bash
error[E0658]: x86-interrupt ABI is experimental and subject to change (see issue #40180)
  --> src/main.rs:53:1
   |
53 | / extern "x86-interrupt" fn breakpoint_handler(stack_frame: &mut InterruptStackFrame) {
54 | |     println!("EXCEPTION: BREAKPOINT\n{:#?}", stack_frame);
55 | | }
   | |_^
   |
   = help: add #![feature(abi_x86_interrupt)] to the crate attributes to enable
```

错误原因为 `x86-interrupt` 调用风格仍然是不稳定的。不管三七二十一的话，我们必须显示在 `lib.rs` 头部添加 `#![feature(abi_x86_interrupt)]` 来启用它。

### 加载 IDT

为了使 CPU 使用新的中断描述符表，我们需要通过 [`lidt`] 指令加载它。`x86_64` 包的 `InterruptDescriptorTable` 结构体提供一个 [`load`][InterruptDescriptorTable::load] 函数，用于实现这个目标。让我们试试看：

```rust
// in src/interrupts.rs

pub fn init_idt() {
    let mut idt = InterruptDescriptorTable::new();
    idt.breakpoint.set_handler_fn(breakpoint_handler);
    idt.load();
}
```

现在编译会触发以下错误：

```bash
error: `idt` does not live long enough
  --> src/interrupts/mod.rs:43:5
   |
43 |     idt.load();
   |     ^^^ does not live long enough
44 | }
   | - borrowed value only lives until here
   |
   = note: borrowed value must be valid for the static lifetime...
```

`load` 方法期望一个 `&'static self` 的引用，这个引用在程序的整个运行时都是合法的。原因是除非加载一个不同的 IDT，否则每次中断时 CPU 都会访问这个表。所以，使用比 `'static` 更短的生命期会触发释放后继续使用的 bug。

这正是目前事实上正在发生的问题。我们的 `idt` 在栈上创建出来，所以只会在 `init` 函数内有效。函数返回后，栈内存被释放掉用于其他函数，所以 CPU 可能会把随机的栈内存看做 IDT。好在 `InterruptDescriptorTable::load` 方法把这个对生命期的要求编码在了函数的定义中，使得 Rust 编译器能够在编译时避免这个潜在的 bug。

为了解决这个问题，我们需要把 `idt` 保存在生命期为 `'static` 的位置。为此，可以借助 [`Box`] 在堆上分配一个 IDT，然后将其转化为一个 `'static` 引用，但是我们还在编写一个内核，还没有堆这种说法。

另一种方法是把 IDT 保存为 `static` 变量：

```rust
static IDT: InterruptDescriptorTable = InterruptDescriptorTable::new();

pub fn init_idt() {
    IDT.breakpoint.set_handler_fn(breakpoint_handler);
    IDT.load();
}
```

然后还是有问题：静态变量是不可变的，所以我们无法在 `init` 函数中更改断点入口函数。我们可以使用 [`static mut`] 来解决这个问题：

```rust
static mut IDT: InterruptDescriptorTable = InterruptDescriptorTable::new();

pub fn init_idt() {
    unsafe {
        IDT.breakpoint.set_handler_fn(breakpoint_handler);
        IDT.load();
    }
}
```

这种方法编译没问题，但是和习惯用法很不一样。`static mut` 非常容易导致数据竞争，所以每次访问都需要用 [`unsafe` 块][`unsafe` block] 包裹。

#### 救命的 Lazy Statics
好在我们还有 `lazy_static` 宏。这个宏不是在编译时确定 `static` 变量值，而会在 `static` 变量第一次被使用时初始化这个变量。因此，我们几乎可以在初始化代码块里面做任何事，甚至读取运行时的值。

在 [抽象 VGA 文本缓冲区][vga text buffer lazy static] 一文，我们已经导入了 `lazy_static`，所以可以直接使用 `lazy_static!` 宏来创建静态的 IDT：

```rust
// in src/interrupts.rs

use lazy_static::lazy_static;

lazy_static! {
    static ref IDT: InterruptDescriptorTable = {
        let mut idt = InterruptDescriptorTable::new();
        idt.breakpoint.set_handler_fn(breakpoint_handler);
        idt
    };
}

pub fn init_idt() {
    IDT.load();
}
```

值得注意的是这个方案不需要 `unsafe` 块。`lazy_static!` 宏底层确实使用了 `unsafe`，但是抽象掉了这些细节并提供了安全的接口。

### 运行它

让异常能够在我们内核正常工作的最后一步是在 `main.rs` 调用 `init_idt` 函数。我们没有直接调用 `init_idt`，而是在 `lib.rs` 引入了通用的 `init` 函数：

```rust
// in src/lib.rs

pub fn init() {
    interrupts::init_idt();
}
```

这个函数作为初始化例程的集中地，可以在 `main.rs`、`lib.rs` 和集成测试等不同的 `_start` 函数中共享。

现在可以更新 `main.rs` 的 `_start` 函数，调用 `init`，然后触发断点异常了：

```rust
// in src/main.rs

#[no_mangle]
pub extern "C" fn _start() -> ! {
    println!("Hello World{}", "!");

    blog_os::init(); // new

    // invoke a breakpoint exception
    x86_64::instructions::interrupts::int3(); // new

    // as before
    #[cfg(test)]
    test_main();

    println!("It did not crash!");
    loop {}
}
```

现在在 QEMU 内运行（使用 `cargo run`）可以看到如下输出：

![QEMU 显示 `EXCEPTION: BREAKPOINT` and the interrupt stack frame](./images/qemu-breakpoint-exception.png)

跑通了！CPU 成功地调用了我们的断点处理函数，将信息打印到屏幕然后返回到 `_start` 函数，后续打印出 `It did not crash!` 消息。

可以看到中断栈帧告诉了我们异常触发时的具体指令和栈指针。这些信息对于调试非预期异常非常有用。

### 添加测试

让我们创建一个测试，确认上述代码会一直工作。首先，更新 `_start` 函数调用 `init`：

```rust
// in src/lib.rs

/// Entry point for `cargo test`
#[cfg(test)]
#[no_mangle]
pub extern "C" fn _start() -> ! {
    init();      // new
    test_main();
    loop {}
}
```

记住，因为 Rust 会分别独立测试 `lib.rs` 和 `main.rs`，所以运行 `cargo test --lib` 时会用到这个 `_start` 函数。这里我们需要在运行测试前调用 `init` 配置好 IDT。

现在我们可以创建如下测试函数 `test_breakpoint_exception`：

```rust
// in src/interrupts.rs

#[test_case]
fn test_breakpoint_exception() {
    // invoke a breakpoint exception
    x86_64::instructions::interrupts::int3();
}
```

测试调用 `int3` 函数触发一个断点异常。通过检查异常处理后会继续执行，我们确认断点处理函数正常工作了。

尝试运行 `cargo test`（所有测试）或 `cargo test --lib`（只测试 `lib.rs` 和它的模块）启动测试，可以看到以下输出：

```bash
blog_os::interrupts::test_breakpoint_exception...	[ok]
```

## 细节过多？

`x86-interrupt` 调用风格和 [InterruptDescriptorTable][InterruptDescriptorTable struct] 类型使得异常处理流程变得非常直接和容易。如果我们还是觉得细节太多并想要自学异常处理的所有底层细节的话，参见 [“使用裸函数处理异常”][Handling Exceptions with Naked Functions] 系列文章。这系列文章讲解如何绕过 `x86-interrupt` 调用风格处理异常，并且创建自己的 IDT 类型。在 `x86-interrupt` 调用风格和 `x86_64` 包出现前，那个系列曾经是异常处理的主要文章。值得注意的是，系列文章基于这个博客的 [第一版][first edition] ，内容可能会过时。

## 下篇预告

我们已经能成功地捕获第一个异常，并从中返回了！未捕获异常会触发无法恢复的 [三级异常][triple fault]，导致系统重置，所以我们的下一个目标是确保捕获到所有异常。下一篇文章讲解如何通过捕获 [二级异常][double faults] 来规避三级异常。

[Calling conventions]: https://en.wikipedia.org/wiki/Calling_convention
[GDT]: https://en.wikipedia.org/wiki/Global_Descriptor_Table
[GitHub]: https://github.com/phil-opp/blog_os
[HandlerFunc]: https://docs.rs/x86_64/0.12.1/x86_64/structures/idt/type.HandlerFunc.html
[HandlerFuncWithErrCode]: https://docs.rs/x86_64/0.12.1/x86_64/structures/idt/type.HandlerFuncWithErrCode.html
[Handling Exceptions with Naked Functions]: @/first-edition/extra/naked-exceptions/_index.md
[How debuggers work]: https://eli.thegreenplace.net/2011/01/27/how-debuggers-work-part-2-breakpoints
[InterruptDescriptorTable struct]: https://docs.rs/x86_64/0.12.1/x86_64/structures/idt/struct.InterruptDescriptorTable.html
[InterruptDescriptorTable::load]: https://docs.rs/x86_64/0.12.1/x86_64/structures/idt/struct.InterruptDescriptorTable.html#method.load
[PageFaultHandlerFunc]: https://docs.rs/x86_64/0.12.1/x86_64/structures/idt/type.PageFaultHandlerFunc.html
[RFLAGS]: https://en.wikipedia.org/wiki/FLAGS_register
[SSE instructions]: https://en.wikipedia.org/wiki/Streaming_SIMD_Extensions
[System V ABI]: https://refspecs.linuxbase.org/elf/x86_64-abi-0.99.pdf

[double faults]: https://wiki.osdev.org/Double_Fault#Double_Fault
[exceptions]: https://wiki.osdev.org/Exceptions
[first edition]: @/first-edition/_index.md
[foreign calling convention]: https://doc.rust-lang.org/nomicon/ffi.html#foreign-calling-conventions
[github blog-os]: https://github.com/phil-opp/blog_os
[global descriptor table]: https://en.wikipedia.org/wiki/Global_Descriptor_Table
[idt::Entry]: https://docs.rs/x86_64/0.12.1/x86_64/structures/idt/struct.Entry.html
[naked functions]: https://github.com/rust-lang/rfcs/blob/master/text/1201-naked-fns.md
[rust abi]: https://github.com/rust-lang/rfcs/issues/600
[too-much-magic]: TODO
[triple fault]: https://wiki.osdev.org/Triple_Fault
[type alias]: https://doc.rust-lang.org/book/ch19-04-advanced-types.html#creating-type-synonyms-with-type-aliases
[valine]: #valine
[vga text buffer lazy static]: /2020/07/23/blog-os-03-vga-text-mode/#延迟初始化

[`Box`]: https://doc.rust-lang.org/std/boxed/struct.Box.html
[`InterruptDescriptorTable`]: https://docs.rs/x86_64/0.12.1/x86_64/structures/idt/struct.InterruptDescriptorTable.html
[`InterruptStackFrame`]: https://docs.rs/x86_64/0.12.1/x86_64/structures/idt/struct.InterruptStackFrame.html

[`lidt`]: https://www.felixcloutier.com/x86/lgdt:lidt
[`static mut`]: https://doc.rust-lang.org/1.30.0/book/second-edition/ch19-01-unsafe-rust.html#accessing-or-modifying-a-mutable-static-variable
[`unsafe` block]: https://doc.rust-lang.org/1.30.0/book/second-edition/ch19-01-unsafe-rust.html#unsafe-superpowers

[05-cpu-exceptions]: https://github.com/sammyne/blog-os-cn/tree/master/05-cpu-exceptions
