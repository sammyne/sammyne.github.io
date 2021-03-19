---
title: '[optee] 02. 项目结构'
date: 2021-03-16
categories:
  - tee
tags:
  - optee
  - trustzone
---

optee 的源代码可以从 [github][optee-gh] 获取。在 Linux 使用 repo 的方式可以获取到完整的 optee 源代码如下：

```bash
# 本教程是用的是 3.12.0 版本的 optee，运行环境为 QEMU 虚拟的 ARMv8 架构。
repo init -b 3.12.0 -u https://github.com/OP-TEE/manifest.git -m qemu_v8.xml
```

> 注意：拉取过程很多东西都需要翻墙，建议为 github 和 repo 设置代理。github 代理教程参见 [这里](https://sammyne.github.io/_post/speedup-github/)，repo 代理设置参见这份 [Dockerfile](https://github.com/sammyne/ghcr.io/blob/main/git-repo/2.12.2/ubuntu20.04/Dockerfile)。

下载完成后，可见项目结构如下

```
.
|-- build
|-- buildroot
|-- edk2
|-- linux
|-- mbedtls
|-- optee_benchmark
|-- optee_client
|-- optee_examples
|-- optee_os
|-- optee_test
|-- qemu
|-- soc_term
`-- trusted-firmware-a
```

各目录的作用介绍如下：

|                                             目录 | 说明                                                                                                                                                                                                                                                  |
| -----------------------------------------------: | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
|                            [build][OP-TEE/build] | 这个工程的编译目录，里面包含了各种 Makefile 文件和相关配置文件                                                                                                                                                                                        |
|                 [buildroot][buildroot/buildroot] | TODO                                                                                                                                                                                                                                                  |
|                           [edk2][tianocore/edk2] | TODO                                                                                                                                                                                                                                                  |
|                        [linux][linaro-swg/linux] | linux 内核代码，其 driver/tee 子目录存放 TEE 对应的驱动程序                                                                                                                                                                                           |
|                       [mbedtls][ARMmbed/mbedtls] | TODO                                                                                                                                                                                                                                                  |
|    [optee_benchmark][linaro-swg/optee_benchmark] | TODO                                                                                                                                                                                                                                                  |
|              [optee_client][OP-TEE/optee_client] | 包含 CA 程序调用的用户空间层面的接口库源码，其 tee_supplicant 子目录的代码会被编译成一个二进制。该二进制主要的作用是：调用 CA 接口加载 TA image 时，TEE OS 通过该二进制从文件系统获取 TA image，并传递给 TEE OS，然后再将 TA image 放到 TEE OS 运行。 |
|      [optee_examples][linaro-swg/optee_examples] | 示例代码                                                                                                                                                                                                                                              |
|                      [optee_os][OP-TEE/optee_os] | 存放 OP-TEE OS 的源代码和相关文档                                                                                                                                                                                                                     |
|                  [optee_test][OP-TEE/optee_test] | optee 的测试程序 xtest 的源码，主要用来测试 TEE 提供的各种算法逻辑和其他功能                                                                                                                                                                          |
|                                [qemu][qemu/qemu] | QEMU 源代码                                                                                                                                                                                                                                           |
|                  [soc_term][linaro-swg/soc_term] | 在启动时与 gnome-terminal 命令一起启动终端，用于建立启动的两个终端之间的端口监听，方便 OP-TEE OS 的日志和linux 内核日志分别输出到两个终端                                                                                                             |
| [trusted-firmware-a][sammyne/trusted-firmware-a] | TODO                                                                                                                                                                                                                                                  |
|                                                  |

> @TODO：其他目录的功能后续弄懂再补充 :(

## 参考文献
- [OP-TEE代码结构](https://icyshuai.blog.csdn.net/article/details/71499945)

[buildroot/buildroot]: https://github.com/buildroot/buildroot/tree/2020.08
[tianocore/edk2]: https://github.com/tianocore/edk2/commit/dd4cae4d82c7477273f3da455084844db5cca0c0
[optee-gh]: https://github.com/OP-TEE/optee_os/tree/3.12.0
[linaro-swg/linux]: https://github.com/linaro-swg/linux/tree/optee-3.12.0
[linaro-swg/optee_benchmark]: https://github.com/linaro-swg/optee_benchmark/tree/3.12.0
[linaro-swg/optee_examples]: https://github.com/linaro-swg/optee_examples/tree/3.12.0
[linaro-swg/soc_term]: https://github.com/linaro-swg/soc_term
[qemu/qemu]: https://github.com/qemu/qemu/tree/v5.1.0
[sammyne/trusted-firmware-a]: https://github.com/sammyne/trusted-firmware-a/tree/v2.3

[ARMmbed/mbedtls]: https://github.com/ARMmbed/mbedtls/tree/mbedtls-2.16.0
[OP-TEE/build]: https://github.com/OP-TEE/build/tree/3.12.0
[OP-TEE/optee_client]: https://github.com/OP-TEE/optee_client/tree/3.12.0
[OP-TEE/optee_os]: https://github.com/OP-TEE/optee_os/tree/3.12.0
[OP-TEE/optee_test]: https://github.com/OP-TEE/optee_test/tree/3.12.0
