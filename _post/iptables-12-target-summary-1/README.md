---
title: '[iptables] 12. 动作总结 1'
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
在参照本文进行 iptables 实验时，请务必在个人的测试机进行。iptables 规则设置不当有可能使你无法连接到远程主机。本文的实验操作环境为 VMware Fusion Player 12.0 下的 Ubuntu 20.04.1。
:::

前面的文章一直在介绍 iptables 的匹配条件，并没有对动作进行过总结。本文总结一下 iptables 的动作。

之前的举例已经用到了一些常用动作，比如 `ACCEPT`、`DROP` 和`REJECT` 等。

"动作"与"匹配条件"一样，也有"基础"与"扩展"之分。

使用扩展动作也需要借助扩展模块，但是扩展动作可以 **直接使用**，不用像使用"扩展匹配条件"那样需要指定模块。

之前用到的 `ACCEPT` 与 `DROP` 都属于基础动作。`REJECT` 则属于扩展动作。

很多例子告诉我们使用 `-j` 可以指定动作，比如

```bash
-j ACCEPT

-j DROP

-j REJECT
```

"动作"也有自己的选项。可以在使用动作时，设置对应的选项。此处以 `REJECT` 为例，展开与"动作"有关的话题。

## 动作 `REJECT`
`REJECT` 动作的常用选项为 `--reject-with`。这个选项可以设置拒绝对方时反馈的提示信息。

可用值如下
- `icmp-net-unreachable`
- `icmp-host-unreachable`
- `icmp-port-unreachable`
- `icmp-proto-unreachable`
- `icmp-net-prohibited`
- `icmp-host-prohibited`
- `icmp-admin-prohibited`

当不设置任何值时，默认值为 `icmp-port-unreachable`。

我们来动手实践一下，为主机 `192.168.44.2` 设置规则如下

```bash
root@ubuntu:~# iptables -F
root@ubuntu:~# iptables -I INPUT -p tcp --dport 22 -j ACCEPT
root@ubuntu:~# iptables -A INPUT -j REJECT
root@ubuntu:~# iptables -L INPUT
Chain INPUT (policy ACCEPT)
target     prot opt source               destination         
ACCEPT     tcp  --  anywhere             anywhere             tcp dpt:ssh
REJECT     all  --  anywhere             anywhere             reject-with icmp-port-unreachable
```

此时在另一台主机向主机 139 发起 `ping` 请求。如下所示，提示目标端口不可达。

```bash
ping 192.168.44.2
PING 192.168.44.2 (192.168.44.2): 56 data bytes
92 bytes from 192.168.44.2: Destination Port Unreachable
Vr HL TOS  Len   ID Flg  off TTL Pro  cks      Src      Dst
 4  5  00 5400 c1bb   0 0000  40  01 df99 192.168.44.1  192.168.44.2 

Request timeout for icmp_seq 0
92 bytes from 192.168.44.2: Destination Port Unreachable
Vr HL TOS  Len   ID Flg  off TTL Pro  cks      Src      Dst
 4  5  00 5400 90b7   0 0000  40  01 109e 192.168.44.1  192.168.44.2 

^C
--- 192.168.44.2 ping statistics ---
2 packets transmitted, 0 packets received, 100.0% packet loss
```

再试试将拒绝报文的提示设置为"主机不可达"如下

```bash{6}
root@ubuntu:~# iptables -L INPUT
Chain INPUT (policy ACCEPT)
target     prot opt source               destination         
ACCEPT     tcp  --  anywhere             anywhere             tcp dpt:ssh
REJECT     all  --  anywhere             anywhere             reject-with icmp-port-unreachable
root@ubuntu:~# iptables -I INPUT 2 -j REJECT --reject-with icmp-host-unreachable
root@ubuntu:~# iptables -L INPUT
Chain INPUT (policy ACCEPT)
target     prot opt source               destination         
ACCEPT     tcp  --  anywhere             anywhere             tcp dpt:ssh
REJECT     all  --  anywhere             anywhere             reject-with icmp-host-unreachable
REJECT     all  --  anywhere             anywhere             reject-with icmp-port-unreachable
```

如上所示，在设置拒绝的动作时，使用 `--reject-with` 选项将提示信息设置为 `icmp-host-unreachable`。完成上述操作后，再次在在另一台主机上向主机 `192.168.44.2` 发起 `ping` 请求如下

```bash
ping 192.168.44.2
PING 192.168.44.2 (192.168.44.2): 56 data bytes
92 bytes from 192.168.44.2: Destination Host Unreachable
Vr HL TOS  Len   ID Flg  off TTL Pro  cks      Src      Dst
 4  5  00 5400 4740   0 0000  40  01 5a15 192.168.44.1  192.168.44.2 

Request timeout for icmp_seq 0
92 bytes from 192.168.44.2: Destination Host Unreachable
Vr HL TOS  Len   ID Flg  off TTL Pro  cks      Src      Dst
 4  5  00 5400 bcbf   0 0000  40  01 e495 192.168.44.1  192.168.44.2 

^C
--- 192.168.44.2 ping statistics ---
2 packets transmitted, 0 packets received, 100.0% packet loss
```

可以看到，`ping` 请求被拒绝时，提示信息已经从"目标端口不可达"变成了"目标主机不可达"。

## 动作 `LOG`
接下来介绍之前没有提及过的 `LOG` 动作。

使用 `LOG` 动作，可以将符合条件的报文相关信息记录到日志，但当前报文具体是被"接受"，还是被"拒绝"，都由后面的规则控制。换句话说，`LOG` 动作只负责记录匹配到的报文相关信息，不负责对报文的其他处理。如果想要对报文进行进一步处理，可以在之后设置具体规则。

下例表示将发往 22 号端口的报文相关信息记录到日志。

```bash
root@ubuntu:~# iptables -F INPUT
root@ubuntu:~# iptables -I INPUT -p tcp --dport 22 -j LOG --log-prefix "[sammyne]"
root@ubuntu:~# iptables -l INPUT
iptables v1.8.4 (legacy): unknown option "-l"
Try `iptables -h' or 'iptables --help' for more information.
root@ubuntu:~# iptables -L INPUT
Chain INPUT (policy ACCEPT)
target     prot opt source               destination         
LOG        tcp  --  anywhere             anywhere             tcp dpt:ssh LOG level warning prefix "[sammyne]"
```

上述规则表示所有发往 22 号端口的 TCP 报文都符合条件，所以都会被记录到日志。查看 `/var/log/kern.log` 即可看到对应报文的相关信息。

```bash
root@ubuntu:~# tail -f /var/log/kern.log | grep "\[sammyne\]"
Jan  9 15:15:31 ubuntu kernel: [ 1662.505100] [sammyne]IN=ens33 OUT= MAC=00:0c:29:61:9c:a1:8a:e9:fe:35:ee:64:08:00 SRC=192.168.44.1 DST=192.168.44.2 LEN=64 TOS=0x00 PREC=0x00 TTL=64 ID=0 PROTO=TCP SPT=56040 DPT=22 WINDOW=65535 RES=0x00 CWR ECE SYN URGP=0 
Jan  9 15:15:31 ubuntu kernel: [ 1662.505857] [sammyne]IN=ens33 OUT= MAC=00:0c:29:61:9c:a1:8a:e9:fe:35:ee:64:08:00 SRC=192.168.44.1 DST=192.168.44.2 LEN=52 TOS=0x00 PREC=0x00 TTL=64 ID=0 PROTO=TCP SPT=56040 DPT=22 WINDOW=2058 RES=0x00 ACK URGP=0 
Jan  9 15:15:31 ubuntu kernel: [ 1662.509127] [sammyne]IN=ens33 OUT= MAC=00:0c:29:61:9c:a1:8a:e9:fe:35:ee:64:08:00 SRC=192.168.44.1 DST=192.168.44.2 LEN=73 TOS=0x02 PREC=0x00 TTL=64 ID=0 PROTO=TCP SPT=56040 DPT=22 WINDOW=2058 RES=0x00 ACK PSH URGP=0 
Jan  9 15:15:31 ubuntu kernel: [ 1662.516111] [sammyne]IN=ens33 OUT= MAC=00:0c:29:61:9c:a1:8a:e9:fe:35:ee:64:08:00 SRC=192.168.44.1 DST=192.168.44.2 LEN=52 TOS=0x00 PREC=0x00 TTL=64 ID=0 PROTO=TCP SPT=56040 DPT=22 WINDOW=2058 RES=0x00 ACK URGP=0
```

但是上述规则只是用于示例。因为使用的匹配条件过于宽泛，所以匹配到的报文数量将会非常之多，记录到的信息也不利于分析，所以使用 `LOG` 动作时，匹配条件应该尽量写得精确一些，匹配到的报文数量也会大幅度减少，从而冗余信息也会变少，日后分析日志时，日志的信息可用程度更高。

> 注：请把刚才用于示例的规则删除。

示例告诉我们 `LOG` 动作会将报文的相关信息记录在 `/var/log/kern.log` 文件。当然也可以将相关信息记录到指定的文件，以防止 iptables 的相关信息与其他日志信息相混淆。修改 `/etc/rsyslog.conf` 文件（或者 `/etc/syslog.conf`），在 `rsyslog` 配置文件中添加如下配置即可。

```bash
root@ubuntu:~# echo "kern.warning /var/log/iptables.log" >> /etc/rsyslog.conf 
root@ubuntu:~# tail -n1 /etc/rsyslog.conf 
kern.warning /var/log/iptables.log
```

加入上述配置后，报文的相关信息将会被记录到 `/var/log/iptables.log` 文件。

完成上述配置后，重启 rsyslog 服务（或者 syslogd）。

```bash
#service rsyslog restart
```

服务重启后，配置即可生效，匹配到的报文相关信息将被记录到指定的文件。

`LOG` 动作也有自己的选项，常用选项如下（先列出概念，后面有示例）

- `--log-level` 选项指定记录日志的级别，可用级别有
  - emerg
  - alert
  - crit
  - error
  - warning
  - notice
  - info
  - debug
- `--log-prefix` 选项可以给记录到的相关信息添加"标签"之类的信息，以便区分信息，便于分析时进行过滤。

::: warning 注意
`--log-prefix` 对应的值不能超过 29 个字符。
:::

比如，我想要将主动连接 22 号端口的报文相关信息都记录到日志，并且把这类记录命名为 `want-in-from-port-22`，可以使用如下命令

```bash
root@ubuntu:~# iptables -F
root@ubuntu:~# iptables -I INPUT -p tcp --dport 22 -m state NEW -j LOG --log-prefix "want-in-from-port-22"
Bad argument `NEW'
Try `iptables -h' or 'iptables --help' for more information.
root@ubuntu:~# iptables -I INPUT -p tcp --dport 22 -m state --state NEW -j LOG --log-prefix "want-in-from-port-22"
root@ubuntu:~# iptables -L INPUT
Chain INPUT (policy ACCEPT)
target     prot opt source               destination         
LOG        tcp  --  anywhere             anywhere             tcp dpt:ssh state NEW LOG level warning prefix "want-in-from-port-22"
```

完成上述配置后，在 IP 地址为 `192.168.1.98` 的客户端机尝试使用 ssh 工具连接以上主机，然后查看对应的日志文件（已经将日志文件设置为 `/var/log/iptables.log`）。

```bash
root@ubuntu:~# cat /var/log/iptables.log 
# ...
# 省略之前的日志
# ...
Jan  9 15:34:05 ubuntu kernel: [ 2777.122815] want-in-from-port-22IN=ens33 OUT= MAC=00:0c:29:61:9c:a1:8a:e9:fe:35:ee:64:08:00 SRC=192.168.44.1 DST=192.168.44.2 LEN=52 TOS=0x00 PREC=0x00 TTL=64 ID=0 PROTO=TCP SPT=56840 DPT=22 WINDOW=2048 RES=0x00 ACK URGP=0 
Jan  9 15:34:25 ubuntu kernel: [ 2797.075648] want-in-from-port-22IN=ens33 OUT= MAC=00:0c:29:61:9c:a1:8a:e9:fe:35:ee:64:08:00 SRC=192.168.44.1 DST=192.168.44.2 LEN=64 TOS=0x00 PREC=0x00 TTL=64 ID=0 PROTO=TCP SPT=57061 DPT=22 WINDOW=65535 RES=0x00 CWR ECE SYN URGP=0
```

如上所示，ssh 连接操作的报文相关信息已经被记录到 iptables.log 文件，而且这条日志包含"标签" `want-in-from-port-22`。如果有很多日志记录，我们就能通过这个"标签"进行筛选从而加快日志查看。同时从上述记录还能够得知报文的源 IP 与目标 IP、源端口与目标端口等信息：`192.168.44.1` 这个 IP 想要在 15:34 连接到 `192.168.44.2`（当前主机的 IP）的 22 号端口，报文由 MAC 地址为 `00:0c:29:61:9c:a1` 的 ens33 网卡进入，客户端网卡的 MAC 地址为 `8a:e9:fe:35:ee:64:08:00`。

除了 `ACCEPT`、`DROP`、`REJECT` 和 `LOG` 等动作，还有一些其他的常用动作，比如 `DNAT` 和 `SNAT` 等。之后的文章会对它们进行总结。

## 参考文献
- [iptables详解（12）：iptables动作总结之一]

[iptables series]: /tag/iptables/
[iptables详解（12）：iptables动作总结之一]: http://www.zsythink.net/archives/1684
