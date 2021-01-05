---
title: '[iptables] 09. 黑白名单机制'
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

## 介绍

前面的文章一直在强调一个概念：报文经过 iptables 链时，会匹配链的规则。遇到匹配的规则触发对应的动作。如果链的规则都无法匹配到当前报文，则使用链的默认策略（默认动作）。链的默认策略通常设置为 `ACCEPT` 或者 `DROP`。

当链的默认策略设置为 `ACCEPT` 时，对应的链没有配置任何规则表示接受所有报文。对应的链存在规则，但是这些规则没有匹配到报文的情况下，报文还是会被接受。

同理，当链的默认策略设置为 `DROP` 时，对应的链没有配置任何规则表示拒绝所有报文。如果对应的链存在规则，但是这些规则没有匹配到报文的情况下，报文还是会被拒绝。

因此，当链的默认策略设置为 `ACCEPT` 时，按照道理来说，为链配置规则的对应动作应该设置为 `DROP` 或者 `REJECT`，为什么呢？

因为默认策略已经为 `ACCEPT`。如果设置规则的对应动作仍然为 `ACCEPT`，那么所有报文都会被放行。因为不管报文是否被规则匹配都会被 `ACCEPT`，就失去了访问控制的意义。

综上，
- 当链的默认策略为 `ACCEPT` 时，链规则对应的动作应该为 `DROP` 或者 `REJECT`，表示只有匹配到规则的报文才会被拒绝，没有被规则匹配到的报文都会被默认接受，这就是 **黑名单** 机制。
- 当链的默认策略为 `DROP` 时，链规则对应的动作应该为 `ACCEPT`，表示只有匹配到规则的报文才会被放行，没有被规则匹配到的报文都会被默认拒绝，这就是 **白名单** 机制。

白名单机制把所有人都当做坏人，只放行好人。而黑名单机制把所有人都当成好人，只拒绝坏人。白名单机制似乎更加安全一些，黑名单机制似乎更加灵活一些。

做一个简单的白名单试试：只放行被规则匹配到的报文，其他报文一律拒绝。

为了放行 ssh 远程连接相关的报文和 web 服务相关的报文，往 `INPUT` 链添加如下规则

```bash
oot@ubuntu:~# iptables -F 
root@ubuntu:~# iptables -I INPUT -p tcp --dport 22 -j ACCEPT
root@ubuntu:~# iptables -I INPUT -p tcp --dport 80 -j ACCEPT
root@ubuntu:~# iptables -L INPUT
Chain INPUT (policy ACCEPT)
target     prot opt source               destination         
ACCEPT     tcp  --  anywhere             anywhere             tcp dpt:http
ACCEPT     tcp  --  anywhere             anywhere             tcp dpt:ssh
```

如上所示，只有上述两条规则匹配到的报文才会被放行。现在将 `INPUT` 链的默认策略改为 `DROP` 即可实现白名单机制。示例如下

```bash
root@ubuntu:~# iptables -P INPUT DROP
root@ubuntu:~# iptables -L INPUT
Chain INPUT (policy DROP)
target     prot opt source               destination         
ACCEPT     tcp  --  anywhere             anywhere             tcp dpt:http
ACCEPT     tcp  --  anywhere             anywhere             tcp dpt:ssh
```

上述操作将 `INPUT` 链的默认策略改为 `DROP`，并且实现了所谓的白名单机制--默认拒绝所有报文，只放行特定的报文。

如果此时不小心执行了 `iptables -F` 操作。根据之前学到的知识去判断，还能够通过 ssh 工具远程到服务器上吗？

按照以上情况，此时执行 `iptables -F` 操作会清空 filter 表所有链的所有规则，而 `INPUT` 链的默认策略为 `DROP`。因此，所有报文都会被拒绝，不止 ssh 远程请求会被拒绝，其他报文也会被拒绝。

当前 ssh 远程工具执行 `iptables -F` 命令后，`INPUT` 链已经不存在任何规则，所以所有报文都被拒绝，包括当前的 ssh 远程连接。

这就是默认策略设置为 `DROP` 的缺点：对应链没有设置任何规则时，这样使用默认策略为 `DROP` 是非常不明智的。因为管理员也会把自己拒之门外，即使对应链存在放行规则，不小心使用 `iptables -F` 清空规则也会导致放行规则被删除，使得所有数据包都无法进入，这就相当于给管理员挖了个坑。所以如果想要使用"白名单"的机制，最好操作如下
1. 将链的默认策略保持为 `ACCEPT`
2. 将"拒绝所有请求"这条规则放在链的尾部
3. 将"放行规则"放在前面

这样做，既能实现"白名单"机制，又能保证在规则被清空时，管理员还有机会连接到主机。

因为刚才的 ssh 连接已经被拒绝，所以此时直接在测试机设置 iptables 规则

```bash
root@ubuntu:~# iptables -P INPUT ACCEPT
```

如上所示，先将 `INPUT` 链的默认策略设置为 `ACCEPT`，然后继续配置需要放行的报文规则。如下所示，当所有放行规则设置完成后，在 `INPUT` 链的尾部设置一条拒绝所有请求的规则。

```bash
root@ubuntu:~# iptables -I INPUT -p tcp --dport 22 -j ACCEPT
root@ubuntu:~# iptables -I INPUT -p tcp --dport 80 -j ACCEPT
root@ubuntu:~# iptables -A INPUT -j REJECT
root@ubuntu:~# 
root@ubuntu:~# iptables -L INPUT
Chain INPUT (policy ACCEPT)
target     prot opt source               destination         
ACCEPT     tcp  --  anywhere             anywhere             tcp dpt:http
ACCEPT     tcp  --  anywhere             anywhere             tcp dpt:ssh
REJECT     all  --  anywhere             anywhere             reject-with icmp-port-unreachable
```


以上设置既将 `INPUT` 链的默认策略设置为 `ACCEPT`，同时又实现白名单机制--如果报文符合放行条件，则会被前面的放行规则匹配到；如果报文不符合放行条件，则会被最后一条拒绝规则匹配到。此时即使误操作执行了 `iptables -F`，也能保证管理员能够远程到主机进行维护，因为默认策略仍然是 `ACCEPT`。

## 参考文献
- [iptables详解（9）：iptables的黑白名单机制]

[iptables series]: /tag/iptables/
[iptables详解（9）：iptables的黑白名单机制]: http://www.zsythink.net/archives/1604
