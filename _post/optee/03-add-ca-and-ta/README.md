---
title: '[optee] 03. 添加自己的 TA 和 CA'
date: 2021-03-22
categories:
  - tee
tags:
  - optee
  - trustzone
---

本章将讲述如何往 OP-TEE 添加自有的 TA 和 CA 程序，并使其运行起来。在前面 [hello world] 的文章搭建 QEMU+OP-TEE 的开发环境基础之上，我们可以开始添加自有的 TA 和 CA 程序了。

> 本教程是用的是 3.12.0 版本的 [optee][optee-gh]，运行环境为 QEMU 虚拟的 ARMv8 架构。

## 1. 源代码及相关目录准备

1. 进入 repo 初始化好的 optee 工作空间（这里假设为 `/home/optee`）
     - 具体命令参见本系列的 [第 1 篇文章][hello world]
2. 切换到 optee_examples 文件夹，可见当前项目结构如下
    ```bash
    cd /home/sammyne/optee/optee_examples

    tree -L 1
    .
    |-- Android.mk
    |-- CMakeLists.txt
    |-- CMakeToolchain.txt
    |-- LICENSE
    |-- Makefile
    |-- README.md
    |-- acipher
    |-- aes
    |-- hello_world
    |-- hotp
    |-- random
    `-- secure_storage

    6 directories, 6 files
    ```

    > 编译打包过程会采用 CMakeLists.txt 规定的 CA 编译逻辑和 Makefile 描述的 TA 编译逻辑。

3. 复制 hello_world 目录为 hello

    ```bash
    cp -r hello_world hello
    ```


4. 调整 `hello` 项目结构如下
	```bash
	tree

	.
	|-- Android.mk
	|-- CMakeLists.txt
	|-- Makefile
	|-- host
	|   |-- Makefile
	|   `-- main.c
	`-- ta
			|-- Android.mk
			|-- Makefile
			|-- hello_ta.c
			|-- include
			|   `-- hello_ta.h
			|-- sub.mk
			`-- user_ta_header_defines.h

	3 directories, 11 files
	```

相关文件说明如下：

|                     文件 | 说明                                                           |
| -----------------------: | :------------------------------------------------------------- |
|               Android.mk | TODO                                                           |
|           CMakeLists.txt | 编译 host 目录的 CMake 描述文件                                |
|                 Makefile | 编译 CA/TA 时使用的 Makefile 文件                              |
|            host/Makefile | host 项目的 Makefile 编译描述文件                              |
|              host/main.c | 存放 CA 代码，CA 的请求最终会被 `TEEC_InvokeCommand` 传递给 TA |
|            ta/Android.mk | TODO                                                           |
|                 Makefile | 编译 host 目录的 Makefile 描述文件                             |
|               hello_ta.c | 存放 TA 代码                                                   |
|       include/hello_ta.h | 定义该 TA 需要使用到的类型，包括 UUID 和可调用的 command ID 宏 |
|                   sub.mk | 定义该 TA 需要被编译的源码                                     |
| user_ta_header_defines.h | 定义 TA UUID、标识符等相关宏                                   |

## 2. 调整 TA 代码

> 高亮行的代码是相对于 hello_world 示例项目的变动。

TA 的逻辑主要是加 `"hello "` 和传入的字符串拼接并返回。

1. 修改 hello/ta/sub.mk 文件，将该 TA 所有的 .c 文件添加到编译文件

	```{2}
	global-incdirs-y += include
	srcs-y += hello_ta.c

	# To remove a certain compiler flag, add a line like this
	#cflags-template_ta.c-y += -Wno-strict-prototypes
	```

2. 修改 hello/ta/include/hello_ta.h 文件，定义该 TA 的 UUID 宏为 `TA_HELLO_UUID`

	```c{1,2,9,14}
	#ifndef TA_HELLO_H
	#define TA_HELLO_H

	/*
	* This UUID is generated with uuidgen
	* the ITU-T UUID generator at http://www.itu.int/ITU-T/asn1/uuid.html
	*/
	#define TA_HELLO_UUID \
		{ 0x9aaaf200, 0x2450, 0x11e4, \
			{ 0xab, 0xe2, 0x00, 0x02, 0xa5, 0xd5, 0xc5, 0x1b} }

	/* The function IDs implemented in this TA */

	#endif /*TA_HELLO_H*/
	```

3. 修改 hello/ta/user_ta_header_defines.h 文件，将 hello_ta.h 文件导入该文件以便获取 UUID 的定义

	```c{4}
	...

	/* To get the TA UUID definition */
	#include <hello_ta.h>

	...
	```

4. 修改 hello/ta/Makefile 文件，将变量 BINARY 的值修改成新增 TA 的 UUID 值

	```makefile{3}
	CFG_TEE_TA_LOG_LEVEL ?= 4

	# The UUID for the Trusted Application
	BINARY=9aaaf200-2450-11e4-abe2-0002a5d5c51b

	...
	```

5. 添加该 TA 的逻辑代码，更新 hello/ta/hello_ta.c 文件如下

	```c
	#include <string.h>

	#include <tee_internal_api.h>
	#include <tee_internal_api_extensions.h>

	#include <hello_ta.h>

	/*
	* Called when the instance of the TA is created. This is the first call in
	* the TA.
	*/
	TEE_Result TA_CreateEntryPoint(void)
	{
		DMSG("has been called");

		return TEE_SUCCESS;
	}

	/*
	* Called when the instance of the TA is destroyed if the TA has not
	* crashed or panicked. This is the last call in the TA.
	*/
	void TA_DestroyEntryPoint(void)
	{
		DMSG("has been called");
	}

	/*
	* Called when a new session is opened to the TA. *sess_ctx can be updated
	* with a value to be able to identify this session in subsequent calls to the
	* TA. In this function you will normally do the global initialization for the
	* TA.
	*/
	TEE_Result TA_OpenSessionEntryPoint(uint32_t param_types,
																			TEE_Param __maybe_unused params[4],
																			void __maybe_unused **sess_ctx)
	{
		uint32_t exp_param_types = TEE_PARAM_TYPES(TEE_PARAM_TYPE_NONE,
																							TEE_PARAM_TYPE_NONE,
																							TEE_PARAM_TYPE_NONE,
																							TEE_PARAM_TYPE_NONE);

		DMSG("has been called");

		if (param_types != exp_param_types)
			return TEE_ERROR_BAD_PARAMETERS;

		/* Unused parameters */
		(void)&params;
		(void)&sess_ctx;

		/*
		* The DMSG() macro is non-standard, TEE Internal API doesn't
		* specify any means to logging from a TA.
		*/
		IMSG("Hello World!\n");

		/* If return value != TEE_SUCCESS the session will not be created. */
		return TEE_SUCCESS;
	}

	/*
	* Called when a session is closed, sess_ctx hold the value that was
	* assigned by TA_OpenSessionEntryPoint().
	*/
	void TA_CloseSessionEntryPoint(void __maybe_unused *sess_ctx)
	{
		(void)&sess_ctx; /* Unused parameter */
		IMSG("Goodbye!\n");
	}

	static TEE_Result say_hello(uint32_t param_types, TEE_Param params[4])
	{
		uint32_t expected_param_types = TEE_PARAM_TYPES(
				TEE_PARAM_TYPE_MEMREF_INOUT,
				TEE_PARAM_TYPE_NONE,
				TEE_PARAM_TYPE_NONE,
				TEE_PARAM_TYPE_NONE);

		// length of "hello "
		const size_t GREETING_LEN = 6;
		const char *who = (const char *)(params[0].memref.buffer);

		if (param_types != expected_param_types)
		{
			return TEE_ERROR_BAD_PARAMETERS;
		}

		char *buf = TEE_Malloc(strlen(who) + GREETING_LEN + 1, 0);
		if (!buf)
		{
			return TEE_ERROR_OUT_OF_MEMORY;
		}

		MSG("requester is %s\n", who);

		sprintf(buf, "hello %s", who);

		params[0].memref.size = strlen(buf) + 1;
		TEE_MemMove(params[0].memref.buffer, buf, params[0].memref.size);
		TEE_Free(buf);

		return TEE_SUCCESS;
	}

	/*
	* Called when a TA is invoked. sess_ctx hold that value that was
	* assigned by TA_OpenSessionEntryPoint(). The rest of the paramters
	* comes from normal world.
	*/
	TEE_Result TA_InvokeCommandEntryPoint(
			void __maybe_unused *sess_ctx,
			uint32_t __maybe_unused cmd_id, uint32_t param_types, TEE_Param params[4])
	{
		(void)&sess_ctx; /* Unused parameter */

		return say_hello(param_types, params);
	}
	```


## 3. 调整 CA 代码

CA 代码存放在 hello/host 目录。

1. 修改 hello/CMakeLists.txt 文件

	```cmake{1}
	project (optee_example_hello C)

	set (SRC host/main.c)

	add_executable (${PROJECT_NAME} ${SRC})

	target_include_directories(${PROJECT_NAME}
					PRIVATE ta/include
					PRIVATE include)

	target_link_libraries (${PROJECT_NAME} PRIVATE teec)

	install (TARGETS ${PROJECT_NAME} DESTINATION ${CMAKE_INSTALL_BINDIR})
	```

2. 更新 hello/host/main.c 文件

	```c
	#include <err.h>
	#include <stdio.h>
	#include <string.h>

	/* OP-TEE TEE client API (built by optee_client) */
	#include <tee_client_api.h>

	/* For the UUID (found in the TA's h-file(s)) */
	#include <hello_ta.h>

	int main(void)
	{
		TEEC_Result res;
		TEEC_Context ctx;
		TEEC_Session sess;
		TEEC_Operation op;
		TEEC_UUID uuid = TA_HELLO_UUID;
		uint32_t err_origin;

		// pre-allocate enough space for hold the output string
		char WHO[32] = "sammyne";

		/* Initialize a context connecting us to the TEE */
		res = TEEC_InitializeContext(NULL, &ctx);
		if (res != TEEC_SUCCESS)
			errx(1, "TEEC_InitializeContext failed with code 0x%x", res);

		/*
		* Open a session to the "hello world" TA, the TA will print "hello
		* world!" in the log when the session is created.
		*/
		res = TEEC_OpenSession(
				&ctx, &sess, &uuid, TEEC_LOGIN_PUBLIC, NULL, NULL, &err_origin);
		if (res != TEEC_SUCCESS)
			errx(1, "TEEC_Opensession failed with code 0x%x origin 0x%x",
					res, err_origin);

		/*
		* Execute a function in the TA by invoking it, in this case
		* we're incrementing a number.
		*
		* The value of command ID part and how the parameters are
		* interpreted is part of the interface provided by the TA.
		*/

		/* Clear the TEEC_Operation struct */
		memset(&op, 0, sizeof(op));

		/*
		* Prepare the argument. Pass a value in the first parameter,
		* the remaining three parameters are unused.
		*/
		op.paramTypes = TEEC_PARAM_TYPES(TEEC_MEMREF_TEMP_INOUT, TEEC_NONE, TEEC_NONE, TEEC_NONE);
		op.params[0].tmpref.buffer = WHO;
		op.params[0].tmpref.size = strlen(WHO) + 1;

		res = TEEC_InvokeCommand(&sess, 0, &op, &err_origin);
		if (res != TEEC_SUCCESS)
		{
			errx(1, "TEEC_InvokeCommand failed with code 0x%x origin 0x%x", res, err_origin);
		}

		const char *greeting = (const char *)(op.params[0].tmpref.buffer);
		printf("greeting from TA: %s\n", greeting);

		/*
		* We're done with the TA, close the session and
		* destroy the context.
		*
		* The TA will print "Goodbye!" in the log when the
		* session is closed.
		*/

		TEEC_CloseSession(&sess);

		TEEC_FinalizeContext(&ctx);

		return 0;
	}
	```

## 4. 编译 TA 和 CA 代码

参照 [第 1 篇文章][hello world] 编译整个项目。如果复用之前编译过的项目，只需借助 buildroot 重新打包生成 rootfs 即可，命令如下

```bash
make buildroot -j
```

## 5. 测试添加新 TA 和 CA

```bash
# 本文假设已初始化 optee 的工作目录为 /root/optee
cd /root/optee/build

make run-only
```

按照 [之前][hello world] 的教程摁下 `c` 打开安全世界和常规世界的终端。在常规世界的终端登录 `root` 账户，并运行 `/usr/bin/optee_example_hello`

```bash
Welcome to Buildroot, type root or test to login
buildroot login: root
# /usr/bin/optee_example_hello
optee_example_hello        optee_example_hello_world
# /usr/bin/optee_example_hello 
greeting from TA: hello sammyne
# 
```

可见 TA 成功向 CA 返回 `hello sammyne` 消息 :smile: 。

## 参考文献

- [OP-TEE 中添加自己的 TA 和 CA](https://icyshuai.blog.csdn.net/article/details/71517567)

[hello world]: /_post/optee/01-hello-world/
[optee-gh]: https://github.com/OP-TEE/optee_os/tree/3.12.0

