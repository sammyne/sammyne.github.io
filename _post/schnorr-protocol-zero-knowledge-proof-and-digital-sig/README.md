---
title: "Schnorr 协议：零知识身份证明和数字签名"
date: 2020-10-19
categories:
- crypto
tags:
- schnorr
- digital signature
---

## 1. Schnorr 简介
Schnorr 机制由德国数学家和密码学家 Claus-Peter Schnorr 在 1990 年提出，是一种基于离散对数难题的知识证明机制。

Schnorr 本质上是一种零知识的技术，即证明方声称知道一个密钥 `x` 的值，通过使用 Schnorr 加密技术，可以在不揭露 `x` 的值情况下向验证者证明对 `x` 的知情权，即可用于证明你有一个私钥。

Schnorr 涉及到的技术有
- 哈希函数的性质
- 椭圆曲线的离线对数难题：已知椭圆曲线 `E` 和点 `G`，随机选择一个整数 `d`，容易计算 `Q=d*G`，但是给定的 `Q` 和 `G` 计算 `d` 就非常困难

## 2. 技术价值
- 证明你知道一个私钥，可用于身份识别
- 数字签名

> 本文中所有出现的变量，小写字母表示标量，即一个数字，在这里指整数；大写字母表示离散对数问题中的参数，例如：椭圆曲线上的点。

## 3. 交互式 Schnorr
原始的 Schnorr 机制是一个交互式的机制。在讲述其机制时，不得不请出密码学中的两个虚拟大人物 Alice 和 Bob。注意，这两位可不是省油的灯，都存在作弊的可能性！

```
+------------------+              +-------------------------+
|       Alice      |              |          Bob            |
|                  |              |                         |
|                  |              |                         |
|  private:  x     |              |                         |
|                  |              |                         |
|   public:  X=x*G |              |    public: X            |
|                  |              |                         |
|   random:  r +------- R=r*G ------->                      |
|                  |              |                         |
|              <-------- c ----------+ random: c            |
|                  |              |                         |
|      z=r+c*x +-------- z ----------> verify: z*G ?= R+c*X |
|                  |              |                         |
+------------------+              +-------------------------+
```

### 场景描述

允许在任何拥有相同生成元（指在离散对数问题中）的协议参与者双方，证明某一方拥有私钥 `x` 而不需要直接交换它。其中双方都拥有的生成元设为 `G`，证明方（Alice）拥有私钥 `x`。验证方（Bob）已经从证明方取得 Alice 的公钥 `X`。简而言之，Bob 要在不知道 `x` 的情况下验证 Alice 知道它。

### 交互式 Schnorr 协议流程
- Alice：随机地选择一个标量 `r`，然后计算出 `R=r*G`，将 `R` 发送给 Bob
- Bob：回应一个随机标量 `c`
- Alice：通过计算 `z=r+c*x`，将标量 `z` 回应给 Bob
- Bob：将 `s` 转换为椭圆曲线上的点，即 `z*G`，然后验证 `z*G ?= c*X+R`

### 零知识解释

由于 `z=r+c*x`，等式两边同时添加相同的生成元可得：`z*G = c*X+R`。即可验证 Alice 确实拥有私钥 `x`，但是验证者 Bob 并不能得到私钥 `x` 的值，因此这个过程是零知识的，且是交互式的。此协议也叫做 [Sigma 协议][1]（Sigma 协议论文地址参见 [这里][2]）。

### 安全性分析

由于椭圆曲线上的离散对数问题，知道 `R` 和 `G` 的情况下通过 `R=r*G` 解出 `r` 是不可能的，所以保证了 `r` 的私密性。但是，这也是证明者和验证者在私有安全通道中执行的。这是由于此协议存在交互过程，此方案只对参与交互的验证者有效，其他不参与交互的验证者无法判断整个过程是否存在串通的舞弊行为，因为一旦两个验证者相互串通（当证明方使用相同的 `r` 时才有效），交换自己得到的值，便可以推出私钥。因此，是无法公开验证的。

不妨来个数学理论推导：在公开验证的条件下，两个验证者分别提供两个不同的随机值 `c1` 和 `c2`，并要求证明者计算 `z1 = r + c1*x`，`z2 = r + c2*x`，即可计算出 `x=(z1-z2)/(c1-c2)`。因此，这个过程便无法公开验证。

进一步分析，为什么需要验证者回复一个随机标量 `c` 呢？防止 Alice 造假！

如果 Bob 不回复一个 `c`，就变成如下一次性交互。

```
+------------------+              +-------------------------+
|       Alice      |              |          Bob            |
|                  |              |                         |
|                  |              |                         |
|  private:  x     |              |                         |
|                  |              |                         |
|   public:  X=x*G |              |    public: X            |
|                  |              |                         |
|   random:  r     |              |                         |
|                  |              |                         |
|      z=r+c*x +------ (R=r*G,z) ----> verify: z*G ?= R+c*X |
|                  |              |                         |
+------------------+              +-------------------------+
```

由于椭圆曲线上的离散对数问题，知道 `X` 和 `G` 的情况下通过 `X = x * G` 解出 `x` 是不可能的，所以保证了 `x` 的私密性。但是这种方案是存在问题的，`x` 和 `r` 都是 Alice 自己生成的，她知道 Bob 会用 `X` 和 `R` 相加然后再与 `z * G` 进行比较。所以她完全可以在不知道 `x` 的情况下构造：`R = r * G - X` 和 `z = r`。

这样 Bob 的验证过程就变成：`z * G ?== X + R ==> r * G ?== X + r * G - X`。这是永远成立的，所以这种方案并不正确。

## 4. 非交互式 Schnorr
上述 Schnorr 协议存在的私钥泄露问题使得算法无法在公开的环境下使用。通过将原始的交互式协议转变为非交互式协议可以解决这个问题。

```
+-----------------------+                +-----------------------
|       Alice           |                |          Bob         |
|                       |                |                      |
|                       |                |                      |
|  private:  x          |                |                      |
|                       |                |                      |
|   public:  X=x*G      |                |    public: X         |
|                       |                |                      |
|   random:  r          |                |                      |
|                       |                |                      |
|            R=r*G      |                |                      |
|                       |                |                      |
|            c=Hash(X,R)|                |                      |
|                       |                |                      |
|            z=r+c*x +------- (R,z) --------> verify:           |
|                       |                |                      |
|                       |                |      c=Hash(X,R)     |
|                       |                |                      |
|                       |                |      z*G ?= R+c*X    |
+-----------------------+                +----------------------+
```

### 非交互式 Schnorr 协议流程
- Alice：均匀随机选择 `r`，并依次计算
  - `R=r*G`
  - `c=Hash(X,R)`
  - `z=r+c*x`
- Alice：生成证明 `(R,z)`
- Bob（或者任意一个验证者）：计算 `c=Hash(X,R)`
- Bob（或者任意一个验证者）：验证 `z*G ?== R+c*X`

### 安全性分析与非交互式

为了不让 Alice 进行造假，需要 Bob 发送一个 `c` 值，并将 `c` 值构造进公式。所以，如果 Alice 选择一个无法造假并且大家公认的 `c` 值并将其构造进公式，问题就解决了。生成这个公认无法造假的 `c` 的方法是使用哈希函数。

看一下交互式 Schnorr 协议的第二步，Bob 需要给出一个随机的挑战数 `c`，这里我们可以让 Alice 用 `c=Hash(X,R)` 这个式子来计算这个挑战数，从而达到去除协议第二步的目的。

此外，利用哈希算法计算 `c` 的式子还达到了两个目的：
- Alice 在产生承诺 `R` 之前，没有办法预测 `c`，即使 `c` 最终变相是 Alice 挑选的
- `c` 通过哈希函数计算，会均匀分布在一个整数域内，而且可以作为一个随机数

::: danger 注意
Alice 绝不能在产生 `R` 之前预测到 `c`，不然 Alice 就等于变相具有了 **时间倒流** 的超能力，从而可以任意愚弄 Bob。
:::

而一个密码学安全哈希函数是 **单向** 的，比如 SHA256 等。这样一来，虽然 `c` 是 Alice 计算的，但是 Alice 并没有能力通过挑选 `c` 来作弊。因为只要 Alice 一产生 `R`，`c` 就相当于固定下来了。我们假设 Alice 这个凡人在 **现实世界** 没有反向计算哈希的能力。

这样就把三步 Schnorr 协议合并为一步。Alice 可直接发送`(R, z)`，因为 Bob 拥有 Alice 的公钥 `X`，于是 Bob 可自行计算出 `c`。然后验证 `z*G ?= c*X+R`。

### 零知识解释

整个过程中 Alice 并未暴露自己的私钥，且 Bob 无法通过正常手段或作弊手段获取 Alice 的私钥，因此也是零知识的。

## 5. Schnorr 用于数字签名
数字签名的出发点有二：
- 当消息基于网络传输时，接收方希望证实消息在传递过程中没有被篡改；
- 希望确认发送者的身份，可以理解为发送者有一个私钥，且私钥和这条消息进行关联计算。

首先要证明我的身份，这个简单，正是 Schnorr 协议的功能--能够向对方证明 **我拥有私钥** 这个陈述，并且这个证明过程是零知识的：不泄露关于 **私钥** 的任何知识。

那么如何和这句唐诗关联呢？我们修改下计算 `c` 的过程：

```
m="白日依山尽，黄河入海流"
c=Hash(m,R)
```

这里为了保证攻击者不能随意伪造签名，利用了离散对数难题（DLP）与哈希函数满足抗第二原象（Secondary Preimage Resistance）这个假设。

> 注：这里严格点讲，为了保证数字签名的不可伪造性，需要证明 Schnorr 协议满足 [Simulation Soundness][Discrete-log-based signatures may not be equivalent to discrete log] 这个更强的性质。

```
+-----------------------+                +-----------------------
|       Alice           |                |          Bob         |
|                       |                |                      |
|                       |                |                      |
|  private:  x          |                |                      |
|                       |                |                      |
|   public:  X=x*G      |                |    public: X         |
|                       |                |                      |
|   random:  r          |                |                      |
|                       |                |                      |
|            R=r*G      |                |                      |
|                       |                |                      |
|            c=Hash(X,R)|                |                      |
|                       |                |                      |
|            z=r+c*x +------- (c,z) --------> verify:           |
|                       |                |                      |
|                       |                |      R'=z*G-c*X      |
|                       |                |                      |
|                       |                |      c ?= Hash(m,R') |
+-----------------------+                +----------------------+
```

以上流程图就是 [Schnorr 签名方案][Efficient signature generation by smart cards]。在这里还有一个优化，Alice 发给 Bob 的内容不是 `(R,z)` 而是 `(c,z)`，这是因为 `R` 可以通过`c` 和 `z` 计算出来。

> 注：为什么说这是一个 **优化** 呢？目前针对椭圆曲线的攻击方法有 Shanks 算法、Lambda 算法还有 Pollard's rho 算法，请大家记住他们的算法复杂度大约都是 3，`n` 是有限域大小的位数。假设我们采用了非常接近 2^256 的有限域，也就是说 `z` 是 256 比特，那么椭圆曲线群的大小也差不多要接近 256 比特，这样一来，把 2^256 开平方根后就是 2^128，所以说 256 比特椭圆曲线群的安全性只有 128 比特。那么，挑战数 `c` 也只需要 128 比特就足够了。这样 Alice 发送 c 要比发送 R 要更节省空间，而后者至少需要 256 比特。`c` 和 `z` 两个数值加起来总共 384 比特。相比现在流行的 ECDSA 签名方案来说，可以节省 1/4 的宝贵空间。现在比特币开发团队已经准备将 ECDSA 签名方案改为一种类 Schnorr 协议的签名方案 -- [muSig]，可以实现更灵活地支持多签和聚合。

## 6. Fiat-Shamir 变换
采用哈希函数的方法来把一个交互式的证明系统变成非交互式的方法被称为 [Fiat-Shamir 变换][How to prove yourself: practical solutions to identification and signature problems]，它由密码学老前辈 Amos Fiat 和 Adi Shamir 两人在 1986 年提出。

Fiat-Shamir 变换，又叫 Fiat-Shamir Heurisitc（启发式）或者 Fiat-Shamir Paradigm（范式），是 Fiat 和 Shamir 在 1986 年提出的一个变换，其特点是可以将交互式零知识证明转换为非交互式零知识证明，从而减少通信步骤来提高通信效率！

Fiat-Shamir 启发式算法允许将交互步骤 3 替换为非交互随机数预言机（Random oracle）。随机数预言机，即随机数函数，是一种针对任意输入得到的输出之间是相互独立切均匀分布的函数。理想的随机数预言机并不存在，在实现中经常采用密码学哈希函数作为随机数预言机。

下面是一个示例图，大家可以迅速理解这个 Fiat-Shamir 变换的做法。

```
                                  Fiat-Shamir
                                      |
                           +--------------->
                                      |
       public-coin interactive        |                    non-interactive
                                      |
                                      |                     哈希函数
                                      |
Alice   +-------a[1]-------->   Bob   |    Alice   +------- a[1],...,a[r-1],a[r] --->   Bob
                                      |
        <-------b[1]--------+         |     b[1]=Hash(x,a[1])
                                      |
                                      |     b[2]=Hash(x,a[1],a[2])
                ...                   |
                                      |     ...
                                      |
        +-------a[r-1]------>         |
                                      |
        <-------b[r-1]------+         |     b[r-1]=Hash(x,a[1],a[2],...,a[r-1])
                                      |
        +-------a[r]-------->         |
                                      +
```

## 7. 参考文献

- [Schnorr协议：零知识身份证明和数字签名](https://mp.weixin.qq.com/s/SlbgZ0XbgYIN-DtmDyP7Lg)


[1]: https://blog.csdn.net/mutourend/article/details/100708354
[2]: https://www.cs.au.dk/~ivan/Sigma.pdf
[3]: https://www.jianshu.com/p/0c0889d2a63a

[Discrete-log-based signatures may not be equivalent to discrete log]: https://xueshu.baidu.com/usercenter/paper/show?paperid=823f61d51e7603551af7bada49907889&site=xueshu_se
[Efficient signature generation by smart cards]: https://xueshu.baidu.com/usercenter/paper/show?paperid=6b1e6f8f1b2c7160d9ec54e0aa5b2c54&site=xueshu_se
[How to prove yourself: practical solutions to identification and signature problems]: https://xueshu.baidu.com/usercenter/paper/show?paperid=1v4d0cc0h52h04k0tc3402k0cd493486&site=xueshu_se

[muSig]: https://xueshu.baidu.com/usercenter/paper/show?paperid=1c710vr0592v06n0rm3r00r0gm123358&site=xueshu_se&hitarticle=1
