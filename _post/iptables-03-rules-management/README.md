---
title: '[iptables] 03. 规则管理'
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

[上一篇文章][02. 规则查询] 中，我们已经学会怎样使用 iptables 命令查看规则，那么这篇文章就来总结一下如何管理规则。

之前我们把查看 iptables 规则的操作比作"增删改查"当中的"查"。那么这篇文章就聊聊怎样对 iptables 进行"增、删、改"操作。

::: danger 高能预警
在参照本文进行 iptables 实验时，请务必在个人的测试机上进行，因为如果 iptables 规则设置不当，有可能使你无法连接到远程主机。
:::

## 规则

首先回顾一下什么是 iptables 的规则。

之前打过一个比方，每条"链"都是一个"关卡"，每个通过这个"关卡"的报文都要匹配这个关卡上的规则：如果匹配，则对报文进行对应的处理。比如说，你我二人此刻就好像两个"报文"，你我二人此刻都要入关。可是城主有命，只有器宇轩昂的人才能入关，不符合此条件的人不能入关。于是守关将士按照城主制定的"规则"，开始打量你我二人。最终，你顺利入关了，而我已被拒之门外。因为你符合"器宇轩昂"的标准，所以把你"放行"，而我不符合标准，所以没有被放行。其实，"器宇轩昂"就是一种 **匹配条件**，"放行"就是一种 **动作**，**匹配条件** 与 **动作** 组成规则。

只不过 iptables 最常用的匹配条件并不是"器宇轩昂"，而是报文的"源地址"、"目标地址"、"源端口" 和 "目标端口"等。在 iptables 的世界中，最常用的动作有 `ACCEPT`（接受）、`DROP`（丢弃）、`REJECT`（拒绝）。其中 `ACCEPT` 就与我们举例的"放行"类似。但是刚才提到的这些并不是全部的匹配条件与动作，只是最常用的一些罢了。具体的匹配条件与动作不是今天讨论的重点，会在后续文章再做总结。

规则的概念回顾完毕：规则大致由两个逻辑单元组成--**匹配条件** 与 **动作**。那么多说无益，我们来动手定义一条规则。此处仍然以 filter 表的 `INPUT` 链为例。因为 filter 表具有"过滤"功能，而所有发往本机的报文如果需要被过滤，首先会经过 `INPUT` 链（`PREROUTING` 链没有过滤功能），这与我们所比喻的"入关"场景非常相似，所以使用 filter 表的 `INPUT` 链为例有助于理解。

首先，查看一下 filter 表的 `INPUT` 链的规则。查看规则的相关命令在 [前文][02. 规则查询] 已经总结，此处不再赘述。如果有遗忘，请回顾 [前文][02. 规则查询]。

使用如下命令查看 filter 表 `INPUT` 链的规则，可见 ubuntu 默认为其设置没有任何规则。

```bash
root@ubuntu:/home/sammy# iptables -L
Chain INPUT (policy ACCEPT)
target     prot opt source               destination

Chain FORWARD (policy ACCEPT)
target     prot opt source               destination

Chain OUTPUT (policy ACCEPT)
target     prot opt source               destination
```

::: danger 高能预警
在进行 iptables 实验时，请务必在测试机上进行。本文的实验操作环境为 VMware Fusion 12.0 下的 Ubuntu 20.04.1。
:::

如果测试机器已有一些规则，则为了准备一个从零开始的环境，我们清空默认提供的规则，以便实验。使用 `iptables -F INPUT` 命令可清空 filter 表 `INPUT` 链的规则。后面会单独对清除规则的相关命令进行总结，此处暂且不深究此命令。

清空 `INPUT` 链后，filter 表的 `INPUT` 链已经不存在任何规则。但是可以看到，`INPUT` 链的默认策略为 `ACCEPT`，也就是说，`INPUT` 链默认"放行"所有发往本机的报文：当没有任何规则时，会接受所有报文；当报文没有被任何规则匹配到时，也会默认放行报文。

那么此刻，我们就在另外一台机器上，使用 `ping` 命令，向当前机器发送报文。如下所示，`ping` 命令可以得到回应，证明 `ping` 命令发送的报文已经正常的发送到防火墙所在的主机。其中，`ping` 命令所在机器 IP 地址为 `172.16.39.1`，当前测试防火墙主机的 IP 地址为 `172.16.39.2`。我们就用这样的环境对 iptables 进行操作演示。

在 `172.16.39.1` 执行 `ping` 如下

```bash
ping 172.16.39.2
PING 172.16.39.2 (172.16.39.2): 56 data bytes
64 bytes from 172.16.39.2: icmp_seq=0 ttl=64 time=0.402 ms
64 bytes from 172.16.39.2: icmp_seq=1 ttl=64 time=0.718 ms
64 bytes from 172.16.39.2: icmp_seq=2 ttl=64 time=0.485 ms
64 bytes from 172.16.39.2: icmp_seq=3 ttl=64 time=0.648 ms
^C
--- 172.16.39.2 ping statistics ---
4 packets transmitted, 4 packets received, 0.0% packet loss
round-trip min/avg/max/stddev = 0.402/0.563/0.718/0.126 ms
```

`172.16.39.2` 在 `ping` 前后的数据统计如下

```bash
# ping 之前
root@ubuntu:/home/sammy# iptables -vL INPUT
Chain INPUT (policy ACCEPT 8 packets, 648 bytes)
 pkts bytes target     prot opt in     out     source               destination

# ping 之后
root@ubuntu:/home/sammy# iptables -vL INPUT
Chain INPUT (policy ACCEPT 12 packets, 984 bytes)
 pkts bytes target     prot opt in     out     source               destination
```

## 增加规则

那么此处，我们就在 `172.16.39.2` 的机器上配置一条规则，拒绝源自 `172.16.39.1` 的所有报文访问当前机器。之前一直说规则由 **匹配条件** 与 **动作** 组成，那么"拒绝 `172.16.39.1` 的所有报文访问当前机器"这条规则中，报文的"源地址为 `172.16.39.1`"则属于匹配条件。如果报文来自 `172.16.39.1`，则满足匹配条件，而"拒绝"这个报文就属于对应的动作。定义这条规则的命令如下

```bash{1}
root@ubuntu:/home/sammy# iptables -t filter -I INPUT -s 172.16.39.1 -j DROP
root@ubuntu:/home/sammy# iptables -vL INPUT
Chain INPUT (policy ACCEPT 2 packets, 414 bytes)
 pkts bytes target     prot opt in     out     source               destination
    0     0 DROP       all  --  any    any     xiangmins-mbp        anywhere
```

上述命令各个选项说明如下

- `-t` 指定了要操作的表。此处指定操作 filter 表，与之前的查看命令一样，不使用 `-t` 选项指定表时，默认为操作 filter 表。
- `-I` 指明将"规则"插入至哪条链。`-I` 表示 insert，即插入的意思，所以 `-I INPUT` 表示将规则插入 `INPUT` 链，即添加规则之意。
- `-s` 指明"匹配条件"中的"源地址"，即如果报文的源地址属于 `-s` 对应的地址，那么报文则满足匹配条件。`-s` 为 source 之意，表示源地址。
- `-j` 指明满足"匹配条件"时，采取的对应动作。上例指定的动作为 `DROP`，当报文的源地址为 `172.16.39.1` 时，报文则被 `DROP`（丢弃）。

::: tip 关于 destination 下的 anywhere
上面目标地址 `destination` 显示为 `anywhere` 是因为 iptables 默认进行了名称解析。在规则非常多的情况下进行名称解析，效率会比较低。所以，在没有此需求的情况下，我们可以使用 `-n` 选项，表示不对 IP 地址进行名称反解，直接显示 IP 地址，示例如下

```bash
root@ubuntu:/home/sammy# iptables -nvL INPUT
Chain INPUT (policy ACCEPT 7 packets, 1125 bytes)
 pkts bytes target     prot opt in     out     source               destination
    0     0 DROP       all  --  *      *       172.16.39.1          0.0.0.0/0
```

:::

再次查看 filter 表的 `INPUT` 链，会发现规则已经被添加。在 iptables 中，动作被称为"target"，所以上面 `target` 字段对应的动作为 `DROP`。

那么此时，我们再通过 `172.16.39.1` 去 `ping` 主机 `172.16.39.2`，看看能否 `ping` 通。

```bash
ping 172.16.39.2
PING 172.16.39.2 (172.16.39.2): 56 data bytes
Request timeout for icmp_seq 0
Request timeout for icmp_seq 1
Request timeout for icmp_seq 2
Request timeout for icmp_seq 3
Request timeout for icmp_seq 4
Request timeout for icmp_seq 5
Request timeout for icmp_seq 6
Request timeout for icmp_seq 7
Request timeout for icmp_seq 8
^C
--- 172.16.39.2 ping statistics ---
10 packets transmitted, 0 packets received, 100.0% packet loss
```

由上可知，`ping 172.16.39.2` 主机时，`ping` 命令一直没有得到回应，看来我们的 iptables 规则已经生效，使得 `ping` 发送的报文压根没有被 `172.16.39.2` 主机接受，而是被丢弃了，所以更不要说什么回应了。至此，我们成功地配置了一条 iptables 规则，总算入门 ：）

还记得 [前文][02. 规则查询] 说过的"计数器"吗？此时再次查看 iptables 的规则，会发现：已经有 10 个包被对应的规则匹配到，总计大小 840 bytes。

```bash
root@ubuntu:/home/sammy# iptables -vL INPUT
Chain INPUT (policy ACCEPT 5 packets, 416 bytes)
 pkts bytes target     prot opt in     out     source               destination
   10   840 DROP       all  --  any    any     172.16.39.1          anywhere
```

此刻，我们来做一个实验。

现在 `INPUT` 链已经存在一条规则，它拒绝所有来自 `172.16.39.1` 主机的报文。如果此时在这条规则之后再配置这样一条规则：接受所有来自 `172.16.39.1` 主机的报文。那么，iptables 是否会接受来自 `172.16.39.1` 主机的报文呢？动手试试。

使用如下命令在 filter 表的 `INPUT` 链追加一条规则，这条规则表示接受所有来自 `172.16.39.1` 的发往本机的报文。

```bash
root@ubuntu:/home/sammy# iptables -A INPUT -s 172.16.39.1 -j ACCEPT
root@ubuntu:/home/sammy# iptables -vL INPUT
Chain INPUT (policy ACCEPT 0 packets, 0 bytes)
 pkts bytes target     prot opt in     out     source               destination
   11   946 DROP       all  --  any    any     172.16.39.1          anywhere
    0     0 ACCEPT     all  --  any    any     172.16.39.1          anywhere
```

上述命令没有使用 `-t` 选项指定表，所以默认操作 filter 表。相关选项说明如下

- `-A` 表示在对应的链"追加规则"。`-A` 为 append 之意。`-A INPUT` 则表示在 `INPUT` 链追加规则
  - 之前示例使用的 `-I` 选项则表示往链"插入规则"。两者本意都是添加一条规则，只是 `-A` 表示在链的 **尾部** 追加规则，`-I` 表示在链的 **首部** 插入规则而已。
- `-j` 指定当前规则对应的动作为 `ACCEPT`。

执行完添加规则的命令后，再次查看 `INPUT` 链，发现规则已经成功"追加"至 `INPUT` 链的末尾。现在第一条规则指明丢弃所有来自 `172.16.39.1` 的报文，第二条规则指明接受所有来自 `172.16.39.1` 的报文，那么结果到底是怎样的呢？实践出真知，在 `172.16.39.1` 主机上再次使用 `ping` 命令向 `172.16.39.2` 主机发送报文，发现仍然 `ping` 不通，看来第二条规则并没有生效。

- `172.16.39.1` 上的终端输出

  ```bash
  ping 172.16.39.2
  PING 172.16.39.2 (172.16.39.2): 56 data bytes
  Request timeout for icmp_seq 0
  Request timeout for icmp_seq 1
  Request timeout for icmp_seq 2
  ^C
  --- 172.16.39.2 ping statistics ---
  4 packets transmitted, 0 packets received, 100.0% packet loss
  ```

- `172.16.39.2` 的情况如下

  ```bash
  root@ubuntu:/home/sammy# iptables -vL INPUT
  Chain INPUT (policy ACCEPT 4 packets, 374 bytes)
  pkts bytes target     prot opt in     out     source               destination
    15  1282 DROP       all  --  any    any     172.16.39.1          anywhere
      0     0 ACCEPT     all  --  any    any     172.16.39.1          anywhere
  ```

而且从以上输出的第二条规则的计数器可以看到，其根本没有任何报文被第二条规则匹配到。

聪明如你一定在猜想，发生上述情况，会不会与规则的先后顺序有关呢？测试一下：再添加一条规则，新规则仍然规定接受所有来自 `172.16.39.1` 主机的报文。只是这一次将新规则添加至 `INPUT` 链的最前面。

在添加这条规则之前，我们先把 `172.16.39.1` 上的 `ping` 命令强制停止，然后使用如下命令，在 filter 表的 `INPUT` 链前端添加新规则。

```bash
root@ubuntu:/home/sammy# iptables -I INPUT -s 172.16.39.1 -j ACCEPT
root@ubuntu:/home/sammy# iptables -vL INPUT
Chain INPUT (policy ACCEPT 0 packets, 0 bytes)
 pkts bytes target     prot opt in     out     source               destination
    0     0 ACCEPT     all  --  any    any     172.16.39.1          anywhere
   15  1282 DROP       all  --  any    any     172.16.39.1          anywhere
    0     0 ACCEPT     all  --  any    any     172.16.39.1          anywhere
```

好了，现在第一条规则就是接受所有来自 `172.16.39.1` 的报文，而且此时计数是 0。此刻，我们再从 `172.16.39.1` 上向 `172.16.39.2` 发起 `ping` 请求。

```bash
ping 172.16.39.2
PING 172.16.39.2 (172.16.39.2): 56 data bytes
64 bytes from 172.16.39.2: icmp_seq=0 ttl=64 time=0.438 ms
64 bytes from 172.16.39.2: icmp_seq=1 ttl=64 time=0.698 ms
64 bytes from 172.16.39.2: icmp_seq=2 ttl=64 time=0.724 ms
^C
--- 172.16.39.2 ping statistics ---
3 packets transmitted, 3 packets received, 0.0% packet loss
round-trip min/avg/max/stddev = 0.438/0.620/0.724/0.129 ms
```

可见 `172.16.39.1` 上已经可以正常地收到响应报文。那么回到 `172.16.39.2` 查看 `INPUT` 链的规则，第一条规则的计数器已经显示出匹配到的报文数量。

```bash
root@ubuntu:/home/sammy# iptables -vL INPUT
Chain INPUT (policy ACCEPT 6 packets, 561 bytes)
 pkts bytes target     prot opt in     out     source               destination
   10  1314 ACCEPT     all  --  any    any     172.16.39.1          anywhere
   15  1282 DROP       all  --  any    any     172.16.39.1          anywhere
    0     0 ACCEPT     all  --  any    any     172.16.39.1          anywhere
```

可见，**规则的顺序很重要**：如果报文已经被前面的规则匹配到，iptables 则会对报文执行对应的动作。即使后面的规则也能匹配到当前报文，很有可能也没有机会再对报文执行相应的动作。以上为例，报文先被第一条规则匹配到，于是当前报文被"放行"。因为报文被放行，所以即使第二条规则能够匹配到刚才"放行"的报文，也没有机会再对刚才的报文进行丢弃操作。这就是 iptables 的工作机制。

使用 `--line-number`（可简写为 `--line`）选项可以列出规则的序号，如下所示

```bash
iptables --line -vL INPUT
Chain INPUT (policy ACCEPT 20 packets, 1855 bytes)
num   pkts bytes target     prot opt in     out     source               destination
1       10  1314 ACCEPT     all  --  any    any     172.16.39.1          anywhere
2       15  1282 DROP       all  --  any    any     172.16.39.1          anywhere
3        0     0 ACCEPT     all  --  any    any     172.16.39.1          anywhere
```

我们也可以在添加规则时，指定新增规则的编号，这样能在任意位置插入规则。只要把刚才的命令稍作修改如下即可

```bash
root@ubuntu:/home/sammy# iptables -I INPUT 2 -s 172.16.39.1 -j DROP
root@ubuntu:/home/sammy# iptables --line -vL INPUT
Chain INPUT (policy ACCEPT 0 packets, 0 bytes)
num   pkts bytes target     prot opt in     out     source               destination
1       13  1548 ACCEPT     all  --  any    any     172.16.39.1          anywhere
2        0     0 DROP       all  --  any    any     172.16.39.1          anywhere
3       15  1282 DROP       all  --  any    any     172.16.39.1          anywhere
4        0     0 ACCEPT     all  --  any    any     172.16.39.1          anywhere
```

- `-I` 选项进行插入规则操作。`-I INPUT 2` 表示往 `INPUT` 链新增规则，新增规则的编号为 2。

## 删除规则

::: danger 高能预警
在进行 iptables 实验时，请务必在测试机上进行。本文的实验操作环境为 VMware Fusion 12.0 下的 Ubuntu 20.04.1。
:::

如果此刻想要删除 filter 表中 `INPUT` 链的一条规则，该怎么做呢？

有两种办法

- 根据规则的编号去删除规则
- 根据具体的匹配条件与动作删除规则

先看看方法一，先查看一下 filter 表 `INPUT` 链的规则

```bash
root@ubuntu:/home/sammy# iptables --line -vL INPUT
Chain INPUT (policy ACCEPT 21 packets, 1912 bytes)
num   pkts bytes target     prot opt in     out     source               destination
1       13  1548 ACCEPT     all  --  any    any     172.16.39.1          anywhere
2        0     0 DROP       all  --  any    any     172.16.39.1          anywhere
3       15  1282 DROP       all  --  any    any     172.16.39.1          anywhere
4        0     0 ACCEPT     all  --  any    any     172.16.39.1          anywhere
```

假如想要删除第 4 条规则，可以使用如下命令。

```bash
root@ubuntu:/home/sammy# iptables -t filter -D INPUT 4
root@ubuntu:/home/sammy# iptables --line -vL INPUT
Chain INPUT (policy ACCEPT 0 packets, 0 bytes)
num   pkts bytes target     prot opt in     out     source               destination
1       13  1548 ACCEPT     all  --  any    any     172.16.39.1          anywhere
2        0     0 DROP       all  --  any    any     172.16.39.1          anywhere
3       15  1282 DROP       all  --  any    any     172.16.39.1          anywhere
```

上例各个选项说明如下

- `-t` 选项指定要操作的表（没错，省略 `-t` 默认表示操作 filter 表）
- `-D` 选项表示删除指定链的某条规则。`-D INPUT 4` 表示删除 `INPUT` 链的第 4 条规则。

当然也可以根据具体的匹配条件与动作去删除规则。比如，删除源地址为 `172.16.39.1`，动作为 `ACCEPT` 的规则，对应命令如下

```bash
root@ubuntu:/home/sammy# iptables -D INPUT -s 172.16.39.1 -j ACCEPT
root@ubuntu:/home/sammy# iptables --line -vL INPUT
Chain INPUT (policy ACCEPT 0 packets, 0 bytes)
num   pkts bytes target     prot opt in     out     source               destination
1        0     0 DROP       all  --  any    any     172.16.39.1          anywhere
2       15  1282 DROP       all  --  any    any     172.16.39.1          anywhere
```

上述命令的相关选项说明如下

- `-D` 选项表示删除指定链的某条规则。`-D INPUT` 表示删除 `INPUT` 链的规则。
- `-s` 表示以对应的源地址作为匹配条件。
- `-j ACCEPT` 表示对应的动作为接受。

综上，以上命令表示删除 `INPUT` 链中源地址为 `172.16.39.1`，动作为 `ACCEPT` 的规则。

而删除指定表中某条链所有规则的命令在一开始就用到了：`iptables -t 表名 -F 链名`，其相关选项说明如下

- `-F` 选项为 flush 之意，即冲刷指定的链，删除指定链的所有规则
  - **注意**：此操作相当于删除操作，没有保存 iptables 规则的情况下，请慎用。

其实，`-F` 选项不仅仅能清空指定链的规则，还能清空整个表的所有链规则：不指定链名，只指定表名即可删除表的所有规则。命令如下

```bash
iptables -t 表名 -F
```

::: warning 再次强调
在没有保存 iptables 规则时，请勿随便清空链或者表的规则，除非我们很清楚自己的所作所为。
:::

## 修改规则

::: danger 高能预警
在进行 iptables 实验时，请务必在测试机上进行。本文的实验操作环境为 VMware Fusion 12.0 下的 Ubuntu 20.04.1。
:::

怎样修改某条规则中的动作呢？比如，如何把如下规则的动作从 `DROP` 改为 `REJECT`？

```bash
root@ubuntu:/home/sammy# iptables --line -vL INPUT
Chain INPUT (policy ACCEPT 0 packets, 0 bytes)
num   pkts bytes target     prot opt in     out     source               destination
1        0     0 DROP       all  --  any    any     172.16.39.1          anywhere
2       15  1282 DROP       all  --  any    any     172.16.39.1          anywhere
```

使用 `-R` 选项可以修改指定链的规则。修改规则时指定规则对应的编号即可(**有坑，慎行**)，示例命令如下

```bash
root@ubuntu:/home/sammy# iptables -t filter -R INPUT 1 -s 172.16.39.1 -j REJECT
root@ubuntu:/home/sammy# iptables --line -vL INPUT
Chain INPUT (policy ACCEPT 0 packets, 0 bytes)
num   pkts bytes target     prot opt in     out     source               destination
1        0     0 REJECT     all  --  any    any     172.16.39.1          anywhere             reject-with icmp-port-unreachable
2       15  1282 DROP       all  --  any    any     172.16.39.1          anywhere
```

相关选项说明如下

- `-R` 选项表示修改指定链。使用 `-R INPUT 1` 表示修改 `INPUT` 链的第 1 条规则
- `-j REJECT` 表示将 `INPUT` 链第一条规则的动作修改为 `REJECT`。
  - **注意**：`-s` 选项以及对应的源地址不可省略。即使我们已经指定规则对应的编号，但是在使用 `-R` 选项修改某个规则时，必须指定规则对应的原本匹配条件（如果有多个匹配条件，则需全部指定）。

如果以上命令没有使用 `-s` 指定对应规则原本的源地址，那么在修改完成后，所修改规则的源地址会自动变为 `anywhere`（此 IP 表示匹配所有网段的 IP 地址）。而此时 `-j` 对应的动作又为 `REJECT`，所以在执行上述命令时没有指明规则原本的源地址的话，那么所有 IP 的请求都被拒绝（因为没有指定原本的源地址，当前规则的源地址自动变为 `anywhere`）。如果正在使用 ssh 远程到服务器上进行 iptables 设置，那么你的 ssh 请求也将会被阻断。

既然使用 `-R` 选项修改规则时，必须指明规则原本的匹配条件，那么我们可以理解为：只能通过 `-R` 选项修改规则对应的动作了。所以个人觉得，如果想要修改某条规则，还不如先将这条规则删除，然后在同样位置再插入一条新规则。当然，如果只是为了修改某条规则的动作，那么使用 `-R` 选项时，千万不要忘了指明规则原本对应的匹配条件。

上面已经将规则的动作从 `DROP` 改为 `REJECT`。那么 `DROP` 与 `REJECT` 有什么不同呢？从字面上理解，`DROP` 表示丢弃，而 `REJECT` 表示拒绝，意思好像更坚决一点。我们再次从 `172.16.39.1` 主机向 `172.16.39.2` 主机发起 `ping` 请求，看看与之前动作为 `DROP` 时有什么不同。

```bash
ping 172.16.39.2
PING 172.16.39.2 (172.16.39.2): 56 data bytes
92 bytes from 172.16.39.2 (172.16.39.2): Destination Port Unreachable
Vr HL TOS  Len   ID Flg  off TTL Pro  cks      Src      Dst
 4  5  00 5400 942b   0 0000  40  01 405a 172.16.39.1  172.16.39.2

Request timeout for icmp_seq 0
92 bytes from 172.16.39.2 (172.16.39.2): Destination Port Unreachable
Vr HL TOS  Len   ID Flg  off TTL Pro  cks      Src      Dst
 4  5  00 5400 b578   0 0000  40  01 1f0d 172.16.39.1  172.16.39.2

Request timeout for icmp_seq 1
92 bytes from 172.16.39.2 (172.16.39.2): Destination Port Unreachable
Vr HL TOS  Len   ID Flg  off TTL Pro  cks      Src      Dst
 4  5  00 5400 4f49   0 0000  40  01 853c 172.16.39.1  172.16.39.2

^C
--- 172.16.39.2 ping statistics ---
3 packets transmitted, 0 packets received, 100.0% packet loss
```

如上所示，当 `172.16.39.2` 主机的 iptables 规则对应的动作为 `REJECT`，从 `172.16.39.1` 上进行 `ping` 操作时，直接就提示 `Destination Port Unreachable`，并没有像之前那样超时。看来，`REJECT` 比 `DROP` 更加"干脆"。

我们还可以修改指定链的"默认策略"。没错，就是下面第 2 行 `policy` 标注的默认策略。

```bash{2,7,10}
root@ubuntu:/home/sammy# iptables -vL
Chain INPUT (policy ACCEPT 6 packets, 546 bytes)
 pkts bytes target     prot opt in     out     source               destination
    3   252 REJECT     all  --  any    any     172.16.39.1          anywhere             reject-with icmp-port-unreachable
   15  1282 DROP       all  --  any    any     172.16.39.1          anywhere

Chain FORWARD (policy ACCEPT 0 packets, 0 bytes)
 pkts bytes target     prot opt in     out     source               destination

Chain OUTPUT (policy ACCEPT 9 packets, 882 bytes)
 pkts bytes target     prot opt in     out     source               destination
```

每张表的每条链都有自己的默认策略，也可以理解为默认"动作"。

当报文没有被链的任何规则匹配到时，或者链没有任何规则时，防火墙会按照默认动作处理报文。指定链的默认策略可以使用如下命令修改

```bash{8}
root@ubuntu:/home/sammy# iptables -t filter -P FORWARD DROP
root@ubuntu:/home/sammy# iptables -vL
Chain INPUT (policy ACCEPT 3 packets, 324 bytes)
 pkts bytes target     prot opt in     out     source               destination
    4   330 REJECT     all  --  any    any     172.16.39.1          anywhere             reject-with icmp-port-unreachable
   15  1282 DROP       all  --  any    any     172.16.39.1          anywhere

Chain FORWARD (policy DROP 0 packets, 0 bytes)
 pkts bytes target     prot opt in     out     source               destination

Chain OUTPUT (policy ACCEPT 5 packets, 442 bytes)
 pkts bytes target     prot opt in     out     source               destination
```

相关选项说明如下

- `-t` 指定要操作的表
- `-P` 选项指定要修改的链。`-P FORWARD DROP` 表示将表中 `FORWRD` 链的默认策略改为 `DROP`。

## 保存规则

默认的情况下，对"防火墙"所做的修改都是"临时的"。换句话说，重启 iptables 服务或者重启服务器以后，平常添加的规则或者对规则所做出的修改都将消失。为了防止发生这种情况，需要将规则"保存"。

CentOS 6 可使用 `service iptables save` 命令保存规则到 `/etc/sysconfig/iptables` 文件，但是 ubuntu 貌似和 CentOS 7 一样不再使用 init 风格的脚本启动服务，所以不行。听说想办法安装 iptables 与 iptables-services 即可（iptables 一般会预装，但是 ubuntu 一般不会预装 iptables-services）。既然系统升级后抛弃了 init 风格的脚本，那我们就跟着时代走，另寻其他通用的方法吧。

### 其他通用方法

使用 `iptables-save` 命令也能帮助保存 iptables 规则。它不能直接保存当前的 iptables 规则，但是可以将当前的 iptables 规则以"保存后的格式"输出到屏幕。

所以，使用 `iptables-save` 命令配合重定向，将规则重定向到 `iptables.txt` 文件即可。

```bash
iptables-save > iptables.txt
```

我们也可以将 `iptables.txt` 的规则重新载入为当前的 iptables 规则。但是 **注意**：未保存入 `iptables.txt` 文件的修改将会丢失或者被覆盖。

使用 `iptables-restore` 命令可以从指定文件重载规则，示例如下

```bash
iptables-restore < iptables.txt
```

::: warning 再次提醒
重载规则时，现有规则将会被覆盖。
:::

## 命令小结

上文已经详细地举例并描述怎样进行 iptables 规则管理。为了便于以后速查，本文的相关命令总结一下。

### 添加规则

::: tip 温馨提示
添加规则时，规则的顺序非常重要
:::

- 在指定表指定链的尾部添加一条规则

  - `-A` 选项表示在对应链的末尾添加规则
  - 省略 `-t` 选项时，表示默认操作 filter 表的规则

  ```bash
  iptables -t 表名 -A 链名 匹配条件 -j 动作

  # 示例
  # iptables -t filter -A INPUT -s 172.16.39.1 -j DROP
  ```

- 在指定表指定链的首部添加一条规则

  - `-I` 选项表示在对应链的开头添加规则

  ```bash
  iptables -t 表名 -I 链名 匹配条件 -j 动作

  # 示例
  # iptables -t filter -I INPUT -s 192.168.1.`172.16.39.1` -j ACCEPT
  ```

- 在指定表指定链的指定位置添加一条规则

  ```bash
  iptables -t 表名 -I 链名 规则序号 匹配条件 -j 动作

  # 示例
  # iptables -t filter -I INPUT 5 -s 192.168.1.`172.16.39.1` -j REJECT
  ```

- 设置指定表指定链的默认策略（默认动作），并非添加规则

  ```bash
  iptables -t 表名 -P 链名 动作

  # 示例：iptables -t filter -P FORWARD ACCEPT
  # 上例表示将 filter 表中 FORWARD 链的默认策略设置为 ACCEPT
  ```

### 删除规则

::: danger 高能警告
如果没有保存规则，删除规则时请慎重
:::

- 按序号删除规则，删除指定表指定链的指定规则

  - `-D` 选项表示删除对应链的规则。

  ```bash
  iptables -t 表名 -D 链名 规则序号

  # 示例
  # iptables -t filter -D INPUT 3
  # 上述示例表示删除 filter 表中 INPUT 链中序号为 3 的规则。
  ```

- 按照具体的匹配条件与动作删除规则，删除指定表指定链的指定规则

  ```bash
  iptables -t 表名 -D 链名 匹配条件 -j 动作

  # 示例
  # iptables -t filter -D INPUT -s 192.168.1.`172.16.39.1` -j DROP
  # 上述示例表示删除 filter 表中 INPUT 链中源地址为 192.168.1.`172.16.39.1` 并且动作为 DROP 的规则。
  ```

- 删除指定表指定链的所有规则

  - `-F` 选项表示清空对应链的规则，三思而后行

  ```bash
  iptables -t 表名 -F 链名

  # 示例
  # iptables -t filter -F INPUT
  ```

- 删除指定表的所有规则，三思而后行

  ```bash
  iptables -t 表名 -F

  # 示例
  # iptables -t filter -F
  ```

### 修改规则

::: tip 温馨提示
如果使用 `-R` 选项修改规则的动作，那么必须指明原规则的原匹配条件，例如源 IP，目标 IP 等。
:::

- 修改指定表中指定链的指定规则

  - `-R` 选项表示修改对应链中的规则。使用 `-R` 选项时要同时指定对应的链以及规则对应的序号，并且规则原本的匹配条件不可省略。

  ```bash
  iptables -t 表名 -R 链名 规则序号 规则原本的匹配条件 -j 动作

  # 示例
  # iptables -t filter -R INPUT 3 -s 172.16.39.1 -j ACCEPT
  # 上述示例表示修改 filter 表中 INPUT 链的第 3 条规则，将这条规则的动作修改为 ACCEPT， -s 192.168.1.`172.16.39.1` 为这条规则中原本的匹配条件，如果省略此匹配条件，修改后的规则中的源地址可能会变为 0.0.0.0/0。
  ```

- 其他修改规则的方法

  - 先通过编号删除规则，再在原编号位置添加一条规则。

- 修改指定表指定链的默认策略（默认动作），并非修改规则，可以使用如下命令。

  ```bash
  iptables -t 表名 -P 链名 动作

  # 示例
  # iptables -t filter -P FORWARD ACCEPT
  # 上例表示将 filter 表中 FORWARD 链的默认策略修改为 ACCEPT
  ```

### 保存规则

保存规则命令如下，表示将 iptables 规则保存至 /etc/sysconfig/iptables 文件

```bash
service iptables save
```

注意点：ubuntu 20.04.1 如果想要使用上述命令保存规则，需要安装 `iptables-services`，具体配置过程自救。

或者使用如下 **通用** 方法保存规则

```bash
iptables-save > /etc/sysconfig/iptables
```

可以使用如下命令从指定的文件载入规则。注意：重载规则时，文件的规则将会覆盖现有规则。

```bash
iptables-restore < /etc/sysconfig/iptables
```

至此，本文已经总结如何添加、删除、修改 iptables 规则。与 [前文][02. 规则查询] 结合起来，我们已经掌握了对 iptables 规则的"增删改查"。同时，本文也总结了如何设置链的默认策略，以及怎样保存 iptables 规则。

## 参考文献

- [iptables 详解（3）：iptables 规则管理]

[iptables series]: /tag/iptables/
[iptables 详解（3）：iptables 规则管理]: http://www.zsythink.net/archives/1517
[02. 规则查询]: /2021/01/03/iptables-02-exercise-listing-rules/
