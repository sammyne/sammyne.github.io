(window.webpackJsonp=window.webpackJsonp||[]).push([[86],{755:function(s,a,e){"use strict";e.r(a);var n=e(2),r=Object(n.a)({},(function(){var s=this,a=s._self._c;return a("ContentSlotsDistributor",{attrs:{"slot-key":s.$parent.slotKey}},[a("h2",{attrs:{id:"_1-schnorr-简介"}},[a("a",{staticClass:"header-anchor",attrs:{href:"#_1-schnorr-简介"}},[s._v("#")]),s._v(" 1. Schnorr 简介")]),s._v(" "),a("p",[s._v("Schnorr 机制由德国数学家和密码学家 Claus-Peter Schnorr 在 1990 年提出，是一种基于离散对数难题的知识证明机制。")]),s._v(" "),a("p",[s._v("Schnorr 本质上是一种零知识的技术，即证明方声称知道一个密钥 "),a("code",[s._v("x")]),s._v(" 的值，通过使用 Schnorr 加密技术，可以在不揭露 "),a("code",[s._v("x")]),s._v(" 的值情况下向验证者证明对 "),a("code",[s._v("x")]),s._v(" 的知情权，即可用于证明你有一个私钥。")]),s._v(" "),a("p",[s._v("Schnorr 涉及到的技术有")]),s._v(" "),a("ul",[a("li",[s._v("哈希函数的性质")]),s._v(" "),a("li",[s._v("椭圆曲线的离线对数难题：已知椭圆曲线 "),a("code",[s._v("E")]),s._v(" 和点 "),a("code",[s._v("G")]),s._v("，随机选择一个整数 "),a("code",[s._v("d")]),s._v("，容易计算 "),a("code",[s._v("Q=d*G")]),s._v("，但是给定的 "),a("code",[s._v("Q")]),s._v(" 和 "),a("code",[s._v("G")]),s._v(" 计算 "),a("code",[s._v("d")]),s._v(" 就非常困难")])]),s._v(" "),a("h2",{attrs:{id:"_2-技术价值"}},[a("a",{staticClass:"header-anchor",attrs:{href:"#_2-技术价值"}},[s._v("#")]),s._v(" 2. 技术价值")]),s._v(" "),a("ul",[a("li",[s._v("证明你知道一个私钥，可用于身份识别")]),s._v(" "),a("li",[s._v("数字签名")])]),s._v(" "),a("blockquote",[a("p",[s._v("本文中所有出现的变量，小写字母表示标量，即一个数字，在这里指整数；大写字母表示离散对数问题中的参数，例如：椭圆曲线上的点。")])]),s._v(" "),a("h2",{attrs:{id:"_3-交互式-schnorr"}},[a("a",{staticClass:"header-anchor",attrs:{href:"#_3-交互式-schnorr"}},[s._v("#")]),s._v(" 3. 交互式 Schnorr")]),s._v(" "),a("p",[s._v("原始的 Schnorr 机制是一个交互式的机制。在讲述其机制时，不得不请出密码学中的两个虚拟大人物 Alice 和 Bob。注意，这两位可不是省油的灯，都存在作弊的可能性！")]),s._v(" "),a("div",{staticClass:"language- line-numbers-mode"},[a("pre",{pre:!0,attrs:{class:"language-text"}},[a("code",[s._v("+------------------+              +-------------------------+\n|       Alice      |              |          Bob            |\n|                  |              |                         |\n|                  |              |                         |\n|  private:  x     |              |                         |\n|                  |              |                         |\n|   public:  X=x*G |              |    public: X            |\n|                  |              |                         |\n|   random:  r +------- R=r*G -------\x3e                      |\n|                  |              |                         |\n|              <-------- c ----------+ random: c            |\n|                  |              |                         |\n|      z=r+c*x +-------- z ----------\x3e verify: z*G ?= R+c*X |\n|                  |              |                         |\n+------------------+              +-------------------------+\n")])]),s._v(" "),a("div",{staticClass:"line-numbers-wrapper"},[a("span",{staticClass:"line-number"},[s._v("1")]),a("br"),a("span",{staticClass:"line-number"},[s._v("2")]),a("br"),a("span",{staticClass:"line-number"},[s._v("3")]),a("br"),a("span",{staticClass:"line-number"},[s._v("4")]),a("br"),a("span",{staticClass:"line-number"},[s._v("5")]),a("br"),a("span",{staticClass:"line-number"},[s._v("6")]),a("br"),a("span",{staticClass:"line-number"},[s._v("7")]),a("br"),a("span",{staticClass:"line-number"},[s._v("8")]),a("br"),a("span",{staticClass:"line-number"},[s._v("9")]),a("br"),a("span",{staticClass:"line-number"},[s._v("10")]),a("br"),a("span",{staticClass:"line-number"},[s._v("11")]),a("br"),a("span",{staticClass:"line-number"},[s._v("12")]),a("br"),a("span",{staticClass:"line-number"},[s._v("13")]),a("br"),a("span",{staticClass:"line-number"},[s._v("14")]),a("br"),a("span",{staticClass:"line-number"},[s._v("15")]),a("br")])]),a("h3",{attrs:{id:"场景描述"}},[a("a",{staticClass:"header-anchor",attrs:{href:"#场景描述"}},[s._v("#")]),s._v(" 场景描述")]),s._v(" "),a("p",[s._v("允许在任何拥有相同生成元（指在离散对数问题中）的协议参与者双方，证明某一方拥有私钥 "),a("code",[s._v("x")]),s._v(" 而不需要直接交换它。其中双方都拥有的生成元设为 "),a("code",[s._v("G")]),s._v("，证明方（Alice）拥有私钥 "),a("code",[s._v("x")]),s._v("。验证方（Bob）已经从证明方取得 Alice 的公钥 "),a("code",[s._v("X")]),s._v("。简而言之，Bob 要在不知道 "),a("code",[s._v("x")]),s._v(" 的情况下验证 Alice 知道它。")]),s._v(" "),a("h3",{attrs:{id:"交互式-schnorr-协议流程"}},[a("a",{staticClass:"header-anchor",attrs:{href:"#交互式-schnorr-协议流程"}},[s._v("#")]),s._v(" 交互式 Schnorr 协议流程")]),s._v(" "),a("ul",[a("li",[s._v("Alice：随机地选择一个标量 "),a("code",[s._v("r")]),s._v("，然后计算出 "),a("code",[s._v("R=r*G")]),s._v("，将 "),a("code",[s._v("R")]),s._v(" 发送给 Bob")]),s._v(" "),a("li",[s._v("Bob：回应一个随机标量 "),a("code",[s._v("c")])]),s._v(" "),a("li",[s._v("Alice：通过计算 "),a("code",[s._v("z=r+c*x")]),s._v("，将标量 "),a("code",[s._v("z")]),s._v(" 回应给 Bob")]),s._v(" "),a("li",[s._v("Bob：将 "),a("code",[s._v("s")]),s._v(" 转换为椭圆曲线上的点，即 "),a("code",[s._v("z*G")]),s._v("，然后验证 "),a("code",[s._v("z*G ?= c*X+R")])])]),s._v(" "),a("h3",{attrs:{id:"零知识解释"}},[a("a",{staticClass:"header-anchor",attrs:{href:"#零知识解释"}},[s._v("#")]),s._v(" 零知识解释")]),s._v(" "),a("p",[s._v("由于 "),a("code",[s._v("z=r+c*x")]),s._v("，等式两边同时添加相同的生成元可得："),a("code",[s._v("z*G = c*X+R")]),s._v("。即可验证 Alice 确实拥有私钥 "),a("code",[s._v("x")]),s._v("，但是验证者 Bob 并不能得到私钥 "),a("code",[s._v("x")]),s._v(" 的值，因此这个过程是零知识的，且是交互式的。此协议也叫做 "),a("a",{attrs:{href:"https://blog.csdn.net/mutourend/article/details/100708354",target:"_blank",rel:"noopener noreferrer"}},[s._v("Sigma 协议"),a("OutboundLink")],1),s._v("（Sigma 协议论文地址参见 "),a("a",{attrs:{href:"https://www.cs.au.dk/~ivan/Sigma.pdf",target:"_blank",rel:"noopener noreferrer"}},[s._v("这里"),a("OutboundLink")],1),s._v("）。")]),s._v(" "),a("h3",{attrs:{id:"安全性分析"}},[a("a",{staticClass:"header-anchor",attrs:{href:"#安全性分析"}},[s._v("#")]),s._v(" 安全性分析")]),s._v(" "),a("p",[s._v("由于椭圆曲线上的离散对数问题，知道 "),a("code",[s._v("R")]),s._v(" 和 "),a("code",[s._v("G")]),s._v(" 的情况下通过 "),a("code",[s._v("R=r*G")]),s._v(" 解出 "),a("code",[s._v("r")]),s._v(" 是不可能的，所以保证了 "),a("code",[s._v("r")]),s._v(" 的私密性。但是，这也是证明者和验证者在私有安全通道中执行的。这是由于此协议存在交互过程，此方案只对参与交互的验证者有效，其他不参与交互的验证者无法判断整个过程是否存在串通的舞弊行为，因为一旦两个验证者相互串通（当证明方使用相同的 "),a("code",[s._v("r")]),s._v(" 时才有效），交换自己得到的值，便可以推出私钥。因此，是无法公开验证的。")]),s._v(" "),a("p",[s._v("不妨来个数学理论推导：在公开验证的条件下，两个验证者分别提供两个不同的随机值 "),a("code",[s._v("c1")]),s._v(" 和 "),a("code",[s._v("c2")]),s._v("，并要求证明者计算 "),a("code",[s._v("z1 = r + c1*x")]),s._v("，"),a("code",[s._v("z2 = r + c2*x")]),s._v("，即可计算出 "),a("code",[s._v("x=(z1-z2)/(c1-c2)")]),s._v("。因此，这个过程便无法公开验证。")]),s._v(" "),a("p",[s._v("进一步分析，为什么需要验证者回复一个随机标量 "),a("code",[s._v("c")]),s._v(" 呢？防止 Alice 造假！")]),s._v(" "),a("p",[s._v("如果 Bob 不回复一个 "),a("code",[s._v("c")]),s._v("，就变成如下一次性交互。")]),s._v(" "),a("div",{staticClass:"language- line-numbers-mode"},[a("pre",{pre:!0,attrs:{class:"language-text"}},[a("code",[s._v("+------------------+              +-------------------------+\n|       Alice      |              |          Bob            |\n|                  |              |                         |\n|                  |              |                         |\n|  private:  x     |              |                         |\n|                  |              |                         |\n|   public:  X=x*G |              |    public: X            |\n|                  |              |                         |\n|   random:  r     |              |                         |\n|                  |              |                         |\n|      z=r+c*x +------ (R=r*G,z) ----\x3e verify: z*G ?= R+c*X |\n|                  |              |                         |\n+------------------+              +-------------------------+\n")])]),s._v(" "),a("div",{staticClass:"line-numbers-wrapper"},[a("span",{staticClass:"line-number"},[s._v("1")]),a("br"),a("span",{staticClass:"line-number"},[s._v("2")]),a("br"),a("span",{staticClass:"line-number"},[s._v("3")]),a("br"),a("span",{staticClass:"line-number"},[s._v("4")]),a("br"),a("span",{staticClass:"line-number"},[s._v("5")]),a("br"),a("span",{staticClass:"line-number"},[s._v("6")]),a("br"),a("span",{staticClass:"line-number"},[s._v("7")]),a("br"),a("span",{staticClass:"line-number"},[s._v("8")]),a("br"),a("span",{staticClass:"line-number"},[s._v("9")]),a("br"),a("span",{staticClass:"line-number"},[s._v("10")]),a("br"),a("span",{staticClass:"line-number"},[s._v("11")]),a("br"),a("span",{staticClass:"line-number"},[s._v("12")]),a("br"),a("span",{staticClass:"line-number"},[s._v("13")]),a("br")])]),a("p",[s._v("由于椭圆曲线上的离散对数问题，知道 "),a("code",[s._v("X")]),s._v(" 和 "),a("code",[s._v("G")]),s._v(" 的情况下通过 "),a("code",[s._v("X = x * G")]),s._v(" 解出 "),a("code",[s._v("x")]),s._v(" 是不可能的，所以保证了 "),a("code",[s._v("x")]),s._v(" 的私密性。但是这种方案是存在问题的，"),a("code",[s._v("x")]),s._v(" 和 "),a("code",[s._v("r")]),s._v(" 都是 Alice 自己生成的，她知道 Bob 会用 "),a("code",[s._v("X")]),s._v(" 和 "),a("code",[s._v("R")]),s._v(" 相加然后再与 "),a("code",[s._v("z * G")]),s._v(" 进行比较。所以她完全可以在不知道 "),a("code",[s._v("x")]),s._v(" 的情况下构造："),a("code",[s._v("R = r * G - X")]),s._v(" 和 "),a("code",[s._v("z = r")]),s._v("。")]),s._v(" "),a("p",[s._v("这样 Bob 的验证过程就变成："),a("code",[s._v("z * G ?== X + R ==> r * G ?== X + r * G - X")]),s._v("。这是永远成立的，所以这种方案并不正确。")]),s._v(" "),a("h2",{attrs:{id:"_4-非交互式-schnorr"}},[a("a",{staticClass:"header-anchor",attrs:{href:"#_4-非交互式-schnorr"}},[s._v("#")]),s._v(" 4. 非交互式 Schnorr")]),s._v(" "),a("p",[s._v("上述 Schnorr 协议存在的私钥泄露问题使得算法无法在公开的环境下使用。通过将原始的交互式协议转变为非交互式协议可以解决这个问题。")]),s._v(" "),a("div",{staticClass:"language- line-numbers-mode"},[a("pre",{pre:!0,attrs:{class:"language-text"}},[a("code",[s._v("+-----------------------+                +-----------------------\n|       Alice           |                |          Bob         |\n|                       |                |                      |\n|                       |                |                      |\n|  private:  x          |                |                      |\n|                       |                |                      |\n|   public:  X=x*G      |                |    public: X         |\n|                       |                |                      |\n|   random:  r          |                |                      |\n|                       |                |                      |\n|            R=r*G      |                |                      |\n|                       |                |                      |\n|            c=Hash(X,R)|                |                      |\n|                       |                |                      |\n|            z=r+c*x +------- (R,z) --------\x3e verify:           |\n|                       |                |                      |\n|                       |                |      c=Hash(X,R)     |\n|                       |                |                      |\n|                       |                |      z*G ?= R+c*X    |\n+-----------------------+                +----------------------+\n")])]),s._v(" "),a("div",{staticClass:"line-numbers-wrapper"},[a("span",{staticClass:"line-number"},[s._v("1")]),a("br"),a("span",{staticClass:"line-number"},[s._v("2")]),a("br"),a("span",{staticClass:"line-number"},[s._v("3")]),a("br"),a("span",{staticClass:"line-number"},[s._v("4")]),a("br"),a("span",{staticClass:"line-number"},[s._v("5")]),a("br"),a("span",{staticClass:"line-number"},[s._v("6")]),a("br"),a("span",{staticClass:"line-number"},[s._v("7")]),a("br"),a("span",{staticClass:"line-number"},[s._v("8")]),a("br"),a("span",{staticClass:"line-number"},[s._v("9")]),a("br"),a("span",{staticClass:"line-number"},[s._v("10")]),a("br"),a("span",{staticClass:"line-number"},[s._v("11")]),a("br"),a("span",{staticClass:"line-number"},[s._v("12")]),a("br"),a("span",{staticClass:"line-number"},[s._v("13")]),a("br"),a("span",{staticClass:"line-number"},[s._v("14")]),a("br"),a("span",{staticClass:"line-number"},[s._v("15")]),a("br"),a("span",{staticClass:"line-number"},[s._v("16")]),a("br"),a("span",{staticClass:"line-number"},[s._v("17")]),a("br"),a("span",{staticClass:"line-number"},[s._v("18")]),a("br"),a("span",{staticClass:"line-number"},[s._v("19")]),a("br"),a("span",{staticClass:"line-number"},[s._v("20")]),a("br")])]),a("h3",{attrs:{id:"非交互式-schnorr-协议流程"}},[a("a",{staticClass:"header-anchor",attrs:{href:"#非交互式-schnorr-协议流程"}},[s._v("#")]),s._v(" 非交互式 Schnorr 协议流程")]),s._v(" "),a("ul",[a("li",[s._v("Alice：均匀随机选择 "),a("code",[s._v("r")]),s._v("，并依次计算\n"),a("ul",[a("li",[a("code",[s._v("R=r*G")])]),s._v(" "),a("li",[a("code",[s._v("c=Hash(X,R)")])]),s._v(" "),a("li",[a("code",[s._v("z=r+c*x")])])])]),s._v(" "),a("li",[s._v("Alice：生成证明 "),a("code",[s._v("(R,z)")])]),s._v(" "),a("li",[s._v("Bob（或者任意一个验证者）：计算 "),a("code",[s._v("c=Hash(X,R)")])]),s._v(" "),a("li",[s._v("Bob（或者任意一个验证者）：验证 "),a("code",[s._v("z*G ?== R+c*X")])])]),s._v(" "),a("h3",{attrs:{id:"安全性分析与非交互式"}},[a("a",{staticClass:"header-anchor",attrs:{href:"#安全性分析与非交互式"}},[s._v("#")]),s._v(" 安全性分析与非交互式")]),s._v(" "),a("p",[s._v("为了不让 Alice 进行造假，需要 Bob 发送一个 "),a("code",[s._v("c")]),s._v(" 值，并将 "),a("code",[s._v("c")]),s._v(" 值构造进公式。所以，如果 Alice 选择一个无法造假并且大家公认的 "),a("code",[s._v("c")]),s._v(" 值并将其构造进公式，问题就解决了。生成这个公认无法造假的 "),a("code",[s._v("c")]),s._v(" 的方法是使用哈希函数。")]),s._v(" "),a("p",[s._v("看一下交互式 Schnorr 协议的第二步，Bob 需要给出一个随机的挑战数 "),a("code",[s._v("c")]),s._v("，这里我们可以让 Alice 用 "),a("code",[s._v("c=Hash(X,R)")]),s._v(" 这个式子来计算这个挑战数，从而达到去除协议第二步的目的。")]),s._v(" "),a("p",[s._v("此外，利用哈希算法计算 "),a("code",[s._v("c")]),s._v(" 的式子还达到了两个目的：")]),s._v(" "),a("ul",[a("li",[s._v("Alice 在产生承诺 "),a("code",[s._v("R")]),s._v(" 之前，没有办法预测 "),a("code",[s._v("c")]),s._v("，即使 "),a("code",[s._v("c")]),s._v(" 最终变相是 Alice 挑选的")]),s._v(" "),a("li",[a("code",[s._v("c")]),s._v(" 通过哈希函数计算，会均匀分布在一个整数域内，而且可以作为一个随机数")])]),s._v(" "),a("div",{staticClass:"custom-block danger"},[a("p",{staticClass:"title"},[s._v("注意")]),a("p",[s._v("Alice 绝不能在产生 "),a("code",[s._v("R")]),s._v(" 之前预测到 "),a("code",[s._v("c")]),s._v("，不然 Alice 就等于变相具有了 "),a("strong",[s._v("时间倒流")]),s._v(" 的超能力，从而可以任意愚弄 Bob。")])]),a("p",[s._v("而一个密码学安全哈希函数是 "),a("strong",[s._v("单向")]),s._v(" 的，比如 SHA256 等。这样一来，虽然 "),a("code",[s._v("c")]),s._v(" 是 Alice 计算的，但是 Alice 并没有能力通过挑选 "),a("code",[s._v("c")]),s._v(" 来作弊。因为只要 Alice 一产生 "),a("code",[s._v("R")]),s._v("，"),a("code",[s._v("c")]),s._v(" 就相当于固定下来了。我们假设 Alice 这个凡人在 "),a("strong",[s._v("现实世界")]),s._v(" 没有反向计算哈希的能力。")]),s._v(" "),a("p",[s._v("这样就把三步 Schnorr 协议合并为一步。Alice 可直接发送"),a("code",[s._v("(R, z)")]),s._v("，因为 Bob 拥有 Alice 的公钥 "),a("code",[s._v("X")]),s._v("，于是 Bob 可自行计算出 "),a("code",[s._v("c")]),s._v("。然后验证 "),a("code",[s._v("z*G ?= c*X+R")]),s._v("。")]),s._v(" "),a("h3",{attrs:{id:"零知识解释-2"}},[a("a",{staticClass:"header-anchor",attrs:{href:"#零知识解释-2"}},[s._v("#")]),s._v(" 零知识解释")]),s._v(" "),a("p",[s._v("整个过程中 Alice 并未暴露自己的私钥，且 Bob 无法通过正常手段或作弊手段获取 Alice 的私钥，因此也是零知识的。")]),s._v(" "),a("h2",{attrs:{id:"_5-schnorr-用于数字签名"}},[a("a",{staticClass:"header-anchor",attrs:{href:"#_5-schnorr-用于数字签名"}},[s._v("#")]),s._v(" 5. Schnorr 用于数字签名")]),s._v(" "),a("p",[s._v("数字签名的出发点有二：")]),s._v(" "),a("ul",[a("li",[s._v("当消息基于网络传输时，接收方希望证实消息在传递过程中没有被篡改；")]),s._v(" "),a("li",[s._v("希望确认发送者的身份，可以理解为发送者有一个私钥，且私钥和这条消息进行关联计算。")])]),s._v(" "),a("p",[s._v("首先要证明我的身份，这个简单，正是 Schnorr 协议的功能--能够向对方证明 "),a("strong",[s._v("我拥有私钥")]),s._v(" 这个陈述，并且这个证明过程是零知识的：不泄露关于 "),a("strong",[s._v("私钥")]),s._v(" 的任何知识。")]),s._v(" "),a("p",[s._v("那么如何和这句唐诗关联呢？我们修改下计算 "),a("code",[s._v("c")]),s._v(" 的过程：")]),s._v(" "),a("div",{staticClass:"language- line-numbers-mode"},[a("pre",{pre:!0,attrs:{class:"language-text"}},[a("code",[s._v('m="白日依山尽，黄河入海流"\nc=Hash(m,R)\n')])]),s._v(" "),a("div",{staticClass:"line-numbers-wrapper"},[a("span",{staticClass:"line-number"},[s._v("1")]),a("br"),a("span",{staticClass:"line-number"},[s._v("2")]),a("br")])]),a("p",[s._v("这里为了保证攻击者不能随意伪造签名，利用了离散对数难题（DLP）与哈希函数满足抗第二原象（Secondary Preimage Resistance）这个假设。")]),s._v(" "),a("blockquote",[a("p",[s._v("注：这里严格点讲，为了保证数字签名的不可伪造性，需要证明 Schnorr 协议满足 "),a("a",{attrs:{href:"https://xueshu.baidu.com/usercenter/paper/show?paperid=823f61d51e7603551af7bada49907889&site=xueshu_se",target:"_blank",rel:"noopener noreferrer"}},[s._v("Simulation Soundness"),a("OutboundLink")],1),s._v(" 这个更强的性质。")])]),s._v(" "),a("div",{staticClass:"language- line-numbers-mode"},[a("pre",{pre:!0,attrs:{class:"language-text"}},[a("code",[s._v("+-----------------------+                +-----------------------\n|       Alice           |                |          Bob         |\n|                       |                |                      |\n|                       |                |                      |\n|  private:  x          |                |                      |\n|                       |                |                      |\n|   public:  X=x*G      |                |    public: X         |\n|                       |                |                      |\n|   random:  r          |                |                      |\n|                       |                |                      |\n|            R=r*G      |                |                      |\n|                       |                |                      |\n|            c=Hash(X,R)|                |                      |\n|                       |                |                      |\n|            z=r+c*x +------- (c,z) --------\x3e verify:           |\n|                       |                |                      |\n|                       |                |      R'=z*G-c*X      |\n|                       |                |                      |\n|                       |                |      c ?= Hash(m,R') |\n+-----------------------+                +----------------------+\n")])]),s._v(" "),a("div",{staticClass:"line-numbers-wrapper"},[a("span",{staticClass:"line-number"},[s._v("1")]),a("br"),a("span",{staticClass:"line-number"},[s._v("2")]),a("br"),a("span",{staticClass:"line-number"},[s._v("3")]),a("br"),a("span",{staticClass:"line-number"},[s._v("4")]),a("br"),a("span",{staticClass:"line-number"},[s._v("5")]),a("br"),a("span",{staticClass:"line-number"},[s._v("6")]),a("br"),a("span",{staticClass:"line-number"},[s._v("7")]),a("br"),a("span",{staticClass:"line-number"},[s._v("8")]),a("br"),a("span",{staticClass:"line-number"},[s._v("9")]),a("br"),a("span",{staticClass:"line-number"},[s._v("10")]),a("br"),a("span",{staticClass:"line-number"},[s._v("11")]),a("br"),a("span",{staticClass:"line-number"},[s._v("12")]),a("br"),a("span",{staticClass:"line-number"},[s._v("13")]),a("br"),a("span",{staticClass:"line-number"},[s._v("14")]),a("br"),a("span",{staticClass:"line-number"},[s._v("15")]),a("br"),a("span",{staticClass:"line-number"},[s._v("16")]),a("br"),a("span",{staticClass:"line-number"},[s._v("17")]),a("br"),a("span",{staticClass:"line-number"},[s._v("18")]),a("br"),a("span",{staticClass:"line-number"},[s._v("19")]),a("br"),a("span",{staticClass:"line-number"},[s._v("20")]),a("br")])]),a("p",[s._v("以上流程图就是 "),a("a",{attrs:{href:"https://xueshu.baidu.com/usercenter/paper/show?paperid=6b1e6f8f1b2c7160d9ec54e0aa5b2c54&site=xueshu_se",target:"_blank",rel:"noopener noreferrer"}},[s._v("Schnorr 签名方案"),a("OutboundLink")],1),s._v("。在这里还有一个优化，Alice 发给 Bob 的内容不是 "),a("code",[s._v("(R,z)")]),s._v(" 而是 "),a("code",[s._v("(c,z)")]),s._v("，这是因为 "),a("code",[s._v("R")]),s._v(" 可以通过"),a("code",[s._v("c")]),s._v(" 和 "),a("code",[s._v("z")]),s._v(" 计算出来。")]),s._v(" "),a("blockquote",[a("p",[s._v("注：为什么说这是一个 "),a("strong",[s._v("优化")]),s._v(" 呢？目前针对椭圆曲线的攻击方法有 Shanks 算法、Lambda 算法还有 Pollard's rho 算法，请大家记住他们的算法复杂度大约都是 3，"),a("code",[s._v("n")]),s._v(" 是有限域大小的位数。假设我们采用了非常接近 2^256 的有限域，也就是说 "),a("code",[s._v("z")]),s._v(" 是 256 比特，那么椭圆曲线群的大小也差不多要接近 256 比特，这样一来，把 2^256 开平方根后就是 2^128，所以说 256 比特椭圆曲线群的安全性只有 128 比特。那么，挑战数 "),a("code",[s._v("c")]),s._v(" 也只需要 128 比特就足够了。这样 Alice 发送 c 要比发送 R 要更节省空间，而后者至少需要 256 比特。"),a("code",[s._v("c")]),s._v(" 和 "),a("code",[s._v("z")]),s._v(" 两个数值加起来总共 384 比特。相比现在流行的 ECDSA 签名方案来说，可以节省 1/4 的宝贵空间。现在比特币开发团队已经准备将 ECDSA 签名方案改为一种类 Schnorr 协议的签名方案 -- "),a("a",{attrs:{href:"https://xueshu.baidu.com/usercenter/paper/show?paperid=1c710vr0592v06n0rm3r00r0gm123358&site=xueshu_se&hitarticle=1",target:"_blank",rel:"noopener noreferrer"}},[s._v("muSig"),a("OutboundLink")],1),s._v("，可以实现更灵活地支持多签和聚合。")])]),s._v(" "),a("h2",{attrs:{id:"_6-fiat-shamir-变换"}},[a("a",{staticClass:"header-anchor",attrs:{href:"#_6-fiat-shamir-变换"}},[s._v("#")]),s._v(" 6. Fiat-Shamir 变换")]),s._v(" "),a("p",[s._v("采用哈希函数的方法来把一个交互式的证明系统变成非交互式的方法被称为 "),a("a",{attrs:{href:"https://xueshu.baidu.com/usercenter/paper/show?paperid=1v4d0cc0h52h04k0tc3402k0cd493486&site=xueshu_se",target:"_blank",rel:"noopener noreferrer"}},[s._v("Fiat-Shamir 变换"),a("OutboundLink")],1),s._v("，它由密码学老前辈 Amos Fiat 和 Adi Shamir 两人在 1986 年提出。")]),s._v(" "),a("p",[s._v("Fiat-Shamir 变换，又叫 Fiat-Shamir Heurisitc（启发式）或者 Fiat-Shamir Paradigm（范式），是 Fiat 和 Shamir 在 1986 年提出的一个变换，其特点是可以将交互式零知识证明转换为非交互式零知识证明，从而减少通信步骤来提高通信效率！")]),s._v(" "),a("p",[s._v("Fiat-Shamir 启发式算法允许将交互步骤 3 替换为非交互随机数预言机（Random oracle）。随机数预言机，即随机数函数，是一种针对任意输入得到的输出之间是相互独立切均匀分布的函数。理想的随机数预言机并不存在，在实现中经常采用密码学哈希函数作为随机数预言机。")]),s._v(" "),a("p",[s._v("下面是一个示例图，大家可以迅速理解这个 Fiat-Shamir 变换的做法。")]),s._v(" "),a("div",{staticClass:"language- line-numbers-mode"},[a("pre",{pre:!0,attrs:{class:"language-text"}},[a("code",[s._v("                                  Fiat-Shamir\n                                      |\n                           +---------------\x3e\n                                      |\n       public-coin interactive        |                    non-interactive\n                                      |\n                                      |                     哈希函数\n                                      |\nAlice   +-------a[1]--------\x3e   Bob   |    Alice   +------- a[1],...,a[r-1],a[r] ---\x3e   Bob\n                                      |\n        <-------b[1]--------+         |     b[1]=Hash(x,a[1])\n                                      |\n                                      |     b[2]=Hash(x,a[1],a[2])\n                ...                   |\n                                      |     ...\n                                      |\n        +-------a[r-1]------\x3e         |\n                                      |\n        <-------b[r-1]------+         |     b[r-1]=Hash(x,a[1],a[2],...,a[r-1])\n                                      |\n        +-------a[r]--------\x3e         |\n                                      +\n")])]),s._v(" "),a("div",{staticClass:"line-numbers-wrapper"},[a("span",{staticClass:"line-number"},[s._v("1")]),a("br"),a("span",{staticClass:"line-number"},[s._v("2")]),a("br"),a("span",{staticClass:"line-number"},[s._v("3")]),a("br"),a("span",{staticClass:"line-number"},[s._v("4")]),a("br"),a("span",{staticClass:"line-number"},[s._v("5")]),a("br"),a("span",{staticClass:"line-number"},[s._v("6")]),a("br"),a("span",{staticClass:"line-number"},[s._v("7")]),a("br"),a("span",{staticClass:"line-number"},[s._v("8")]),a("br"),a("span",{staticClass:"line-number"},[s._v("9")]),a("br"),a("span",{staticClass:"line-number"},[s._v("10")]),a("br"),a("span",{staticClass:"line-number"},[s._v("11")]),a("br"),a("span",{staticClass:"line-number"},[s._v("12")]),a("br"),a("span",{staticClass:"line-number"},[s._v("13")]),a("br"),a("span",{staticClass:"line-number"},[s._v("14")]),a("br"),a("span",{staticClass:"line-number"},[s._v("15")]),a("br"),a("span",{staticClass:"line-number"},[s._v("16")]),a("br"),a("span",{staticClass:"line-number"},[s._v("17")]),a("br"),a("span",{staticClass:"line-number"},[s._v("18")]),a("br"),a("span",{staticClass:"line-number"},[s._v("19")]),a("br"),a("span",{staticClass:"line-number"},[s._v("20")]),a("br"),a("span",{staticClass:"line-number"},[s._v("21")]),a("br"),a("span",{staticClass:"line-number"},[s._v("22")]),a("br")])]),a("h2",{attrs:{id:"_7-参考文献"}},[a("a",{staticClass:"header-anchor",attrs:{href:"#_7-参考文献"}},[s._v("#")]),s._v(" 7. 参考文献")]),s._v(" "),a("ul",[a("li",[a("a",{attrs:{href:"https://mp.weixin.qq.com/s/SlbgZ0XbgYIN-DtmDyP7Lg",target:"_blank",rel:"noopener noreferrer"}},[s._v("Schnorr协议：零知识身份证明和数字签名"),a("OutboundLink")],1)])])])}),[],!1,null,null,null);a.default=r.exports}}]);