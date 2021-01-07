---
title: '[iptables] 05. 匹配条件总结 2'
date: 2021-01-07
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

::: danger 高能预警
在进行 iptables 实验时，请务必在测试机上进行。本文的实验操作环境为 VMware Fusion 12.0 下的 Ubuntu 20.04.1。
:::

[前文][04. 匹配条件总结 1] 总结了 iptables 的基本匹配条件以及简单的扩展匹配条件。本文介绍一些新的扩展模块。

## iprange 扩展模块

之前总结过：在不使用任何扩展模块的情况下，使用 `-s` 选项或者 `-d` 选项即可匹配报文的源地址与目标地址，而且在指定 IP 地址时，可以同时指定多个 IP 地址，每个 IP 用 `,` 隔开。但是，`-s` 选项与 `-d` 选项不能一次性指定一段连续的 IP 地址范围。如果需要指定一段连续的 IP 地址范围，可以使用 iprange 扩展模块。

使用 iprange 扩展模块可以指定 **一段连续的 IP 地址范围**，用于匹配报文的源地址或者目标地址。

iprange 扩展模块有两个扩展匹配条件可以使用

- `--src-range`
- `--dst-range`

见名知意，上述两个选项分别用于匹配报文的源地址所在范围与目标地址所在范围。

示例如下：

```bash
root@ubuntu:/home/sammy# iptables -F INPUT
root@ubuntu:/home/sammy# iptables -I INPUT -m iprange --src-range 192.168.1.127-192.168.1.146 -j DROP
root@ubuntu:/home/sammy# iptables -vL INPUT
Chain INPUT (policy ACCEPT 0 packets, 0 bytes)
 pkts bytes target     prot opt in     out     source               destination
    0     0 DROP       all  --  any    any     anywhere             anywhere             source IP range 192.168.1.127-192.168.1.146
```

上例表示如果报文的源 IP 地址如果在 `192.168.1.127` 到 `192.168.1.146` 之间，则丢弃报文。IP 段的始末 IP 使用 `-` 连接，`--src-range` 与 `--dst-range` 和其他匹配条件一样，能够使用 `!` 取反。有了 [前文][04. 匹配条件总结 1] 的知识作为基础，此处不再赘述。

## string 扩展模块

使用 string 扩展模块可以指定要匹配的字符串。如果报文中包含对应的字符串，则符合匹配条件。

比如，如果报文中包含字符 "Hello" 就丢弃当前报文。

对于 IP 为 `172.16.39.1` 的主机上

1. 在当前工作目录添加两个页面，页面内容分别为 "Hello" 和 "World"

```bash
echo "Hello" > index.html
echo "World" > index2.html
```

2. 启动 http 服务

```bash
docker run -it --rm -v ${PWD}:/usr/share/nginx/html -p 8080:80 nginx:1.19.6-alpine
```

对于 IP 为 `172.16.39.2` 的主机

1. 访问 `172.16.39.1` 的主机的页面

```bash
root@ubuntu:/home/sammy# iptables -F INPUT
root@ubuntu:/home/sammy# curl 172.16.39.1:8080
Hello
root@ubuntu:/home/sammy# curl 172.16.39.1:8080/index2.html
World
```

可见，在没有配置任何规则时，`172.16.39.2` 主机可以正常访问 `172.16.39.1` 主机的两个页面。

我们想要达到的目的是，如果报文包含 "Hello" 字符就拒绝报文进入本机。所以，可以在 `172.16.39.2` 上进行如下配置。

```bash
root@ubuntu:/home/sammy# iptables -F INPUT
root@ubuntu:/home/sammy# iptables -I INPUT -m string --algo bm --string "Hello" -j REJECT
root@ubuntu:/home/sammy# curl 172.16.39.1:8080
^C
root@ubuntu:/home/sammy# curl 172.16.39.1:8080/index2.html
World
```

相关选项说明如下

- `-m string` 表示使用 string 模块
- `--algo bm` 表示使用 bm 算法去匹配指定的字符串
- `--string "Hello"` 表示想要匹配的字符串为 "Hello"

设置完以上规则后，因为 index.html 包含 "Hello" 字符串，所以 `172.16.39.1` 的回应报文无法通过 `172.16.39.2` 的 `INPUT` 链，所以无法获取到页面对应的内容。

那么，我们来总结一下 string 模块的常用选项

|       选项 | 说明                                                                                             |
| ---------: | :----------------------------------------------------------------------------------------------- |
|   `--algo` | 指定匹配算法，可选的算法有 bm 与 kmp。此选项为必须选项。不用纠结于选择哪个算法，但必须指定一个。 |
| `--string` | 指定需要匹配的字符串。                                                                           |

## time 扩展模块

通过 time 扩展模块可以实现根据时间段区匹配报文。如果报文到达的时间在指定时间范围以内，则符合匹配条件。

比如，"我想要自我约束，每天早上 9 点到下午 6 点不能看网页"。多么残忍的规定。如果你想要这样定义，可以尝试设置规则如下

```bash
root@ubuntu:~# iptables -F INPUT
root@ubuntu:~# iptables -I OUTPUT -p tcp --dport 80 -m time --timestart 09:00:00 --timestop 18:00:00 -j REJECT
root@ubuntu:~# iptables -I OUTPUT -p tcp --dport 443 -m time --timestart 09:00:00 --timestop 18:00:00 -j REJECT
root@ubuntu:~# iptables -vL OUTPUT
Chain OUTPUT (policy ACCEPT 1 packets, 76 bytes)
 pkts bytes target     prot opt in     out     source               destination
    0     0 REJECT     tcp  --  any    any     anywhere             anywhere             tcp dpt:https TIME from 09:00:00 to 18:00:00 UTC reject-with icmp-port-unreachable
    0     0 REJECT     tcp  --  any    any     anywhere             anywhere             tcp dpt:http TIME from 09:00:00 to 18:00:00 UTC reject-with icmp-port-unreachable
```

相关选项说明如下

- `-m time` 表示使用 time 扩展模块
- `--timestart` 选项用于指定起始时间
- `--timestop` 选项用于指定结束时间

如果你想要换一种约束方法，只有周六日不能看网页，那么可以使用如下规则。

```bash
root@ubuntu:~# iptables -F OUTPUT
root@ubuntu:~# iptables -I OUTPUT -p tcp --dport 80 -m time --weekdays 6,7 -j REJECT
root@ubuntu:~# iptables -vL OUTPUT
Chain OUTPUT (policy ACCEPT 0 packets, 0 bytes)
 pkts bytes target     prot opt in     out     source               destination
    0     0 REJECT     tcp  --  any    any     anywhere             anywhere             tcp dpt:http TIME on Sat,Sun UTC reject-with icmp-port-unreachable
```

使用 `--weekdays` 选项可以指定每个星期的具体哪一天，可同时指定多个，用逗号隔开。除了能够数字表示"星期几"，还能用缩写表示。例如：Mon，Tue，Wed，Thu，Fri，Sat 或 Sun。

当然，你也可以将上述几个选项结合起来使用，比如指定只有周六日的早上 9 点到下午 6 点不能浏览网页。

```bash
root@ubuntu:~# iptables -F OUTPUT
root@ubuntu:~# iptables -I OUTPUT -p tcp --dport 80 -m time --timestart 09:00:00 --timestop 18:00:00 --weekdays 6,7 -j REJECT
root@ubuntu:~# iptables -vL OUTPUT
Chain OUTPUT (policy ACCEPT 1 packets, 76 bytes)
 pkts bytes target     prot opt in     out     source               destination
    0     0 REJECT     tcp  --  any    any     anywhere             anywhere             tcp dpt:http TIME from 09:00:00 to 18:00:00 on Sat,Sun UTC reject-with icmp-port-unreachable
```

依此类推，既然有 `--weekdays` 选项，也有 `--monthdays` 选项。

使用 `--monthdays` 选项可以具体指定每个月的哪一天。比如如下设置表示每月的 22 号和 23 号。

```bash
root@ubuntu:~# iptables -F OUTPUT
root@ubuntu:~# iptables -I OUTPUT -p tcp --dport 80 -m time --monthdays 22,23 -j REJECT
root@ubuntu:~# iptables -vL OUTPUT
Chain OUTPUT (policy ACCEPT 0 packets, 0 bytes)
 pkts bytes target     prot opt in     out     source               destination
    0     0 REJECT     tcp  --  any    any     anywhere             anywhere             tcp dpt:http TIME on 22nd,23rd UTC reject-with icmp-port-unreachable
```

[前文][04. 匹配条件总结 1] 总结过：当一条规则同时存在多个条件时，条件之间默认存在"与"的关系。因此，以下设置的匹配时间必须为星期 5，并且这个"星期 5"同时还需要是每个月的 22 号到 28 号之间的一天，即此设置表示每月第 4 个星期 5。

```bash
root@ubuntu:~# iptables -F OUTPUT
root@ubuntu:~# iptables -I OUTPUT -p tcp --dport 80 -m time --weekdays 5 --monthdays 22,23,24,25,26,27,28 -j REJECT
root@ubuntu:~# iptables -vL OUTPUT
Chain OUTPUT (policy ACCEPT 0 packets, 0 bytes)
 pkts bytes target     prot opt in     out     source               destination
    0     0 REJECT     tcp  --  any    any     anywhere             anywhere             tcp dpt:http TIME on Fri on 22nd,23rd,24th,25th,26th,27th,28th UTC reject-with icmp-port-unreachable
```

除了使用 `--weekdays` 与 `--monthdays` 选项，还可以使用 `--datestart` 与 `-datestop` 选项，指定具体的日期范围如下。

```bash
root@ubuntu:~# iptables -F OUTPUT
root@ubuntu:~# iptables -I OUTPUT -p tcp -m time --datestart 2021-01-07 --datestop 2021-01-31 -j REJECT
root@ubuntu:~# iptables -vL OUTPUT
Chain OUTPUT (policy ACCEPT 0 packets, 0 bytes)
 pkts bytes target     prot opt in     out     source               destination
    0     0 REJECT     tcp  --  any    any     anywhere             anywhere             TIME starting from 2021-01-07 00:00:00 until date 2021-01-31 00:00:00 UTC reject-with icmp-port-unreachable
```

上面指定的日期范围为 2021 年 01 月 07 日到 2021 年 01 月 31 日。

上述选项中，`--monthdays` 与 `--weekdays` 可以使用 `!` 取反，其他选项不能取反。

## connlimit 扩展模块

使用 connlimit 扩展模块，可以限制每个 IP 地址同时到 server 端的链接数量。注意：我们不用指定 IP，其默认就是针对"每个客户端 IP"，即对单 IP 的并发连接数限制。

比如，限制每个 IP 地址最多只能占用两个 ssh 链接远程到 server 端，可以进行如下限制。

```bash
root@ubuntu:~# iptables -F INPUT
root@ubuntu:~# iptables -I INPUT -p tcp --dport 22 -m connlimit --connlimit-above 2 -j REJECT
root@ubuntu:~# iptables -vL INPUT
Chain INPUT (policy ACCEPT 0 packets, 0 bytes)
 pkts bytes target     prot opt in     out     source               destination
    0     0 REJECT     tcp  --  any    any     anywhere             anywhere             tcp dpt:ssh #conn src/32 > 2 reject-with icmp-port-unreachable
```

相关选项说明如下

- `-m connlimit` 指定使用 connlimit 扩展。
- `--connlimit-above 2` 表示限制每个 IP 的链接数量上限为 2，再配合 `-p tcp --dport 22` 即表示限制每个客户端 IP 的 ssh 并发链接数量不能高于 2。

同时打开 3 个终端，执行以下命令链接到测试机器 `172.16.39.2`。

```bash
ssh sammy@172.16.39.2
```

可见，第 3 条链接会触发如下错误

```bash
ssh: connect to host 172.16.39.2 port 22: Connection refused
```

可以使用 `!` 对 `--connlimit-above` 选项进行取反，示例如下

```bash
root@ubuntu:~# iptables -F INPUT
root@ubuntu:~# iptables -I INPUT -p tcp --dport 22 -m connlimit ! --connlimit-above 2 -j ACCEPT
root@ubuntu:~# iptables -vL INPUT
Chain INPUT (policy ACCEPT 0 packets, 0 bytes)
 pkts bytes target     prot opt in     out     source               destination
    0     0 ACCEPT     tcp  --  any    any     anywhere             anywhere             tcp dpt:ssh #conn src/32 <= 2
```

上例表示每个客户端 IP 的 ssh 链接数量只要不超过两个，则允许链接。

但是以上规则并**不能表示**：每个客户端 IP 的 ssh 链接数量超过两个则拒绝链接（与 [前文][04. 匹配条件总结 1] 的举例原理相同，此处不再赘述）。也就是说，以上规则不能达到"限制"的目的，所以通常并不会对此选项取反。因为既然使用此选项，目的通常就是"限制"连接数量。

Ubuntu 20.04.1/CentOS 7 的 iptables 还提供了一个新的选项-- `--connlimit-upto`。这个选项的含义与 `! --commlimit-above` 的含义相同，即链接数量未达到指定的连接数量之意。综上所述，`--connlimit-upto` 选项也不常用。

```bash
root@ubuntu:~# iptables -F INPUT
root@ubuntu:~# iptables -I INPUT -p tcp --dport 22 -m connlimit --connlimit-upto 2 -j ACCEPT
root@ubuntu:~# iptables -vL INPUT
Chain INPUT (policy ACCEPT 0 packets, 0 bytes)
 pkts bytes target     prot opt in     out     source               destination
    0     0 ACCEPT     tcp  --  any    any     anywhere             anywhere             tcp dpt:ssh #conn src/32 <= 2
```

刚才说过，`--connlimit-above` 默认表示限制"每个 IP"的链接数量。还可以配合 `--connlimit-mask` 选项，去限制"某类网段"的链接数量，示例如下

::: warning 注意事项
下例需要一定的网络知识基础。如果你还不了解它们，可以选择先跳过此选项或者先去学习部分的网络知识
:::

```bash
root@ubuntu:~# iptables -F INPUT
root@ubuntu:~# iptables -I INPUT -p tcp -m connlimit --connlimit-above 2 --connlimit-mask 24 -j REJECT
root@ubuntu:~# iptables -vL INPUT
Chain INPUT (policy ACCEPT 0 packets, 0 bytes)
 pkts bytes target     prot opt in     out     source               destination
    0     0 REJECT     tcp  --  any    any     anywhere             anywhere             #conn src/24 > 2 reject-with icmp-port-unreachable
```

上例中 `--connlimit-mask 24` 表示某个 C 类网段。mask 为掩码之意，将 24 转换成点分十进制就表示 `255.255.255.0`。以上示例规则表示：一个最多包含 254 个 IP 的 C 类网络中，同时最多只能有 2 个 ssh 客户端可连接到当前服务器，看来资源很紧俏啊！254 个 IP 才有 2 个名额。如果一个 IP 同时把两个连接名额都占用了，那么剩下的 253 个 IP 连一个连接名额都没有。那么，我们再看看下例，是不是就好多了。

```bash
root@ubuntu:~# iptables -F INPUT
root@ubuntu:~# iptables -I INPUT -p tcp -m connlimit --connlimit-above 10 --connlimit-mask 27 -j REJECT
root@ubuntu:~# iptables -vL INPUT
Chain INPUT (policy ACCEPT 0 packets, 0 bytes)
 pkts bytes target     prot opt in     out     source               destination
    0     0 REJECT     tcp  --  any    any     anywhere             anywhere             #conn src/27 > 10 reject-with icmp-port-unreachable
```

上例中 `--connlimit-mask 27` 表示某个 C 类网段。通过计算后可以得知，这个网段最多只能有 30 台机器（30 个 IP）。这 30 个 IP 地址最多只能有 10 个 ssh 连接可同时连接到服务器端，比刚才的设置大方多了。当然，这样并不能避免某个 IP 占用所有连接的情况发生。假设报文来自 `192.168.1.40` 这个 IP，按照掩码为 27 进行计算，这个 IP 属于 `192.168.1.32/27` 网段。如果 `192.168.1.40` 同时占用了 10 个 ssh 连接，那么当 `192.168.1.51` 这个 IP 向服务端发起 ssh 连接请求时，同样会被拒绝。因为 `192.168.1.51` 这个 IP 按照掩码为 27 进行计算，也是属于 `192.168.1.32/27` 网段，所以他们共享这 10 个连接名额。

因此，在不使用 `--connlimit-mask` 的情况下，连接数量的限制是针对"每个 IP"而言的；使用了 `--connlimit-mask` 选项后，则可以针对"某类 IP 段内一定数量的 IP"进行连接数量的限制，这样灵活许多。

## limit 扩展模块

connlimit 模块限制连接数量，limit 模块则限制"报文到达速率"。

用大白话说就是，如果想要限制单位时间内流入的包数量，就能用 limit 模块。

可以以秒为单位进行限制，也可以以分钟、小时、天作为单位进行限制。

比如，限制每秒最多流入 3 个包，或者限制每分钟最多流入 30 个包。

举个栗子：假设想要限制外部主机对本机进行 `ping` 操作时，本机最多每 6 秒放行一个 `ping` 包。可以进行如下设置

> 注意：只进行如下设置有可能无法实现限制功能，请看完后面的内容。

```bash
root@ubuntu:~# iptables -F INPUT
root@ubuntu:~# iptables -I INPUT -p icmp -m limit --limit 10/minute -j ACCEPT
root@ubuntu:~# iptables -vL INPUT
Chain INPUT (policy ACCEPT 0 packets, 0 bytes)
 pkts bytes target     prot opt in     out     source               destination
    0     0 ACCEPT     icmp --  any    any     anywhere             anywhere             limit: avg 10/min burst 5
```

相关选项说明如下

- `-p icmp` 表示针对 `ping` 请求添加一条规则（ping 使用 ICMP 协议）
- `-m limit` 表示使用 limit 模块
- `--limit 10/minute -j ACCEPT` 表示每分钟最多放行 10 个包，就相当于每 6 秒钟最多放行一个包。换句话说，每过 6 秒钟放行一个包

配置完上述规则后，在另外一台机器上对当前机器 `172.16.39.2` 进行 `ping` 操作，看看是否能够达到限制的目的，如下所示

```bash
ping 172.16.39.2
PING 172.16.39.2 (172.16.39.2): 56 data bytes
64 bytes from 172.16.39.2: icmp_seq=0 ttl=64 time=0.401 ms
64 bytes from 172.16.39.2: icmp_seq=1 ttl=64 time=0.786 ms
64 bytes from 172.16.39.2: icmp_seq=2 ttl=64 time=0.709 ms
64 bytes from 172.16.39.2: icmp_seq=3 ttl=64 time=0.842 ms
64 bytes from 172.16.39.2: icmp_seq=4 ttl=64 time=0.746 ms
64 bytes from 172.16.39.2: icmp_seq=5 ttl=64 time=0.665 ms
64 bytes from 172.16.39.2: icmp_seq=6 ttl=64 time=0.728 ms
64 bytes from 172.16.39.2: icmp_seq=7 ttl=64 time=0.474 ms
64 bytes from 172.16.39.2: icmp_seq=8 ttl=64 time=0.741 ms
64 bytes from 172.16.39.2: icmp_seq=9 ttl=64 time=0.733 ms
64 bytes from 172.16.39.2: icmp_seq=10 ttl=64 time=0.689 ms
64 bytes from 172.16.39.2: icmp_seq=11 ttl=64 time=0.740 ms
^C
--- 172.16.39.2 ping statistics ---
12 packets transmitted, 12 packets received, 0.0% packet loss
round-trip min/avg/max/stddev = 0.401/0.688/0.842/0.121 ms
```

可见刚才配置的规则并没有如想象一般，`ping` 请求的响应速率完全没有发生任何变化。为什么呢？我们一起来分析一下。

回顾一下刚才配置的规则。

```bash
root@ubuntu:~# iptables -I INPUT -p icmp -m limit --limit 10/minute -j ACCEPT
```

其实，可以把以上规则理解为如下含义。

每 6 秒放行一个包，那么 iptables 就会计时，每 6 秒一个轮次。到第 6 秒时，到达的报文就会匹配到对应的规则，执行对应的动作。而动作是 `ACCEPT`。**那么在第 6 秒之前到达的包，则无法被上述规则匹配到。**

之前总结过：报文会匹配链的每一条规则。如果没有任何一条规则能够匹配到，则匹配默认动作（链的默认策略）。

既然第 6 秒之前的包没有被上述规则匹配到，而我们又没有在 INPUT 链配置其他规则。因此，第 6 秒之前的包肯定会被默认策略匹配到，先看看默认策略是什么。

```bash
root@ubuntu:~# iptables -L INPUT
Chain INPUT (policy ACCEPT)
target     prot opt source               destination
ACCEPT     icmp --  anywhere             anywhere             limit: avg 10/min burst 5
```

现在再想想，应该明白为什么刚才的 `ping` 的响应速率没有变化了。

因为第 6 秒的报文的确被对应的规则匹配到了。于是执行"放行"操作，第 6 秒之前的报文没有被配置的规则匹配到，但是被默认策略匹配到，而恰巧默认动作也是 `ACCEPT`。所以所有 `ping` 报文都被放行。怪不得与没有配置规则时的速率一模一样。

因此，我们可以修改 `INPUT` 链的默认策略，或者在以上限制规则的后面再加入一条规则，将"漏网之鱼"匹配到即可，示例如下

```bash
root@ubuntu:~# iptables -F INPUT
root@ubuntu:~# iptables -I INPUT -p icmp -m limit --limit 10/minute -j ACCEPT
root@ubuntu:~# iptables -A INPUT -p icmp -j REJECT
root@ubuntu:~# iptables -L INPUT
Chain INPUT (policy ACCEPT)
target     prot opt source               destination
ACCEPT     icmp --  anywhere             anywhere             limit: avg 10/min burst 5
REJECT     icmp --  anywhere             anywhere             reject-with icmp-port-unreachable
```

如上所示，第一条规则表示每分钟最多放行 10 个 ICMP 包，也就是 6 秒放行一个。第 6 秒的 ICMP 包会被以上第一条规则匹配到，第 6 秒之前的包则不会被第一条规则匹配到，而被后面的拒绝规则匹配到。此时再试试，看看 `ping` 的报文放行速率有没有发生改变。

```bash{44}
ping 172.16.39.2
PING 172.16.39.2 (172.16.39.2): 56 data bytes
64 bytes from 172.16.39.2: icmp_seq=0 ttl=64 time=0.378 ms
64 bytes from 172.16.39.2: icmp_seq=1 ttl=64 time=0.710 ms
64 bytes from 172.16.39.2: icmp_seq=2 ttl=64 time=0.497 ms
64 bytes from 172.16.39.2: icmp_seq=3 ttl=64 time=0.654 ms
64 bytes from 172.16.39.2: icmp_seq=4 ttl=64 time=0.693 ms
92 bytes from 172.16.39.2 (172.16.39.2): Destination Port Unreachable
Vr HL TOS  Len   ID Flg  off TTL Pro  cks      Src      Dst
 4  5  00 5400 59b1   0 0000  40  01 7ad4 172.16.39.1  172.16.39.2

Request timeout for icmp_seq 5
92 bytes from 172.16.39.2 (172.16.39.2): Destination Port Unreachable
Vr HL TOS  Len   ID Flg  off TTL Pro  cks      Src      Dst
 4  5  00 5400 5fff   0 0000  40  01 7486 172.16.39.1  172.16.39.2

Request timeout for icmp_seq 6
64 bytes from 172.16.39.2: icmp_seq=7 ttl=64 time=0.742 ms
92 bytes from 172.16.39.2 (172.16.39.2): Destination Port Unreachable
Vr HL TOS  Len   ID Flg  off TTL Pro  cks      Src      Dst
 4  5  00 5400 f2a5   0 0000  40  01 e1df 172.16.39.1  172.16.39.2

Request timeout for icmp_seq 8
92 bytes from 172.16.39.2 (172.16.39.2): Destination Port Unreachable
Vr HL TOS  Len   ID Flg  off TTL Pro  cks      Src      Dst
 4  5  00 5400 64e1   0 0000  40  01 6fa4 172.16.39.1  172.16.39.2

Request timeout for icmp_seq 9
92 bytes from 172.16.39.2 (172.16.39.2): Destination Port Unreachable
Vr HL TOS  Len   ID Flg  off TTL Pro  cks      Src      Dst
 4  5  00 5400 8178   0 0000  40  01 530d 172.16.39.1  172.16.39.2

Request timeout for icmp_seq 10
92 bytes from 172.16.39.2 (172.16.39.2): Destination Port Unreachable
Vr HL TOS  Len   ID Flg  off TTL Pro  cks      Src      Dst
 4  5  00 5400 c4c4   0 0000  40  01 0fc1 172.16.39.1  172.16.39.2

Request timeout for icmp_seq 11
92 bytes from 172.16.39.2 (172.16.39.2): Destination Port Unreachable
Vr HL TOS  Len   ID Flg  off TTL Pro  cks      Src      Dst
 4  5  00 5400 3f58   0 0000  40  01 952d 172.16.39.1  172.16.39.2

Request timeout for icmp_seq 12
64 bytes from 172.16.39.2: icmp_seq=13 ttl=64 time=0.674 ms
92 bytes from 172.16.39.2 (172.16.39.2): Destination Port Unreachable
Vr HL TOS  Len   ID Flg  off TTL Pro  cks      Src      Dst
 4  5  00 5400 f9cf   0 0000  40  01 dab5 172.16.39.1  172.16.39.2

Request timeout for icmp_seq 14
92 bytes from 172.16.39.2 (172.16.39.2): Destination Port Unreachable
Vr HL TOS  Len   ID Flg  off TTL Pro  cks      Src      Dst
 4  5  00 5400 6043   0 0000  40  01 7442 172.16.39.1  172.16.39.2

Request timeout for icmp_seq 15
92 bytes from 172.16.39.2 (172.16.39.2): Destination Port Unreachable
Vr HL TOS  Len   ID Flg  off TTL Pro  cks      Src      Dst
 4  5  00 5400 58ce   0 0000  40  01 7bb7 172.16.39.1  172.16.39.2

^C
--- 172.16.39.2 ping statistics ---
17 packets transmitted, 7 packets received, 58.8% packet loss
round-trip min/avg/max/stddev = 0.378/0.621/0.742/0.123 ms
```

刚开始还真吓我一跳，难道配置的规则还是有问题？

结果发现：只有前 5 个 `ping` 包没有受到限制，之后的 `ping` 包已经开始受到了规则限制。

由上可知：除了前 5 个 `ping` 包以外，之后的 `ping` 包差不多每 6 秒才能 `ping` 通一次。看来之后的 `ping` 包已经受到规则控制，被限制流入防火墙的速率。前 5 个 `ping` 包是什么鬼？为什么它们不受规则限制呢？这个现象正好引出另一个选项 `--limit-burst`。

`--limit-burst` 选项是干什么用的呢？先用不准确的大白话描述一遍：`--limit-burst` 可以指定"空闲时可放行的包数量"。其实，这样说并不准确，但是可以先这样大概的理解。在不使用 `--limit-burst` 选项明确指定放行包的数量时，默认值为 5。所以才会出现以上情况，前 5 个 `ping` 包并没有受到任何速率限制，之后的包才受到规则限制。

想要彻底了解 limit 模块的工作原理需要先了解一下其使用的"令牌桶"算法。

可以这样想象：有一个木桶，木桶里面放了 5 块令牌，而且这个木桶最多也只能放下 5 块令牌。所有报文如果想要出入关，都必须要持有木桶的令牌才行。这个木桶有一个神奇的功能，就是每隔 6 秒钟会生成一块新的令牌。如果此时，木桶的令牌不足 5 块，那么新生成的令牌就存放在木桶。如果木桶中已经存在 5 块令牌，新生成的令牌就无处安放了，只能溢出木桶（令牌被丢弃）。如果此时有 5 个报文想要入关，那么这 5 个报文就去木桶里找令牌，正好一人一个。于是他们 5 个手持令牌，快乐地入关了。此时木桶空了。再有报文想要入关，已经没有对应的令牌可以使用。但过了 6 秒钟，新的令牌生成了。此刻，正好来了一个报文想要入关。这个报文拿起这个令牌，就入关了。在这个报文之后，如果很长一段时间内没有新的报文想要入关，木桶中的令牌又会慢慢的积攒起来，直到达到 5 个令牌，并且一直保持着 5 个令牌，直到有人需要使用这些令牌。这就是令牌桶算法的大致逻辑。

就拿刚才的"令牌桶"理论类比命令

- `--limit` 选项指定"多长时间生成一个新令牌的"
- `--limit-burst`选项指定"木桶最多存放几个令牌的"

现在，你明白了吗？？示例如下

```bash
root@ubuntu:~# iptables -F INPUT
root@ubuntu:~# iptables -I INPUT -p icmp -m limit --limit-burst 3 --limit 10/minute -j ACCEPT
root@ubuntu:~# iptables -A INPUT -p icmp -j REJECT
root@ubuntu:~# iptables -L INPUT
Chain INPUT (policy ACCEPT)
target     prot opt source               destination
ACCEPT     icmp --  anywhere             anywhere             limit: avg 10/min burst 3
REJECT     icmp --  anywhere             anywhere             reject-with icmp-port-unreachable
```

以上命令表示令牌桶最多能存放 3 个令牌，每分钟生成 10 个令牌（即 6 秒钟生成一个令牌）。

之前说过，使用 `--limit` 选项时，可以选择的时间单位有多种，如下

- `/second`
- `/minute`
- `/hour`
- `/day`

比如，`3/second` 表示每秒生成 3 个"令牌"，`30/minute` 表示每分钟生成 30 个"令牌"。

## 小结

老规矩，为了便于以后速查，上文提到的命令总结如下。

### iprange 模块

包含的扩展匹配条件如下

|          条件 | 说明                   |
| ------------: | :--------------------- |
| `--src-range` | 指定连续的源地址范围   |
| `--dst-range` | 指定连续的目标地址范围 |

```bash
#示例
iptables -t filter -I INPUT -m iprange --src-range 192.168.1.127-192.168.1.146 -j DROP
iptables -t filter -I OUTPUT -m iprange --dst-range 192.168.1.127-192.168.1.146 -j DROP
iptables -t filter -I INPUT -m iprange ! --src-range 192.168.1.127-192.168.1.146 -j DROP
```

### string 模块

常用扩展匹配条件如下

|       条件 | 说明                                                       |
| ---------: | :--------------------------------------------------------- |
|   `--algo` | 指定对应的匹配算法，可用算法为 bm 和 kmp，此选项为必需选项 |
| `--string` | 指定需要匹配的字符串                                       |

```bash
#示例
iptables -t filter -I INPUT -p tcp --sport 80 -m string --algo bm --string "OOXX" -j REJECT
iptables -t filter -I INPUT -p tcp --sport 80 -m string --algo bm --string "OOXX" -j REJECT
```

### time 模块

常用扩展匹配条件如下

|          条件 | 说明                             |
| ------------: | :------------------------------- |
| `--timestart` | 指定时间范围的开始时间，不可取反 |
|  `--timestop` | 指定时间范围的结束时间，不可取反 |
|  `--weekdays` | 指定"星期几"，可取反             |
| `--monthdays` | 指定"几号"，可取反               |
| `--datestart` | 指定日期范围的开始日期，不可取反 |
|  `--datestop` | 指定日期范围的结束时间，不可取反 |

```bash
#示例
iptables -t filter -I OUTPUT -p tcp --dport 80 -m time --timestart 09:00:00 --timestop 19:00:00 -j REJECT
iptables -t filter -I OUTPUT -p tcp --dport 443 -m time --timestart 09:00:00 --timestop 19:00:00 -j REJECT
iptables -t filter -I OUTPUT -p tcp --dport 80 -m time --weekdays 6,7 -j REJECT
iptables -t filter -I OUTPUT -p tcp --dport 80 -m time --monthdays 22,23 -j REJECT
iptables -t filter -I OUTPUT -p tcp --dport 80 -m time ! --monthdays 22,23 -j REJECT
iptables -t filter -I OUTPUT -p tcp --dport 80 -m time --timestart 09:00:00 --timestop 18:00:00 --weekdays 6,7 -j REJECT
iptables -t filter -I OUTPUT -p tcp --dport 80 -m time --weekdays 5 --monthdays 22,23,24,25,26,27,28 -j REJECT
iptables -t filter -I OUTPUT -p tcp --dport 80 -m time --datestart 2017-12-24 --datestop 2017-12-27 -j REJECT
```

### connlimit 模块

常用的扩展匹配条件如下

|                条件 | 说明                                                                                                                      |
| ------------------: | :------------------------------------------------------------------------------------------------------------------------ |
| `--connlimit-above` | 单独使用此选项时，表示限制每个 IP 的链接数量                                                                              |
|  `--connlimit-mask` | 此选项不能单独使用。在使用`--connlimit-above` 选项时，配合此选项，则可以针对"某类 IP 段内的一定数量 IP"进行连接数量的限制 |

```bash
#示例
iptables -I INPUT -p tcp --dport 22 -m connlimit --connlimit-above 2 -j REJECT
iptables -I INPUT -p tcp --dport 22 -m connlimit --connlimit-above 20 --connlimit-mask 24 -j REJECT
iptables -I INPUT -p tcp --dport 22 -m connlimit --connlimit-above 10 --connlimit-mask 27 -j REJECT
```

### limit 模块

常用的扩展匹配条件如下

|            条件 | 说明                                                                                                         |
| --------------: | :----------------------------------------------------------------------------------------------------------- |
| `--limit-burst` | 类比"令牌桶"算法，此选项用于指定令牌桶中令牌的最大数量，上文已经详细地描述了"令牌桶"的概念，方便回顾。       |
|       `--limit` | 类比"令牌桶"算法，此选项用于指定令牌桶中生成新令牌的频率，可用时间单位有 `second`、`minute`、`hour` 和 `day` |

## 参考文献

- [iptables 详解（5）：iptables 匹配条件总结之二（常用扩展模块）]

[iptables series]: /tag/iptables/
[iptables 详解（5）：iptables 匹配条件总结之二（常用扩展模块）]: http://www.zsythink.net/archives/1564
[04. 匹配条件总结 1]: /2021/01/03/iptables-04-rules-summary-01/
