---
title: '[iptables] 07. udp 扩展与 icmp 扩展'
date: 2021-01-08
# prev: /2021/01/07/iptables-06-extended-rules-tcp-flags/
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

[前文][prev] 总结了 iptables 的 tcp 扩展模块。本文总结一下另外两个跟协议有关的常用的扩展模块--udp 扩展与 icmp 扩展。

## udp 扩展

先来说说 udp 扩展模块。这个扩展模块能用的匹配条件只有两个：`--sport` 与 `--dport`，即匹配报文的源端口与目标端口。

tcp 模块也有同名的两个选项。

只不过 udp 扩展模块的 `--sport` 与 `--dport` 是用于匹配 UDP 协议报文的源端口与目标端口。比如，放行 samba 服务的 137 与 138 这两个 UDP 端口，示例如下

```bash
root@ubuntu:~# iptables -I INPUT -p udp -m udp --dport 137 -j ACCEPT
root@ubuntu:~# iptables -I INPUT -p udp -m udp --dport 138 -j ACCEPT
root@ubuntu:~# iptables -nvL INPUT
Chain INPUT (policy ACCEPT 1 packets, 285 bytes)
 pkts bytes target     prot opt in     out     source               destination         
    0     0 ACCEPT     udp  --  *      *       0.0.0.0/0            0.0.0.0/0            udp dpt:138
    0     0 ACCEPT     udp  --  *      *       0.0.0.0/0            0.0.0.0/0            udp dpt:137
```

前面的文章说明过：使用扩展匹配条件时，如果未指定扩展模块，iptables 会默认调用与 `-p` 对应的协议名称相同的模块。所以使用 `-p udp` 时，可以省略 `-m udp`，示例如下

```bash
root@ubuntu:~# iptables -F INPUT
root@ubuntu:~# iptables -I INPUT -p udp --dport 137 -j ACCEPT
root@ubuntu:~# iptables -I INPUT -p udp --dport 138 -j ACCEPT
root@ubuntu:~# iptables -nvL INPUT
Chain INPUT (policy ACCEPT 1 packets, 76 bytes)
 pkts bytes target     prot opt in     out     source               destination         
    0     0 ACCEPT     udp  --  *      *       0.0.0.0/0            0.0.0.0/0            udp dpt:138
    0     0 ACCEPT     udp  --  *      *       0.0.0.0/0            0.0.0.0/0            udp dpt:137
```

udp 扩展的 `--sport` 与 `--dport` 同样支持指定一个连续的端口范围，示例如下

```bash
root@ubuntu:~# iptables -F INPUT
root@ubuntu:~# iptables -I INPUT -p udp --dport 137:157 -j ACCEPT
root@ubuntu:~# iptables -nvL INPUT
Chain INPUT (policy ACCEPT 0 packets, 0 bytes)
 pkts bytes target     prot opt in     out     source               destination         
    0     0 ACCEPT     udp  --  *      *       0.0.0.0/0            0.0.0.0/0            udp dpts:137:157
```

上述配置表示 137 到 157 之间的所有 UDP 端口全部对外开放，与 tcp 扩展的使用方法相同。

但是** udp 的 `--sport`与 `--dport` 也只能指定连续的端口范围，并不能一次性指定多个离散的端口**。使用之前总结过的 multiport 扩展模块即可指定多个离散的 UDP 端口，具体参见前面文章的 [multiport 模块]。

在前文的基础，再理解上述示例就容易多了。此处不再对 udp 模块的 `--sport` 与 `--dport` 进行赘述。

## icmp 扩展
看到 icmp，我们通常会想到 `ping` 命令。因为 `ping` 命令使用 ICMP 协议。

ICMP 协议的全称为 Internet Control Message Protocol，翻译为互联网控制报文协议。它主要用于探测网络主机是否可用、目标是否可达、网络是否通畅或路由是否可用等。

平常 `ping` 某主机时，如果主机可达，对应主机会对 `ping` 请求做出回应（此处不考虑禁 `ping`等情况）。也就是说，发出 `ping` 请求，对方回应 `ping` 请求。虽然 `ping` 请求报文与 `ping` 回应报文都属于 ICMP 类型的报文，但是在概念上细分的话，它们所属的类型还是不同的：发出的 `ping` 请求属于类型 8 的 ICMP 报文，而对方主机的 `ping` 回应报文则属于类型 0 的 ICMP 报文。根据应用场景的不同，ICMP 报文被细分为如下各种类型。

| TYPE | CODE | Description                                                                        | Query | Error |
| ---- | ---- | ---------------------------------------------------------------------------------- | ----- | ----- |
| 0    | 0    | Echo Reply——回显应答（Ping 应答）                                                  | x     |
| 3    | 0    | Network Unreachable——网络不可达                                                    |       | x     |
| 3    | 1    | Host Unreachable——主机不可达                                                       |       | x     |
| 3    | 2    | Protocol Unreachable——协议不可达                                                   |       | x     |
| 3    | 3    | Port Unreachable——端口不可达                                                       |       | x     |
| 3    | 4    | Fragmentation needed but no frag. bit set——需要进行分片但设置不分片比特            |       | x     |
| 3    | 5    | Source routing failed——源站选路失败                                                |       | x     |
| 3    | 6    | Destination network unknown——目的网络未知                                          |       | x     |
| 3    | 7    | Destination host unknown——目的主机未知                                             |       | x     |
| 3    | 8    | Source host isolated (obsolete)——源主机被隔离（作废不用）                          |       | x     |
| 3    | 9    | Destination network administratively prohibited——目的网络被强制禁止                |       | x     |
| 3    | 10   | 0	Destination host administratively prohibited——目的主机被强制禁止                 |       | x     |
| 3    | 11   | 1	Network unreachable for TOS——由于服务类型TOS，网络不可达                         |       | x     |
| 3    | 12   | 2	Host unreachable for TOS——由于服务类型TOS，主机不可达                            |       | x     |
| 3    | 13   | 3	Communication administratively prohibited by filtering——由于过滤，通信被强制禁止 |       | x     |
| 3    | 14   | 4	Host precedence violation——主机越权                                              |       | x     |
| 3    | 15   | 5	Precedence cutoff in effect——优先中止生效                                        |       | x     |
| 4    | 0    | Source quench——源端被关闭（基本流控制）                                            |       | x     |
| 5    | 0    | Redirect for network——对网络重定向                                                 |       | x     |
| 5    | 1    | Redirect for host——对主机重定向                                                    |       | x     |
| 5    | 2    | Redirect for TOS and network——对服务类型和网络重定向                               |       | x     |
| 5    | 3    | Redirect for TOS and host——对服务类型和主机重定向                                  |       | x     |
| 8    | 0    | Echo request——回显请求（Ping 请求）                                                | x     |
| 9    | 0    | Router advertisement——路由器通告                                                   | x     |
| 10   | 0    | Route solicitation——路由器请求                                                     | x     |
| 11   | 0    | TTL equals 0 during transit——传输期间生存时间为0                                   |       | x     |
| 11   | 1    | TTL equals 0 during reassembly——在数据报组装期间生存时间为0                        |       | x     |
| 12   | 0    | IP header bad (catchall error)——坏的 IP 首部（包括各种差错）                         |       | x     |
| 12   | 1    | Required options missing——缺少必需的选项                                           |       | x     |
| 13   | 0    | Timestamp request (obsolete)——时间戳请求（作废不用）                               | x     |
| 14   | 0    | Timestamp reply (obsolete)——时间戳应答（作废不用）                                 | x     |
| 15   | 0    | Information request (obsolete)——信息请求（作废不用）                               | x     |
| 16   | 0    | Information reply (obsolete)——信息应答（作废不用）                                 | x     |
| 17   | 0    | Address mask request——地址掩码请求                                                 | x     |
| 18   | 0    | Address mask reply——地址掩码应答                                                   | x     |

由上表可知，所有表示"目标不可达"的 ICMP 报文的类型码 `type` 为 3，而"目标不可达"又可以细分为以下多种情况
- 网络不可达
- 主机不可达
- 端口不可达

所以为了细分它们，ICMP 将每种 `type` 又细分为对应 `code`。用不同的 `code` 对应具体场景。因此可以使用 `type/code` 去匹配具体类型的 ICMP 报文。比如可以使用 `3/1` 表示主机不可达的 ICMP 报文。

上表的第一行就表示 `ping` 回应报文，它的 `type` 为 0，`code` 也为 0。由图可知，`ping` 回应报文属于查询类（query）的 ICMP 报文。从大类上分，ICMP 报文还能分为 **查询类** 与 **错误类** 两大类。目标不可达类的 ICMP 报文则属于错误类报文。

`ping` 请求报文对应的 `type` 为 8，`code` 为 0。

了解完上述概念，我们来看一些应用场景。

为了禁止所有 ICMP 类型的报文进入本机，可以进行如下设置

```bash
root@ubuntu:~# iptables -F INPUT
root@ubuntu:~# iptables -I INPUT -p icmp -j REJECT
root@ubuntu:~# iptables -L INPUT
Chain INPUT (policy ACCEPT)
target     prot opt source               destination         
REJECT     icmp --  anywhere             anywhere             reject-with icmp-port-unreachable
```

上述命令没有使用任何扩展匹配条件，只是使用 `-p icmp` 匹配所有 ICMP 协议类型的报文。

进行上述设置后，别的主机（`192.168.44.1`）向我们（`192.168.44.2`）发送的 `ping` 请求报文无法进入 **防火墙**。我们向别人发送的 `ping` 请求对应的回应报文也无法进入防火墙。因此，

我们无法 `ping` 通别人，

```bash
root@ubuntu:~# ping 192.168.44.1
PING 192.168.44.1 (192.168.44.1) 56(84) bytes of data.
^C
--- 192.168.44.1 ping statistics ---
13 packets transmitted, 0 received, 100% packet loss, time 12294ms
```

别人也无法 `ping` 通我们。

```bash
ping 192.168.44.2
PING 192.168.44.2 (192.168.44.2): 56 data bytes
92 bytes from 192.168.44.2: Destination Port Unreachable
Vr HL TOS  Len   ID Flg  off TTL Pro  cks      Src      Dst
 4  5  00 5400 07f2   0 0000  40  01 9963 192.168.44.1  192.168.44.2 

Request timeout for icmp_seq 0
92 bytes from 192.168.44.2: Destination Port Unreachable
Vr HL TOS  Len   ID Flg  off TTL Pro  cks      Src      Dst
 4  5  00 5400 0dfc   0 0000  40  01 9359 192.168.44.1  192.168.44.2 

Request timeout for icmp_seq 1
92 bytes from 192.168.44.2: Destination Port Unreachable
Vr HL TOS  Len   ID Flg  off TTL Pro  cks      Src      Dst
 4  5  00 5400 cb9a   0 0000  40  01 d5ba 192.168.44.1  192.168.44.2 

^C
--- 192.168.44.2 ping statistics ---
3 packets transmitted, 0 packets received, 100.0% packet loss
```


假设此刻需求有变，要 `ping` 通别人，但是不想让别人 `ping` 通我们。刚才的配置就不行了。可以进行如下设置（此处不考虑禁 `ping` 的情况）

```bash
root@ubuntu:~# iptables -F
root@ubuntu:~# iptables -I INPUT -p icmp -m icmp --icmp-type 8/0 -j REJECT
root@ubuntu:~# iptables -L INPUT
Chain INPUT (policy ACCEPT)
target     prot opt source               destination         
REJECT     icmp --  anywhere             anywhere             icmptype 8 code 0 reject-with icmp-port-unreachable
```

相关选项说明如下
- `-m icmp` 表示使用 icmp 扩展。因为上例使用 `-p icmp`，所以 `-m icmp` 可以省略。
- `--icmp-type` 选项表示根据具体的 `type` 与 `code` 去匹配对应的 ICMP 报文。
  - 此处的 `--icmp-type 8/0` 表示 ICMP 报文的 `type` 为 8，`code` 为 0 才会被匹配到，也就是只有 `ping` 请求类型的报文才能被匹配到。所以别人对我们发起的 `ping` 请求将会被拒绝通过防火墙。而我们能够 `ping` 通别人，是因为别人回应的 ICMP 报文的 `type` 为 0，`code` 也为 0，无法被上述规则匹配到，所以我们可以看到别人回应的信息。


配置之后，我们 `ping` 别人的结果如下
```bash
root@ubuntu:~# ping 192.168.44.1
PING 192.168.44.1 (192.168.44.1) 56(84) bytes of data.
64 bytes from 192.168.44.1: icmp_seq=1 ttl=64 time=0.336 ms
64 bytes from 192.168.44.1: icmp_seq=2 ttl=64 time=0.385 ms
64 bytes from 192.168.44.1: icmp_seq=3 ttl=64 time=0.310 ms
^C
--- 192.168.44.1 ping statistics ---
3 packets transmitted, 3 received, 0% packet loss, time 2017ms
rtt min/avg/max/mdev = 0.310/0.343/0.385/0.031 ms
```

别人 `ping` 我们的结果如下
```bash
ping 192.168.44.2
PING 192.168.44.2 (192.168.44.2): 56 data bytes
92 bytes from 192.168.44.2: Destination Port Unreachable
Vr HL TOS  Len   ID Flg  off TTL Pro  cks      Src      Dst
 4  5  00 5400 4592   0 0000  40  01 5bc3 192.168.44.1  192.168.44.2 

Request timeout for icmp_seq 0
92 bytes from 192.168.44.2: Destination Port Unreachable
Vr HL TOS  Len   ID Flg  off TTL Pro  cks      Src      Dst
 4  5  00 5400 cf7d   0 0000  40  01 d1d7 192.168.44.1  192.168.44.2 

^C
--- 192.168.44.2 ping statistics ---
2 packets transmitted, 0 packets received, 100.0% packet loss
```

因为 `type` 为 8 的类型下只有一个 `code` 为 0 的类型，所以可以省略对应的 `code` 如下

```bash
root@ubuntu:~# iptables -F
root@ubuntu:~# iptables -I INPUT -p icmp --icmp-type 8 -j REJECT
root@ubuntu:~# iptables -L INPUT
Chain INPUT (policy ACCEPT)
target     prot opt source               destination         
REJECT     icmp --  anywhere             anywhere             icmp echo-request reject-with icmp-port-unreachable
```

除了能够使用对应 `type/code` 匹配到具体类型的 ICMP 报文以外，还能用 ICMP 报文的描述名称去匹配对应类型的报文如下

```bash
root@ubuntu:~# iptables -F
root@ubuntu:~# iptables -I INPUT -p icmp --icmp-type "echo-request" -j REJECT
root@ubuntu:~# iptables -I INPUT -p icmp --icmp-type "ip-header-bad" -j REJECT
root@ubuntu:~# iptables -L INPUT
Chain INPUT (policy ACCEPT)
target     prot opt source               destination         
REJECT     icmp --  anywhere             anywhere             icmp ip-header-bad reject-with icmp-port-unreachable
REJECT     icmp --  anywhere             anywhere             icmp echo-request reject-with icmp-port-unreachable
```

上述命令使用的 `--icmp-type "echo-request"` 与 `--icmp-type 8/0` 的效果完全相同。参考本文最上方的表格即可获取对应的 ICMP 类型描述名称。

注意：名称中的"空格"需要替换为 `-`。

## 小结
### udp 扩展
常用的扩展匹配条件
- `--sport`：匹配 udp 报文的源地址
- `--dport`：匹配 udp 报文的目标地址

```bash
#示例
iptables -t filter -I INPUT -p udp -m udp --dport 137 -j ACCEPT
iptables -t filter -I INPUT -p udp -m udp --dport 137:157 -j ACCEPT
#可以结合multiport模块指定多个离散的端口
```

### icmp 扩展
常用的扩展匹配条件
- `--icmp-type`：匹配 ICMP 报文的具体类型

```bash
#示例
iptables -t filter -I INPUT -p icmp -m icmp --icmp-type 8/0 -j REJECT
iptables -t filter -I INPUT -p icmp --icmp-type 8 -j REJECT
iptables -t filter -I OUTPUT -p icmp -m icmp --icmp-type 0/0 -j REJECT
iptables -t filter -I OUTPUT -p icmp --icmp-type 0 -j REJECT
iptables -t filter -I INPUT -p icmp --icmp-type "echo-request" -j REJECT
```

## 参考文献
- [iptables 详解（7）：iptables 扩展之 udp 扩展与 icmp 扩展]

[iptables series]: /tag/iptables/
[iptables 详解（7）：iptables 扩展之 udp 扩展与 icmp 扩展]: http://www.zsythink.net/archives/1588
[multiport 模块]: /2021/01/03/iptables-04-rules-summary-01/#multiport-模块
[prev]: /2021/01/07/iptables-06-extended-rules-tcp-flags/
