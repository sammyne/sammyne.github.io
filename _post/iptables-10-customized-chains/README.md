---
title: '[iptables] 10. 自定义链'
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
在参照本文进行 iptables 实验时，请务必在个人的测试机进行。iptables 规则设置不当有可能使你无法连接到远程主机。
:::

前面的文章一直在定义规则，准确地讲是一直在 iptables 的默认链定义规则。本文介绍一下 **自定义链**。

iptables 的默认链就已经能够满足需求了，为什么还需要自定义链呢？

原因：当默认链的规则非常多时，管理不便。

想象一下，如果 `INPUT` 链存放了 200 条规则。这 200 条规则有针对 httpd 服务的，有针对 sshd 服务的，有针对私网 IP 的，有针对公网 IP 的。假如突然想要修改针对 httpd 服务的相关规则，从头看一遍这 200 条规则，找出哪些规则是针对 httpd 的做法显然不合理。

因此，iptables 支持借助自定义链解决上述问题。

自定义一条名为 `IN_WEB` 的链，我们可以将所有针对 80 端口的入站规则都写入到这条自定义链。以后想要修改针对 web 服务的入站规则时，直接修改 `IN_WEB` 链的规则即可。即使默认链有再多的规则也不怕，因为我们知道所有针对 80 端口的入站规则都存放在 `IN_WEB` 链。同理可以将针对 sshd 的出站规则放入到 `OUT_SSH` 自定义链，针对 Nginx 的入站规则放入到 `IN_NGINX` 自定义链。这样就能实现想改哪里改哪里，再也不同担心找不到规则在哪里了。

但是需要注意的是，自定义链并不能直接使用，而是需要被默认链引用才能够使用。空口白话说不明白，等到演示过后我们自然会明白。

## 自定义链
多说无益，我们来动手创建一条自定义链玩一下。使用 `-N` 选项可以创建自定义链如下

```bash
root@ubuntu:~# iptables -F 
root@ubuntu:~# iptables -t filter -N IN_WEB
root@ubuntu:~# iptables -L
Chain INPUT (policy ACCEPT)
target     prot opt source               destination         

Chain FORWARD (policy ACCEPT)
target     prot opt source               destination         

Chain OUTPUT (policy ACCEPT)
target     prot opt source               destination         

Chain IN_WEB (0 references)
target     prot opt source               destination
```

相关选项说明如下
- `-t filter` 表示操作对象为 filter 表。与之前的示例相同，省略 `-t` 选项时，默认操作的就是 filter 表。
- `-N IN_WEB` 表示创建一条自定义链，名称为 `IN_WEB`。

自定义链创建完成后，查看 filter 表的链。如上所示，自定义链已经被创建，而且可以看到这条自定义链的引用计数为 0 (0 references)。也就是说，这条自定义链还没有被任何默认链所引用，所以即使 `IN_WEB` 配置了规则，也不会生效。暂且把这问题放一边，继续学习自定义链。

自定义链已经创建完毕。现在就可以直接在自定义链上配置规则了。以下是一些示例规则

```bash
oot@ubuntu:~# iptables -I IN_WEB -s 192.168.44.1 -j REJECT
root@ubuntu:~# iptables -t filter -I IN_WEB -s 192.168.44.3 -j REJECT
root@ubuntu:~# iptables -nL IN_WEB
Chain IN_WEB (0 references)
target     prot opt source               destination         
REJECT     all  --  192.168.44.3         0.0.0.0/0            reject-with icmp-port-unreachable
REJECT     all  --  192.168.44.1         0.0.0.0/0            reject-with icmp-port-unreachable
```

如上所示，对自定义链的操作与对默认链的操作并没有什么不同，一切按照操作默认链的方法操作自定义链即可。

自定义链现在已经有了一些规则。但是目前这些规则无法匹配到任何报文，因为并没有在任何默认链引用它。

既然 `IN_WEB` 链是为了针对 web 服务的入站规则而创建的，这些规则应该去匹配入站的报文，所以应该用 `INPUT` 链去引用它。

现在测试机（IP 为 `192.168.44.2`）上启动 HTTP 服务

```bash
root@ubuntu:~# apt install -y mini-httpd curl
root@ubuntu:~# echo "hello world" > index.html
root@ubuntu:~# mini_httpd -h 0.0.0.0
```

客户端访问测试机可正常获取报文如下
```bash
curl 192.168.44.2
hello world
```

接下来我们测试自定义链。自定义链在哪里创建，应该被哪条默认链引用，取决于实际的工作场景。因为此处示例的规则是匹配入站报文，所以在 `INPUT` 链引用自定义链如下

```bash{5,13}
root@ubuntu:~# iptables -I INPUT -p tcp --dport 80 -j IN_WEB
root@ubuntu:~# iptables -vL
Chain INPUT (policy ACCEPT 0 packets, 0 bytes)
 pkts bytes target     prot opt in     out     source               destination         
    0     0 IN_WEB     tcp  --  any    any     anywhere             anywhere             tcp dpt:http

Chain FORWARD (policy ACCEPT 0 packets, 0 bytes)
 pkts bytes target     prot opt in     out     source               destination         

Chain OUTPUT (policy ACCEPT 0 packets, 0 bytes)
 pkts bytes target     prot opt in     out     source               destination         

Chain IN_WEB (1 references)
 pkts bytes target     prot opt in     out     source               destination         
    0     0 REJECT     all  --  any    any     192.168.44.3         anywhere             reject-with icmp-port-unreachable
    0     0 REJECT     all  --  any    any     _gateway             anywhere             reject-with icmp-port-unreachable
```

上述操作在 `INPUT` 链添加一条规则，能够匹配访问本机 80 端口的 TCP 报文。

而上述规则中的 `-j IN_WEB` 表示：访问 80 端口的 TCP 报文将由自定义链 `IN_WEB` 的规则进行处理。之前示例使用 `-j` 选项指定动作，而此处将"动作"替换为"自定义链"。当 `-j` 对应的值为一个自定义链时，被当前规则匹配到的报文将交由对应的自定义链处理。具体怎样处理，取决于自定义链的规则。`IN_WEB`  自定义链被 `INPUT` 链引用以后，可以发现 `IN_WEB` 链的引用计数已经变为 1，表示这条自定义链已经被引用了 1 次。自定义链还可以引用其他的自定义链。感兴趣的话，自己动手吧。

之前的文章说过：iptables 将“动作”称为"target"。这样描述并不准确，因为 target 为目标之意，报文被规则匹配到以后，target 能是一个"动作"，也能是一个"自定义链"。target 为一个动作时，报文按照指定的动作处理；target 为自定义链时，报文由自定义链的规则处理。现在回过头再理解之前的术语，似乎更加明了了。

在 `192.168.44.1` 主机尝试访问本机的 80 端口，已经被拒绝访问。证明刚才自定义链的规则已经生效。

```bash
curl 192.168.44.2
curl: (7) Failed to connect to 192.168.44.2 port 80: Connection refused
```

过了一段时间，我们觉得 `IN_WEB` 这个名字不太合适，可将这条自定义链重命名为 `WEB` 如下

```bash{5,13}
root@ubuntu:~# iptables -E IN_WEB WEB
root@ubuntu:~# iptables -vL
Chain INPUT (policy ACCEPT 0 packets, 0 bytes)
 pkts bytes target     prot opt in     out     source               destination         
    1    64 WEB        tcp  --  any    any     anywhere             anywhere             tcp dpt:http

Chain FORWARD (policy ACCEPT 0 packets, 0 bytes)
 pkts bytes target     prot opt in     out     source               destination         

Chain OUTPUT (policy ACCEPT 0 packets, 0 bytes)
 pkts bytes target     prot opt in     out     source               destination         

Chain WEB (1 references)
 pkts bytes target     prot opt in     out     source               destination         
    0     0 REJECT     all  --  any    any     192.168.44.3         anywhere             reject-with icmp-port-unreachable
    2   128 REJECT     all  --  any    any     _gateway             anywhere             reject-with icmp-port-unreachable
```

如上所示，使用 `-E` 选项可以修改自定义链名。修改后，引用自定义链处的名称会自动随之更新。

至此，我们已经能够创建自定义链了，那么怎样删除自定义链呢？

使用 `-X` 选项可以删除自定义链。但是删除自定义链时，需要满足两个条件：
1. 自定义链没有被任何默认链引用，即自定义链的引用计数为 0。
2. 自定义链没有任何规则，即自定义链为空。

我们来删除自定义链 `WEB` 试试。

```bash
root@ubuntu:~# iptables -X WEB
iptables: Too many links.
```

上述命令使用 `-X` 选项删除对应的自定义链，但是没能成功删除自定义链 `WEB`，提示 `Too many links`。原因是 `WEB` 链已经被默认链所引用，不满足上述条件 1，所以还需要删除对应的引用规则如下

```bash
root@ubuntu:~# iptables -vL INPUT
Chain INPUT (policy ACCEPT 21 packets, 2185 bytes)
 pkts bytes target     prot opt in     out     source               destination         
    1    64 WEB        tcp  --  any    any     anywhere             anywhere             tcp dpt:http
root@ubuntu:~# iptables -D INPUT 1
root@ubuntu:~# iptables -X WEB
iptables: Directory not empty.
```

上述命令删除引用自定义链的规则后，再次尝试删除自定义链，提示 `Directory not empty`。原因是 `WEB` 链还有规则，不满足上述条件 2，所以还需要清空对应的自定义链如下

```bash
root@ubuntu:~# iptables -F WEB
root@ubuntu:~# iptables -X WEB
root@ubuntu:~# iptables -L
Chain INPUT (policy ACCEPT)
target     prot opt source               destination         

Chain FORWARD (policy ACCEPT)
target     prot opt source               destination         

Chain OUTPUT (policy ACCEPT)
target     prot opt source               destination
```

以上命令使用 `-X` 选项可以删除一个引用计数为 0、空的自定义链。

## 小结
为了便于以后速查，上述命令总结如下。

### 创建自定义链
```bash
#示例：在 filter 表中创建IN_WEB自定义链
iptables -t filter -N IN_WEB
```

### 引用自定义链
```bash
#示例：在INPUT链中引用刚才创建的自定义链
iptables -t filter -I INPUT -p tcp --dport 80 -j IN_WEB
```

### 重命名自定义链
```bash
#示例：将IN_WEB自定义链重命名为WEB
iptables -E IN_WEB WEB
```

### 删除自定义链
需要满足两个条件
1. 自定义链没有被引用
2. 自定义链没有任何规则

```bash
#示例：删除引用计数为0并且不包含任何规则的WEB链
iptables -X WEB
```

## 参考文献
- [iptables详解（10）：iptables自定义链]

[iptables series]: /tag/iptables/
[iptables详解（10）：iptables自定义链]: http://www.zsythink.net/archives/1625
