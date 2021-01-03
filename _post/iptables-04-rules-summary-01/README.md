---
title: '[iptables] 04. 匹配条件总结 1'
date: 2021-01-03
categories:
  - network
tags:
  - iptables
  - linux
  - ops
---

本文从理论到实践，系统地介绍 iptables。如果你想要从头开始了解 iptables，可以查看 [iptables 系列文章][iptables series]。

经过前文的总结，我们已经能够熟练地管理规则，但是使用过的"匹配条件"少得可怜。之前的示例只使用过一种匹配条件，就是将"源地址"作为匹配条件。

本文学习一下更多匹配条件及其更多用法。

::: danger 高能预警
在参照本文进行 iptables 实验时，请务必在个人的测试机上进行，因为如果 iptables 规则设置不当，有可能使你无法连接到远程主机。
:::

## 匹配条件的更多用法

还是从最常用的"源地址"说起。我们知道：以 `-s` 选项作为匹配条件可以匹配报文的源地址。但是之前的示例每次指定的源地址都只是单个 IP，示例如下

```bash
root@ubuntu:/home/sammy# iptables -I INPUT -s 172.16.39.1 -j DROP
root@ubuntu:/home/sammy# iptables -vL INPUT
Chain INPUT (policy ACCEPT 2 packets, 172 bytes)
 pkts bytes target     prot opt in     out     source               destination
    0     0 DROP       all  --  any    any     172.16.39.1          anywhere
```

其实也可以一次性指定多个源地址，用 `,` 隔开即可，示例如下

```bash
root@ubuntu:/home/sammy# iptables -F
root@ubuntu:/home/sammy# iptables -I INPUT -s 172.16.39.1,172.16.39.3 -j DROP
root@ubuntu:/home/sammy# iptables -vL INPUT
Chain INPUT (policy ACCEPT 0 packets, 0 bytes)
 pkts bytes target     prot opt in     out     source               destination
    0     0 DROP       all  --  any    any     172.16.39.3          anywhere
    0     0 DROP       all  --  any    any     172.16.39.1          anywhere
```

可以看到，上述命令一次性添加两条规则，规则之间只是源地址 IP 不同。**注意**：`,` 两侧均不能包含空格，**多个 IP 之间必须与 `,` 相连**。

除了能指定具体的 IP 地址，还能指定某个网段，示例如下

```bash
root@ubuntu:/home/sammy# iptables -F
root@ubuntu:/home/sammy# iptables -I INPUT -s 172.16.39.0/24 -j DROP
root@ubuntu:/home/sammy# iptables -vL INPUT
Chain INPUT (policy ACCEPT 0 packets, 0 bytes)
 pkts bytes target     prot opt in     out     source               destination
    0     0 DROP       all  --  any    any     172.16.39.0/24       anywhere
```

上述命令表示报文的源地址 IP 如果在 `172.16.39.0/24` 网段内，经过 `INPUT`链时就会被`DROP` 掉。

其实，我们还可以对匹配条件 **取反** 如下

```bash
root@ubuntu:/home/sammy# iptables -F
root@ubuntu:/home/sammy# iptables -I INPUT ! -s 172.16.39.1 -j DROP
root@ubuntu:/home/sammy# iptables -vL INPUT
Chain INPUT (policy ACCEPT 0 packets, 0 bytes)
 pkts bytes target     prot opt in     out     source               destination
    0     0 DROP       all  --  any    any    !172.16.39.1          anywhere
```

上述命令使用 `! -s 172.16.39.1` 表示对 `-s 172.16.39.1` 这个匹配条件取反。`-s 172.16.39.1` 表示报文源 IP 地址为 `172.16.39.1` 即可满足匹配条件。使用 `!` 取反后则表示，报文源地址 IP 只要不为 `172.16.39.1` 即满足条件。因此，规则的意思是：只要发往本机的报文的源地址不是 `172.16.39.1`，就接受报文。

按照上述配置，如果此时从 `172.16.39.1` 主机上向防火墙所在的主机发送 `ping` 请求，`172.16.39.1` 主机能得到回应吗？（此处不考虑其他链，只考虑 filter 表的 `INPUT` 链）

::: details 答案
能。也就是说，按照以上配置，`172.16.39.1` 主机仍然能够 `ping` 通当前主机，何解？
:::

原因分析如下。

上述配置中，filter 表的 `INPUT` 链只有一条规则：只要报文的源 IP 不是 `172.16.39.1`，那么就接受此报文。但是，某些小伙伴可能会把规则误解为：只要报文的源 IP 是 `172.16.39.1`，那么就不接受此报文。两种理解看似差别不大，其实完全不一样。后者是错误的，前者才是正确的。

换句话说，报文的源 IP 不是 `172.16.39.1` 时，会被接收，并不能代表报文的源 IP 是 `172.16.39.1` 时，会被拒绝。

因为并没有任何一条规则指明源 IP 是 `172.16.39.1` 时，该执行怎样的动作，所以来自 `172.16.39.1` 的报文经过 `INPUT` 链时，不能匹配以上规则，使得此报文就继续匹配后面的规则。可是在此只有一条规则，这条规则后面没有其他可以匹配的规则。因此，报文会去匹配当前链的默认动作(默认策略)。而 `INPUT` 链的默认动作为 `ACCEPT`，所以来自 `172.16.39.1` 的 `ping` 报文就被接收了。如果把 `INPUT` 链的默认策略改为 `DROP`，`172.16.39.1` 的报文会被丢弃。`172.16.39.1` 的 `ping` 命令将得不到任何回应。但是如果将 `INPUT` 链的默认策略设置为 `DROP`，且 `INPUT` 链没有其他规则时，所有外来报文将会被丢弃，包括我们 ssh 远程连接。

### 匹配条件：目标 IP 地址

除了可以通过 `-s` 选项指定源地址作为匹配条件，我们还可以使用 `-d` 选项指定"目标地址"作为匹配条件。

源地址表示报文从哪里来，目标地址表示报文要到哪里去。

除了 127.0.0.1 回环地址以外，假设当前机器还有一个 IP 为 `172.16.39.101`。

如果要拒绝 `172.16.39.1` 主机发来的报文，但是又只想拒绝 `172.16.39.1` 向 `172.16.39.2` 这个 IP 发送报文，并不想要防止 `172.16.39.1` 向 `172.16.39.101` 这个 IP 发送报文，我们就可以指定目标地址作为匹配条件如下

```bash
root@ubuntu:/home/sammy# iptables -F INPUT
root@ubuntu:/home/sammy# iptables -I INPUT -s 172.16.39.1 -d 172.16.39.2 -j DROP
root@ubuntu:/home/sammy# iptables -vL INPUT
Chain INPUT (policy ACCEPT 0 packets, 0 bytes)
 pkts bytes target     prot opt in     out     source               destination
    0     0 DROP       all  --  any    any     172.16.39.1          172.16.39.2
```

上述命令表示只丢弃从 `172.16.39.1` 发往 `172.16.39.2` 这个 IP 的报文，但 `172.16.39.1` 发往 `172.16.39.101` 这个 IP 的报文并不会被丢弃。如果我们不指定任何目标地址，则目标地址默认为 `anywhere`。同理，如果我们不指定源地址，源地址默认为 `anywhere`，`anywhere` 表示所有 IP，示例如下

```bash
root@ubuntu:/home/sammy# iptables -F INPUT
root@ubuntu:/home/sammy# iptables -I INPUT -d 172.16.39.2 -j DROP
root@ubuntu:/home/sammy# iptables -vL INPUT
Chain INPUT (policy ACCEPT 0 packets, 0 bytes)
 pkts bytes target     prot opt in     out     source               destination
    0     0 DROP       all  --  any    any     anywhere             172.16.39.2
```

上述命令表示表示，所有 IP 发送往 `172.16.39.2` 的报文都将被丢弃。

与 `-s` 选项一样，`-d` 选项也可以使用 `!` 进行取反，也能够同时指定多个 IP 地址，使用 `,` 隔开即可。

::: warning 注意
不管是 `-s` 选项还是 `-d` 选项，取反操作与同时指定多个 IP 的操作不能同时使用。
:::

需要明确的一点是：**当一条规则有多个匹配条件时，这多个匹配条件之间默认存在"与"的关系**。

说白了就是：当一条规则存在多个匹配条件时，报文必须同时满足这些条件，才算做被规则匹配。

如下所示，规则包含有两个匹配条件--源地址与目标地址。报文必须同时能被这两个条件匹配，才算作被当前规则匹配。也就是说，报文来自 `172.16.39.1`，且目标地址为 `172.16.39.101`，才会被规则匹配，两个条件必须同时满足。

```bash
root@ubuntu:/home/sammy# iptables -F INPUT
root@ubuntu:/home/sammy# iptables -I INPUT -s 172.16.39.1 -d 172.16.39.101 -j ACCEPT
root@ubuntu:/home/sammy# iptables -vL INPUT
Chain INPUT (policy ACCEPT 0 packets, 0 bytes)
 pkts bytes target     prot opt in     out     source               destination
    0     0 ACCEPT     all  --  any    any     172.16.39.1          172.16.39.101
```

除了能够使用 `-s` 选项和 `-d` 选项匹配源 IP 与目标 IP 以外，还能够匹配"源端口"与"目标端口"，但是在此之前先聊聊其他选项。

### 匹配条件：协议类型

使用 `-p` 选项可以指定需要匹配的报文协议类型。

如果只想要拒绝来自 `172.16.39.1` 的 tcp 类型的请求，可以进行如下设置

```bash
root@ubuntu:/home/sammy# iptables -F INPUT
root@ubuntu:/home/sammy# iptables -I INPUT -s 172.16.39.1 -d 172.16.39.2 -p tcp -j REJECT
root@ubuntu:/home/sammy# iptables -vL INPUT
Chain INPUT (policy ACCEPT 0 packets, 0 bytes)
 pkts bytes target     prot opt in     out     source               destination
    0     0 REJECT     tcp  --  any    any     172.16.39.1          172.16.39.2          reject-with icmp-port-unreachable
```

上述命令设置防火墙拒绝来自 `172.16.39.1` 的 tcp 报文发往 `172.16.39.2` 这个 IP。测试一下：我们在 `172.16.39.1` 上使用 ssh 连接 `172.16.39.2` 这个 IP 试试（ssh 协议的传输层协议属于 tcp 协议类型）

```bash
ssh 172.16.39.2
ssh: connect to host 172.16.39.2 port 22: Connection refused
```

可见 ssh 连接被拒绝了。那么我们使用 `ping` 命令试试 (`ping` 命令使用 icmp 协议)，看看能不能 `ping` 通 `172.16.39.2`。

```bash
ping 172.16.39.2
PING 172.16.39.2 (172.16.39.2): 56 data bytes
64 bytes from 172.16.39.2: icmp_seq=0 ttl=64 time=0.531 ms
64 bytes from 172.16.39.2: icmp_seq=1 ttl=64 time=0.798 ms
64 bytes from 172.16.39.2: icmp_seq=2 ttl=64 time=0.796 ms
^C
--- 172.16.39.2 ping statistics ---
3 packets transmitted, 3 packets received, 0.0% packet loss
round-trip min/avg/max/stddev = 0.531/0.708/0.798/0.125 ms
```

可以 `ping` 通 `172.16.39.2` 证明 icmp 协议并没有被规则匹配到，只有 tcp 类型的报文被匹配到。

那么，`-p` 选项都支持匹配哪些协议呢？我们总结一下

|                操作系统 | 协议                                               |
| ----------------------: | :------------------------------------------------- |
| CentOS 7/Ubuntu 20.04.1 | tcp, udp, udplite, icmp, icmpv6, esp, ah, sctp, mh |
|                CentOS 6 | tcp, udp, udplite, icmp, esp, ah, sctp             |

当不使用 `-p` 指定协议类型时，默认表示所有类型的协议都会被匹配到，与使用 `-p all` 的效果相同。

### 匹配条件：网卡接口

当本机有多个网卡时，我们可以使用 `-i` 选项去匹配报文是通过哪块网卡流入本机的。

我们先动手做个小例子，对 `-i` 选项有一个初步的了解以后，再结合理论去看。

当前主机的网卡名称为 ens33，如下图

```bash
root@ubuntu:/home/sammy# ifconfig
ens33: flags=4163<UP,BROADCAST,RUNNING,MULTICAST>  mtu 1500
        inet 172.16.39.2  netmask 255.255.255.0  broadcast 172.16.39.255
        inet6 fd15:4ba5:5a2b:1008:d949:b1:af3a:68e2  prefixlen 64  scopeid 0x0<global>
        inet6 fe80::7d6e:652a:fa81:5ec1  prefixlen 64  scopeid 0x20<link>
        inet6 fd15:4ba5:5a2b:1008:c4ab:3160:80eb:c469  prefixlen 64  scopeid 0x0<global>
        ether 00:0c:29:f2:51:6c  txqueuelen 1000  (Ethernet)
        RX packets 3468  bytes 2042288 (2.0 MB)
        RX errors 0  dropped 0  overruns 0  frame 0
        TX packets 2844  bytes 312109 (312.1 KB)
        TX errors 0  dropped 0 overruns 0  carrier 0  collisions 0
```

假设想要拒绝由网卡 ens33 流入的 `ping` 请求报文，则可以进行如下设置。

```bash
root@ubuntu:/home/sammy# iptables -F INPUT
root@ubuntu:/home/sammy# iptables -I INPUT -i ens33 -p icmp -j DROP
root@ubuntu:/home/sammy# iptables -vL INPUT
Chain INPUT (policy ACCEPT 0 packets, 0 bytes)
 pkts bytes target     prot opt in     out     source               destination
    0     0 DROP       icmp --  ens33  any     anywhere             anywhere
```

上述命令使用 `-i` 选项指定网卡名称，使用 `-p` 选项指定需要匹配的报文协议类型，表示丢弃由 ens33 网卡流入的 icmp 类型的报文。

我们需要考虑一个问题，`-i` 选项用于匹配报文流入的网卡。也就是说，从本机发出的报文是不可能会使用到 `-i` 选项，因为这些由本机发出的报文压根不是从网卡流入的，而是要通过网卡发出的。从这个角度考虑，`-i` 选项的使用是有限制的。

为了更好地解释 `-i` 选项，回顾一下在理论总结中的一张 iptables 全局报文流向图如下

![网络报文流向图](./images/packets-flow.png)

> Ubuntu 应该和 CentOS 7 差不多。

既然 `-i` 选项是用于判断报文是从哪个网卡流入的，那么 `-i` 选项只能用于上图中的 `PREROUTING` 链、`INPUT` 链和 `FORWARD` 链。这是`-i` 选项的特殊性，因为它只是用于判断报文是从哪个网卡流入的，所以只能在上图中"数据流入流向"的链与 `FORWARD` 链存在，而上图的"数据发出流向"经过的链是不可能使用 `-i` 选项的，比如上图的 `OUTPUT` 链与 `POSTROUTING` 链。

与 `-i` 相对的是 `-o` 选项。`-i` 选项用于匹配报文从哪个网卡流入，`-o` 选项用于匹配报文将从哪个网卡流出。当主机有多块网卡时，可以使用 `-o` 选项，匹配报文将由哪块网卡流出。

因此，`-i` 选项只能用于 `PREROUTING` 链、`INPUT` 链和 `FORWARD` 链，而 `-o` 选项只能用于 `FORWARD` 链、`OUTPUT` 链和 `POSTROUTING` 链。

因为 `-o` 选项是用于匹配报文将由哪个网卡"流出"的，所以与上图的"数据进入流向"的链没有任何缘分，只能用于 `FORWARD` 链、`OUTPUT` 链和 `POSTROUTING` 链。

看来，`FORWARD` 链属于"中立国"，它能同时使用 `-i` 选项与 `-o` 选项。

## 扩展匹配条件

接着聊聊怎样匹配报文的"源端口"与"目标端口"。

前面总结"源地址"与"目标地址"以后，就顺便提到"源端口"与"目标端口"。但是，为什么不继续介绍"源端口"与"目标端口"，非要等到现在呢？这是因为"源端口"与"目标端口"属于 **扩展匹配条件**，"源地址"与"目标地址"属于 **基本匹配条件**。前面介绍到的匹配条件，都属于基本匹配条件。所以我们单独把"源端口"与"目标端口"放在后面总结，是为了引出扩展匹配条件的概念。

先来了解一下什么是扩展匹配条件。

不是基本匹配条件的就是扩展匹配条件。这样说好像是句废话。我们可以这样理解，基本匹配条件可以直接使用，而如果想要**使用扩展匹配条件，则需要依赖一些扩展模块**。或者说，在使用扩展匹配条件之前，需要指定相应的扩展模块才行。这样说不容易明白，我们举个例子演示一下。

我们知道 sshd 服务的默认端口为 22。当使用 ssh 工具远程连接主机时，默认会连接服务端的 22 号端口。假设现在想要使用 iptables 设置一条规则，拒绝来自 `172.16.39.1` 的 ssh 请求，我们可以拒绝 `172.16.39.1` 的报文能够发往本机的 22 号端口。这时就需要用到"目标端口"选项。

使用选项 `--dport` 可以匹配报文的目标端口，`--dport` 意为 destination-port，即目标端口。

**注意**：与之前的选项不同，`--dport` 前有两条"横杠"，而且**使用时，必须事先指定使用哪种协议，即必须先使用 `-p` 选项**，示例如下

```bash
root@ubuntu:/home/sammy# iptables -F INPUT
root@ubuntu:/home/sammy# iptables -I INPUT -s 172.16.39.1 -p tcp -m tcp --dport 22 -j REJECT
root@ubuntu:/home/sammy# iptables -vL INPUT
Chain INPUT (policy ACCEPT 0 packets, 0 bytes)
 pkts bytes target     prot opt in     out     source               destination
    0     0 REJECT     tcp  --  any    any     172.16.39.1          anywhere             tcp dpt:ssh reject-with icmp-port-unreachable
```

上述命令使用扩展匹配条件 `--dport`，指定匹配报文的目标端口：如果外来报文的目标端口为本机的 22 号端口（ssh 默认端口），则拒绝之。而在使用 `--dport` 之前，借助 `-m` 选项指定对应的扩展模块为 tcp。也就是说，如果想要使用 `--dport` 这个扩展匹配条件，则必须依靠某个扩展模块完成。此处这个扩展模块就是 tcp 扩展模块。最终使用的是 tcp 扩展模块的 `dport` 扩展匹配条件。

现在再回过头来看看扩展匹配条件的概念，就更加明白了。

扩展匹配条件被使用时，需要依赖一些扩展模块。或者说，在使用扩展匹配条件之前，需要指定相应的扩展模块才行。

- `-m tcp` 表示使用 tcp 扩展模块。
- `--dport` 表示 tcp 扩展模块中的一个扩展匹配条件，可用于匹配报文的目标端口。

**注意**：`-p tcp` 与 `-m tcp` 并不冲突

- `-p` 用于匹配报文的协议。
- `-m` 用于指定扩展模块的名称，正好这个扩展模块也叫 tcp。

其实上例可以省略 `-m` 选项如下

```bash
root@ubuntu:/home/sammy# iptables -F INPUT
root@ubuntu:/home/sammy# iptables -I INPUT -s 172.16.39.1 -p tcp --dport 22 -j REJECT
root@ubuntu:/home/sammy# iptables -vL INPUT
Chain INPUT (policy ACCEPT 0 packets, 0 bytes)
 pkts bytes target     prot opt in     out     source               destination
    0     0 REJECT     tcp  --  any    any     172.16.39.1          anywhere             tcp dpt:ssh reject-with icmp-port-unreachable
```

当使用 `-p` 选项指定报文的协议时，如果没有使用 `-m` 指定对应的扩展模块名称，直接使用扩展匹配条件，iptables 默认会调用与 `-p` 选项对应的协议名称相同的模块。

上面使用 `-p` 选项指定协议名称，使用扩展匹配条件 `--dport` 指定目标端口。在使用扩展匹配条件的时候，如果没有使用 `-m` 指定使用哪个扩展模块，iptables 会默认使用 `-m 协议名`，而协议名就是 `-p` 选项对应的协议名。上例中，`-p` 对应的值为 tcp，所以默认调用的扩展模块就为 `-m tcp`。如果 `-p` 对应的值为 udp，那么默认调用的扩展模块就为 `-m udp`。

所以上例其实"隐式"地指定了扩展模块，只是没有表现出来罢了。

因此，在使用扩展匹配条件时，一定要注意：如果这个扩展匹配条件所依赖的扩展模块名正好与 `-p` 对应的协议名称相同，则可省略 `-m` 选项，否则不能省略 `-m` 选项，必须使用 `-m` 选项指定对应的扩展模块名称。这样说可能还是不是特别明了，后续的举例会让我们更加明了地理解这些概念。

有"目标端口"，就有"源端口"，代表"源端口"的扩展匹配条件为 `--sport`。

使用 `--sport` 可以判断报文是否从指定的端口发出，即匹配报文的源端口是否与指定的端口一致。`--sport` 表示 source-port，表示源端口之意。

我们已经搞明白了 `dport`，`sport` 类推即可，示例如下

```bash
root@ubuntu:/home/sammy# iptables -F INPUT
root@ubuntu:/home/sammy# iptables -I INPUT -s 172.16.39.1 -p tcp --sport 22 -j ACCEPT
root@ubuntu:/home/sammy# iptables -vL INPUT
Chain INPUT (policy ACCEPT 0 packets, 0 bytes)
 pkts bytes target     prot opt in     out     source               destination
    0     0 ACCEPT     tcp  --  any    any     172.16.39.1          anywhere             tcp spt:ssh
```

上例隐含了 `-m tcp` 之意，表示使用了 tcp 扩展模块的 `--sport` 扩展匹配条件。

扩展匹配条件同样可以使用 `!` 进行取反。比如 `! --dport 22` 表示目标端口不是 22 的报文将会被匹配到。

`--sport` 还是 `--dsport` 都能够指定一个端口范围。比如，`--dport 22:25` 表示目标端口为 22 到 25 之间的所有端口，即 22 端口、23 端口、24 端口和 25 端口，示例如下

```bash
root@ubuntu:/home/sammy# iptables -F INPUT
root@ubuntu:/home/sammy# iptables -I INPUT -s 172.16.39.1 -p tcp --dport 22:25 -j REJECT
root@ubuntu:/home/sammy# iptables -vL INPUT
Chain INPUT (policy ACCEPT 0 packets, 0 bytes)
 pkts bytes target     prot opt in     out     source               destination
    0     0 REJECT     tcp  --  any    any     172.16.39.1          anywhere             tcp dpts:ssh:smtp reject-with icmp-port-unreachable
```

也可以写成如下模样：第一条规则表示匹配 0 号到 22 号之间的所有端口，第二条规则表示匹配 80 号端口以及其以后的所有端口（直到 65535）。

```bash
root@ubuntu:/home/sammy# iptables -F INPUT
root@ubuntu:/home/sammy# iptables -I INPUT -s 172.16.39.1 -p tcp -m tcp --dport :22 -j REJECT
root@ubuntu:/home/sammy# iptables -I INPUT -s 172.16.39.1 -p tcp -m tcp --dport 80: -j REJECT
root@ubuntu:/home/sammy# iptables -nvL INPUT
Chain INPUT (policy ACCEPT 26 packets, 2218 bytes)
 pkts bytes target     prot opt in     out     source               destination
    0     0 REJECT     tcp  --  *      *       172.16.39.1          0.0.0.0/0            tcp dpts:80:65535 reject-with icmp-port-unreachable
    0     0 REJECT     tcp  --  *      *       172.16.39.1          0.0.0.0/0            tcp dpts:0:22 reject-with icmp-port-unreachable
```

刚才聊到的两个扩展匹配条件都是 tcp 扩展模块的。tcp 扩展模块还有一个比较有用的扩展匹配条件叫做 `--tcp-flags`，但是由于篇幅原因，以后再对这个扩展匹配条件进行总结。

借助 tcp 扩展模块的 `--sport` 或者 `--dport` 都可以指定一个连续的端口范围，但是无法同时指定多个离散的、不连续的端口。同时指定多个离散的端口需要借助另一个扩展模块--multiport 模块。

- multiport 模块的 `--sports` 扩展条件可同时指定多个离散的源端口。
- multiport 模块的 `--dports` 扩展条件可同时指定多个离散的目标端口。

示例如下

```bash
root@ubuntu:/home/sammy# iptables -F INPUT
root@ubuntu:/home/sammy# iptables -I INPUT -s 172.16.39.1 -p tcp -m multiport --dports 22,36,80 -j DROP
root@ubuntu:/home/sammy# iptables -vL INPUT
Chain INPUT (policy ACCEPT 0 packets, 0 bytes)
 pkts bytes target     prot opt in     out     source               destination
    0     0 DROP       tcp  --  any    any     172.16.39.1          anywhere             multiport dports ssh,36,http
```

上述命令表示禁止来自 `172.16.39.1` 的主机上的 tcp 报文访问本机的 22 号端口、36 号端口以及 80 号端口。

`-m multiport --dports 22,36,80` 表示使用 multiport 扩展模块的 `--dports` 扩展条件，同时指定多个离散的端口，每个端口之间用逗号隔开。

`-m multiport` 是不能省略的。如果省略了 `-m multiport`，就相当于在没有指定扩展模块的情况下使用扩展条件（`--dports`）。此时 iptables 会默认调用 `-m tcp`，但是 `--dports` 扩展条件并不属于 tcp 扩展模块，而是属于 multiport 扩展模块，这时就会报错。

综上所述，当使用 `--dports` 或者 `--sports` 这种扩展匹配条件时，必须使用 `-m` 指定模块的名称。

其实，使用 multiport 模块的 `--sports` 与 `--dports` 时，也可以指定连续的端口范围，并且能够在指定连续端口范围的同时，指定离散的端口号，示例如下

```bash
root@ubuntu:/home/sammy# iptables -F INPUT
root@ubuntu:/home/sammy# iptables -I INPUT -s 172.16.39.1 -p tcp -m multiport --dports 22,80:88 -j REJECT
root@ubuntu:/home/sammy# iptables -vL INPUT
Chain INPUT (policy ACCEPT 0 packets, 0 bytes)
 pkts bytes target     prot opt in     out     source               destination
    0     0 REJECT     tcp  --  any    any     172.16.39.1          anywhere             multiport dports ssh,http:kerberos reject-with icmp-port-unreachable
```

以上命令表示拒绝来自 `172.16.39.1` 的 tcp 报文访问当前主机的 22 号端口以及 80 到 88 之间的所有端口号，是不是很方便？

::: warning 注意
multiport 扩展只能用于 tcp 协议与 udp 协议，即配合 `-p tcp` 或者 `-p udp` 使用。
:::

再回过头看之前的概念，我们应该就更加明白了。

本文只是初步认识扩展模块以及扩展匹配条件，还有一些模块并没有总结。好饭不怕晚，后续会有对它们的总结。

## 小结

本文主要总结一些常用的"基础匹配条件"，并且初步认识两个"扩展模块"以及这两个扩展模块中一些常用的扩展条件。为了便于以后速查，总结如下。

首先要明确一点：当规则同时存在多个匹配条件时，多个条件之间默认存在"与"的关系，即报文必须同时满足所有条件，才能被规则匹配。

### 基本匹配条件总结

- `-s` 用于匹配报文的源地址，可以同时指定多个源地址，每个 IP 之间用逗号隔开，也可以指定为一个网段。

  ```bash
  #示例如下
  iptables -t filter -i INPUT -s 172.16.39.111,172.16.39.118 -j DROP
  iptables -t filter -i INPUT -s 172.16.39.0/24 -j ACCEPT
  iptables -t filter -i INPUT ! -s 172.16.39.0/24 -j ACCEPT
  ```

- `-d` 用于匹配报文的目标地址，可以同时指定多个目标地址，每个 IP 之间用逗号隔开，也可以指定为一个网段。

  ```bash
  #示例如下
  iptables -t filter -i OUTPUT -d 172.16.39.111,172.16.39.118 -j DROP
  iptables -t filter -i INPUT -d 172.16.39.0/24 -j ACCEPT
  iptables -t filter -i INPUT ! -d 172.16.39.0/24 -j ACCEPT
  ```

- `-p` 用于匹配报文的协议类型，可以匹配的协议类型有 tcp、udp、 udplite、icmp、icmpv6、esp、ah、sctp 和 mh。

  ```bash
  #示例如下
  iptables -t filter -i INPUT -p tcp -s 172.16.39.1 -j ACCEPT
  iptables -t filter -i INPUT ! -p udp -s 172.16.39.1 -j ACCEPT
  ```

- `-i` 用于匹配报文是从哪个网卡接口流入本机的。由于匹配条件只是用于匹配报文流入的网卡，所以在 `OUTPUT` 链与 `POSTROUTING` 链不能使用此选项。

  ```bash
  #示例如下
  iptables -t filter -i INPUT -p icmp -i eth4 -j DROP
  iptables -t filter -i INPUT -p icmp ! -i eth4 -j DROP
  ```

- `-o` 用于匹配报文将要从哪个网卡接口流出本机。由于匹配条件只是用于匹配报文流出的网卡，所以在 `INPUT` 链与 `PREROUTING` 链不能使用此选项。

  ```bash
  #示例如下
  iptables -t filter -i OUTPUT -p icmp -o eth4 -j DROP
  iptables -t filter -i OUTPUT -p icmp ! -o eth4 -j DROP
  ```

### 扩展匹配条件总结

两个扩展模块，以及其中的扩展条件（并非全部，只是这篇文章介绍过的）总结如下

#### tcp 扩展模块

常用的扩展匹配条件如下

- `-p tcp -m tcp --sport` 用于匹配 tcp 协议报文的源端口，可以使用冒号指定一个连续的端口范围
- `-p tcp -m tcp --dport` 用于匹配 tcp 协议报文的目标端口，可以使用冒号指定一个连续的端口范围

  ```bash
  #示例如下
  iptables -t filter -i OUTPUT -d 172.16.39.1 -p tcp -m tcp --sport 22 -j REJECT
  iptables -t filter -i INPUT -s 172.16.39.1 -p tcp -m tcp --dport 22:25 -j REJECT
  iptables -t filter -i INPUT -s 172.16.39.1 -p tcp -m tcp --dport :22 -j REJECT
  iptables -t filter -i INPUT -s 172.16.39.1 -p tcp -m tcp --dport 80: -j REJECT
  iptables -t filter -i OUTPUT -d 172.16.39.1 -p tcp -m tcp ! --sport 22 -j ACCEPT
  ```

#### multiport 扩展模块

常用的扩展匹配条件如下

- `-p tcp -m multiport --sports` 用于匹配报文的源端口，可以指定离散的多个端口号，端口之间用 `,` 隔开
- `-p udp -m multiport --dports` 用于匹配报文的目标端口，可以指定离散的多个端口号，端口之间用 `,` 隔开

## 参考文献

- [iptables 详解（4）：iptables 匹配条件总结之一]

[iptables series]: /tag/iptables/
[iptables 详解（4）：iptables 匹配条件总结之一]: http://www.zsythink.net/archives/1544
