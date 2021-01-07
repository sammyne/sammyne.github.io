---
title: '[iptables] 11. 网络防火墙'
date: 2021-01-09
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
在进行 iptables 实验时，请务必在测试机上进行。iptables 规则设置不当有可能使你无法连接到远程主机。本文的实验操作环境为 VMware Fusion Pro 12.0 （前面文章使用的是 VMware Fusion Player 12.0）下的 Ubuntu 20.04.1。
:::

阅读这篇文章需要以前面的文章为基础。如果在阅读时遇到障碍，请回顾那些文章。

回顾一下之前的知识。[第一篇介绍 iptables 的文章][iptables-01-concepts] 就描述过防火墙的概念。防火墙从逻辑上讲，可以分为

- **主机防火墙**：针对于单个主机进行防护。
- **网络防火墙**：往往处于网络入口或边缘，针对于网络入口进行防护，服务于防火墙背后的本地局域网。

前面的文章中，iptables 都是作为主机防火墙的角色出现的。本文介绍一下如何把 iptables 应用到网络防火墙。

回到刚才的概念，网络防火墙往往处于网络的入口或者边缘，如果想要使用 iptables 充当网络防火墙，iptables 所在的主机需要处于网络入口处，示意图如下。

```
                     +--------------------------------------------------------------------------+
                     |           +--------+   +--------+   +--------+                           |
                     |           |  主机 1 |   | 主机 2 |   |  主机 3 |                           |
                     |           +--------+   +--------+   +--------+                           |
+-----+ +------> +-----------+                                                                  |
| 网络 |          | 防火墙主机  |               +---------+   +---------+   +---------+           |
+-----+ <------+ +-----------+                |  主机 4 |   |   主机 5 |   |   主机 6 |           |
                     |                        +---------+   +---------+   +---------+           |
                     |                                                                          |
                     |                                     +--------+   +--------+   +--------+ |
                     | 内部网络                             |  主机 7 |   |  主机 8 |   | 主机 9 | |
                     |                                     +--------+   +--------+   +--------+ |
                     |                                                                          |
                     |                                                  ...                     |
                     |                                                                          |
                     +--------------------------------------------------------------------------+
```

上图的防火墙主机为 iptables 所在主机。此时 iptables 充当的角色即为网络防火墙。最大的虚线框表示网络防火墙所防护的网络区域。

当外部网络的主机与网络内部主机通讯时，不管是由外部主机发往内部主机的报文，还是由内部主机发往外部主机的报文，都需要经过 iptables 所在的主机，由 iptables 所在的主机进行"过滤并转发"。因此，防火墙主机的主要工作就是"过滤并转发"。说到这里，再回顾之前的 iptables 报文流程图如下：

![](./images/packets-flow.png)

前面的文章中，iptables 都是作为"主机防火墙"的角色出现的。所以举例只用到上图的 `INPUT` 链与 `OUTPUT` 链。因为拥有"过滤功能"的链只有 3 条--`INPUT`、`OUTPUT` 和 `FORWARD`，当报文发往本机时，如果想要过滤，只能在 `INPUT` 链与 `OUTPUT` 链实现。而此时，iptables 的角色发生了转变--成为了"网络防火墙"。而刚才说过网络防火墙的职责就是"过滤并转发"，"过滤"只能在 `INPUT`、`OUTPUT` 和 `FORWARD` 三条链实现，"转发"报文则只会经过 `FORWARD` 链（发往本机的报文才会经过 `INPUT`链）。综上，iptables 的角色变为"网络防火墙"时，规则只能定义在 `FORWARD` 链。

## 环境准备

那么为了能够进行实验，我们设置如下所示实验场景（后面有对图的解释）

```
+----------------+
| 172.16.39.8: A |
+---+---------+--+
    |         ^             +---------------------------------------------+
    |         |             |                            +-------------+  |
    |         |             |                            |    ...      |  |
+------------------------------------------ +            +-------------+  |
|   |         |             |               |                             |
| +-v---------+-+           | +----------+ +-----------> +-------------+  |
| | 172.16.39.2 |           | | 10.1.0.2 |  |            | C: 10.1.0.3 |  |
| +-------------+           | +----------+ <-----------+ +-------------+  |
|    网卡 1          主机 B  |    网卡 2      |                             |
+------------------------------------------ +            +-------------+  |
                            |                            |    ...      |  |
                            | 内部网络                    +-------------+  |
                            +---------------------------------------------+
```

假设上图最大虚线框所示的网络为内部网络。

::: warning 注意
此处所描述的内网、外网与我们平常所说的公网、私网不同。内外部网络可以理解成两个网段，A 网络与 B 网络。为了方便描述，我们把右边最大虚线框内的主机称为内部主机，最大虚线框所表示的网络称为内部网络，圆形外的网络称为外部网络。
:::

假设内部网络的网段为 `10.1.0.0/16`。此内部网络存在主机 C，其 IP 地址为 `10.1.0.3`。

上图的主机 B 充当网络防火墙的角色，也属于内部网络，同时主机 B 也能与外部网络进行通讯。主机 B 有两块网卡--网卡 1 与网卡 2，IP 地址分别为 `10.1.0.2` 和 `172.16.39.2`，所以防火墙主机在内部网络的 IP 地址为 `10.1.0.2`，防火墙主机与外部网络通信的 IP 地址为 `172.16.39.2`。

主机 A 充当"外部网络主机"的角色，IP 地址为 `172.16.39.8`。我们使用主机 A 访问内部网络的主机 C，但是需要主机 B 进行转发。主机 B 在转发报文时会进行过滤，以实现网络防火墙的功能。

我已经准备了 3 台虚拟机：A、B 和 C。

虚拟机 A 与虚拟机 B 的网卡 2 都使用了桥接模式。

为了能够尽量模拟内部网络的网络入口，我们将虚拟机 B 的网卡 1 与虚拟机 C 同时放在"仅主机模式"的虚拟网络，操作如下（本人的操作系统为 macOS）

1. 点击 VMware Fusion "Preferences" 菜单
2. 选择 "Network" 面板
3. 暂时解锁更改设置
4. 添加如图所示仅主机模式的虚拟网络 `vmnet2`，设置子网地址为 `10.1.0.0`，子网掩码为 `255.255.0.0`

下图的 vmnet2 为已经添加过的虚拟网络，此处不再重复添加。

![将虚拟机 B 的网卡 1 与虚拟机 C 同时放在"仅主机模式"的虚拟网络](./images/vmware-add-network.png)

由于 B 主机现在的角色是 `10.1.0.0` 的"网络防火墙"。直接将 C 主机的网关指向 B 主机的内部网络 IP，如下图所示（命令的执行顺序很重要）

::: tip 温馨提示
`route` 命令配置的路由条目在网络重启后将会失效。匹配度更精确的路由表项优先级更高。
:::

```bash{6,7}
root@ubuntu2:~# route
Kernel IP routing table
Destination     Gateway         Genmask         Flags Metric Ref    Use Iface
10.1.0.0        0.0.0.0         255.255.0.0     U     100    0        0 ens33
link-local      0.0.0.0         255.255.0.0     U     1000   0        0 ens33
root@ubuntu2:~# route add -net 0.0.0.0 gw 10.1.0.2
root@ubuntu2:~# route del -net 10.1.0.0/16
root@ubuntu2:~# route -n
Kernel IP routing table
Destination     Gateway         Genmask         Flags Metric Ref    Use Iface
0.0.0.0         10.1.0.2        0.0.0.0         UG    0      0        0 ens33
169.254.0.0     0.0.0.0         255.255.0.0     U     1000   0        0 ens33
```

同时，为了尽量简化路由设置，直接将 A 主机访问 `10.1` 网络时的网关指向 B 主机的网卡 2 的 IP，如下图所示。

```bash{4}
root@ubuntu3:~# ifconfig | awk '/inet / {print $1,$2}'
inet 172.16.39.8
inet 127.0.0.1
root@ubuntu3:~# route add -net 10.1.0.0/16 gw 172.16.39.2
root@ubuntu3:~# route -n
Kernel IP routing table
Destination     Gateway         Genmask         Flags Metric Ref    Use Iface
0.0.0.0         172.16.39.1     0.0.0.0         UG    100    0        0 ens33
10.1.0.0        172.16.39.2     255.255.0.0     UG    0      0        0 ens33
169.254.0.0     0.0.0.0         255.255.0.0     U     1000   0        0 ens33
172.16.39.0     0.0.0.0         255.255.255.0   U     100    0        0 ens33
```

现在 A 主机通往 `10.1` 网络的网关已经指向 B 主机。我们再试试 A 主机能否达到 `10.1.0.0/16` 网络。

如下所示，直接在 A 主机向 C 主机发起 `ping` 请求，并没有得到任何回应。

```bash
root@ubuntu3:~# ping 10.1.0.3
PING 10.1.0.3 (10.1.0.3) 56(84) bytes of data.
^C
--- 10.1.0.3 ping statistics ---
4 packets transmitted, 0 received, 100% packet loss, time 3075ms
```

再试试 B 主机的内部网 IP。如下所示，直接在 A 主机向 B 主机的内部网 IP 发起 `ping` 请求，发现是可以 `ping` 通。这是为什么呢？

```bash
root@ubuntu3:~# ping 10.1.0.2
PING 10.1.0.2 (10.1.0.2) 56(84) bytes of data.
64 bytes from 10.1.0.2: icmp_seq=1 ttl=64 time=0.654 ms
64 bytes from 10.1.0.2: icmp_seq=2 ttl=64 time=1.11 ms
64 bytes from 10.1.0.2: icmp_seq=3 ttl=64 time=1.12 ms
^C
--- 10.1.0.2 ping statistics ---
3 packets transmitted, 3 received, 0% packet loss, time 2017ms
rtt min/avg/max/mdev = 0.654/0.963/1.123/0.218 ms
```

按照道理来说，`10.1.0.3` 与 `10.1.0.2` 都属于 `10.1.0.0/16`网段，为什么 B 主机的 IP 就能通，C 主机的 IP 却不通呢？

先分析 `10.1.0.3` 没有回应的原因。

A 主机通过路由表得知，发往 `10.1.0.0/16` 网段的报文网关为 B 主机。当报文达到 B 主机时，B 主机发现 A 的目标为 `10.1.0.3`，而自己的 IP 是 `10.1.0.2`。这时，B 主机需要将这个报文转发给 `10.1.0.3`（也就是 C 主机）。但是，Linux 主机在默认情况下，并不会转发报文。如果想要让 Linux 主机能够转发报文，需要额外的设置。这就是为什么 `10.1.0.3` 没有回应的原因--因为 B 主机压根就没有将 A 主机的 `ping` 请求转发给 C 主机，导致 C 主机没有收到 A 的 `ping` 请求，所以 A 自然得不到回应。

现在再来聊聊为什么 `10.1.0.2` 会回应。

这是因为 `10.1.0.2` 与 `172.16.39.2` 这个 IP 都属于 B 主机。当 A 主机通过路由表将 `ping` 报文发送到 B 主机时，B 主机发现自己既是 `172.16.39.2` 又是 `10.1.0.2`，所以就直接回应了 A 主机，并没有将报文转发给谁，从而让 A 主机能够得到 `10.1.0.2` 的回应。

大致原因分析如上。接下来我们再学习一下设置 Linux 主机转发报文。

首先查看 `/proc/sys/net/ipv4/ip_forward` 的文件内容。如果文件内容为 0，则表示当前主机不支持转发。

```bash
root@ubuntu:~# cat /proc/sys/net/ipv4/ip_forward
0
```

如果想要让当前主机支持核心转发功能，只需要将此文件的值设置为 1 即可。

```bash
root@ubuntu:~# echo 1 > /proc/sys/net/ipv4/ip_forward
root@ubuntu:~# cat /proc/sys/net/ipv4/ip_forward
1
```

现在就开启了 B 主机的核心转发功能。

除了上述方法，还能使用 `sysctl` 命令去设置是否开启核心转发。示例如下

```bash
root@ubuntu:~# sysctl -w net.ipv4.ip_forward=0
net.ipv4.ip_forward = 0
root@ubuntu:~# cat /proc/sys/net/ipv4/ip_forward
0
root@ubuntu:~# sysctl -w net.ipv4.ip_forward=1
net.ipv4.ip_forward = 1
root@ubuntu:~# cat /proc/sys/net/ipv4/ip_forward
1
```

上述两种方法都能控制是否开启核心转发。但是通过上述两种方法设置的时效都是临时的，会因重启网络服务而失效。

如果想要永久生效，则需要设置 `/etc/sysctl.conf` 文件，添加（或修改）配置项 `net.ipv4.ip_forward = 1` 如下即可。

至此，B 主机已经具备了核心转发功能，可以转发报文了。现在再次回到 A 主机，向 C 主机发起 `ping` 请求。如下所示，可见已经可以 `ping` 通。

::: tip 温馨提示
如果你仍然无法 `ping` 通，可能是因为你使用 `route` 命令配置了 C 主机的默认网关。这种情况下，请查看 C 主机的路由配置是否自动消失。如果没有对应的路由条目，请重新配置。同时，如果你的主机 C 如果有多块网卡，可以暂时禁用其他网卡试试。
:::

```bash
root@ubuntu3:~# ping 10.1.0.3
PING 10.1.0.3 (10.1.0.3) 56(84) bytes of data.
64 bytes from 10.1.0.3: icmp_seq=1 ttl=63 time=1.16 ms
64 bytes from 10.1.0.3: icmp_seq=2 ttl=63 time=1.82 ms
64 bytes from 10.1.0.3: icmp_seq=3 ttl=63 time=1.69 ms
^C
--- 10.1.0.3 ping statistics ---
3 packets transmitted, 3 received, 0% packet loss, time 2005ms
rtt min/avg/max/mdev = 1.164/1.557/1.823/0.283 ms
```

同时，从主机 C 向主机 A 发起 `ping` 请求，也可以 `ping` 通，如下所示

```bash
root@ubuntu2:~# ping 172.16.39.8
PING 172.16.39.8 (172.16.39.8) 56(84) bytes of data.
64 bytes from 172.16.39.8: icmp_seq=1 ttl=63 time=1.15 ms
64 bytes from 172.16.39.8: icmp_seq=2 ttl=63 time=1.74 ms
64 bytes from 172.16.39.8: icmp_seq=3 ttl=63 time=2.10 ms
^C
--- 172.16.39.8 ping statistics ---
3 packets transmitted, 3 received, 0% packet loss, time 2006ms
rtt min/avg/max/mdev = 1.152/1.662/2.098/0.389 ms
```

至此，测试环境已经准备完毕，可以开始测试了。

因为此处主要测试"网络防火墙"，在开始之前，请确认主机 A 与主机 C 没有对应的 iptables 规则。为了减少主机防火墙带来的影响，直接执行 `iptables -F` 将主机 A 与 C 的规则清空。

## 网络防火墙测试

之前说过，iptables 作为网络防火墙时，主要负责"过滤与转发"。既然要过滤，则需配置 filter 表，既然要转发，则需在 `FORWAED` 链定义规则。所以，我们应该往 filter 表的 `FORWARD` 链配置规则。

先来看看主机 B 的 filter 表是否已经存在规则，如下

```bash{5}
root@ubuntu:~# iptables -L
Chain INPUT (policy ACCEPT)
target     prot opt source               destination

Chain FORWARD (policy ACCEPT)
target     prot opt source               destination

Chain OUTPUT (policy ACCEPT)
target     prot opt source               destination
```

可见，`FORWARD` 链没有任何规则，默认策略为 `ACCEPT`，我们可以使用"白名单机制"（如果忘了请回顾 [黑白名单机制][iptables-09-whitelist-and-blacklist]）。

在主机 B 的 `FORWARD` 链的末端添加一条默认拒绝的规则，然后将"放行规则"设置在这条"默认拒绝规则"之前即可。

```bash
root@ubuntu:~# iptables -I FORWARD -j REJECT
root@ubuntu:~# iptables -L FORWARD
Chain FORWARD (policy ACCEPT)
target     prot opt source               destination
REJECT     all  --  anywhere             anywhere             reject-with icmp-port-unreachable
```

配置完上述规则后，主机 A 与主机 C 已经无法通讯。

主机 A 的情况如下

```bash
root@ubuntu3:~# ping 10.1.0.3
PING 10.1.0.3 (10.1.0.3) 56(84) bytes of data.
From 172.16.39.2 icmp_seq=1 Destination Port Unreachable
From 172.16.39.2 icmp_seq=2 Destination Port Unreachable
^C
--- 10.1.0.3 ping statistics ---
2 packets transmitted, 0 received, +2 errors, 100% packet loss, time 1033ms
```

主机 C 的情况如下

```
root@ubuntu2:~# ping 172.16.39.8
PING 172.16.39.8 (172.16.39.8) 56(84) bytes of data.
From 10.1.0.2 icmp_seq=1 Destination Port Unreachable
From 10.1.0.2 icmp_seq=2 Destination Port Unreachable
^C
--- 172.16.39.8 ping statistics ---
2 packets transmitted, 0 received, +2 errors, 100% packet loss, time 1010ms
```

它们之间的通信需要靠主机 B 进行转发。而上述规则设置完成后，所有报文都无法通过 `FORWARD` 链，所以任何转发报文在经过 `FORWARD` 链时都会被拒绝，外部主机的报文无法转发到内部主机，内部网主机的报文也无法转发到外部主机，因为主机 B 已经拒绝转发所有报文。

现在同时将 A 主机与 C 主机的 web 服务启动，以便进行测试（需安装 mini-httpd）。

首先启动 A 主机的 httpd 服务

```bash
root@ubuntu3:~# mkdir hello
root@ubuntu3:~# cd hello/
root@ubuntu3:~/hello# echo "I'm A" > index.html
root@ubuntu3:~/hello# mini_httpd -h 0.0.0.0
root@ubuntu3:~/hello# mini_httpd: started as root without requesting chroot(), warning only
```

然后，启动 C 主机的 httpd 服务

```bash
root@ubuntu2:~# mkdir hello
root@ubuntu2:~# cd hello/
root@ubuntu2:~/hello# echo "I'm C" > index.html
root@ubuntu2:~/hello# mini_httpd -h 0.0.0.0
root@ubuntu2:~/hello# mini_httpd: started as root without requesting chroot(), warning only
```

由于主机 B 设置了默认拒绝的规则，所以此刻 A 主机无法访问 C 主机的 web 服务， C 主机同样无法访问 A 主机的 web 服务。

如果想要使内部的主机能够访问外部主机的 web 服务，应该怎样做呢？需要在 `FORWARD` 链放行内部主机对外部主机的 web 请求，配置如下即可。

```bash
root@ubuntu:~# iptables -L FORWARD
Chain FORWARD (policy ACCEPT)
target     prot opt source               destination
REJECT     all  --  anywhere             anywhere             reject-with icmp-port-unreachable
root@ubuntu:~# iptables -I FORWARD -s 10.1.0.0/16 -p tcp --dport 80 -j ACCEPT
root@ubuntu:~# iptables -L FORWARD
Chain FORWARD (policy ACCEPT)
target     prot opt source               destination
ACCEPT     tcp  --  10.1.0.0/16          anywhere             tcp dpt:http
REJECT     all  --  anywhere             anywhere             reject-with icmp-port-unreachable
```

如上所示，因为我们将来自内部网络目标端口为 80 的报文都放行了，所以防火墙放行内部主机的 web 请求。那么此时，C 主机访问 A 主机的 web 服务试试。结果如下

```bash
root@ubuntu2:~/hello# curl 172.16.39.8
^C
```

可以看到，主机 C 并无法访问到主机 A 上的 web 服务，这是为什么呢？

因为只在主机 B 放行了内部主机访问 80 端口的请求，但是并没有放行外部主机的回应报文。虽然内部主机的请求能够通过防火墙主机 B 转发出去，但是回应的报文则无法进入防火墙，所以仍然需要在主机 B 进行如下设置。

```bash
root@ubuntu:~# iptables -L FORWARD
Chain FORWARD (policy ACCEPT)
target     prot opt source               destination
ACCEPT     tcp  --  10.1.0.0/16          anywhere             tcp dpt:http
REJECT     all  --  anywhere             anywhere             reject-with icmp-port-unreachable
root@ubuntu:~# iptables -I FORWARD -d 10.1.0.0/16 -p tcp --sport 80 -j ACCEPT
root@ubuntu:~# iptables -L FORWARD
Chain FORWARD (policy ACCEPT)
target     prot opt source               destination
ACCEPT     tcp  --  anywhere             10.1.0.0/16          tcp spt:http
ACCEPT     tcp  --  10.1.0.0/16          anywhere             tcp dpt:http
REJECT     all  --  anywhere             anywhere             reject-with icmp-port-unreachable
```

如上所示，当外部主机的 web 服务响应内部主机时，目标地址肯定为内部主机，所以我们放行目标 IP 属于内部主机网段且源端口为 80 的报文，因为外部主机肯定会使用 80 端口进行回应。

完成上述配置后，再次回到 C 主机，即可正常访问 A 主机的 web 服务。

```bash
root@ubuntu2:~/hello# curl 172.16.39.8
I'm A
```

可见，iptables 作为"网络防火墙"的场景下，配置规则往往需要考虑"双向性"。也就是说，为了达成一个目的，往往需要两条规则才能完成。

此时，A 主机依然无法访问 C 主机的 web 服务，因为 B 主机并没有放行相关报文。

结合之前的知识，我们可以将上述规则配置进行优化。比如，不管是由内而外，还是由外而内，只要是"响应报文"统统放行，配置如下

> 注：如果你没有明白如下配置的含义，请回顾之前的 [state 扩展模块][iptables-08-extended-modules-state]。

```bash{8}
root@ubuntu:~# iptables --line -vL FORWARD
Chain FORWARD (policy ACCEPT 0 packets, 0 bytes)
num   pkts bytes target     prot opt in     out     source               destination
1        4   437 ACCEPT     tcp  --  any    any     anywhere             10.1.0.0/16          tcp spt:http
2       12   771 ACCEPT     tcp  --  any    any     10.1.0.0/16          anywhere             tcp dpt:http
3     3525  229K REJECT     all  --  any    any     anywhere             anywhere             reject-with icmp-port-unreachable
root@ubuntu:~# iptables -D FORWARD 1
root@ubuntu:~# iptables -I FORWARD -m state --state ESTABLISHED,RELATED -j ACCEPT
root@ubuntu:~# iptables --line -vL FORWARD
Chain FORWARD (policy ACCEPT 0 packets, 0 bytes)
num   pkts bytes target     prot opt in     out     source               destination
1        0     0 ACCEPT     all  --  any    any     anywhere             anywhere             state RELATED,ESTABLISHED
2       12   771 ACCEPT     tcp  --  any    any     10.1.0.0/16          anywhere             tcp dpt:http
3     3633  237K REJECT     all  --  any    any     anywhere             anywhere             reject-with icmp-port-unreachable
```

如上图所示，先将"web 响应报文放行规则"删除，同时增加第 8 行规则。只需要在网络防火墙主机的 `FORWARD` 链添加如上规则，就可以将绝大多数响应报文放行。不管是外部响应内部，还是内部响应外部，一条规则就能搞定。当 iptables 作为网络防火墙时，每次配置规则都要考虑"双向"的问题。但是配置完上述规则后，只要考虑请求报文的方向即可。而回应报文，上述一条规则就能搞定。这样配置，即使以后有更多服务的响应报文需要放行，我们也不用再去针对响应报文设置规则了（具体原因 [state 扩展模块][iptables-08-extended-modules-state] 已经详细的总结过），会省去不少规则。

比如，除了想要让内部主机能够访问外部的 web 服务，还想让内部主机能够访问外部的 sshd 服务，则可以进行如下设置

```bash{7}
root@ubuntu:~# iptables --line -vL FORWARD
Chain FORWARD (policy ACCEPT 0 packets, 0 bytes)
num   pkts bytes target     prot opt in     out     source               destination
1        0     0 ACCEPT     all  --  any    any     anywhere             anywhere             state RELATED,ESTABLISHED
2       12   771 ACCEPT     tcp  --  any    any     10.1.0.0/16          anywhere             tcp dpt:http
3     3633  237K REJECT     all  --  any    any     anywhere             anywhere             reject-with icmp-port-unreachable
root@ubuntu:~# iptables -I FORWARD -s 10.1.0.0/16 -p tcp --dport 22 -j ACCEPT
root@ubuntu:~# iptables -vL FORWARD
Chain FORWARD (policy ACCEPT 0 packets, 0 bytes)
 pkts bytes target     prot opt in     out     source               destination
    0     0 ACCEPT     tcp  --  any    any     10.1.0.0/16          anywhere             tcp dpt:ssh
    7   668 ACCEPT     all  --  any    any     anywhere             anywhere             state RELATED,ESTABLISHED
   13   831 ACCEPT     tcp  --  any    any     10.1.0.0/16          anywhere             tcp dpt:http
 4057  264K REJECT     all  --  any    any     anywhere             anywhere             reject-with icmp-port-unreachable
```

上面只要考虑内部主机请求方向的报文规则即可，因为响应报文的规则已被之前配置的规则"承包"。

此刻，使用 C 主机即可访问 A 主机的 22 端口。

```bash
root@ubuntu2:~# ssh sammy@172.16.39.8
The authenticity of host '172.16.39.8 (172.16.39.8)' can't be established.
ECDSA key fingerprint is SHA256:vYot0T5Xa+31Fa6BRAhbCmAdQr6i7MSuwsDN7xrd7co.
Are you sure you want to continue connecting (yes/no/[fingerprint])? yes
Warning: Permanently added '172.16.39.8' (ECDSA) to the list of known hosts.
sammy@172.16.39.8's password:
Welcome to Ubuntu 20.04.1 LTS (GNU/Linux 5.4.0-58-generic x86_64)

 * Documentation:  https://help.ubuntu.com
 * Management:     https://landscape.canonical.com
 * Support:        https://ubuntu.com/advantage


203 updates can be installed immediately.
14 of these updates are security updates.
To see these additional updates run: apt list --upgradable

Your Hardware Enablement Stack (HWE) is supported until April 2025.
Last login: Thu Jan  7 22:23:04 2021 from 172.16.39.1
```

目前只允许内部主机访问外部主机的 web 服务与 sshd 服务，但是外部主机还无法访问内部主机的服务。具体配置不再赘述，自救吧。

## 小结

为了便于以后速查，上述过程总结一下。

```bash
# 如果想要 iptables 作为网络防火墙，iptables 所在主机开启核心转发功能，以便能够转发报文。
# 使用如下命令查看当前主机是否已经开启了核心转发，0表示为开启，1表示已开启
cat /proc/sys/net/ipv4/ip_forward
# 使用如下两种方法均可临时开启核心转发，立即生效，但是重启网络配置后会失效。
方法一：echo 1 > /proc/sys/net/ipv4/ip_forward
方法二：sysctl -w net.ipv4.ip_forward=1
# 使用如下方法开启核心转发功能，重启网络服务后永久生效。
配置 /etc/sysctl.conf 文件（CentOS 7 配置 /usr/lib/sysctl.d/00-system.conf 文件），在配置文件中将 net.ipv4.ip_forward 设置为 1

# 由于 iptables 此时的角色为"网络防火墙"，所以需要在 filter 表的 FORWARD 链设置规则。
# 可以使用"白名单机制"，先添加一条默认拒绝的规则，然后再为需要放行的报文设置规则。
# 配置规则时需要考虑"方向问题"，针对请求报文与回应报文，考虑报文的源地址与目标地址，源端口与目标端口等。
# 示例为允许网络内主机访问网络外主机的 web 服务与 sshd 服务。
iptables -A FORWARD -j REJECT
iptables -I FORWARD -s 10.1.0.0/16 -p tcp --dport 80 -j ACCEPT
iptables -I FORWARD -d 10.1.0.0/16 -p tcp --sport 80 -j ACCEPT
iptables -I FORWARD -s 10.1.0.0/16 -p tcp --dport 22 -j ACCEPT
iptables -I FORWARD -d 10.1.0.0/16 -p tcp --sport 22 -j ACCEPT

# 可以使用 state 扩展模块，对上述规则进行优化。使用如下配置可以省略许多"回应报文放行规则"。
iptables -A FORWARD -j REJECT
iptables -I FORWARD -s 10.1.0.0/16 -p tcp --dport 80 -j ACCEPT
iptables -I FORWARD -s 10.1.0.0/16 -p tcp --dport 22 -j ACCEPT
iptables -I FORWARD -m state --state ESTABLISHED,RELATED -j ACCEPT
```

一些注意点：

1. 当测试网络防火墙时，默认前提为网络已经正确配置。
2. 当测试网络防火墙时，如果出现问题，请先确定主机防火墙规则的配置没有问题。

## 参考文献

- [iptables 详解（11）：iptables 之网络防火墙]

[iptables series]: /tag/iptables/
[iptables-01-concepts]: /2020/12/03/iptables-01-concepts/
[iptables-08-extended-modules-state]: /2021/01/08/iptables-08-extended-modules-state/
[iptables-09-whitelist-and-blacklist]: /2021/01/08/iptables-09-whitelist-and-blacklist/
[iptables 详解（11）：iptables 之网络防火墙]: http://www.zsythink.net/archives/1663
