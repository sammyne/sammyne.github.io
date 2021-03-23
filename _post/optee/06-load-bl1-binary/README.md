---
title: '[optee] 06. 加载 bl1.bin'
date: 2021-03-23
categories:
  - tee
tags:
  - optee
  - trustzone
---

> 本教程是用的是 3.12.0 版本的 [optee][optee-gh]，运行环境为 QEMU 虚拟的 ARMv8 架构。

前面的文章介绍了使用 QEMU 运行 OP-TEE 所依赖 image 的编译以及启动过程。本文将开始介绍启动过程加载 bl1.bin 的流程。

调用 qemu-system-aarch64 启动 QEMU 时，会加载 `$(BINARIES_PATH)`--out/bin 目录的 bl1.bin 文件（本质上是 trusted-firmware-a/build/qemu/release/bl1.bin 的软链接）。bl1.bin 镜像的入口函数是 [bl1_entrypoint] 函数，由汇编代码编写，定义在 trusted-firmware-a/bl1/aarch64/bl1_entrypoint.S 文件如下

```asm6502
/*
 * Copyright (c) 2013-2019, ARM Limited and Contributors. All rights reserved.
 *
 * SPDX-License-Identifier: BSD-3-Clause
 */

#include <arch.h>
#include <el3_common_macros.S>

	.globl	bl1_entrypoint


	/* -----------------------------------------------------
	 * bl1_entrypoint() is the entry point into the trusted
	 * firmware code when a cpu is released from warm or
	 * cold reset.
	 * -----------------------------------------------------
	 */

func bl1_entrypoint
	/* ---------------------------------------------------------------------
	 * If the reset address is programmable then bl1_entrypoint() is
	 * executed only on the cold boot path. Therefore, we can skip the warm
	 * boot mailbox mechanism.
	 * ---------------------------------------------------------------------
	 */
	el3_entrypoint_common					\
		_init_sctlr=1					\
		_warm_boot_mailbox=!PROGRAMMABLE_RESET_ADDRESS	\
		_secondary_cold_boot=!COLD_BOOT_SINGLE_CPU	\
		_init_memory=1					\
		_init_c_runtime=1				\
		_exception_vectors=bl1_exceptions		\
		_pie_fixup_size=0

	/* --------------------------------------------------------------------
	 * Perform BL1 setup
	 * --------------------------------------------------------------------
	 */
	bl	bl1_setup

#if ENABLE_PAUTH
	/* --------------------------------------------------------------------
	 * Program APIAKey_EL1 and enable pointer authentication.
	 * --------------------------------------------------------------------
	 */
	bl	pauth_init_enable_el3
#endif /* ENABLE_PAUTH */

	/* --------------------------------------------------------------------
	 * Initialize platform and jump to our c-entry point
	 * for this type of reset.
	 * --------------------------------------------------------------------
	 */
	bl	bl1_main

#if ENABLE_PAUTH
	/* --------------------------------------------------------------------
	 * Disable pointer authentication before jumping to next boot image.
	 * --------------------------------------------------------------------
	 */
	bl	pauth_disable_el3
#endif /* ENABLE_PAUTH */

	/* --------------------------------------------------
	 * Do the transition to next boot image.
	 * --------------------------------------------------
	 */
	b	el3_exit
endfunc bl1_entrypoint
```

## 参考文献
- [OP-TEE+qemu的启动过程分析--加载bios.bin](https://icyshuai.blog.csdn.net/article/details/71535554)

[bl1_entrypoint]: https://github.com/sammyne/trusted-firmware-a/blob/v2.3/bl1/aarch64/bl1_entrypoint.S#L20
[optee-gh]: https://github.com/OP-TEE/optee_os/tree/3.12.0
