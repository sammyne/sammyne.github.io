---
title: "学点 ELF"
date: 2021-07-24
categories:
  - os
tags:
  - linux
  - compiler
---

## 初次见面

ELF 全称叫 Executable and Linkable Format。经常在 Linux 系统开发的小伙伴们应该熟悉 ELF，特别是那些需要了解编译和链接的大神。

本文介绍 Linux 系统编译、链接的基石--ELF 文件。了解这些知识有助于后继续学习编译、链接的底层过程，以及掌握可执行程序在从硬盘加载到内存、一直到 `main` 函数的执行的细节。掌握 ELF 文件的结构和内容是理解编译、链接和程序执行的基础。

文件需要遵守一定的格式，ELF 也不例外。从宏观上看，ELF 可拆卸成以下四个部分：

```
+----------------------+
|       ELF header     |  ELF 头部
+----------------------+
| Program header table |  程序头表
+----------------------+
|       Sections       |  节
+----------------------+
| Section Header table |  节头表
+----------------------+
```

暂时不理解上图的几个概念也没关系，后续部分会逐一说明。

在 Linux 系统中，ELF 文件主要用来表示以下 3 种类型的文件：

- 可执行文件
- 目标文件（`.o`）
- 共享库文件（`.so`）

3 种类型的文件区分通过 ELF 头部的一个字段实现，各自的使用场景分别为：

- 可执行文件：被操作系统的加载器从硬盘读取，载入到内存去执行
- 目标文件：被链接器读取，用来产生可执行文件或者共享库文件
- 共享库文件：在动态链接的时候，由 ld-linux.so 读取

以链接器和加载器为例，两者看待 ELF 文件的姿势是不一样的。

链接器只看到以下 3 部分内容：

```
+----------------------+
|       ELF header     |  ELF 头部
+----------------------+
|          N/A         |  看不到
+----------------------+
|       Sections       |  节
+----------------------+
| Section Header table |  节头表
+----------------------+
```

也就是说，链接器只关心 **ELF 头部**（ELF header）, **节**（Sections） 以及**节头表**（Section header table） 这 3 部分内容。

加载器则看到另外 3 部分内容：

```
+----------------------+
|       ELF header     |  ELF 头部
+----------------------+
| Program header table |  程序头表
+----------------------+
|       Sections       |  节
+----------------------+
|        N/A           |  看不到
+----------------------+
```

加载器只关心 **ELF 头部**, **程序头表**（Program header table）和 **节** 这 3 部分内容。加载器又把中间部分的节叫做**段**（Segments）。可以理解为：一个段可能包含一个或者多个节，就像下面这样：

```
          +----------------------+
          |       ELF header     |
          +----------------------+
+---------+ Program header table |              // 加载器看到一个 Segment
|         +----------------------+
|         | +------------------+ |
|    +------+     .text        +<----------+
+--->+    | +------------------+ |         |
     |    | +------------------+ |         |
     +------+     .rodata      +<----------+
          | +------------------+ |         |
          | +------------------+ |         |
          | |     .data        | |         |
          | +------------------+ |         |
          | +------------------+ |         |
          | |     .bss         | |         |
          | +------------------+ |         |
          +----------------------+         |
          | Section Header table +---------+   // 连接器看到两个 Sections
          +----------------------+
```

这就好比超市里的货架摆放的商品：有矿泉水、可乐、啤酒、巧克力、牛肉干、薯片。从理货员的角度看：它们属于 6 种不同的商品；但是从超市经理的角度看，它们只属于 2 类商品：饮料和零食。

其实只要掌握到 2 点内容就可以了：

- 一个 ELF 文件由 4 个部分组成
- 链接器和加载器使用 ELF 时，只会使用各自感兴趣的部分

## Linux 系统描述 ELF 的数据结构

以下结构均源自文件 [elf(5) — linux manual page]。

```c
#define EI_NIDENT 16

// ELF header
typedef struct {
  unsigned char e_ident[EI_NIDENT];
  uint16_t      e_type;
  uint16_t      e_machine;
  uint32_t      e_version;
  Elf64_Addr    e_entry;
  Elf64_Off     e_phoff;
  Elf64_Off     e_shoff;
  uint32_t      e_flags;
  uint16_t      e_ehsize;
  uint16_t      e_phentsize;
  uint16_t      e_phnum;
  uint16_t      e_shentsize;
  uint16_t      e_shnum;
  uint16_t      e_shstrndx;
} Elf64_Ehdr;

// Program header table
typedef struct {
  uint32_t   p_type;
  uint32_t   p_flags;
  Elf64_Off  p_offset;
  Elf64_Addr p_vaddr;
  Elf64_Addr p_paddr;
  uint64_t   p_filesz;
  uint64_t   p_memsz;
  uint64_t   p_align;
} Elf64_Phdr;

// Section header table
typedef struct {
  uint32_t   sh_name;
  uint32_t   sh_type;
  uint64_t   sh_flags;
  Elf64_Addr sh_addr;
  Elf64_Off  sh_offset;
  uint64_t   sh_size;
  uint32_t   sh_link;
  uint32_t   sh_info;
  uint64_t   sh_addralign;
  uint64_t   sh_entsize;
} Elf64_Shdr;

```

## ELF 头部

ELF 头部相当于是一个总管，决定整个 ELF 文件内部的所有信息，比如：

- 标记这是 ELF 文件
- 一些基本信息：版本，文件类型，机器类型
- 程序头表的开始地址，在整个文件的什么地方
- 节头表的开始地址，在整个文件的什么地方

到目前为止，好像没有说节（从链接器角度看）或者段（从加载器角度看）在 ELF 文件的什么地方。稍安勿躁，快到了~

为了方便描述，后续部分把节和段全部统一称为节。

其实是这样的：一个 ELF 文件存在很多个节，这些节的具体信息由程序头表或者节头表描述。

以节头表为例：假如一个 ELF 文件共存在 4 个 Section--`.text`、`.rodata`、`.data` 和 `.bss`，那么 节头表将会有 4 个表项（Entry）分别描述这 4 节的具体信息（严格来说，除了 4 个表项外还存在一些其他辅助的节），就像下面这样：

```
       +------------------------------+
       |       ELF header             |
       +------------------------------+
       |    Program header table      |
       +------------------------------+
       | +--------------------------+ |
       | |     .text                +<--------+
       | +--------------------------+ |       |
       | +--------------------------+ |       |
       | |     .rodata              +<----+   |
       | +--------------------------+ |   |   |
       | +--------------------------+ |   |   |
    +--->+     .data                | |   |   |
    |  | +--------------------------+ |   |   |
    |  | +--------------------------+ |   |   |
+------->+     .bss                 | |   |   |
|   |  | +--------------------------+ |   |   |
|   |  +------------------------------+   |   |
|   |  | +--------------------------+ |   |   |
|   |  | | entry0: describe .text   +---------+
|   |  | +--------------------------+ |   |
|   |  | +--------------------------+ |   |
|   |  | | entry1: describe .rodata +-----+
|   |  | +--------------------------+ |
|   |  | +--------------------------+ |
|   +----+ entry2: describe .data   | |
|      | +--------------------------+ |
|      | +--------------------------+ |
+--------+ entry3: describe .bss    | |
       | +--------------------------+ |
       +------------------------------+
```

## 示例程序

为了加深理解，这里分析一个具体的代码示例，从字节码的粒度来解剖 ELF 文件结构。

### 环境

|   软件 | 版本  |
| -----: | :---- |
| ubuntu | 20.04 |
|    gcc | 9.3.0 |
|   make | 4.2.1 |

### 演示

程序的功能比较简单：

```
  源文件                 动态库文件
+----------+         +--------------+
| mymath.c +-------->+ libmymath.so +---+
+----------+         +--------------+   |     +------+
                                        +---->+ main |
+----------+         +--------------+   |     +------+
|  main.c  +-------->+    main.o    +---+     可执行文件
+----------+         +--------------+
  源文件                 目标文件
```

```c
// mymath.c
int my_add(int a, int b)
{
  return a + b;
}
```

```c
// main.c
#include <stdio.h>

extern int my_add(int a, int b);

int main()
{
  int i = 1;
  int j = 2;
  int k = my_add(i, j);

  printf("k = %d \n", k);

  return 0;
}
```

```makefile
# makefile

.PHONY: all
all: main libmymath.so

libmymath.so: mymath.c
	gcc $< -fPIC -shared -o $@

main.o: main.c
	gcc -c $< -o $@

main: main.o libmymath.so
	gcc main.o -L. -lmymath -o $@

.PHONY: clean
clean:
	rm *.o *.so main
```

由之前的描述可知：动态库文件 libmymath.so, 目标文件 main.o 和可执行文件 main 都是 ELF 文件，只不过属于不同的类型。

接下来拆解一下可执行文件 main。首先编译生成可执行文件

```bash
make
```

然后用指令 `readelf -h main` 查看 main 文件的 ELF header 的信息。

> readelf 是一个可以好好利用的工具。

```bash
ELF Header:
  Magic:   7f 45 4c 46 02 01 01 00 00 00 00 00 00 00 00 00
  Class:                             ELF64
  Data:                              2's complement, little endian
  Version:                           1 (current)
  OS/ABI:                            UNIX - System V
  ABI Version:                       0
  Type:                              DYN (Shared object file)
  Machine:                           Advanced Micro Devices X86-64
  Version:                           0x1
  Entry point address:               0x1080
  Start of program headers:          64 (bytes into file)
  Start of section headers:          14744 (bytes into file)
  Flags:                             0x0
  Size of this header:               64 (bytes)
  Size of program headers:           56 (bytes)
  Number of program headers:         13
  Size of section headers:           64 (bytes)
  Number of section headers:         31
  Section header string table index: 30
```

上图显示了 ELF 头部描述的所有内容。这个内容与结构体 `Elf64_Ehdr` 的成员变量是一一对应的！

由图可知，第 15 行显示的内容：`Size of this header: 64 (bytes)`，表明 ELF header 部分的内容，一共是 64 字节。接下来我们看看开头的这 64 个字节码。

```bash
od -Ax -t x1 -N 64 main

000000 7f 45 4c 46 02 01 01 00 00 00 00 00 00 00 00 00
000010 03 00 3e 00 01 00 00 00 80 10 00 00 00 00 00 00
000020 40 00 00 00 00 00 00 00 98 39 00 00 00 00 00 00
000030 00 00 00 00 40 00 38 00 0d 00 40 00 1f 00 1e 00
000040
```

简单解释一下 `od` 工具的几个选项：

|     选项 | 说明                                                                         |
| -------: | :--------------------------------------------------------------------------- |
|    `-Ax` | 显示地址的时候，用十六进制来表示。如果使用 `-Ad`，意思就是用十进制来显示地址 |
| `-t -x1` | 显示字节码内容的时候，使用十六进制（`x`），每次显示一个字节（1）             |
|  `-N 64` | 只需要读取 64 个字节                                                         |

这 64 字节的内容可以一一对应到结构体 `Elf64_Ehdr` 的每个字段。

先看字段 `e_ident`,

| 字节下标范围 | 值                     | 说明                                                        |
| ------------ | ---------------------- | ----------------------------------------------------------- |
| 0            | 0x7F                   | 文件标识，必须为 0x7F                                       |
| 1-3          | 0x45 4c 46             | `ELF` 字符串对应的 ASCII 码                                 |
| 4            | 0x02                   | 文件类型，0 表示非法，1 表示 32 位，2 表示 64 位            |
| 5            | 0x01                   | 编码格式，0 表示非法，1 表示小端，2 表示大端                |
| 6            | 0x01                   | 文件版本，0 表示非法，1 表示当前                            |
| 7            | 0x00                   | 标记对象的目标系统和 ABI，0 和 1 均表示 `UNIX System V ABI` |
| 8            | 0x00                   | 标记对象的目标 ABI 版本，具体解析方式依第 7 字节而定        |
| 9-15         | 0x00 00 00 00 00 00 00 | 填充字节                                                    |

详情参见 [官方文档][elf(5) — linux manual page]。

关于大端、小端格式，这个 `main` 文件显示的是 1，代表小端格式。啥意思呢，看下面这张图就明白了：

| 值         | 低地址 0 | 低地址 1 | 低地址 2 | 低地址 3 |
| ---------- | -------- | -------- | -------- | -------- |
| 0x01       | 0x01     |          |          |          |
| 0x0102     | 0x02     | 0x01     |          |          |
| 0x010203   | 0x03     | 0x02     | 0x01     |          |
| 0x01020304 | 0x04     | 0x03     | 0x02     | 0x01     |

那么再来看一下大端格式：

| 值         | 低地址 0 | 低地址 1 | 低地址 2 | 低地址 3 |
| ---------- | -------- | -------- | -------- | -------- |
| 0x01       | 0x01     |          |          |          |
| 0x0102     | 0x01     | 0x02     |          |          |
| 0x010203   | 0x01     | 0x02     | 0x03     |          |
| 0x01020304 | 0x01     | 0x02     | 0x03     | 0x04     |

接下来继续把剩下的 48 字节（64 - 16 = 48），也以这样的字节码含义画出来：

| 字段        | 字节范围 | 值                        | 说明                                                                                                                                 |
| ----------- | -------- | ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| e_type      | 16-17    | 0x03 00                   | 3 表示共享对象文件，比 2 表示的可执行文件更加安全，因为多了 [PIE][readelf reports program is a shared library instead of executable] |
| e_machine   | 18-19    | 0x3e 00                   | Advanced Micro Devices X86-64                                                                                                        |
| e_version   | 20-23    | 0x01 00 00 00             | 1 表示非法版本，2 表示当前版本                                                                                                       |
| e_entry     | 24-31    | 0x80 10 00 00 00 00 00 00 | 程序的入口地址                                                                                                                       |
| e_phoff     | 32-39    | 0x40 00 00 00 00 00 00 00 | program header table 在 ELF 文件的偏移量。0x40=64 表示从第 64 字节开始就是程序头表                                                   |
| e_shoff     | 40-47    | 0x98 39 00 00 00 00 00 00 | section header table 在 ELF 文件的偏移量。0x3998=14744 表示从第 14744 字节开始就是节头表                                             |
| e_flags     | 48-51    | 0x00 00 00 00             | 处理器相关标识                                                                                                                       |
| e_ehsize    | 52-53    | 0x40 00                   | ELF 头部的字节数                                                                                                                     |
| e_phentsize | 54-55    | 0x38 00                   | 程序头表每个表项的字节长度为 0x38=56                                                                                                 |
| e_phnum     | 56-57    | 0x0d 00                   | 程序头表的表项总数为 0x0b=10                                                                                                         |
| e_shentsize | 58-59    | 0x40 00                   | 节头表种每个表项的字节长度为 0x40=64                                                                                                 |
| e_shnum     | 60-61    | 0x1f 00                   | 节头表的表项总数为 0x1f=31                                                                                                           |
| e_shstrndx  | 62-63    | 0x1e 00                   | 字符串表项在节头表的索引为 0x1e=30                                                                                                   |

### 字符串表项

在一个 ELF 文件中，存在很多字符串，例如：变量名、节名称、链接器加入的符号等等。这些字符串的长度都是不固定的，因此用一个固定的结构来表示这些字符串肯定是不现实的。于是，聪明的人类就想到：把这些字符串集中放在一起，作为一个独立的节管理。文件的其他地方如果想表示一个字符串，就在这个地方写一个数字索引：表示这个字符串位于字符串统一存储地方的某个偏移位置。经过这样的按图索骥，就可以找到具体的字符串了。

比如说啊，下面这个空间中存储了所有的字符串：

| 偏移 | 00  | 01  | 02  | 03  | 04  | 05  | 06  | 07  | 08  | 09  | 10  | 11  | 12  | 13  | 14  | 15  |
| ---- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 00   | \0  | .   | t   | e   | x   | t   | \0  | .   | d   | a   | t   | a   | \0  | h   | e   | l   |
| 16   | l   | o   | ,   | w   | o   | r   | l   | d   | !   | \0  | .   | r   | o   | d   | a   | t   |
| 32   | a   | \0  | .   | b   | s   | s   | \0  |

在程序的其他地方，如果想引用字符串 `hello,world!`，那么就只需要在那个地方标明数字 13 就可以了，表示：这个字符串从偏移 13 个字节处开始。

那么现在，咱们再回到这个 main 文件的字符串表，

ELF 头的最后 2 个字节是 0x1e 0x00，对应结构体的成员 `e_shstrndx`，意思是这个 ELF 文件中，字符串表是一个普通的节，存储了 ELF 文件使用到的所有字符串。既然是一个节，那么节头表就一定有一个表项来描述它，那么是哪一个表项呢？这就是第 LE(0x1e00)=30 个表项。

可以用指令 `readelf -S main` 来看一下这个 ELF 文件的所有节信息，可见其中第 30 个节描述的正是字符串表节

```bash{66,67}
There are 31 section headers, starting at offset 0x3998:

Section Headers:
  [Nr] Name              Type             Address           Offset
       Size              EntSize          Flags  Link  Info  Align
  [ 0]                   NULL             0000000000000000  00000000
       0000000000000000  0000000000000000           0     0     0
  [ 1] .interp           PROGBITS         0000000000000318  00000318
       000000000000001c  0000000000000000   A       0     0     1
  [ 2] .note.gnu.propert NOTE             0000000000000338  00000338
       0000000000000020  0000000000000000   A       0     0     8
  [ 3] .note.gnu.build-i NOTE             0000000000000358  00000358
       0000000000000024  0000000000000000   A       0     0     4
  [ 4] .note.ABI-tag     NOTE             000000000000037c  0000037c
       0000000000000020  0000000000000000   A       0     0     4
  [ 5] .gnu.hash         GNU_HASH         00000000000003a0  000003a0
       0000000000000024  0000000000000000   A       6     0     8
  [ 6] .dynsym           DYNSYM           00000000000003c8  000003c8
       00000000000000c0  0000000000000018   A       7     1     8
  [ 7] .dynstr           STRTAB           0000000000000488  00000488
       0000000000000098  0000000000000000   A       0     0     1
  [ 8] .gnu.version      VERSYM           0000000000000520  00000520
       0000000000000010  0000000000000002   A       6     0     2
  [ 9] .gnu.version_r    VERNEED          0000000000000530  00000530
       0000000000000020  0000000000000000   A       7     1     8
  [10] .rela.dyn         RELA             0000000000000550  00000550
       00000000000000c0  0000000000000018   A       6     0     8
  [11] .rela.plt         RELA             0000000000000610  00000610
       0000000000000030  0000000000000018  AI       6    24     8
  [12] .init             PROGBITS         0000000000001000  00001000
       000000000000001b  0000000000000000  AX       0     0     4
  [13] .plt              PROGBITS         0000000000001020  00001020
       0000000000000030  0000000000000010  AX       0     0     16
  [14] .plt.got          PROGBITS         0000000000001050  00001050
       0000000000000010  0000000000000010  AX       0     0     16
  [15] .plt.sec          PROGBITS         0000000000001060  00001060
       0000000000000020  0000000000000010  AX       0     0     16
  [16] .text             PROGBITS         0000000000001080  00001080
       00000000000001b5  0000000000000000  AX       0     0     16
  [17] .fini             PROGBITS         0000000000001238  00001238
       000000000000000d  0000000000000000  AX       0     0     4
  [18] .rodata           PROGBITS         0000000000002000  00002000
       000000000000000d  0000000000000000   A       0     0     4
  [19] .eh_frame_hdr     PROGBITS         0000000000002010  00002010
       0000000000000044  0000000000000000   A       0     0     4
  [20] .eh_frame         PROGBITS         0000000000002058  00002058
       0000000000000108  0000000000000000   A       0     0     8
  [21] .init_array       INIT_ARRAY       0000000000003da0  00002da0
       0000000000000008  0000000000000008  WA       0     0     8
  [22] .fini_array       FINI_ARRAY       0000000000003da8  00002da8
       0000000000000008  0000000000000008  WA       0     0     8
  [23] .dynamic          DYNAMIC          0000000000003db0  00002db0
       0000000000000200  0000000000000010  WA       7     0     8
  [24] .got              PROGBITS         0000000000003fb0  00002fb0
       0000000000000050  0000000000000008  WA       0     0     8
  [25] .data             PROGBITS         0000000000004000  00003000
       0000000000000010  0000000000000000  WA       0     0     8
  [26] .bss              NOBITS           0000000000004010  00003010
       0000000000000008  0000000000000000  WA       0     0     1
  [27] .comment          PROGBITS         0000000000000000  00003010
       000000000000002a  0000000000000001  MS       0     0     1
  [28] .symtab           SYMTAB           0000000000000000  00003040
       0000000000000630  0000000000000018          29    46     8
  [29] .strtab           STRTAB           0000000000000000  00003670
       000000000000020b  0000000000000000           0     0     1
  [30] .shstrtab         STRTAB           0000000000000000  0000387b
       000000000000011a  0000000000000000           0     0     1
Key to Flags:
  W (write), A (alloc), X (execute), M (merge), S (strings), I (info),
  L (link order), O (extra OS processing required), G (group), T (TLS),
  C (compressed), x (unknown), o (OS specific), E (exclude),
  l (large), p (processor specific)
```

可以看出来：这个节在 ELF 文件的偏移地址是 0x000387b，长度是 0x000000000000011a 字节。

下面从 ELF 头部的二进制数据解析出这些信息。

### 读取字符串表节的内容

本节演示如何借助 ELF 头部提供的信息，把字符串表这个节给找出来，然后把它的字节码打印出来看看。

要想打印字符串表节的内容，就必须知道这个节在 ELF 文件的偏移地址。而偏移地址可从节头表的第 30 个表项的描述信息获取。要想知道第 30 个表项的地址，就必须知道节头表在 ELF 文件的开始地址，以及每一个表项的大小。

ELF 头部给出了最后这两个需求信息，因此可反推算出 `shstrtab` 的偏移地址。ELF 头部的第 32 到 35 字节内容是：14744=LE(0x9839000000000000)（注意这里的字节序，低位在前）表示的就是节头表在 ELF 文件的开始地址 `e_shoff` 位于 ELF 文件的第 14744 字节处。知道了开始地址，再来算一下第 30 个表项的地址。ELF 头部第 58-59 字节的内容是 0x4000，表示每个表项的长度 `e_shentsize` 是 LE(0x0040)=64 字节。

::: tip 温馨提示
这里的计算都是从 0 开始的，因此第 30 个表项的开始地址就是：14744 + 30 \* 64 = 16664，也就是说描述字符串表这个节的表项位于 ELF 文件的 16664 字节的位置。
:::

既然知道了这个表项的地址，那么就扒开来看一下其中的二进制内容：

```bash
od -Ad -t x1 -j 16664 -N 64 main

0016664 11 00 00 00 03 00 00 00 00 00 00 00 00 00 00 00
0016680 00 00 00 00 00 00 00 00 7b 38 00 00 00 00 00 00
0016696 1a 01 00 00 00 00 00 00 00 00 00 00 00 00 00 00
0016712 01 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00
0016728
```

其中的 `-j 16664` 选项，表示跳过前面的 16664 个字节，也就是从 main 这个 ELF 文件的 16664 字节处开始读取，一共读 64 字节。

这 64 个字节的内容，就对应了 `Elf64_Shdr` 结构体的每个成员变量：

```c{2,3,6,7}
typedef struct {
  uint32_t   sh_name;
  uint32_t   sh_type;
  uint64_t   sh_flags;
  Elf64_Addr sh_addr;
  Elf64_Off  sh_offset;
  uint64_t   sh_size;
  uint32_t   sh_link;
  uint32_t   sh_info;
  uint64_t   sh_addralign;
  uint64_t   sh_entsize;
} Elf64_Shdr;
```

这里重点讲一下以下 4 个字段:

| 字段      | 值                        | 说明                                                                                                         |
| --------- | ------------------------- | ------------------------------------------------------------------------------------------------------------ |
| sh_name   | 0x11 00 00 00             | 暂且按住不表，马上就解释到了                                                                                 |
| sh_type   | 0x03 00 00 00             | 类型，3 表示这是一个字符串表                                                                                 |
| sh_offset | 0x7b 38 00 00 00 00 00 00 | 在 ELF 文件的偏移量。LE(0x7b38000000000000) = 14459，表示字符串表这个 Section 从 ELF 文件的 14459 字节处开始 |
| sh_size   | 0x1a 01 00 00 00 00 00 00 | 长度为 LE(0x1a01000000000000) = 282 字节                                                                     |

还记得刚才我们使用 readelf 工具，读取到字符串表 Section 在 ELF 文件中的偏移地址是 LE(0x7b38000000000000)，长度是 LE(0x1a01000000000000) 字节吗？与我们这里的推断所得完全一致！

既然知道了字符串表这个节在 ELF 文件的偏移量以及长度，那么就可以把它的字节码内容读取出来看看了。

```bash
od -Ad -t c -j 14459 -N 282 main

0014459  \0   .   s   y   m   t   a   b  \0   .   s   t   r   t   a   b
0014475  \0   .   s   h   s   t   r   t   a   b  \0   .   i   n   t   e
0014491   r   p  \0   .   n   o   t   e   .   g   n   u   .   p   r   o
0014507   p   e   r   t   y  \0   .   n   o   t   e   .   g   n   u   .
0014523   b   u   i   l   d   -   i   d  \0   .   n   o   t   e   .   A
0014539   B   I   -   t   a   g  \0   .   g   n   u   .   h   a   s   h
0014555  \0   .   d   y   n   s   y   m  \0   .   d   y   n   s   t   r
0014571  \0   .   g   n   u   .   v   e   r   s   i   o   n  \0   .   g
0014587   n   u   .   v   e   r   s   i   o   n   _   r  \0   .   r   e
0014603   l   a   .   d   y   n  \0   .   r   e   l   a   .   p   l   t
0014619  \0   .   i   n   i   t  \0   .   p   l   t   .   g   o   t  \0
0014635   .   p   l   t   .   s   e   c  \0   .   t   e   x   t  \0   .
0014651   f   i   n   i  \0   .   r   o   d   a   t   a  \0   .   e   h
0014667   _   f   r   a   m   e   _   h   d   r  \0   .   e   h   _   f
0014683   r   a   m   e  \0   .   i   n   i   t   _   a   r   r   a   y
0014699  \0   .   f   i   n   i   _   a   r   r   a   y  \0   .   d   y
0014715   n   a   m   i   c  \0   .   d   a   t   a  \0   .   b   s   s
0014731  \0   .   c   o   m   m   e   n   t  \0
0014741
```

看一看，瞧一瞧，是不是这个节中存储的全部是字符串？

刚才没有解释 `sh_name` 这个字段，它表示字符串表这个节本身的名字。既然是名字，那一定是个字符串。但是这个字符串不是直接存储在这里的，而是存储了一个值为 0x00000011=17 的索引。现在数一下字符串表节的第 17 个字节开始的地方，可见 `.shstrtab` 这个字符串（`\0` 是字符串的分隔符）！

### 读取代码段的内容

从下面的这张图（指令：`readelf -S main`）：

```bash{9,10}
There are 31 section headers, starting at offset 0x3998:

Section Headers:
  [Nr] Name              Type             Address           Offset
       Size              EntSize          Flags  Link  Info  Align
...
  [15] .plt.sec          PROGBITS         0000000000001060  00001060
       0000000000000020  0000000000000010  AX       0     0     16
  [16] .text             PROGBITS         0000000000001080  00001080
       00000000000001b5  0000000000000000  AX       0     0     16
  [17] .fini             PROGBITS         0000000000001238  00001238
       000000000000000d  0000000000000000  AX       0     0     4
...
```

可以看到代码段是位于第 16 个表项 `.text` 中，加载（虚拟）地址是 0x0000000000001080，它位于 ELF 文件的偏移量是 0x00001080，长度是 0x00000000000001b5 字节。

接下来解析一下其对应的二进制内容。首先计算这个表项的地址：14744 + 16 \* 64 = 15768，然后读取这个表项的头部信息

```bash
od -Ad -t x1 -j 15768 -N 64 main

0015768 b9 00 00 00 01 00 00 00 06 00 00 00 00 00 00 00
0015784 80 10 00 00 00 00 00 00 80 10 00 00 00 00 00 00
0015800 b5 01 00 00 00 00 00 00 00 00 00 00 00 00 00 00
0015816 10 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00
0015832
```

重点关注下面这 5 个字段

```c{2,3,5-7}
typedef struct {
  uint32_t   sh_name;
  uint32_t   sh_type;
  uint64_t   sh_flags;
  Elf64_Addr sh_addr;
  Elf64_Off  sh_offset;
  uint64_t   sh_size;
  uint32_t   sh_link;
  uint32_t   sh_info;
  uint64_t   sh_addralign;
  uint64_t   sh_entsize;
} Elf64_Shdr;
```

| 字段      | 值（小端存储）            | 说明                                                                                                                                                           |
| --------- | ------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| sh_name   | 0xb9 00 00 00             | 代码段名称在字符串表节的偏移位置。LE(0xb9000000)=185 字节，也就是在字符串表的第 185 字节处，存储的就是代码段的名字。回过头去找一下，看一下是不是字符串 `.text` |
| sh_type   | 0x01 00 00 00             | 类型，`SHT_PROGBITS=1` 表示这是代码                                                                                                                            |
| sh_addr   | 0x80 10 00 00 00 00 00 00 | 加载的虚拟地址，与 ELF header 的 `e_entry` 字段的值是相同的                                                                                                    |
| sh_offset | 0x80 10 00 00 00 00 00 00 | 在 ELF 文件的偏移量。LE(0x8010000000000000)=4224，意思是内容从 ELF 文件的 4224 字节处开始                                                                      |
| sh_size   | 0xb5 01 00 00 00 00 00 00 | 长度为 LE(0xb501000000000000)=437 字节                                                                                                                         |

以上这些分析结果与指令 `readelf -S main` 读取出来的完全一样！

根据这些信息，我们可以读取代码段的字节码 如下

```bash
od -Ad -t x1 -j 4224 -N 437 main
```

这里就不贴输出的黑乎乎字节码了。

## 程序头（Program header）

文章开头就介绍了 ELF 是一个通用的文件结构，链接器和加载器在看待 ELF 的角度是不同的。为了对程序头有更感性的认识，我们先用 readelf 工具从总体上看一下 main 文件的所有段信息。

```bash{3-5}
readelf -l main

Elf file type is DYN (Shared object file)
Entry point 0x1080
There are 13 program headers, starting at offset 64

Program Headers:
  Type           Offset             VirtAddr           PhysAddr
                 FileSiz            MemSiz              Flags  Align
  PHDR           0x0000000000000040 0x0000000000000040 0x0000000000000040
                 0x00000000000002d8 0x00000000000002d8  R      0x8
  INTERP         0x0000000000000318 0x0000000000000318 0x0000000000000318
                 0x000000000000001c 0x000000000000001c  R      0x1
      [Requesting program interpreter: /lib64/ld-linux-x86-64.so.2]
  LOAD           0x0000000000000000 0x0000000000000000 0x0000000000000000
                 0x0000000000000640 0x0000000000000640  R      0x1000
  LOAD           0x0000000000001000 0x0000000000001000 0x0000000000001000
                 0x0000000000000245 0x0000000000000245  R E    0x1000
  LOAD           0x0000000000002000 0x0000000000002000 0x0000000000002000
                 0x0000000000000160 0x0000000000000160  R      0x1000
  LOAD           0x0000000000002da0 0x0000000000003da0 0x0000000000003da0
                 0x0000000000000270 0x0000000000000278  RW     0x1000
  DYNAMIC        0x0000000000002db0 0x0000000000003db0 0x0000000000003db0
                 0x0000000000000200 0x0000000000000200  RW     0x8
  NOTE           0x0000000000000338 0x0000000000000338 0x0000000000000338
                 0x0000000000000020 0x0000000000000020  R      0x8
  NOTE           0x0000000000000358 0x0000000000000358 0x0000000000000358
                 0x0000000000000044 0x0000000000000044  R      0x4
  GNU_PROPERTY   0x0000000000000338 0x0000000000000338 0x0000000000000338
                 0x0000000000000020 0x0000000000000020  R      0x8
  GNU_EH_FRAME   0x0000000000002010 0x0000000000002010 0x0000000000002010
                 0x0000000000000044 0x0000000000000044  R      0x4
  GNU_STACK      0x0000000000000000 0x0000000000000000 0x0000000000000000
                 0x0000000000000000 0x0000000000000000  RW     0x10
  GNU_RELRO      0x0000000000002da0 0x0000000000003da0 0x0000000000003da0
                 0x0000000000000260 0x0000000000000260  R      0x1

 Section to Segment mapping:
  Segment Sections...
   00
   01     .interp
   02     .interp .note.gnu.property .note.gnu.build-id .note.ABI-tag .gnu.hash .dynsym .dynstr .gnu.version .gnu.version_r .rela.dyn .rela.plt
   03     .init .plt .plt.got .plt.sec .text .fini
   04     .rodata .eh_frame_hdr .eh_frame
   05     .init_array .fini_array .dynamic .got .data .bss
   06     .dynamic
   07     .note.gnu.property
   08     .note.gnu.build-id .note.ABI-tag
   09     .note.gnu.property
   10     .eh_frame_hdr
   11
   12     .init_array .fini_array .dynamic .got
```

由输出可得以下信息

- 这是一个共享对象文件
- 入口地址是 0x1080
- 共有 13 个 Program header，从 ELF 文件的 64 字节偏移地址开始

布局如下图所示：

```
+----------------------+
|    ELF header        |
+----------------------+
+----------------------+
|  +----------------+------> 偏移 64 字节
|  | PHDR           |  |  每个表项 56 字节
|  +----------------+  |
|  | INTERP         |  |
|  +----------------+------> 偏移 176=64+56*2
|  | LOAD           |  |
|  +----------------+  |
|  | LOAD           |  |
|  +----------------+  |
|  | LOAD           |  |
|  +----------------+  |
|  | LOAD           |  |
|  +----------------+  |
|  | DYNAMIC        |  |
|  +----------------+  |
|  | NOTE           |  |
|  +----------------+  |
|  | NOTE           |  |
|  +----------------+  |
|  | GNU_PROPERTY   |  |
|  +----------------+  |
|  | GNU_EH_FRAME   |  |
|  +----------------+  |
|  | GNU_STACK      |  |
|  +----------------+  |
|  | GNU_RELRO      |  |
|  +----------------+  |
+----------------------+
+----------------------+
|    Segments          |
+----------------------+
+----------------------+
| Section header table |
+----------------------+
```

开头还说过：节与段本质上是一样的，可以理解为一个段由一个或多个节组成。

从上图可以看到，第 2 个程序头这个段由那么多的 Section 组成。还可以看到，一共有 4 个 `LOAD` 类型的段：

```bash
...
      [Requesting program interpreter: /lib64/ld-linux-x86-64.so.2]
  LOAD           0x0000000000000000 0x0000000000000000 0x0000000000000000
                 0x0000000000000640 0x0000000000000640  R      0x1000
  LOAD           0x0000000000001000 0x0000000000001000 0x0000000000001000
                 0x0000000000000245 0x0000000000000245  R E    0x1000
  LOAD           0x0000000000002000 0x0000000000002000 0x0000000000002000
                 0x0000000000000160 0x0000000000000160  R      0x1000
  LOAD           0x0000000000002da0 0x0000000000003da0 0x0000000000003da0
                 0x0000000000000270 0x0000000000000278  RW     0x1000
  DYNAMIC        0x0000000000002db0 0x0000000000003db0 0x0000000000003db0
                 0x0000000000000200 0x0000000000000200  RW     0x8
...
```

我们读取第一个 `LOAD` 类型的段，扒开其中的二进制字节码瞅瞅。

第一步的工作：计算这个段表项的地址信息。从 ELF 头得知如下信息：

|        字段 | 说明                                    |
| ----------: | :-------------------------------------- |
|     e_phoff | 程序头表位于 ELF 文件偏移 64 字节的地方 |
| e_phentsize | 每一个表项的长度是 56 字节              |
|     e_phnum | 共有 10 个表项                          |

通过计算，得到可读、可执行的 `LOAD` 段（第 3 个程序表项）位于偏移量 176=64+56\*2 字节处。

```bash
od -Ad -t x1 -j 176 -N 56 main

0000176 01 00 00 00 04 00 00 00 00 00 00 00 00 00 00 00
0000192 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00
0000208 40 06 00 00 00 00 00 00 40 06 00 00 00 00 00 00
0000224 00 10 00 00 00 00 00 00
0000232
```

按照惯例把其中几个需要关注的字段与数据结构的成员变量对照看一下：

```c{2-7}
typedef struct {
  uint32_t   p_type;
  uint32_t   p_flags;
  Elf64_Off  p_offset;
  Elf64_Addr p_vaddr;
  Elf64_Addr p_paddr;
  uint64_t   p_filesz;
  uint64_t   p_memsz;
  uint64_t   p_align;
} Elf64_Phdr;
```

| 字段     | 值（小端存储）            | 说明                                                       |
| -------- | ------------------------- | ---------------------------------------------------------- |
| p_type   | 0x01 00 00 00             | 段的类型，1 表示这个段需要加载到内存                       |
| p_flags  | 0x04 00 00 00             | 位掩码，`04=PF_X` 表示这是个可执行段                       |
| p_offset | 0x00 00 00 00 00 00 00 00 | 段在 ELF 文件的偏移地址，0 表示这个段从 ELF 文件的头部开始 |
| p_vaddr  | 0x00 00 00 00 00 00 00 00 | 段加载到内存的虚拟地址 0                                   |
| p_paddr  | 0x00 00 00 00 00 00 00 00 | 段加载的物理地址，与虚拟地址相同                           |
| p_filesz | 0x40 06 00 00 00 00 00 00 | 这个段在 ELF 文件占据的字节数，LE(0x0640)=1600 字节        |
| p_memsz  | 0x40 06 00 00 00 00 00 00 | 这个段加载到内存需要占据的字节数，LE(0x0640)=1600 字节     |

> 注意：有些段是不需要加载到内存中的;

由上述分析可知：从 ELF 文件的 1 到 1600 字节都属于这个 `LOAD` 段的内容。被执行时，这个段需要被加载到内存中虚拟地址为 0 的地方，从这里开始，又是一个全新的故事了。

## 小结

本文两个重点：

- ELF 头描述文件的总体信息，以及两个表（程序头表和节头表）的相关信息（偏移地址，表项个数，表项长度）
- 每一个表包括很多个表项，每一个表项都描述一个节/段的具体信息

链接器和加载器也都是按照这样的原理来解析 ELF 文件的。

## 参考文献

- [elf(5) — linux manual page]
- [Linux 系统中编译、链接的基石-ELF 文件：扒开它的层层外衣，从字节码的粒度来探索](https://www.toutiao.com/i6982736574626660872/?tt_from=weixin&utm_campaign=client_share&wxshare_count=1&timestamp=1625875430&app=news_article&utm_source=weixin&utm_medium=toutiao_android&use_new_style=1&req_id=2021071008035001013516808335284E69&share_token=b34f88c9-9107-4600-8850-bd1599e87b73&group_id=6982736574626660872&wid=1625992706756)

[elf(5) — linux manual page]: https://man7.org/linux/man-pages/man5/elf.5.html
[readelf reports program is a shared library instead of executable]: https://stackoverflow.com/questions/30555248/readelf-reports-program-is-a-shared-library-instead-of-executable