---
title: '[optee] 10. OP-TEE OS 启动 -- part 01'
date: 2021-03-23
categories:
  - tee
tags:
  - optee
  - trustzone
---

> 本教程是用的是 3.12.0 版本的 [optee][optee-gh]，运行环境为 QEMU 虚拟的 ARMv8 架构。
> 
如果系统有 ATF（ARM Trusted Frimware）（ATF 知识请参考 ATF 相关文档），OP-TEE OS 在 bl32 阶段启动，通过 bl31 阶段调用 [opteed_enter_sp] 函数跳转到 OP-TEE OS 执行启动操作。

以 QEMU+OP-TEE 的方式运行 TEE 时，OP-TEE image 的链接文件是 optee_os/core/arch/arm/kernel/kern.ld.S，由文件可知 TEE image 启动的入口函数是 [_start] 函数。

`_start` 函数定义在 optee_os/core/arch/arm 目录的不同文件，不同的板子拥有不同的 .S 文件。本文教程是用 QEMU 模拟 ARMv8，故使用 QEMU+OPTEE 运行 TEE 时，入口函数定义在 [core/arch/arm/kernel/entry_a64.S][_start-def] 文件。整个启动的大致流程图如下（只考虑主 CPU 的启动）：

```
+-------------------------------+               +-------------------------+
|            _start             |               | thread_clr_boot_thread  |
+---------------+---------------+               +-------------+-----------+
                |                                             ^
                |                                             |
                v                                             |
+---------------+---------------+               +-------------+-----------+
|          set_sctlr_el1        |               |     boot_init_primary   |
+---------------+---------------+               +-------------+-----------+
                |                                             ^
                |                                             |
                v                                             |
+---------------+---------------+               +-------------+-----------+
|           copy_init           |               |        enable_mmu       |
+---------------+---------------+               +-------------+-----------+
                |                                             ^
                |                                             |
                v                                             |
+---------------+---------------+               +-------------+-----------+
|            set_sp             |               |     core_init_mmu_map   |
+---------------+---------------+               +-------------+-----------+
                |                                             ^
                |                                             |
                v                                             |
+---------------+---------------+               +-------------+-----------+
| thread_init_thread_core_local +-------------->+ dcache_cleaninv_range   |
+-------------------------------+               +-------------------------+
```


## 参考文献
- [OP-TEE OS启动（一）](https://icyshuai.blog.csdn.net/article/details/72638193)

[optee-gh]: https://github.com/OP-TEE/optee_os/tree/3.12.0
[opteed_enter_sp]: https://github.com/sammyne/trusted-firmware-a/blob/v2.3/services/spd/opteed/opteed_helpers.S#L21
[_start]: https://github.com/OP-TEE/optee_os/blob/3.12.0/core/arch/arm/kernel/kern.ld.S#L74
[_start-def]: https://github.com/OP-TEE/optee_os/blob/3.12.0/core/arch/arm/kernel/entry_a64.S#L57
