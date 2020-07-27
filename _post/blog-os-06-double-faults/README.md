---
title: "[blog os] 06. 二级异常"
date: 2020-07-27
categories:
  - os
  - blog_os
tags:
  - rust
---

本文深入探究 CPU 调用异常处理函数失败时触发的二级异常。处理这种异常能够避免导致系统重置的、不可恢复的 *三级异常*。为了避免所有情况下的三级异常，我们配置一个 *中断栈表* 用于在独立的内核栈上捕获二级异常。

<!-- more -->

这文章开源在 [Github] 上。如果你有任何问题或疑问的话，请在那里打开一个 issue。这篇文章的完整源代码参见 @TODO（补充地址）。


<!-- toc -->

## 什么是二级异常

简而言之，二级异常是一种特殊的异常，在 CPU 调用异常处理函数失败时触发。例如，缺页异常出现后，[中断描述符表][IDT] 没有注册哦人的缺页异常处理函数。所以，这个编程语言的所有异常捕获块类似，例如 C++ 的 `catch(...)` 或 Java/C# 的 `catch(Exception e)`。


二级异常和常规异常表现类似。它的向量值为 `8`，我们可以在 IDT 中为其定义常规异常处理函数。因为如果没有处理的二级异常会触发不可恢复的 *三级异常*，所以设置二级异常处理函数是非常重要的。三级异常无法被捕获，大多数硬件都会以系统重置的方式响应。

### 触发二级异常

让我们试着通过触发没有定义处理函数的异常来引发一个二级异常：

```rust
// in src/main.rs

#[no_mangle]
pub extern "C" fn _start() -> ! {
    println!("Hello World{}", "!");

    blog_os::init();

    // trigger a page fault
    unsafe {
        *(0xdeadbeef as *mut u64) = 42;
    };

    // as before
    #[cfg(test)]
    test_main();

    println!("It did not crash!");
    loop {}
}
```

我们使用 `unsafe` 在非法地址 `0xdeadbeef` 执行写入操作。虚拟地址没有映射到页表的物理地址，所以缺页异常触发。我们没有在 [IDT] 注册缺页异常处理函数，所以二级异常触发。

现在启动内核会发现内核会不断重启。不断重启的原因如下：
1. CPU 试图往地址 `0xdeadbeef` 写入值，触发缺页异常
2. CPU 查看 IDT 的相应表项，发现没有相应的处理函数。因此，无法调用缺页异常处理函数，二级异常触发
3. CPU 查看 IDT 表项中的二级异常处理函数，但是这个表项也没有注明处理函数。因此，*三级* 异常触发
4. 三级异常是不可恢复的。QEMU 像大多数硬件那样响应，触发系统重置

所以，为了防止触发三级异常，我们要么为缺页异常提供处理函数，要么为二级异常提供处理函数。我们想要避免所有情况下的三级异常，所以让我们创建一个二级异常处理函数，用于处理所有未处理异常。

## 二级异常处理函数

二级异常是一个附带错误码的常规异常，所以我们可以注册一个类似断点处理函数的处理函数：

```rust
// in src/interrupts.rs

lazy_static! {
    static ref IDT: InterruptDescriptorTable = {
        let mut idt = InterruptDescriptorTable::new();
        idt.breakpoint.set_handler_fn(breakpoint_handler);
        idt.double_fault.set_handler_fn(double_fault_handler); // new
        idt
    };
}

// new
extern "x86-interrupt" fn double_fault_handler(
    stack_frame: &mut InterruptStackFrame, _error_code: u64) -> !
{
    panic!("EXCEPTION: DOUBLE FAULT\n{:#?}", stack_frame);
}
```

处理函数打印一条简单的错误信息，显示异常的栈帧。二级异常的错误码总是 0，所以没有必要打印它。和断点处理函数不同的是二级异常处理函数时 [*发散*][diverging] 的。原因是 `x86_64` 架构不允许从二级异常处理函数返回。


现在启动内核应该能够看到二级异常处理函数被调用了：

![QEMU 显示 `EXCEPTION: DOUBLE FAULT` 和异常栈帧](./images/qemu-catch-double-fault.png)

跑通了！这次发生的事情如下：

1. CPU 试图往地址 `0xdeadbeef` 写入值，触发缺页异常
2. CPU 查看 IDT 的相应表项，发现没有相应的处理函数。因此，无法调用缺页异常处理函数，二级异常触发
3. CPU 跳转到现在存在的二级异常处理函数

由于 CPU 现在调用二级异常处理函数，三级异常（和不断重启）不再触发。

看起来不难呀！那为啥我们还需要为这个主题一大篇文章呢？虽然我们现在可以捕获 *大部分* 二级异常，但是还有些情况是我们目前的方法没有覆盖到的。

## 二级异常的原因

查看特殊情况前，我们需要知道二级异常发生的确切原因。之前，我们的定义比较宽泛：

> 二级异常是一种特殊的异常，在 CPU 调用异常处理函数失败时触发。

*“调用失败”* 是什么意思？处理函数不存在？处理函数被 [换出][swapped out] 了 CPU？处理函数自身出发了异常又会怎样？


例如，以下情况出现时会发生什么事：

1. 断点异常触发，但是对应的处理函数被换出了 CPU？
2. 缺页异常触发，但是缺页异常处理函数被换出了 CPU？
3. 除零异常导致断点异常，但是断点处理函数被换出了 CPU？
4. 内核栈溢出，触及了 *防护页*？

好在 AMD64 指南（[PDF][AMD64 manual]）有一个确切的定义（在 8.2.9 节）。根据指南，“处理之前（第一个）异常过程中触发了第二个异常可以触发二级异常”。这个 *“可以”* 很重要：只有非常特定的一场组合才能导致二级异常。具体组合如下：


| 第一个异常                                                                                                            | 第二个异常                                                                                                        |
| --------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| [Divide-by-zero],<br>[Invalid TSS],<br>[Segment Not Present],<br>[Stack-Segment Fault],<br>[General Protection Fault] | [Invalid TSS],<br>[Segment Not Present],<br>[Stack-Segment Fault],<br>[General Protection Fault]                  |
| [Page Fault]                                                                                                          | [Page Fault],<br>[Invalid TSS],<br>[Segment Not Present],<br>[Stack-Segment Fault],<br>[General Protection Fault] |

[Divide-by-zero]: https://wiki.osdev.org/Exceptions#Divide-by-zero_Error
[Invalid TSS]: https://wiki.osdev.org/Exceptions#Invalid_TSS
[Segment Not Present]: https://wiki.osdev.org/Exceptions#Segment_Not_Present
[Stack-Segment Fault]: https://wiki.osdev.org/Exceptions#Stack-Segment_Fault
[General Protection Fault]: https://wiki.osdev.org/Exceptions#General_Protection_Fault
[Page Fault]: https://wiki.osdev.org/Exceptions#Page_Fault

[AMD64 manual]: https://www.amd.com/system/files/TechDocs/24593.pdf

所以，除零异常紧跟缺页异常没事（缺页异常处理函数会被调用），但是除零异常紧跟通用保护异常则会导致二级异常。

借助这个表格，我们可以回答上述问题中的前三个：

1. 如果断点异常出现，并且对应的处理函数被换出了，*缺页异常* 触发，缺页异常处理函数被调用
2. 如果缺页异常触发，缺页异常处理函数被换出，*二级异常* 触发，*二级异常处理* 函数被调用
3. 如果除零异常处理函数触发断点异常，CPU 会试图调用断点处理函数。如果断点处理函数被换出，则 *缺页异常* 触发，*缺页异常处理函数* 被调用

事实上，IDT 没有异常处理函数的异常也会遵循这样的规则：当异常触发时，CPU 试图读取相应的 IDT 表项。由于表项为 0，不是合法的 IDT 表项，一个 *通用保护异常* 触发。如果我们没有为通用异常定义处理函数的话，另一个通用保护异常触发。由表可得，这会导致二级异常。

#### 内核栈溢出

接着看一下第四个问题：

> 内核栈溢出，触及了 *防护页*？

防护页是栈空间底部的一个特殊内存页，用于监测栈溢出的情况。这一页不会映射到物理帧，所以访问它会触发缺页异常而不是静叽叽第污染其他内存。引导器为我们的内核栈配置了防护页，所以栈溢出会触发 *缺页异常*。

缺页异常出现时，CPU 在 IDT 中查找缺页异常处理函数，并试图把 [中断栈帧][interrupt stack frame] 压入栈。然而，当前栈指针依然指向不存在的防护页。因此，第二个缺页异常触发，进而触发二级异常（由表可得）。


现在 CPU 试图调用 *二级异常处理* 函数了。但是，CPU 也会为二级异常压入异常栈帧。栈指针依然指向不存在的防护页，所以 *第三个* 缺页异常触发，从而触发 *三级异常* 和系统重启。因此，我们当前的二级异常处理函数无法在这种情况下避免三级异常。

让我们动手试一下！调用无限递归的函数很容触发内核栈溢出：

```rust
// in src/main.rs

#[no_mangle] // don't mangle the name of this function
pub extern "C" fn _start() -> ! {
    println!("Hello World{}", "!");

    blog_os::init();

    fn stack_overflow() {
        stack_overflow(); // for each recursion, the return address is pushed
    }

    // trigger a stack overflow
    stack_overflow();

    […] // test_main(), println(…), and loop {}
}
```

在 QEMU 再尝试这份代码可以看到系统再次进入不断重启的状态。

这样的话，我们要如何解决这个问题呢？因为异常栈帧是被 CPU 自动压入的，所以无法屏蔽压入操作。所以我们需要以某种方式确保二级异常出现时栈总是合法的。好在 x86_64 架构为这个问题提供了解决方案。

## 切换栈

异常触发时，x86_64 架构可以切换到一个预定义的、已知良好的栈。这个切换发生在硬件级别，所以可以在 CPU 压入异常栈帧前执行。

切换机制实现为一个 *中断栈表*（IST）。IST 是执行已知良好的栈的 7 个指针表。用 Rust 伪代码表示为：

```rust
struct InterruptStackTable {
    stack_pointers: [Option<StackPointer>; 7],
}
```

对于每个异常处理函数，我们可以为其从 IST 选择一个要切换到的栈，注明在对应 [IDT 表项][IDT entry] 的 `stack_pointers` 字段。例如，我们可以为二级异常选用 IST 的第一个栈。这样每次二级异常触发时 CPU 就会自动切换到这个栈。这个切换会在所有东西压栈前发生，所以能够防止三级异常。


### IST 和 TSS

中断栈表（IST）是一个称为 [任务状态段][Task State Segment] （TSS）的旧结构的一部分。TSS 用于保存关于 32 位模式下任务的多个信息（例如，处理寄存器状态），用作硬件上下文切换等场景。然而，64 位模式不再支持硬件上下文切换，TSS 的格式也变得面目全非了。

[Task State Segment]: https://en.wikipedia.org/wiki/Task_state_segment
[hardware context switching]: https://wiki.osdev.org/Context_Switching#Hardware_Context_Switching

x86_64 架构下，TSS 不再保存任何任务相关信息。取而代之，它保存了两个栈表（IST 是其中一个）。32 和 64 位模式下 TSS 的仅有共同字段是 [I/O 端口权限位图][I/O port permissions bitmap] 的指针。


64 位的 TSS 格式如下：

|                  字段 | 类型       |
| --------------------: | :--------- |
|              （预留） | `u32`      |
|              特权栈表 | `[u64; 3]` |
|              （预留） | `u64`      |
| Interrupt Stack Table | `[u64; 7]` |
|              （预留） | `u64`      |
|              （预留） | `u16`      |
|        I/O 映射基地址 | `u16`      |

特权级别变化时，CPU 会用到特权栈表。例如，CPU 在用户模式下（特权级别 3）触发异常时，CPU 通常会在调用异常处理函数前切换到内核模式（特权级别 0）。那种情况下，CPU 会切换到特权栈表的第 0 个栈（因为 0 是目标特权级别）。我们还没有任何用户模式程序，所以可以暂且忽略这个表。

### 创建 TSS

让我们创建一个新的 TSS，在其中断栈表中嵌入一个独立的二级异常栈。为此，我们需要一个 TSS 结构体。好在 `x86_64` 包已经定义了可用的 [`TaskStateSegment` 结构体][`TaskStateSegment` struct]。


我们在新的 `gdt` 模块创建 TSS（名字后续解释）：

```rust
// in src/lib.rs

pub mod gdt;

// in src/gdt.rs

use x86_64::VirtAddr;
use x86_64::structures::tss::TaskStateSegment;
use lazy_static::lazy_static;

pub const DOUBLE_FAULT_IST_INDEX: u16 = 0;

lazy_static! {
    static ref TSS: TaskStateSegment = {
        let mut tss = TaskStateSegment::new();
        tss.interrupt_stack_table[DOUBLE_FAULT_IST_INDEX as usize] = {
            const STACK_SIZE: usize = 4096;
            static mut STACK: [u8; STACK_SIZE] = [0; STACK_SIZE];

            let stack_start = VirtAddr::from_ptr(unsafe { &STACK });
            let stack_end = stack_start + STACK_SIZE;
            stack_end
        };
        tss
    };
}
```

因为 Rust 的 const 表达式尚未强大到支持在编译时执行这些初始化操作，所以我们使用了 TODO。我们把第 0 个 IST 表项定义为二级异常栈（其他 IST 索引也是可以的）。然后往第 0 项写入二级异常栈。写入的是高地址是因为 x86 的栈是往下扩展的，即从高地址到低地址。

我们还没有实现内存管理，所以没有合适的方法来分配一个新的栈。暂且用一个 `static mut` 数组作为栈存储空间。因为编译器无法保证访问可变静态变量时没有竞争状态，所以 `unsafe` 是必要的。重要的一点是数组是 `static mut` 而不是不可变的 `static`，否则引导器会将其映射到只读页。我们会在后续文章用合适的栈分配替换上述方案，到那时就不再需要 `unsafe` 了。

需要注意的是这个二级异常栈没有防护页用于防止栈溢出。这就是说我们不应该在二级异常处理函数中执行任何很费栈空间的事情，否则栈底下的内存可能会由于栈溢出被污染。

#### 加载 TSS

新的 TSS 创建出来了，我们需要一种方法告诉 CPU 使用它。但是由于（历史原因）TSS 采用分段系统，所以操作起来比较麻烦。我们需要往 [全局描述符表][Global Descriptor Table]（GDT）添加一个新的段选择符，而不是直接加载这个表。然后以相应的 GDT 索引调用 [`ltr` 指令][`ltr` instruction] 来加载 TSS。（这也是我们将模块命名为 `gdt` 的原因）


### 全局描述符表

在分页称为事实上的标准前，全局描述符表（GDT）是用于 [内存分段][memory segmentation] 的历史遗留产物。64 位模式下仍然在内核/用户模式配置和 TSS 加载等方面用到它。


GDT 是包含程序的 *段空间* 的结构。分页成为标准前，它在旧架构中用于隔离程序。更多分段详情参见免费的 [“Three Easy Pieces” 一书][“Three Easy Pieces” book] 相同命名的章节。虽然 64 位模式不再支持分段，但是 GDT 依然存在，它常见用途有两个：内核空间和用户空间的切换，加载 TSS 结构。


#### 创建 GDT

让我们创建一个静态的 `GDT`，包含一段静态的 `TSS`：

```rust
// in src/gdt.rs

use x86_64::structures::gdt::{GlobalDescriptorTable, Descriptor};

lazy_static! {
    static ref GDT: GlobalDescriptorTable = {
        let mut gdt = GlobalDescriptorTable::new();
        gdt.add_entry(Descriptor::kernel_code_segment());
        gdt.add_entry(Descriptor::tss_segment(&TSS));
        gdt
    };
}
```

因为 Rust 的常量表达式还不足够强大，所以 `lazy_static` 再次被用上。我们创建用一个代码段和 TSS 段创建了一个新的 GDT。

#### 加载 GDT

为了加载 GDT，我们创建一个新的 `gdt::init` 函数，会被 `init` 函数调用：

```rust
// in src/gdt.rs

pub fn init() {
    GDT.load();
}

// in src/lib.rs

pub fn init() {
    gdt::init();
    interrupts::init_idt();
}
```

现在 GDT 被加载了（因为 `_start` 函数调用了 `init`），但是依然栈溢出导致不断重启。

### 最后一步

问题出在由于段寄存器和 TSS 寄存器依然存储旧 GDT 的值，我们的 GDT 段尚未激活。我们还需要修改二级异常的 IDT 表项，让其使用新的栈。

总而言之，我们只需要执行以下操作：
1. **重新加载代码段寄存器**：我们更改了 GDT，所以需要重新加载代码段寄存器 `cs`。因为旧的段选择器现在可能指向一个不同的 GDT 描述符（例如一个 TSS 描述符），所以这项操作是必要的
2. **加载 TSS**：虽然我们加载了包含 TSS 选择器的 GDT，但是仍然需要告诉 CPU 去使用那个 TSS
3. **更新 IDT 表项**：加载了 TSS 后，CPU 能够访问一个合法的中断栈表（IST）。然后通过修改二级异常 IDT 表项来告诉 CPU 这时应该使用新的二级异常栈了。

前两步需要访问到 `gdt::init` 函数中的 `code_selector` 和 `tss_selector` 变量。为此，我们将它们变成新的 `Selectors` 结构的一部分：

```rust
// in src/gdt.rs

use x86_64::structures::gdt::SegmentSelector;

lazy_static! {
    static ref GDT: (GlobalDescriptorTable, Selectors) = {
        let mut gdt = GlobalDescriptorTable::new();
        let code_selector = gdt.add_entry(Descriptor::kernel_code_segment());
        let tss_selector = gdt.add_entry(Descriptor::tss_segment(&TSS));
        (gdt, Selectors { code_selector, tss_selector })
    };
}

struct Selectors {
    code_selector: SegmentSelector,
    tss_selector: SegmentSelector,
}
```

Now we can use the selectors to reload the `cs` segment register and load our `TSS`:

```rust
// in src/gdt.rs

pub fn init() {
    use x86_64::instructions::segmentation::set_cs;
    use x86_64::instructions::tables::load_tss;

    GDT.0.load();
    unsafe {
        set_cs(GDT.1.code_selector);
        load_tss(GDT.1.tss_selector);
    }
}
```

使用 [`set_cs`] 加载代码段寄存器，使用 [`load_tss`] 加载 TSS。函数标识为 `unsafe`，所以需要用 `unsafe` 块包裹它们。原因是加载非法的选择器可能会破坏内存安装。


加载了合法的 TSS 和中断栈表后，我们现在可以设置 IDT 里的二级异常处理函数的栈索引了：

```rust
// in src/interrupts.rs

use crate::gdt;

lazy_static! {
    static ref IDT: InterruptDescriptorTable = {
        let mut idt = InterruptDescriptorTable::new();
        idt.breakpoint.set_handler_fn(breakpoint_handler);
        unsafe {
            idt.double_fault.set_handler_fn(double_fault_handler)
                .set_stack_index(gdt::DOUBLE_FAULT_IST_INDEX); // new
        }

        idt
    };
}
```

因为调用者必须确保使用的索引是合法的且尚未被其他异常使用，所以 `set_stack_index` 方法是不安全的。

这样就够了！无论何时触发二级异常，现在 CPU 应该都能切换到二级异常栈。因此，我们能够捕获到 *所有* 二级异常，包括内核栈溢出了。

![QEMU 打印 `EXCEPTION: DOUBLE FAULT` 并输出异常栈帧](./images/qemu-double-fault-on-stack-overflow.png)

从此以后，我们应该绝不会再看到三级异常了。为了确保不会无意破坏这点，我们应该为其添加个测试函数。

## 栈溢出测试

为了测试新的 `gdt` 模块，确保栈溢出时正常调用二级异常处理函数，我们可以添加一个集成测试。基本做法是在测试函数里面触发二级异常，然后验证二级异常处理函数被调用了。

让我们先搭个框：

```rust
// in tests/stack_overflow.rs

#![no_std]
#![no_main]

use core::panic::PanicInfo;

#[no_mangle]
pub extern "C" fn _start() -> ! {
    unimplemented!();
}

#[panic_handler]
fn panic(info: &PanicInfo) -> ! {
    blog_os::test_panic_handler(info)
}
```

和 `panic_handler` 测试类似，这个测试 [不需要借助 test harness][without a test harness] 运行。理由是二级异常触发后程序无法继续执行，所以多个测试用处不大。为测试禁用 test harness，在 `Cargo.toml` 添加一下片段：

```toml
# in Cargo.toml

[[test]]
name = "stack_overflow"
harness = false
```


现在执行 `cargo test --test stack_overflow` 应该能够成功编译。由于 `unimplemented` 宏触发 panic，所以测试必然失败。

### 实现 `_start`

`_start` 函数的实现如下：

```rust
// in tests/stack_overflow.rs

use blog_os::serial_print;

#[no_mangle]
pub extern "C" fn _start() -> ! {
    serial_print!("stack_overflow::stack_overflow...\t");

    blog_os::gdt::init();
    init_test_idt();

    // trigger a stack overflow
    stack_overflow();

    panic!("Execution continued after stack overflow");
}

#[allow(unconditional_recursion)]
fn stack_overflow() {
    stack_overflow(); // for each recursion, the return address is pushed
    volatile::Volatile::new(0).read(); // prevent tail recursion optimizations
}
```

调用 `gdt::init` 函数来初始化一个新的 GDT。我们调用紧接会解释的 `init_test_idt` 函数而不是 `interrupts::init_idt` 函数。理由是我们想要注册一个自定义的二级异常处理函数，这个函数调用 `exit_qemu(QemuExitCode::Success)` 而不是 panic。

`stack_overflow` 函数和 `main.rs` 的几乎完全一样。仅有的区别是我们使用 [`Volatile`] 类型在函数末尾执行额外的 [易变][volatile] 读操作，来避免编译器成为 [*尾部调用消除*][tail call elimination] 的优化。除了其他操作，这个优化允许编译器把最后语句位递归函数调用的函数转化为一个常规循环。这样的话，函数调用就不会触发额外栈帧的分配，也就使得栈使用率保持不变了。


当前场景下，我们需要栈溢出，所以在函数末尾添加一个随意的易变读操作，使得编译器无法移除。这样一来，函数就不再 *尾部递归*，也就避免了到循环的转换。我们还添加 `allow(unconditional_recursion)` 属性用于沉默编译关于函数无限递归的警告。

### 测试的 IDT

如上所述，测试需要附带自定义二级异常处理函数的 IDT。具体实现如下：

```rust
// in tests/stack_overflow.rs

use lazy_static::lazy_static;
use x86_64::structures::idt::InterruptDescriptorTable;

lazy_static! {
    static ref TEST_IDT: InterruptDescriptorTable = {
        let mut idt = InterruptDescriptorTable::new();
        unsafe {
            idt.double_fault
                .set_handler_fn(test_double_fault_handler)
                .set_stack_index(blog_os::gdt::DOUBLE_FAULT_IST_INDEX);
        }

        idt
    };
}

pub fn init_test_idt() {
    TEST_IDT.load();
}
```

这个实现和 `interrupts.rs` 的常规 IDT 非常类似。和常规 IDT 类似，我们为二级异常处理函数在 IST 设置栈索引，用于切换到独立的栈。`init_test_idt` 函数借助 `load` 方法把 IDT 加载到 CPU。

### 二级异常处理函数

二级异常处理函数是缺的最后一块了。实现如下：

```rust
// in tests/stack_overflow.rs

use blog_os::{exit_qemu, QemuExitCode, serial_println};
use x86_64::structures::idt::InterruptStackFrame;

extern "x86-interrupt" fn test_double_fault_handler(
    _stack_frame: &mut InterruptStackFrame,
    _error_code: u64,
) -> ! {
    serial_println!("[ok]");
    exit_qemu(QemuExitCode::Success);
    loop {}
}
```

二级异常处理函数调用时，我们以成功状态码退出 QEMU，标记测试通过。由于集成测试时完全独立的可执行文件，我们需要在测试文件的顶部设置 `#![feature(abi_x86_interrupt)]` 属性。


现在通过 `cargo test --test stack_overflow` 命令执行测试（或者 `cargo test` 命令执行所有测试）。如预期那样，我们在控制台可以看到 `stack_overflow... [ok]` 输出。尝试注释掉 `set_stack_index` 行：它应该会触发测试失败。

## 总结
通过本文，我们了解到二级异常的定义及其触发条件。我们添加一个基本的二级异常处理函数，在函数内打印出错误信息，并为其添加一个集成测试。

我们还实现了二级异常时支持硬件切换栈，使其在栈溢出时仍能工作。实现过程中，我们学习了任务状态段（TSS），内置的中断栈表（IST）和用于旧架构实现分段的全局描述符表（GDT）。

## 下篇预告

下篇文章将会讲解如何出阿里来自计时器、键盘和网络控制器等外部设备的中断。这些硬件中断和异常非常类似，例如它们通过 IDT 分发。但是和异常不同的是，他们不是由 CPU 直接触发的。*中断控制器* 收集这些中断并根据优先级把他们推送给 CPU。下篇文章将会探索 [Intel 8259]（“PIC”）中断控制器，并学习如何实现键盘支持。 

[diverging]: https://doc.rust-lang.org/stable/rust-by-example/fn/diverging.html
[GitHub]: https://github.com/phil-opp/blog_os
[Global Descriptor Table]: http://www.flingos.co.uk/docs/reference/Global-Descriptor-Table/
[Intel 8259]: https://en.wikipedia.org/wiki/Intel_8259
[interrupt stack frame]: @/second-edition/posts/05-cpu-exceptions/index.md#the-interrupt-stack-frame
[IDT]: @/second-edition/posts/05-cpu-exceptions/index.md#the-interrupt-descriptor-table
[IDT entry]: @/second-edition/posts/05-cpu-exceptions/index.md#the-interrupt-descriptor-table
[I/O port permissions bitmap]: https://en.wikipedia.org/wiki/Task_state_segment#I.2FO_port_permissions
[memory segmentation]: https://en.wikipedia.org/wiki/X86_memory_segmentation
[swapped out]: http://pages.cs.wisc.edu/~remzi/OSTEP/vm-beyondphys.pdf
[tail call elimination]: https://en.wikipedia.org/wiki/Tail_call
[volatile]: https://en.wikipedia.org/wiki/Volatile_(computer_programming)
[without a test harness]: @TODO

[`load_tss`]: https://docs.rs/x86_64/0.11.1/x86_64/instructions/tables/fn.load_tss.html
[`ltr` instruction]: https://www.felixcloutier.com/x86/ltr
[`set_cs`]: https://docs.rs/x86_64/0.11.1/x86_64/instructions/segmentation/fn.set_cs.html
[`TaskStateSegment` struct]: https://docs.rs/x86_64/0.11.1/x86_64/structures/tss/struct.TaskStateSegment.html
[`Volatile`]: https://docs.rs/volatile/0.2.6/volatile/struct.Volatile.html

[“Three Easy Pieces” book]: http://pages.cs.wisc.edu/~remzi/OSTEP/
