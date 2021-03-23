---
title: '[optee] 05. run-only 目标'
date: 2021-03-23
categories:
  - tee
tags:
  - optee
  - trustzone
---

> 本教程是用的是 3.12.0 版本的 [optee][optee-gh]，运行环境为 QEMU 虚拟的 ARMv8 架构。

使用 QEMU 模拟运行 OP-TEE 时，需要在 build 目录执行 `make run-only`命令。本文介绍这个 `run-only` 目标涉及的相关内容。

## 1. run-only 目标内容

Makefile（qemu_v8.mk）文件关于 `run-only` 目标的定义如下：

```makefile
.PHONY: run-only
run-only:
	ln -sf $(ROOT)/out-br/images/rootfs.cpio.gz $(BINARIES_PATH)/
	$(call check-terminal)
	$(call run-help)
	$(call launch-terminal,54320,"Normal World")
	$(call launch-terminal,54321,"Secure World")
	$(call wait-for-ports,54320,54321)
	cd $(BINARIES_PATH) && $(QEMU_PATH)/aarch64-softmmu/qemu-system-aarch64 \
		-nographic \
		-serial tcp:localhost:54320 -serial tcp:localhost:54321 \
		-smp $(QEMU_SMP) \
		-s -S -machine virt,secure=on -cpu cortex-a57 \
		-d unimp -semihosting-config enable,target=native \
		-m 1057 \
		-bios bl1.bin \
		-initrd rootfs.cpio.gz \
		-kernel Image -no-acpi \
		-append 'console=ttyAMA0,38400 keep_bootcon root=/dev/vda2' \
		$(QEMU_EXTRA_ARGS)
```

此目标执行的相关函数都定义在在 build 目录的相关文件，大致介绍如下：

- `ln -sf $(ROOT)/out-br/images/rootfs.cpio.gz $(BINARIES_PATH)/`：将编译打包好的 rootfs.cpio.gz 软链接到 `BINARIES_PATH`--out/bin 指向的目录 
- `$(call check-terminal)`：`check-terminal` 函数定义在 [build/common.mk][check-terminal] 文件。在我们的当前场景下，build/common.mk 检测到 ubuntu 20.04.1 的 gnome-terminal 可用，使得此函数的定义无效
- `$(call run-help)`：`run-help` 函数定义在 [build/commom.mk][run-help] 文件，主要用来打印出相关的帮助信息
- `$(call launch-terminal,54320,"Normal World")`：执行 `launch-terminal,54320,"Normal World"`，其中`launch-terminal` 定义在 [build/common.mk][launch-terminal] 文件
- `$(call launch-terminal,54321,"Secure World")`：执行功能同上，只是重定向时将端口换成 54321，且启动的终端名字为 `Secure World`
- `$(call wait-for-ports,54320,54321)`：调用定义在 build/common.mk 文件的 [wait-for-ports] 函数，主要功能是检查上面启动的两个终端 socket 通信是否正常
- `$(QEMU_PATH)/arm-softmmu/qemu-system-aarch64`：调用 `qemu-system-aarch64` 可执行文件并设定好 QEMU 启动的各种参数，然后开始启动 linux 和 OP-TEE。部分参数说明如下

    |      参数 | 说明                                                                     |
    | --------: | :----------------------------------------------------------------------- |
    | nographic | 不显示图形界面                                                           |
    |    serial | 将串口重定向到后面的参数部分                                             |
    |         S | 使用 `c` 来控制启动（在 QEMU 的控制台界面输入 `c` 之后才会正式启动系统） |
    |         m | 设定虚拟的内存大小                                                       |
    |      bios | 指定 BIOS 的文件（该 image 会包含 OP-TEE、linux、rootfs 的镜像）         |


`make run-only` 成功执行之后，在 QEMU 的控制台输入字母 `c`，回车即可正式启动 linux+OP-TEE。

```bash
sammyne@ubuntu:~/Workspace/v8/optee/build$ make run-only
ln -sf /home/sammyne/Workspace/v8/optee/build/../out-br/images/rootfs.cpio.gz /home/sammyne/Workspace/v8/optee/build/../out/bin/

* QEMU is now waiting to start the execution
* Start execution with either a 'c' followed by <enter> in the QEMU console or
* attach a debugger and continue from there.
*
* To run OP-TEE tests, use the xtest command in the 'Normal World' terminal
* Enter 'xtest -h' for help.

cd /home/sammyne/Workspace/v8/optee/build/../out/bin && /home/sammyne/Workspace/v8/optee/build/../qemu/aarch64-softmmu/qemu-system-aarch64 \
	-nographic \
	-serial tcp:localhost:54320 -serial tcp:localhost:54321 \
	-smp 2 \
	-s -S -machine virt,secure=on -cpu cortex-a57 \
	-d unimp -semihosting-config enable,target=native \
	-m 1057 \
	-bios bl1.bin \
	-initrd rootfs.cpio.gz \
	-kernel Image -no-acpi \
	-append 'console=ttyAMA0,38400 keep_bootcon root=/dev/vda2' \
	-object rng-random,filename=/dev/urandom,id=rng0 -device virtio-rng-pci,rng=rng0,max-bytes=1024,period=1000 -netdev user,id=vmnic -device virtio-net-device,netdev=vmnic
QEMU 5.1.0 monitor - type 'help' for more information
(qemu) c
(qemu) pflash_write: Write to buffer emulation is flawed
pflash_write: Write to buffer emulation is flawed
```

## 2. launch-terminal 函数
[launch-terminal] 函数用于启动终端，定义在 build/common.mk 文件。具体内容如下：

```makefile
define launch-terminal
	@nc -z  127.0.0.1 $(1) || \
	$(gnome-terminal) -x $(SOC_TERM_PATH)/soc_term $(1) &
endef
```

[$(gnome-terminal)][gnome-ternal] 的定义也在 build/common.mk 文件，定义如下：

```makefile
gnome-terminal := $(shell command -v gnome-terminal 2>/dev/null)
```

所以调用 `$(call launch-terminal,54320,"Normal World")` 等价于 `gnome-terminal -t "Normal World" -x $(SOC_TERM_PATH)/soc_term 54320`。

该函数的作用是启动一个名字为 `Normal World` 的终端，并且在终端执行 `soc_term 54320`，而 soc_term 是 soc_term 目录编译出来的可执行文件。执行 `soc_term 54320` 命令的主要作用是将该终端的输入输出通过 54320 端口重新定向标准输入和标准输出。

## 3. soc_term 可执行文件
soc_term 可执行文件实现 normal world 和 secure world 两个终端输入和输出重定向到标准输入输出。该可执行文件的源码存放在 soc_term 目录，其中部分函数如下

```c
// ...

// server_fd 函数负责接收到监控端口的数据，并执行重定向操作
static void serve_fd(int fd)
{
	uint8_t buf[512];
	struct pollfd pfds[2];

  // 设定 pollfd 参数，用于实现重定向操作
	memset(pfds, 0, sizeof(pfds));
	pfds[0].fd = STDIN_FILENO;
	pfds[0].events = POLLIN;
	pfds[1].fd = fd;
	pfds[1].events = POLLIN;


	while (true) {
		size_t n;

		if (poll(pfds, 2, -1) == -1)  // 获取监听事件的 pfds[0] 和 pfds[1] 定义的事件
			err(1, "poll");

		if (pfds[0].revents & POLLIN) { // 如果 pfds[0] 的 POLLIN 事件触发（在该终端的标准输入有输入操作），则进行读取操作
			n = read(STDIN_FILENO, buf, sizeof(buf));
			if (n == -1)
				err(1, "read stdin");
			if (n == 0)
				errx(1, "read stdin EOF");

			/* TODO handle case when this write blocks */
			if (!write_buf(fd, buf, n)) { // 将读取到的数据写入重定向端口捆绑的 socket 
				warn("write_buf fd");
				break;
			}
		}

    // 如果 pfds[1] 的 POLLIN 事件触发（监测到该终端的端口捆绑的 socket 有输入流操作），
    // 则读取监测的端口所对应 socket 句柄的数据
		if (pfds[1].revents & POLLIN) {
			n = read(fd, buf, sizeof(buf)); // 读取与端口捆绑的 socket 句柄的数据
			if (n == -1) {
				warn("read fd");
				break;
			}
			if (n == 0) {
				warnx("read fd EOF");
				break;
			}
			handle_telnet_codes(fd, buf, &n);

			if (!write_buf(STDOUT_FILENO, buf, n)) // 将读取到的数据写入到该终端的标准输出
				err(1, "write_buf stdout");
		}
	}
}

int main(int argc, char *argv[])
{
	int listen_fd;
	char *port;
	bool have_handle_telnet_option = false;

	switch (argc) {
	case 2:
		port = argv[1];
		break;
	case 3:
		if (strcmp(argv[1], "-t") != 0)
			usage();
		have_handle_telnet_option = true;
		port = argv[2];
		break;
	default:
		usage();
	}

	save_current_termios(); // 获取当前的终端信息（标准输入输出的终端配置）

	listen_fd = get_listen_fd(port); // 建立 socket 机制，并监听输入的端口号

	printf("listening on port %s\n", port);
	if (have_handle_telnet_option)  // 判定是否使用 telent
		printf("Handling telnet commands\n");

	while (true) { // 进入循环，完成端口监听和输入输出的重定向
		int fd = accept_fd(listen_fd); // 开始接收建立的监听端口的信息

		handle_telnet = have_handle_telnet_option;
		handle_telnet_codes(-1, NULL, NULL); /* Reset internal state */ // 使用 telent 时不起作用

		warnx("accepted fd %d", fd);
		set_tty_noncanonical(); // 拷贝当前终端信息并配置其他参数，然后条用 tcsetattr 函数来设定当前启动的终端信息
		serve_fd(fd); // 开始处理监听收到的数据，并对应的 revent 进行重定向操作，server_fd 函数的注释见后续小节

		if (close(fd))  // 处理完成之后关闭 fd 
			err(1, "close");
		fd = -1;
		restore_termios();  // 保存当前 terminos 的配置
	}
}
```

[check-terminal]: https://github.com/OP-TEE/build/blob/3.12.0/common.mk#L425
[gnome-ternal]: https://github.com/OP-TEE/build/blob/3.12.0/common.mk#L411
[launch-terminal]: https://github.com/OP-TEE/build/blob/3.12.0/common.mk#L414
[optee-gh]: https://github.com/OP-TEE/optee_os/tree/3.12.0
[run-help]: https://github.com/OP-TEE/build/blob/3.12.0/common.mk#L394
[wait-for-ports]: https://github.com/OP-TEE/build/blob/3.12.0/common.mk#L430
