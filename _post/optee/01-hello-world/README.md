---
title: '[optee] 01. hello world'
date: 2021-03-01
categories:
  - tee
tags:
  - optee
  - trustzone
---

## 背景
由于在线支付和互联网的发展，在手机和互联网电视领域，甚至物联网领域安全越来越显得重要。而 android 一直被诟病的就是运行速度慢和安全问题。关于安全问题，这点无可厚非，谁叫 android 是开源的呢？由于安全问题的严重性，google 规定在 android 7.0 之后要求厂商必须使用 TEE 来保护用户的生物特征数据（指纹，虹膜等）。

为确保用户的数据的安全，ARM 公司提出了 trustzone 技术，个人将 trustzone 理解为 cortex 的虚拟化技术。ARM 在 AXI 系统总线上添加了一根额外的安全总线，称为 NS 位，并将 cortex 分为两种状态：secure world 和 non-secure world，并添加了一种叫做 monitor 的模式，cortex 根据 NS 的值来判定当前指令操作是需要安全操作还是非安全操作，并结合自身是属于 secure world 状态还是 non-secure 状态来判定是否需要执行当前的指令操作。而 cortex 的 secure world 和 non-secure world 状态之间的切换由 monitor 来完成，最近由于 ATF（arm trusted firmware）的给出，cortex 的状态切换操作都是在 ATF 中完成。当 cortex 处于 secure world 状态时，cortex 会去执行 TEE(Trusted execute enviorment) OS 部分的代码，当 cortex 处于 non-secure world 状态时，cortex 回去执行 linux kernel 部分的代码。而 linux kernel 是无法访问 TEE 部分所有资源，只能通过特定的 TA(Trust Application) 和 CA(Client Application) 来访问 TEE 部分特定的资源。关于 TEE 和 trustzone 的更加详细资料在网上有一大堆，在次就不做过多的冗述。

TEE 是基于 trustzone 技术搭建的安全执行环境。当 cortex 处于 secure world 态时，cortex 执行的是 TEE OS 的代码。而当前全世界并未有一个统一的 TEE OS，各家厂商和组织都有各自的实现方式，但是所有的方案的外部接口都会遵循 GP（GlobalPlatform）标准。所有对于二级厂商来说，使用更加方便。当前具有自己 TEE 解决方案的厂商有：高通的 Qsee, Trustonic 的 tee OS，OP-TEE OS，opentee，海思，Mstar，VIA，豆荚科技等，笔者使用过上述几家厂商中的大部分，外部接口统一，只是 TA 的添加和加载时的校验有所区别。

由于各厂商的 TEE OS 都属于闭源的，所以关于内部的 SMC 响应机制，TEE OS 内个进程的调度机制，TZPC 的相关配置等都无法详细了解。

本文以 OP-TEE 为例。在 QEMU 上搭建 OP-TEE 的运行环境，后续章节将会介绍添加自有 TA 和 CA、工程编译、启动机制等其他更加详细的内容。

## hello-world 示例程序

::: warning 注意事项
演示环境为 VMware Fusion Player 12.1.0 下的 ubuntu 20.04。
:::

### 0. [可选] 替换 apt 源
```bash
# Ubuntu 图形安装器会根据用户设定的时区推断 locale，这导致默认的源地址通常不是 http://archive.ubuntu.com/， 而是 http://<country-code>.archive.ubuntu.com/ubuntu/ ，如 http://cn.archive.ubuntu.com/ubuntu/， 此时只需将上面的命令进行相应的替换即可

sudo sed -i 's/us.archive.ubuntu.com/mirrors.ustc.edu.cn/g' /etc/apt/sources.list

sudo sed -i 's/security.ubuntu.com/mirrors.ustc.edu.cn/g' /etc/apt/sources.list
```

### 1. 安装依赖

```bash
# @see https://optee.readthedocs.io/en/latest/building/prerequisites.html#prerequisites

sudo apt update

sudo dpkg --add-architecture i386

sudo apt update

#	ubuntu 20.04 has dropped python-serial
sudo apt install -y android-tools-adb android-tools-fastboot autoconf 			\
	automake bc bison build-essential ccache cscope curl device-tree-compiler \
	expect flex ftp-upload gdisk iasl libattr1-dev libcap-dev 								\
	libfdt-dev libftdi-dev libglib2.0-dev libhidapi-dev libncurses5-dev 			\
	libpixman-1-dev libssl-dev libtool make 																	\
	mtools netcat python-crypto python3-crypto python-pyelftools 							\
	python3-pycryptodome python3-pyelftools python3-serial 										\
	rsync unzip uuid-dev xdg-utils xterm xz-utils zlib1g-dev

sudo apt install -y git cmake

sudo ln -sf /usr/bin/python3 /usr/bin/python
```

### 2. 下载并配置 git-repo

```bash
set -e

git clone -b v2.12.2 http://mirrors.ustc.edu.cn/aosp/git-repo.git

chmod u+x git-repo/repo

sudo cp git-repo/repo /usr/bin/

repo --version

echo "export REPO_URL='https://gerrit-googlesource.lug.ustc.edu.cn/git-repo'" >> ~/.bashrc
echo "export REPO_REV=v2.12.2" >> ~/.bashrc

source ~/.bashrc

rm -rf git-repo
```

### 3. 下载 optee 代码

```bash
source ~/.bashrc

workdir=$PWD/optee

rm -rf $workdir
mkdir -p $workdir

cd $workdir

git config --global url."https://hub.fastgit.org".insteadOf https://github.com

git config --global user.email "optee@optee.com"
git config --global user.name "optee"

repo init -b 3.12.0 -u https://github.com/OP-TEE/manifest.git -m qemu_v8.xml

repo sync
```

> 后续步骤用 `opteeDir` 变量表示拉取到的 optee 代码。

### 4. 替换部分软件源

> 主要是为了解决翻墙问题。

```bash
buildDir=$opteeDir/build

binrel=https://developer.arm.com/-/media/Files/downloads/gnu-a/9.2-2019.12/binrel
fastgit=hub.fastgit.org
github=https://hub.fastgit.org/sammyne/gcc-arm/releases/download/9.2-2019.12

sed -i "s!$binrel!$github!g" $buildDir/toolchain.mk
sed -i "s!https://github.com!https://$fastgit!g" $buildDir/get_clang.sh
```

### 5. 配置工具链

```bash
# @see https://optee.readthedocs.io/en/latest/building/toolchains.html

buildDir=$opteeDir/build
cd $buildDir

rm -rf ../toolchains

# 3.12.0 miss SHELL setting, which trigger bad substitution error
if [ -z "$(grep '^SHELL' toolchain.mk)" ]; then
  sed -i '1i\SHELL = /bin/bash' toolchain.mk
fi

make -f toolchain.mk
```

### 6. 编译

> 编译过程需要回答问题，添加 `DEBIAN_FRONTEND=noninteractive` 环境变量可能可以减去交互的麻烦。

```bash
cd $opteeDir/build


make
```

### 7. 启动

```bash
cd $opteeDir/build

make run
```

上述命令会启动一个 QEMU 控制台，这个控制台还会开辟两个 UART 控制台，分别连接安全世界和常规世界。

QEMU 控制台的最后几行输出
```bash
make[1]: Entering directory '/home/sammyne/Workspace/optee/build'
ln -sf /home/sammyne/Workspace/optee/build/../out-br/images/rootfs.cpio.gz /home/sammyne/Workspace/optee/build/../out/bin/

* QEMU is now waiting to start the execution
* Start execution with either a 'c' followed by <enter> in the QEMU console or
* attach a debugger and continue from there.
*
* To run OP-TEE tests, use the xtest command in the 'Normal World' terminal
* Enter 'xtest -h' for help.

# Option “-x” is deprecated and might be removed in a later version of gnome-terminal.
# Use “-- ” to terminate the options and put the command line to execute after it.
# Option “-x” is deprecated and might be removed in a later version of gnome-terminal.
# Use “-- ” to terminate the options and put the command line to execute after it.
cd /home/sammyne/Workspace/optee/build/../out/bin && /home/sammyne/Workspace/optee/build/../qemu/aarch64-softmmu/qemu-system-aarch64 \
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
(qemu)
```

安全世界的控制台输出
```bash
listening on port 54321
soc_term: accepted fd 4
soc_term: read fd EOF
soc_term: accepted fd 4
```

常规世界的控制台输出
```bash
listening on port 54320
soc_term: accepted fd 4
soc_term: read fd EOF
soc_term: accepted fd 4
```

然后，QEMU 控制会等待用户输入，敲入 `c` 并回车即可继续后续步骤。此时

- 安全世界的控制台最后的部分输出如下
```bash
# ...
I/TC: Primary CPU switching to normal world boot
I/TC: Secondary CPU 1 initializing
D/TC:1   select_vector:1126 SMCCC_ARCH_WORKAROUND_1 (0x80008000) available
D/TC:1   select_vector:1128 SMC Workaround for CVE-2017-5715 used
I/TC: Secondary CPU 1 switching to normal world boot
D/TC:0   tee_entry_exchange_capabilities:102 Dynamic shared memory is enabled
D/TC:0 0 core_mmu_entry_to_finer_grained:750 xlat tables used 7 / 8
D/TC:? 0 tee_ta_init_pseudo_ta_session:299 Lookup pseudo TA 7011a688-ddde-4053-a5a9-7b3c4ddf13b8
D/TC:? 0 tee_ta_init_pseudo_ta_session:312 Open device.pta
D/TC:? 0 tee_ta_init_pseudo_ta_session:329 device.pta : 7011a688-ddde-4053-a5a9-7b3c4ddf13b8
D/TC:? 0 tee_ta_close_session:514 csess 0xe43e99f0 id 1
D/TC:? 0 tee_ta_close_session:533 Destroy session
D/TC:? 0 tee_ta_init_session_with_context:609 Re-open TA 7011a688-ddde-4053-a5a9-7b3c4ddf13b8
D/TC:? 0 tee_ta_close_session:514 csess 0xe43e9840 id 1
D/TC:? 0 tee_ta_close_session:533 Destroy session
```

- 常规世界的控制台最后**部分**输出
```bash
# ...
[    2.285240] optee: revision 3.12 (3d47a131)
[    2.289375] optee: dynamic shared memory is enabled
[    2.311266] optee: initialized driver
[    2.320481] NET: Registered protocol family 17
[    2.325807] 9pnet: Installing 9P2000 support
[    2.329443] Key type dns_resolver registered
[    2.335122] registered taskstats version 1
[    2.336807] Loading compiled-in X.509 certificates
[    2.407603] input: gpio-keys as /devices/platform/gpio-keys/input/input0
[    2.415790] ALSA device list:
[    2.417193]   No soundcards found.
[    2.427490] uart-pl011 9000000.pl011: no DMA platform data
[    2.535391] Freeing unused kernel memory: 5760K
[    2.538201] Run /init as init process
Starting syslogd: OK
Starting klogd: OK
Running sysctl: OK
Saving random seed: OK
Set permissions on /dev/tee*: OK
Set permissions on /dev/ion: OK
Create/set permissions on /data/tee: OK
Starting tee-supplicant: OK
Starting network: OK
Starting network (udhcpc): OK

Welcome to Buildroot, type root or test to login
buildroot login:
```

可见常规世界在等待登录。

### 8. 运行示例程序
在常规世界的控制台依次执行以下步骤

1. 以 root 账户登录常规世界
  ```bash
  Welcome to Buildroot, type root or test to login
  buildroot login: root
  #
  ```

2. 运行 `optee_example_hello_world` 程序，可得预期输出如下
  ```bash
  # /usr/bin/optee_example_hello_world 
  Invoking TA to increment 42
  TA incremented value to 43
  # 
  ```

### 9. 关闭 QEMU
在 QEMU 控制台输出 `q`，然后回车即可退出。

## 参考文献
- [使用Qemu运行OP-TEE](https://blog.csdn.net/shuaifengyun/article/details/71499619?spm=1001.2014.3001.5501)
- [Get and build the solution](https://optee.readthedocs.io/en/latest/building/gits/build.html#get-and-build-the-solution)
