---
title: '[iptables] 08. state 扩展模块'
date: 2021-01-08
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

## 背景
通过 HTTP 的 url 访问某个网页时，客户端向服务端的 80 端口发起请求，服务端通过 80 端口响应请求。客户端似乎理所当然地放行 80 端口，以便服务端的回应报文可以进入客户端主机。因此，客户端设置放行 80 端口。

同理，通过 SSH 工具远程连接到某台服务器时，客户端向服务端的 22 号端口发起请求，服务端再通过 22 号端口响应请求。因此，客户端理所当然地放行了所有 22 号端口，以便远程主机的响应请求能够通过防火墙。

但是客户端没有主动向 80 端口发起请求，也没有主动向 22 号端口发起请求的情况下，那么其他主机通过 80 端口或者 22 号端口向服务端发送数据时，服务端可以接收到吗？应该是可以的。为了收到 HTTP 与 SSH 的响应报文，服务端已经放行了 80 与 22 号端口。所以"响应"报文和"主动发送"给我们的报文都可以通过这两个端口。这样就带来了安全问题：某些坏人可以利用这些端口"主动"连接到服务器干坏事。一般都是我们主动请求 80 端口，80 端口回应我们，但是一般不会出现 80 端口主动请求客户端的情况。

我们可能会这样想：已知哪些主机是安全的，只要针对这些安全的主机放行对应的端口即可，其他 IP 一律拒绝。比如，已知 IP 为 123 的主机是安全的，所以对 123 主机开放 22 号端口，以便 123 主机能够通过 22 号端口响应 SSH 请求。这样一来，随着管理的主机越来越多，每次都要为新主机配置这些规则。30 台可能还好，但是 300 台就炸了。80 端口就更别提了。每次访问一个新网址都要对这个网址添加信任的做法显然不太合理。

我们可能还会想：针对相应端口，用 `--tcp-flags` 去匹配 TCP 报文的标志位，把外来的"第一次握手"的请求拒绝，是不是也可以呢？但是如果对方使用的是 UDP 协议或者 ICMP 协议就不行了。

仔细想想造成上述问题的"根源"：为了让"服务提供方"能够正常地"响应"我们的请求，在主机上开放对应端口。开放这些端口的同时，也使得别人可以利用这些开放端口"主动"地攻击我们。他们发送过来的报文并不是为了响应我们，而是为了主动攻击我们。这正是问题所在。

问题就是：怎样判断这些报文是为了回应我们之前发出的报文，还是主动向我们发送的报文呢？

## state 拓展模块
可以通过 iptables 的 state 扩展模块可解决上述问题。在这之前，需要先了解一些 state 模块的相关概念，然后再回过头来解决上述问题。

从字面上理解，state 可以译为状态，但是也可以用一个高大上的词去解释它。state 模块可以让 iptables 实现"连接追踪"机制。

既然是"连接追踪"，则必然要有"连接"。一说到连接，你可能会下意识地想到 TCP 连接。但是对于 state 模块而言的"连接"并不能与 TCP "连接"画等号。在 TCP/IP 协议簇中，UDP 和 ICMP 没有所谓的连接。但是对于 state 模块来说，TCP 报文、UDP 报文和 ICMP 报文都是有连接状态的。可以这样理解：对于 state 模块而言，只要两台机器在"你来我往"地通信，就算建立了连接，如下图所示

```
+---------+   +------------+   +---------+
|         |   |            |   |         |
|  host1  |   |  iptables  |   |  host2  |
|         |   |            |   |         |
|   +------------------------------->    |
|         |   |            |   |         |
|   <-------------------------------+    |
|         |   |            |   |         |
|   +------------------------------->    |
|         |   |            |   |         |
+---------+   +------------+   +---------+
```

这个所谓链接中的报文状态是接下来讨论的话题。

对于 state 模块的连接而言，"连接"的报文可以分为以下 5 种状态
- `NEW`
- `ESTABLISHED`
- `RELATED`
- `INVALID`
- `UNTRACKED`

那么上述报文状态都代表什么含义呢？我们先来大概了解一下概念，然后结合示例说明。

::: warning 注意事项
如下报文状态都是对于 state 模块来说的。
:::

- `NEW`：连接的第一个包，状态就是 `NEW`，可以理解为新连接第一个包的状态为 `NEW`。
- `ESTABLISHED`：可以把 `NEW` 状态包后面的包状态理解为 `ESTABLISHED`，表示连接已建立。

或许用图说话更容易被人理解

```
+---------+   +------------+   +---------+
|  host1  |   |  iptables  |   |  host2  |
|         |   |            |   |         |
|         |   |    NEW     |   |         |
|   +------------------------------->    |
|         |   |            |   |         |
|         |   | ESTABLISHED|   |         |
|   <-------------------------------+    |
|         |   |            |   |         |
|         |   | ESTABLISHED|   |         |
|   +------------------------------->    |
+---------+   +------------+   +---------+
```

- `RELATED`：从字面上理解 `RELATED` 译为关系，但是这样仍然不好理解，我们举个例子。
  - 比如 FTP 服务
    - FTP 服务端会建立两个进程：**命令进程** 和 **数据进程**。
      - 命令进程负责服务端与客户端之间的命令传输（可以把这个传输过程理解成 state 中所谓的一个"连接"，暂称为"命令连接"）。
      - 数据进程负责服务端与客户端之间的数据传输 (把这个过程暂称为"数据连接")。
    - 但是具体传输的数据由命令控制，所以"数据连接"的报文与"命令连接"是有"关系"的。
    - 因此，"数据连接"的报文可能就是 `RELATED` 状态。因为这些报文与"命令连接"的报文有关系。

    :::tip 温馨提示
    如果想要对 FTP 进行连接追踪，需要单独加载对应的内核模块 `nf_conntrack_ftp`。如果想要自动加载，可以配置 `/etc/sysconfig/iptables-config` 文件。
    :::
- `INVALID`：一个包如果无法被识别，或者没有任何状态，它的状态就是 `INVALID`。我们可以主动屏蔽状态为 `INVALID` 的报文。
- `UNTRACKED`：报文的状态为 `untracked` 时，表示报文未被追踪，此时通常表示无法找到相关的连接。

上述 5 种状态的详细解释可以参考如下文章的 ["User-land states"章节](http://www.iptables.info/en/connection-state.html)

以上便是 state 模块所定义的 5 种状态。现在再回想一下刚才的问题：怎样判断报文是否是为了回应之前发出的报文。

刚才举例的问题即可使用 state 扩展模块解决：放行状态为 `ESTABLISHED` 的报文。因为如果报文的状态为 `ESTABLISHED`，那么报文肯定是之前已发报文的回应。如果你还不放心，可以将状态为 `RELATED` 或 `ESTABLISHED` 的报文都放行。这样就表示只有回应我们的报文能够通过防火墙，别人主动发送过来的新报文无法通过防火墙，示例如下。

```bash
root@ubuntu:~# ifconfig | awk '/inet / {print $1,$2}'
inet 192.168.44.2
inet 127.0.0.1
root@ubuntu:~# iptables -F
root@ubuntu:~# iptables -I INPUT -m state --state RELATED,ESTABLISHED  -j ACCEPT
root@ubuntu:~# iptables -A INPUT -j REJECT
root@ubuntu:~# iptables -L INPUT
Chain INPUT (policy ACCEPT)
target     prot opt source               destination         
ACCEPT     all  --  anywhere             anywhere             state RELATED,ESTABLISHED
REJECT     all  --  anywhere             anywhere             reject-with icmp-port-unreachable
root@ubuntu:~# ssh 192.168.44.1
The authenticity of host '192.168.44.1 (192.168.44.1)' can't be established.
ECDSA key fingerprint is SHA256:zNpI2HXzTZMSMnTe+BlKXoFjD/3JuTs8MWRxCyNOKgQ.
Are you sure you want to continue connecting (yes/no/[fingerprint])? ^C
```

当前主机 IP 为 `192.168.44.2`。放行 `ESTABLISHED` 与 `RELATED` 状态的包以后，并没有影响通过本机远程 SSH 到 IP 为 `192.168.44.1` 的主机，但是无法从 `192.168.44.1` 使用 22 端口主动连接到 `192.168.44.2`。`192.168.44.1` 尝试链接时触发的错误如下

```bash
ssh 192.168.44.2
ssh: connect to host 192.168.44.2 port 22: Connection refused
```

对于其他端口与 IP 来说也是相同的。可以从 `192.168.44.2` 主动发送报文，并且能够收到响应报文，但是其他主机并不能主动向 `192.168.44.2` 发起请求。

## 参考文献
- [iptables详解（8）：iptables扩展模块之state扩展]

[iptables series]: /tag/iptables/
[iptables详解（8）：iptables扩展模块之state扩展]: http://www.zsythink.net/archives/1597
