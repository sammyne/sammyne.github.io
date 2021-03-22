---
title: '[optee] 04. 工程编译 target 依赖关系'
date: 2021-03-22
categories:
  - tee
tags:
  - optee
  - trustzone
---

> 本教程是用的是 3.12.0 版本的 [optee][optee-gh]，运行环境为 QEMU 虚拟的 ARMv8 架构。

前一篇文章 TODO 成功添加 CA 和 TA 之后。我们还有一些问题没解决
- 整个工程是如何编译出来的
- linux 内核在什么时候被编译
- OP-TEE OS image 是怎么编译出来的
- TA 和 CA 是如何编译出来
- ...

找到这些问题的答案需要我们理清工程的 Makefile 和相关的 mk 文件以及其他编译相关的文件。本文将大致讲述使用 QEMU+OP-TEE 的编译过程。

## 显式编译目标

OP-TEE 编译是从 build/Makefile （当前场景下本质是 build/qemu_v8.mk 文件的一个软链接）开始的，然后按照 target 的依赖关系进行编译。完整的 target 依赖关系如下：

```bash
|-all
  |-arm-tf
    |-optee-os
    |-edk2
  |-buildroot   # common.mk
    |-optee-os
  |-edk2
    |-edk2-common # common.mk
  |-linux
    |-linux-common # common.mk
      |-linux-defconfig
  |-optee-os
    |-optee-os-common # common.mk
  |-qemu
  |-soc-term
```


整个工程的编译始于 build/Makefile 或者对应板子的 xxx.mk 文件。本文以 qemu_v8.mk 为例，说明主要目标的作用

|            目标 | 作用                                                                                                                              |
| --------------: | :-------------------------------------------------------------------------------------------------------------------------------- |
|            qemu | 切换到 qemu 目录，获取 qemu 的配置文件，然后执行 make 命令编译 qemu                                                               |
|       soce-term | 编译 soc-term 目录，生成 soc-term 二进制文件                                                                                      |
| optee-os-common | 编译 optee_os 目录，编译生成 tee-*_v2.bin 以及其他的 lib 库文件                                                                   |
|       buildroot | 创建 out-br 暂存目录，生成 buildroot 编译的配置文件，涉及编译 [optee_examples][br-ext-examples]、[optee_client][br-ext-client] 等 |

## buildroot 编译过程

> 假设当前目录为项目根目录。

大致编译过程如下

1. 创建 out-br 目录
2. 生成定义变量的额外配置文件 out-br/extra.conf
3. 运行 build/br-ext/scripts/make_def_config.py 脚本，脚本执行 buildroot/Makefile 的 `defconfig` 目标，生成 out-br/Makefile 文件
4. 转到 out-br 目录执行 `all` 目标，涉及 [optee_examples][br-ext-examples]、[optee_client][br-ext-client] 等项目的编译


### optee-client 编译

该项目基于 CMake 编译，产出一系列的库文件和二进制文件如下

|           文件 | 说明                                                                                             |
| -------------: | :----------------------------------------------------------------------------------------------- |
|     libteec.so | TODO                                                                                             |
|   libckteec.so | TODO                                                                                             |
|   optee_client | TODO                                                                                             |
| tee-supplicant | 编译生成一个 tee_supplicant 的可执行文件，提供 optee_os 访问文件系统，加载具体的 TA image 的功能 |

### optee-examples 编译

相关 buildroot 编译描述文件参见 [optee_examples_ext.mk][br-ext-examples]，主要功能为
- 借助 `OPTEE_EXAMPLES_EXT_BUILD_TAS` 宏编译 TA，用宏 `OPTEE_EXAMPLES_EXT_INSTALL_TAS` 将产出的 TA 安装到 out-br/lib/optee_armtz 目录
- 根据 [optee_examples/CMakeLists.txt][optee-examples-cmakelists] 的规则编译 CA，并将编译产出安装到 out-br/staging/usr/bin 目录

### optee-os 拓展部分的编译

该项目基于 CMake 编译，把 optee_os 项目为指定架构编译生成的 ta（预期目录为 optee_os/out/arm/export-ta_arm64/lib/）挪到 out-br/target/lib/optee_armtz 目录，但是目前看起来没用，因为 预期目录没有 *.ta 后缀的文件。

### TODO
- optee_benchmark
- optee_test

## 参考文献

- [OP-TEE+qemu的编译--工程编译target依赖关系](https://icyshuai.blog.csdn.net/article/details/71518125)

[optee-gh]: https://github.com/OP-TEE/optee_os/tree/3.12.0
[br-ext-examples]: https://github.com/OP-TEE/build/blob/3.12.0/br-ext/package/optee_examples_ext/optee_examples_ext.mk
[br-ext-client]: https://github.com/OP-TEE/build/blob/3.12.0/br-ext/package/optee_client_ext/optee_client_ext.mk
[optee-examples-cmakelists]: https://github.com/linaro-swg/optee_examples/blob/3.12.0/CMakeLists.txt
