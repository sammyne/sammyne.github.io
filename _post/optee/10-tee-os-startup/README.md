---
title: '[optee] 10. OP-TEE OS 启动'
date: 2021-03-24
categories:
  - tee
tags:
  - optee
  - trustzone
---

## 启动流程
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

如果系统有 ATF，[boot_init_primary] 函数执行完成之后返回 OP-TEE 的向量表，否则不返回向量表。OP-TEE 启动过程中主体初始化操作都是在 `boot_init_primary` 函数执行的。该函数的相关函数集中在 [optee_os/core/arch/arm/kernel/boot.c][boot.c] 文件，具体如下

```
|-boot_init_primary
  |-init_primary
    |-thread_set_exceptions // 设置异常处理函数
    |-init_vfp_sec // 初始化 VFP--浮点数运算单元 
    |-init_runtime  // 初始化和配置 TEE 运行时用到的各种内存，例如：清空 BSS，初始化线程内存，分配 TA 运行时所需内存等
    |-thread_init_primary // 初始化 TEE 支持的线程栈空间、异常处理、页表等
    |-thread_init_per_cpu // 如果没有 ATF，初始化每个 CPU 的 monitor 态的处理方式
    |-init_sec_mon        // 如果不支持 ATF，配置内核态 CPU 的 Monitor 处理方式
  |-paged_init_primary
    |-init_external_dt    // 初始化设备树
    |-main_init_gic       // 初始化中断控制器
    |-init_vfp_nsec       // 初始化常规世界的 VFP--浮点数运算单元
    |-init_tee_runtime    // 初始化共享内存等
      |-call_initcalls    // 定义在 initcall.c 
    |-call_finalcalls
```

### call_initcalls

初始化内存、CPU 相关设置、中断控制器、共享内存、线程堆栈、TA 执行内存分配等操作之后，`init_tee_runtime` 函数调用 `call_initcalls` 函数启动 OP-TEE OS 的各种 service。`call_initcalls` 代码如下：

```c
// optee_os/core/kernel/initcall.c

void __weak call_initcalls(void)
{
	const struct initcall *call = NULL;
	TEE_Result ret = TEE_SUCCESS;

	for (call = initcall_begin; call < initcall_end; call++) {
		DMSG("level %d %s()", call->level, call->func_name);
		ret = call->func();
		if (ret != TEE_SUCCESS) {
			EMSG("Initcall __text_start + 0x%08" PRIxVA
			     " failed", (vaddr_t)call - VCORE_START_VA);
		}
	}
}
```

该函数会依次执行 `initcall_begin` 到 `initcall_end` 之间的所有函数。（TODO：`initcall_begin` 和 `initcall_end` 的具体定义尚未看懂 :(）

`initcall_begin` 和 `initcall_end` 之间的函数代码通过 [__define_initcall] 宏放到对应段，具体内容如下

```c
#define early_init(fn)			__define_initcall(init, 1, fn)
#define early_init_late(fn)		__define_initcall(init, 2, fn)
#define service_init(fn)		__define_initcall(init, 3, fn)
#define service_init_late(fn)		__define_initcall(init, 4, fn)
#define driver_init(fn)			__define_initcall(init, 5, fn)
#define driver_init_late(fn)		__define_initcall(init, 6, fn)
```

> `__define_initcall` 指示编译器将 `service_init(fn)` 的 `fn` 函数代码存放到 `.scattered_array_initcall_1_3` 段（目前这个属于个人理解）

## service_init

由编译产出的 optee_os/out/arm/core/tee.map 文件可知 `.scattered_array_initcall_1_3` 段存的内容如下

```
// ...
.scattered_array_initcall_1_1
              0x000000000e15cc18       0x18 out/arm/core/arch/arm/mm/core_mmu.o
.scattered_array_initcall_1_3
              0x000000000e15cc30       0x30 out/arm/core/arch/arm/kernel/user_ta.o
.scattered_array_initcall_1_3
              0x000000000e15cc60       0x18 out/arm/core/arch/arm/kernel/pseudo_ta.o
.scattered_array_initcall_1_3
              0x000000000e15cc78       0x18 out/arm/core/arch/arm/mm/mobj_dyn_shm.o
.scattered_array_initcall_1_3
              0x000000000e15cc90       0x18 out/arm/core/tee/tee_cryp_utl.o
.scattered_array_initcall_1_4
// ...
```

遍历整个 OP-TEE 目录可知，使用 `service_init` 宏将代码存放到 `.scattered_array_initcall_1_3` 段的函数如下：

|                             函数 | 相关文件       |
| -------------------------------: | :------------- |
| [check_ta_store], [init_user_ta] | user_ta.c      |
|  [verify_pseudo_tas_conformance] | pseudo_ta.c    |
|           [mobj_mapped_shm_init] | mobj_dyn_shm.c |
|                  [tee_cryp_init] | tee_cryp_utl.c |

也即执行 `.scattered_array_initcall_1_3` 段内容时，将会依次执行这些函数。

### 1. check_ta_store, init_user_ta

这两个函数负责把加载 TA image 的操作结构体赋值给 `_user_ta_ops` 变量，该变量会在加载 TA image 的时候被使用到，该函数的代码如下：

```c
// 定义加载 TA image 依赖的操作函数指针
static const struct ts_ops user_ta_ops __rodata_unpaged = {
	.enter_open_session = user_ta_enter_open_session,
	.enter_invoke_cmd = user_ta_enter_invoke_cmd,
	.enter_close_session = user_ta_enter_close_session,
	.dump_state = user_ta_dump_state,
#ifdef CFG_FTRACE_SUPPORT
	.dump_ftrace = user_ta_dump_ftrace,
#endif
	.destroy = user_ta_ctx_destroy,
	.get_instance_id = user_ta_get_instance_id,
	.handle_svc = user_ta_handle_svc,
#ifdef CFG_TA_GPROF_SUPPORT
	.gprof_set_status = user_ta_gprof_set_status,
#endif
};

/*
 * Break unpaged attribute dependency propagation to user_ta_ops structure
 * content thanks to a runtime initialization of the ops reference.
 */
static const struct ts_ops *_user_ta_ops;

static TEE_Result init_user_ta(void)
{
	_user_ta_ops = &user_ta_ops;

	return TEE_SUCCESS;
}
service_init(init_user_ta);

// ...

static TEE_Result check_ta_store(void)
{
	const struct ts_store_ops *op = NULL;

	SCATTERED_ARRAY_FOREACH(op, ta_stores, struct ts_store_ops)
		DMSG("TA store: \"%s\"", op->description);

	return TEE_SUCCESS;
}
service_init(check_ta_store);

// ...
```

### 2. verify_pseudo_tas_conformance
 
该函数校验 OP-TEE OS 集成的 TA 合法性，需要检查 OP-TEE OS 自有 TA 的 UUID、函数指针和相关标识符。代码如下：

```c

/* Insures declared pseudo TAs conforms with core expectations */
static TEE_Result verify_pseudo_tas_conformance(void)
{
	const struct pseudo_ta_head *start =
		SCATTERED_ARRAY_BEGIN(pseudo_tas, struct pseudo_ta_head); // 获取存放 pseudo TAs 的 head info 段起始地址
	const struct pseudo_ta_head *end =
		SCATTERED_ARRAY_END(pseudo_tas, struct pseudo_ta_head); // 获取存放 pseudo TAs 的 head info 段末尾地址
	const struct pseudo_ta_head *pta;

	for (pta = start; pta < end; pta++) {
		const struct pseudo_ta_head *pta2;

		/* PTAs must all have a specific UUID */
		for (pta2 = pta + 1; pta2 < end; pta2++) {
      // 检查 psedo TAs 的 head info 包含的 UUID 信息是否有相同的
			if (!memcmp(&pta->uuid, &pta2->uuid, sizeof(TEE_UUID)))
				goto err;
		}

    // 检查 invoke 函数指针是否为空和相关 flag 是否合法
		if (!pta->name ||
		    (pta->flags & PTA_MANDATORY_FLAGS) != PTA_MANDATORY_FLAGS ||
		    pta->flags & ~PTA_ALLOWED_FLAGS ||
		    !pta->invoke_command_entry_point)
			goto err;
	}
	return TEE_SUCCESS;
err:
	DMSG("pseudo TA error at %p", (void *)pta);
	panic("PTA");
}

service_init(verify_pseudo_tas_conformance);
```

在编译过程中，哪些部分会被添加到存放 pseudo TAs 的 head info 的 `.scattered_array_pseudo_tas_0`（由 `SCATTERED_ARRAY_BEGIN` 定义）段呢？该操作通过使用 [pseudo_ta_register] 宏实现，定义在 core/arch/arm/include/kernel/pseudo_ta.h 文件如下：

```c
#define pseudo_ta_register(...)	\
	SCATTERED_ARRAY_DEFINE_PG_ITEM(pseudo_tas, struct pseudo_ta_head) = \
		{ __VA_ARGS__ }
```

该宏规定 `pseudo_ta_register` 参数的 `pseudo_ta_head` 结构体变量将会被存放 `.scattered_array_pseudo_tas_1_0` 段（核实）。在 OP-TEE 有 5 个 TA 会被打包进 OP-TEE image，相关文件如下：

> 除了 socket TA 外，所有文件均在 optee_os/core/arch/arm/pta 目录下。

|                TA | 文件                       |
| ----------------: | :------------------------- |
|      [device.pta] | device.c                   |
| [secstor_ta_mgmt] | secstor_ta_mgmt.c          |
|           [gprof] | gprof.c                    |
|        [stats.ta] | stats.c                    |
|      [system.pta] | system.c                   |
|          [socket] | optee_os/core/tee/socket.c |

> TODO：未完全理解

### 3. mobj_mapped_shm_init

TODO
 
### 4. tee_cryp_init
 
该函数初始化加解密功能，会调用 `crypto_init()` 和 `plat_rng_init()` 进行初始化操作，函数调用栈如下

```
|-tee_cryp_init
  |-crypto_init  // optee_os/lib/libmbedtls/core/tomcrypt.c#L10
    |-tomcrypt_init // optee_os/core/lib/libtomcrypt/tomcrypt.c#141
      |-ltc_init    // optee_os/core/lib/libtomcrypt/tomcrypt.c#125
                    // 完成各种算法调用接口的定义和初始化
  |-plat_rng_init // 初始化伪随机数发生器的种子
```

## service_init_late

系统执行完 `.scattered_array_initcall_1_3` 段的代码（由 `service_init` 函数定义）后，继续执行 `.scattered_array_initcall_1_4` 段的代码。目前，只有 [tee_fs_init_key_manager] 函数的编译借助了这个宏。

因此，执行 `.scattered_array_initcall_1_4` 段的代码时，将会执行 `tee_fs_init_key_manager` 函数，生成  secure storage key，生成的密钥将会被保存到 `tee_fs_ssk` 变量的 `key` 字段。

## driver_init 和 driver_init_late

初始化阶段完成了 `.scattered_array_initcall_1_3` 和 `.scattered_array_initcall_1_4` 段的代码执行之后，系统将执行 `.scattered_array_initcall_1_5` 和 `.scattered_array_initcall_1_6` 段的代码。该部分负责初始化一些驱动，包括串口、外围设备等。在 OP-TEE 中，[driver_init] 和 [driver_init_late] 定义的 `.scattered_array_initcall_1_5` 和 `.scattered_array_initcall_1_6` 段的基本如下：

```bash
root@cd8b134d882e:~/optee/builder/optee/optee_os/core# grep "driver_init(" -R .
./drivers/bnxt/bnxt.c:driver_init(bnxt_init);
./drivers/crypto/caam/caam_ctrl.c:static TEE_Result crypto_driver_init(void)
./drivers/crypto/se050/session.c:driver_init(se050_early_init);
./drivers/stm32_bsec.c:driver_init(initialize_bsec);
./drivers/dra7_rng.c:driver_init(dra7_rng_init);
./drivers/bcm_sotp.c:driver_init(bcm_sotp_init);
./drivers/bcm_gpio.c:driver_init(bcm_gpio_init);
./drivers/imx_wdog.c:driver_init(imx_wdog_init);
./drivers/stm32_rng.c:driver_init(stm32_rng_init);
./drivers/bcm_hwrng.c:driver_init(bcm_hwrng_init);
./drivers/hi16xx_rng.c:driver_init(hi16xx_rng_init);
./arch/arm/plat-synquacer/main.c:driver_init(init_timer_itr);
./arch/arm/plat-stm32mp1/drivers/stm32mp1_pmic.c:driver_init(initialize_pmic);
./arch/arm/plat-stm32mp1/drivers/stm32mp1_syscfg.c:driver_init(stm32mp1_iocomp);
./arch/arm/plat-stm32mp1/plat_tzc400.c:driver_init(init_stm32mp1_tzc);
./arch/arm/plat-hikey/main.c:driver_init(peripherals_init);
./arch/arm/plat-vexpress/main.c:driver_init(init_console_itr);
./arch/arm/plat-sunxi/main.c:driver_init(smc_init);
./arch/arm/plat-imx/drivers/tzc380.c:driver_init(imx_configure_tzasc);
./arch/arm/plat-imx/drivers/imx_csu.c:driver_init(csu_init);
./arch/arm/plat-imx/drivers/imx_scu.c:driver_init(scu_init);
./arch/arm/plat-imx/drivers/imx_caam.c:driver_init(init_caam);
./include/initcall.h:#define driver_init(fn)			__define_initcall(init, 5, fn)
```

以 vexpress 平台为例，`.scattered_array_initcall_1_5`  段的代码会初始化控制台，而该操作是通过执行 [init_console_itr] 函数实现。

## 参考文献
- [OP-TEE OS启动（一）](https://icyshuai.blog.csdn.net/article/details/72638193)
- [OP-TEE OS启动（二）](https://blog.csdn.net/shuaifengyun/article/details/72638272)
- [OP-TEE OS启动（三）--service_init](https://icyshuai.blog.csdn.net/article/details/72655106)
- [OP-TEE OS启动（四）--service_init_late](https://icyshuai.blog.csdn.net/article/details/72657577)
- [OP-TEE OS启动（五）--driver_init和driver_init_late](https://icyshuai.blog.csdn.net/article/details/72663758)

[boot_init_primary]: https://github.com/OP-TEE/optee_os/blob/3.12.0/core/arch/arm/kernel/boot.c#L1185
[boot.c]: https://github.com/OP-TEE/optee_os/blob/3.12.0/core/arch/arm/kernel/boot.c
[check_ta_store]: https://github.com/OP-TEE/optee_os/blob/3.12.0/core/arch/arm/kernel/user_ta.c#L422
[crypto_init]: https://github.com/OP-TEE/optee_os/blob/3.12.0/lib/libmbedtls/core/tomcrypt.c#L10
[device.pta]: https://github.com/OP-TEE/optee_os/blob/3.12.0/core/pta/device.c#L95
[driver_init]: https://github.com/OP-TEE/optee_os/blob/3.12.0/core/include/initcall.h#L43
[driver_init_late]: https://github.com/OP-TEE/optee_os/blob/3.12.0/core/include/initcall.h#L44
[early_ta_init]: https://github.com/OP-TEE/optee_os/blob/3.12.0/core/arch/arm/kernel/early_ta.c#L64
[gprof]: https://github.com/OP-TEE/optee_os/blob/3.12.0/core/pta/gprof.c#L182
[init_console_itr]: https://github.com/OP-TEE/optee_os/blob/3.12.0/core/arch/arm/plat-vexpress/main.c#L121
[init_user_ta]: https://github.com/OP-TEE/optee_os/blob/3.12.0/core/arch/arm/kernel/user_ta.c#L401
[mobj_mapped_shm_init]: https://github.com/OP-TEE/optee_os/blob/3.12.0/core/arch/arm/mm/mobj_dyn_shm.c#L438
[opteed_enter_sp]: https://github.com/sammyne/trusted-firmware-a/blob/v2.3/services/spd/opteed/opteed_helpers.S#L21
[plat_rng_init]: https://github.com/OP-TEE/optee_os/blob/3.12.0/core/tee/tee_cryp_utl.c#L170
[pseudo_ta_register]: https://github.com/OP-TEE/optee_os/blob/3.12.0/core/arch/arm/include/kernel/pseudo_ta.h#L43
[secstor_ta_mgmt]: https://github.com/OP-TEE/optee_os/blob/3.12.0/core/pta/secstor_ta_mgmt.c#L179
[secure_partition_init]: https://github.com/OP-TEE/optee_os/blob/3.12.0/core/arch/arm/kernel/secure_partition.c#L61
[socket]: https://github.com/OP-TEE/optee_os/blob/3.12.0/core/tee/socket.c#L262
[stats.ta]: https://github.com/OP-TEE/optee_os/blob/3.12.0/core/pta/stats.c#L161
[system.pta]: https://github.com/OP-TEE/optee_os/blob/3.12.0/core/pta/system.c#L331
[tee_cryp_init]: https://github.com/OP-TEE/optee_os/blob/3.12.0/core/tee/tee_cryp_utl.c#L211
[tee_fs_init_key_manager]: https://github.com/OP-TEE/optee_os/blob/3.12.0/core/tee/tee_fs_key_manager.c#L277
[verify_pseudo_tas_conformance]: https://github.com/OP-TEE/optee_os/blob/3.12.0/core/arch/arm/kernel/pseudo_ta.c#L286
[_start]: https://github.com/OP-TEE/optee_os/blob/3.12.0/core/arch/arm/kernel/kern.ld.S#L74
[_start-def]: https://github.com/OP-TEE/optee_os/blob/3.12.0/core/arch/arm/kernel/entry_a64.S#L57
[__define_initcall]: https://github.com/OP-TEE/optee_os/blob/3.12.0/core/include/initcall.h#L22
