---
title: '[iptables] 02. 规则查询'
date: 2021-01-03
categories:
  - network
tags:
  - iptables
  - linux
  - ops
---

::: tip 温馨提示
本文从理论到实践，系统地介绍 iptables。如果你想要从头开始了解 iptables，可以查看 [iptables 系列文章][iptables series]。
:::

在阅读这篇文章之前，请确保你已经阅读了本系列总结 iptables 相关概念的 [上一篇文章][iptables-01-concepts]，那是阅读这篇文章的基础。

如果你是一个新手，读的过程中可能会有障碍，但是在读完以后，你会豁然开朗。

::: danger 高能预警
在进行 iptables 实验时，请务必在测试机上进行。本文的实验操作环境为 VMware Fusion 12.0 下的 Ubuntu 20.04.1。
:::

## 查询操作

之前在 [iptables 的概念][iptables-01-concepts] 已经提到过：实际操作 iptables 的过程是以"表"作为操作入口的。如果经常操作关系型数据库，听到"表"这个词时，你可能会联想到另一个词--"增删改查"。当我们定义 iptables 规则时，所做的操作其实类似于"增删改查"。接下来，我们先从最简单的"查"操作入手，开始实际操作 iptables。

[之前的文章][iptables-01-concepts] 已经总结过，iptables 预定义了功能不同的 4 张表，它们分别是 raw、mangle、nat 和 filter 表。

filter 负责过滤功能，比如

- 允许/禁止哪些 IP 地址访问
- 允许/禁止访问哪些端口

filter 表会根据定义的规则进行过滤，应该是我们最常用到的表。所以此处以 filter 表为例，开始学习怎样实际操作 iptables。

怎样查看 filter 表的规则呢？使用如下命令即可查看。

```bash
root@ubuntu:/home/sammy# iptables -t filter -L
Chain INPUT (policy ACCEPT)
target     prot opt source               destination

Chain FORWARD (policy ACCEPT)
target     prot opt source               destination

Chain OUTPUT (policy ACCEPT)
target     prot opt source               destination
```

上例的相关选项解析如下

- `-t`：指定要操作的表
- `-L`：查看 `-t` 选项对应的表的规则

上述命令的含义为列出 filter 表的所有规则。注意，上图显示系统启动 iptables 以后默认没有设置任何规则（如有，则 target 所在行以下应有数据），暂且不用在意它们。图中显示了 3 条链（蓝色标注部分为链）：`INPUT`、`FORWARD` 和 `OUTPUT`。每条链可以有各自的规则。

[前文][iptables-01-concepts] 打过一个比方--把"链"比作"关卡"，不同的"关卡"拥有不同的能力。由以上输出可知，`INPUT` 链、`FORWARD` 链和 `OUTPUT` 链都拥有"过滤"的能力。要定义某条"过滤"的规则时，我们会在 filter 表定义，但是具体在哪条"链"上定义规则呢？这取决于具体的工作场景。比如，需要禁止某个 IP 地址访问主机时，需要在 `INPUT` 链上定义规则。在 [理论总结一文][iptables-01-concepts] 提到过：报文发往本机时，会经过 `PREROUTING` 链与 `INPUT` 链（如果有疑惑请回顾 [前文][iptables-01-concepts]）。如果想要禁止某些报文发往本机，只能在 `PREROUTING` 链和 `INPUT` 链定义规则。但是 `PREROUTING` 链并不存在于 filter 表。换句话说，`PREROUTING` 关卡天生就没有过滤的能力。因此，我们只能在 `INPUT` 链定义。当然，如果是其他工作场景，可能需要在 `FORWARD` 链或者 `OUTPUT` 链定义过滤规则。

言归正传，继续聊聊怎样查看某张表的规则。

刚才提到：可以使用 `iptables -t filter -L` 命令列出 filter 表的所有规则。举一反三，也可以查看其它表的规则，示例如下

```bash
iptables -t raw -L

iptables -t mangle -L

iptables -t nat -L
```

其实，`-t filter`可以省略--当没有使用 `-t` 选项指定表时，默认操作 filter 表，即 `iptables -L` 表示列出 filter 表的所有规则。

我们还可以只查看指定表中指定链的规则。比如，只查看 filter 表中 `INPUT` 链的规则，示例如下（注意大小写）。

```bash
root@ubuntu:/home/sammy# iptables -L INPUT
Chain INPUT (policy ACCEPT)
target     prot opt source               destination
```

上图中只显示了 filter 表中 `INPUT` 链的规则（省略 `-t` 选项默认为 filter 表）。当然，也可以指定只查看其他链。其实查看到的信息还不是最详细的。使用 `-v` 选项可以查看到更多更详细的信息，示例如下。

```bash
root@ubuntu:/home/sammy# iptables -vL INPUT
Chain INPUT (policy ACCEPT 230 packets, 277K bytes)
 pkts bytes target     prot opt in     out     source               destination
```

可以看到：使用 `-v` 选项后，iptables 展示的信息更多了。这些字段的意思暂时看不懂也没关系，等到实际使用的时候，自然会明白，此处大概了解一下即可。

这些字段其实就是规则对应的属性，即规则的各种信息，汇总如下。

|          字段 | 说明                                                                           |
| ------------: | :----------------------------------------------------------------------------- |
|        `pkts` | 规则匹配到的报文个数                                                           |
|       `bytes` | 匹配到的报文包的大小总和                                                       |
|      `target` | 规则对应的 target，往往表示规则对应的"动作"，即规则匹配成功后采取的措施        |
|        `prot` | 规则对应的协议，是否只针对某些协议应用此规则                                   |
|         `opt` | 规则对应的选项                                                                 |
|          `in` | 表示数据包由哪个接口(网卡)流入，可以设置通过哪块网卡流入的报文需要匹配当前规则 |
|         `out` | 表示数据包由哪个接口(网卡)流出，可以设置通过哪块网卡流出的报文需要匹配当前规则 |
|      `source` | 表示规则对应的源头地址，可以是一个 IP 或网段                                   |
| `destination` | 表示规则对应的目标地址。可以是一个 IP 或网段                                   |

再看看还会发现：表中每个链的后面都有一个括号。括号里面有一些信息，如下图第 2 行最后的括号，那么这些信息都代表了什么呢？

```bash{2}
root@ubuntu:/home/sammy# iptables -vL INPUT
Chain INPUT (policy ACCEPT 83 packets, 9366 bytes)
 pkts bytes target     prot opt in     out     source               destination
```

上图中 INPUT 链后面的括号中包含 `policy ACCEPT, 83 packets, 9366 bytes` 三部分。

- `policy` 表示当前链的默认策略，`policy ACCEPT` 表示上图中 `INPUT` 链的默认动作为 `ACCEPT`。换句话说就是，默认接受通过 `INPUT` 关卡的所有请求。因此。在配置 `INPUT` 链的具体规则时，应该将需要拒绝的请求配置到规则。说白了就是"黑名单"机制 -- 默认所有人都能通过，只有指定的人不能通过。把 `INPUT` 链默认动作设置为接受(`ACCEPT`) 表示所有人都能通过这个关卡，此时就应该在具体的规则指定需要拒绝的请求，表示只有指定的人不能通过这个关卡，这就是黑名单机制。但是，上图所显示的规则大部分都是接受请求(`ACCEPT`)，并不是想象中的拒绝请求(`DROP` 或者 `REJECT`)。这与我们所描述的黑名单机制不符啊。按照道理来说，默认动作为接受，就应该在具体的规则配置需要拒绝的人，但是上图中并不是这样的。出现上图中的情况是 iptables 的工作机制导致的。上例其实是利用这些"机制"完成所谓的"白名单"机制，并不是我们所描述的"黑名单"机制。我们此处暂时忽略这一点，之后会进行详细的举例并解释。此处只要明白 `policy` 对应的动作为链的默认动作即可。或者换句话说，只要理解 `policy` 为链的默认策略即可。

- `packets` 表示当前链（上例为 `INPUT` 链）默认策略所匹配包的数量，`83 packets` 表示默认策略匹配到 83 个包。
- `bytes` 表示当前链默认策略匹配的所有包大小总和。

其实 `packets` 与 `bytes` 可称作"计数器"。上图的计数器记录了默认策略匹配到的报文数量与总大小。"计数器"只会在使用 `-v` 选项时，才会显示出来。

当被匹配到的包达到一定数量时，计数器会自动将匹配到的包大小转换为可读性较高的单位，如下图所示的 `277K bytes`。

```bash{2}
root@ubuntu:/home/sammy# iptables -vL INPUT
Chain INPUT (policy ACCEPT 559 packets, 454K bytes)
 pkts bytes target     prot opt in     out     source               destination
```

如果想要查看精确的计数值，而不是经过可读性优化过的计数值，可以使用 `-x` 选项，表示显示精确的计数值，示例如下。

```bash{2}
root@ubuntu:/home/sammy# iptables -vxL INPUT
Chain INPUT (policy ACCEPT 564 packets, 454850 bytes)
    pkts      bytes target     prot opt in     out     source               destination
```

每张表的每条链都有自己的计数器，链的每个规则也都有自己的计数器，就是每条规则对应的 `packets` 字段与 `bytes` 字段的信息。

## 命令小节

我们已经会使用命令简单地查看 iptables 表的规则了。为了方便以后回顾，我们将上文中的相关命令总结一下。

- 查看对应表的所有规则

  ```bash
  iptables -t 表名 -L
  ```

  - `-t` 选项指定要操作的表，省略"-t 表名"时，默认表示操作 filter 表
  - `-L` 表示列出规则，即查看规则

- 查看指定表中指定链的规则。

  ```bash
  iptables -t 表名 -L 链名
  ```

- 查看指定表的所有规则，并且显示更详细的信息（更多字段）

  ```bash
  iptables -t 表名 -v -L
  ```

  - `-v` 表示 verbose（详细的、冗长的）。使用 `-v` 选项会显示出"计数器"的信息。由于上例使用的选项都是短选项，所以一般简写为 `iptables -t 表名 -vL`。

- 查看表中的所有规则，并且显示更详细的信息(`-v` 选项)。计数器中的信息显示为精确的计数值，而不是显示为经过可读优化的计数值，`-x` 选项表示显示计数器的精确值。

  ```bash
  iptables -t 表名 -v -x -L
  ```

- 为了方便，实际使用往往会将短选项进行合并。如果将上述选项都糅合在一起，可以写成如下命令，此处以 filter 表为例。

  ```bash
  iptables -t filter -vxL
  ```

使用 iptables 命令进行基本的查看操作先总结到这里。下一篇文章会总结 iptables 规则的"增、删、改"操作。

## 参考文献

- [iptables 详解（2）：iptables 实际操作之规则查询]

[iptables series]: /tag/iptables/
[iptables-01-concepts]: /2020/12/03/iptables-01-concepts/
[iptables 详解（2）：iptables 实际操作之规则查询]: http://www.zsythink.net/archives/1493
