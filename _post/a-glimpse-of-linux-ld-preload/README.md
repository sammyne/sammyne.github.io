---
title: 'Linux 下 `LD_PRELOAD` 的初探'
date: 2020-12-23
categories:
  - dev
tags:
  - linux
  - c
  - debug
---

## 简介

`LD_PRELOAD` 是个环境变量，用于动态库的加载，其动态库加载的优先级最高。一般情况下，其加载优先级从高到低依次为

```
LD_PRELOAD > LD_LIBRARY_PATH > /etc/ld.so.cache > /lib>/usr/lib
```

## 自定义函数替换外部库函数

程序经常要调用一些外部库的函数，例如 `rand`。如果我们自定义一个 `rand` 函数，将其编译成动态库后，通过 `LD_PRELOAD` 加载。当程序调用 `rand` 函数时，调用的其实是我们自定义的函数。举个栗子如下。

### 实验环境

以下 Dockerfile 配置的容器镜像

```docker
FROM alpine:3.12.3

RUN apk update && apk add build-base
```

### 链接系统的 `rand()`

1. 可行执行程序源码如下

   ```c
   // test_fakerand.c

   #include <stdio.h>
   #include <stdlib.h>
   #include <time.h>

   int main()
   {
     srand(time(NULL));

     int i = 10;
     while (i--)
     {
       printf("%d\n", rand() % 100);
     }

     return 0;
   }
   ```

2. 执行

   ```bash
   gcc -g -o test_fakerand test_fakerand.cxx

   ./test_fakerand

   # 输出
   22
   54
   34
   15
   95
   ```

### 链接自定义的 `rand()`

1. 自定义 `rand()` 函数如下

   ```c
   // fakerand.c

   int rand(){
     return 42; // 不能再假的随机数
   }
   ```

2. 编成动态库
   ```bash
   # 注意：用 C 的编译风格确保函数不会被重命名，C++ 的话需要添加 `extern "C"` 包裹链接的函数
   gcc -shared -fPIC fakerand.c -o libfakerand.so
   ```
3. 运行

   ```bash
   LD_PRELOAD=$PWD/libfakerand.so ./test_fakerand
   # 或以下两条命令
   # export LD_PRELOAD=$PWD/libfakerand.so
   # ./test_fakerand

   # 输出
   42
   42
   42
   42
   42
   ```

可见，我们已经成功将 `rand` 函数替换为自定义版。

使用 `ldd` 工具可以查看两种运行方式各自加载的动态库。

- 直接运行时，由于没有加载 libfakerand.so，使用系统的 `rand` 函数

  ```bash
  ldd test_fakerand

  # 输出
    /lib/ld-musl-x86_64.so.1 (0x7f4516990000)
    libc.musl-x86_64.so.1 => /lib/ld-musl-x86_64.so.1 (0x7f4516990000)
  ```

- 指定 `LD_PRELOAD=$PWD/libfakerand.so`后，使用 `ldd` 查看所加载的 `so` 列表中有自定义的 libfakerand.so。由于 `LD_PRELOAD` 加载顺序最高，因此会优先使用 `libfakerand.so` 的 `rand` 函数

  ```bash
  LD_PRELOAD=$PWD/libfakerand.so ldd test_fakerand

  # 输出
    /lib/ld-musl-x86_64.so.1 (0x7f884894b000)
    /workspace/examples/libfakerand.so => /workspace/examples/libfakerand.so (0x7f8848941000)
    libc.musl-x86_64.so.1 => /lib/ld-musl-x86_64.so.1 (0x7f884894b000)
  ```

使用 `nm -D` 命令可以查看动态库 `libfakerand.so` 的符号。

```bash
nm -D libfakerand.so

# 输出
                 w _ITM_deregisterTMCloneTable
                 w _ITM_registerTMCloneTable
                 w __cxa_finalize
                 w __deregister_frame_info
                 w __register_frame_info
000000000000116c T _fini
0000000000001000 T _init
000000000000113f T rand
```

## 自定义函数替换外部同名库函数

下面的例子我们想封装一个 `open` 函数，其内部调用 `libc` 的 `open`函数。

```c
int open(const char *pathname, int flags){
  // ...
  // 一些恶意注入的代码
  // ...

  // 调用 "真正的" open 函数，在此有 libc.so 提供
  return open(pathname, flags);
}
```

这种写法会导致递归调用。

那如何在自定义库中调用真正的 `open` 函数呢？一种姿势如下

1. 自定义 `open` 函数

   ```c
   # fakeopen.c

   #include <dlfcn.h>
   #include <stdio.h>

   typedef int (*orig_open_func_type)(const char *pathname, int flags);

   int open(const char *pathname, int flags, ...)
   {
       // ...
       // 一些恶意注入的代码
       // ...
       printf("The victim used open(...) to access '%s'!!!\n", pathname);

       // 别忘了包含 stdio.h!
       orig_open_func_type orig_open = (orig_open_func_type) dlsym(RTLD_NEXT, "open");

       return orig_open(pathname, flags);
   }
   ```

2. 编译生成动态库 `libfake_open.so`
   ```bash
   gcc -shared -fPIC -o libfake_open.so fakeopen.c -ldl
   ```

::: tip 温馨提示  
`RTLD_NEXT` 的 man 手册解释如下：  
There are two special pseudo-handles, RTLD_DEFAULT and RTLD_NEXT. The former will find the first occurrence of the desired symbol using the default library search order. The latter will find the next occurrence of a function in the search order after the current library. This allows one to provide a wrapper around a function in another shared library.

换句话说，`RTLD_DEFAULT` 基于默认加载顺序查找第一个满足要求的函数，而 `RTLD_NEXT` 则是在当前库之后查找第一次出现的函数。
:::

3. 编写测试程序

   ```c
   // test_fakeopen.c

   #include <stdio.h>
   #include <sys/types.h>
   #include <sys/stat.h>
   #include <fcntl.h>
   #include <string.h>
   #include <errno.h>
   #include <unistd.h>

   int main(int argc, char *argv[])
   {
       int fd;

       if(2 != argc)
       {
           printf("Usage :  \n");
           return 1;
       }

       errno = 0;
       fd = open(argv[1],O_RDONLY|O_CREAT, S_IRWXU);

       if(-1 == fd)
       {
           printf("open() failed with error [%s]\n", strerror(errno));
           return 1;
       }
       else
       {
           printf("open() Successful.\n");
       }

       return 0;
   }
   ```

4. 编译并运行测试程序可执行文件

   ```bash
   gcc -g -o test_fakeopen test_fakeopen.c

   # 不替换 open 函数
   ./test_fakeopen fakerand.c

   ## 输出
   open() Successful.

   # 替换 open 函数
   LD_PRELOAD=/workspace/examples/libfakeopen.so ./test_fakeopen fakerand.c

   ## 输出
   The victim used open(...) to access 'fakerand.c'!!!
   open() Successful.
   ```

## 参考文献

- [Dynamic linker tricks: Using LD_PRELOAD to cheat, inject features and investigate programs](https://rafalcieslak.wordpress.com/2013/04/02/dynamic-linker-tricks-using-ld_preload-to-cheat-inject-features-and-investigate-programs/)
- [Linux 下 LD_PRELOAD 的简单用法](http://www.52coder.net/post/ld-preload)
