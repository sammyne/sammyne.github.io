(window.webpackJsonp=window.webpackJsonp||[]).push([[14],{665:function(v,_,t){v.exports=t.p+"assets/img/schnorr.21738c7f.png"},666:function(v,_,t){v.exports=t.p+"assets/img/schnorr-nizk.61d3185b.png"},667:function(v,_,t){v.exports=t.p+"assets/img/schnorr-sig.9238e422.png"},668:function(v,_,t){v.exports=t.p+"assets/img/ro.d6bd7fb8.png"},669:function(v,_,t){v.exports=t.p+"assets/img/schnorrsig-sim1.f41b54dc.png"},670:function(v,_,t){v.exports=t.p+"assets/img/schnorrsig-sim2.ef95b8ff.png"},671:function(v,_,t){v.exports=t.p+"assets/img/schnorrsig-sim3.d3993152.png"},672:function(v,_,t){v.exports=t.p+"assets/img/schnorrsig-sim4.be5fc96f.png"},673:function(v,_,t){v.exports=t.p+"assets/img/schnorrsig-sim5.01e97bcc.png"},674:function(v,_,t){v.exports=t.p+"assets/img/fs-transform.b76ebadd.png"},675:function(v,_,t){v.exports=t.p+"assets/img/arthur.c4f3fd3d.png"},676:function(v,_,t){v.exports=t.p+"assets/img/am-ip.9b1d5b11.png"},677:function(v,_,t){v.exports=t.p+"assets/img/shamir.f1f30c4b.png"},764:function(v,_,t){"use strict";t.r(_);var r=t(2),o=Object(r.a)({},(function(){var v=this,_=v._self._c;return _("ContentSlotsDistributor",{attrs:{"slot-key":v.$parent.slotKey}},[_("blockquote",[_("p",[v._v("原文链接："),_("a",{attrs:{href:"https://github.com/sec-bit/learning-zkp/blob/master/zkp-intro/4/zkp-rom.md",target:"_blank",rel:"noopener noreferrer"}},[v._v("随机「挑战」"),_("OutboundLink")],1)])]),v._v(" "),_("blockquote",[_("p",[_("RouterLink",{attrs:{to:"/tag/ZKP/"}},[v._v("本系列文章")]),v._v(" 以非专业的视角介绍零知识相关知识。")],1)]),v._v(" "),_("blockquote",[_("p",[v._v('"Challenges are at times an indication of Lord\'s trust in you." 挑战，有时是上天信任你的一种表现。―- D. Todd Christofferson')])]),v._v(" "),_("h2",{attrs:{id:"交互与挑战"}},[_("a",{staticClass:"header-anchor",attrs:{href:"#交互与挑战"}},[v._v("#")]),v._v(" 交互与挑战")]),v._v(" "),_("p",[v._v("之前介绍的零知识证明系统都是"),_("strong",[v._v("交互式")]),v._v("的，需要验证者 Bob 提供一个或若干个"),_("strong",[v._v("随机数")]),v._v("来挑战。比如"),_("strong",[v._v("地图三染色问题")]),v._v("（参见 "),_("RouterLink",{attrs:{to:"/2021/02/14/zkp-02-simulation/"}},[v._v("理解模拟")]),v._v("）中，验证者 Bob 需要"),_("strong",[v._v("不断地")]),v._v("随机挑选一条边来挑战 Alice 的答案，直到 Bob 满意为止，而 Alice 的作弊概率会"),_("strong",[v._v("指数级")]),v._v("地衰减。而让 Bob 相信证明的"),_("strong",[v._v("基础")]),v._v("取决于 Bob 所挑选的随机数是不是足够随机。如果 Alice 能够提前预测到 Bob 的随机数，灾难就会发生，现实世界就会退化成"),_("strong",[v._v("理想世界")]),v._v("，而 Alice 就可以立即升级成"),_("strong",[v._v("模拟器")]),v._v("，利用超能力来愚弄 Bob。")],1),v._v(" "),_("p",[_("RouterLink",{attrs:{to:"/2021/02/14/zkp-03-pok/"}},[v._v("寻找知识")]),v._v(" 分析了 Schnorr 协议：协议中，虽然验证者 Bob 只需要挑选一个随机数 "),_("code",[v._v("c")]),v._v(" 来挑战 Alice ，让她计算一个值 "),_("code",[v._v("z")]),v._v("，但 Bob 绝对不能让 Alice 有能力来预测到 "),_("code",[v._v("c")]),v._v(" 的任何知识，否则 Alice 也会变身成模拟器。")],1),v._v(" "),_("p",[v._v("随机数的重要性不言而喻：")]),v._v(" "),_("div",{staticClass:"custom-block tip"},[_("p",{staticClass:"title"}),_("p",[v._v("通过随机数挑战是交互式零知识证明的"),_("strong",[v._v("信任根基")]),v._v("。")])]),_("p",[v._v("但"),_("strong",[v._v("交互过程")]),v._v("会限制应用场景。如果能将交互式零知识证明变成"),_("strong",[v._v("非交互")]),v._v("？这会非常非常激动人心。所谓的非交互可以看成只有"),_("strong",[v._v("一轮")]),v._v("的证明过程，即 Alice 直接发一个证明给 Bob 进行验证。")]),v._v(" "),_("p",[v._v("非交互式零知识证明，英文是 "),_("code",[v._v("Non-Interactive Zero Knowledge")]),v._v("，简称 "),_("strong",[v._v("NIZK")]),v._v("。它意味着：整个证明被编码为一个"),_("strong",[v._v("字符串")]),v._v("，可以写到一张纸上，通过邮件、聊天工具等各种方式随意发送给任何验证者，甚至可以放在 Github 上随时供大家下载验证。")]),v._v(" "),_("p",[v._v("在区块链世界，"),_("strong",[v._v("NIZK")]),v._v("可以作为共识协议的一部分。因为一个交易"),_("strong",[v._v("需要多个矿工进行校验")]),v._v("。设想下，如果交易的发送者和每个矿工都要交互一下，让矿工进行挑战，那么共识过程将奇慢无比。而非交互式零知识证明则"),_("strong",[v._v("可以直接广播给所有矿工节点")]),v._v("，让他们自行验证。")]),v._v(" "),_("p",[v._v("可能有朋友会问：只让一个矿工挑战不就够了吗？把矿工和交易发送者的交互脚本编码成证明，然后广播给其他矿工，然后其他矿工就直接相信这个挑战过程是可信的，不也可以吗？但是，很显然这里需要相信第一个交互矿工作为可信第三方。第三方似乎不是一个好主意......")]),v._v(" "),_("p",[v._v("而非交互式零知识证明（往后简称"),_("strong",[v._v("NIZK")]),v._v("）似乎就很理想了，没有第三方赚差价。")]),v._v(" "),_("h2",{attrs:{id:"非交互带来的困惑"}},[_("a",{staticClass:"header-anchor",attrs:{href:"#非交互带来的困惑"}},[v._v("#")]),v._v(" 非交互带来的困惑")]),v._v(" "),_("p",[v._v("非交互式零知识证明 NIZK 如果存在，那么它要比交互式证明强大得多。")]),v._v(" "),_("ul",[_("li",[v._v("交互式证明只能取信于一个验证者；而 NIZK 可以取信于多个验证者，以至所有人。")]),v._v(" "),_("li",[v._v("交互式证明只能在交互的那个时刻有效；而 NIZK 将始终有效。")])]),v._v(" "),_("blockquote",[_("p",[v._v("NIZK 不仅可以跨越空间，还能跨越时间")])]),v._v(" "),_("p",[v._v("听上去很美，不是吗？然而 😦")]),v._v(" "),_("p",[v._v("重复下上节的一个结论：")]),v._v(" "),_("div",{staticClass:"custom-block tip"},[_("p",{staticClass:"title"}),_("p",[v._v("通过随机数挑战是交互式零知识证明的"),_("strong",[v._v("信任根基")]),v._v("。")])]),_("p",[v._v("可是如果 NIZK 失去了挑战过程，有什么后果？")]),v._v(" "),_("p",[v._v("回顾"),_("strong",[v._v("零知识")]),v._v("性质的证明（参考 "),_("RouterLink",{attrs:{to:"/2021/02/14/zkp-02-simulation/"}},[v._v("理解模拟")]),v._v("）：证明过程需要构造一个模拟器（算法）和验证者（Bob）在理想世界进行交互，而验证者 Bob 没有能力区分出来对方是否是真的 Alice 还是一个模拟器。")],1),v._v(" "),_("p",[v._v("如果现在考虑下 NIZK 的 "),_("strong",[v._v("非交互式")]),v._v("：假如"),_("strong",[v._v("我")]),v._v("向"),_("strong",[v._v("你")]),v._v("出示一张纸，上面写着一个"),_("strong",[v._v("真")]),v._v("证明 "),_("code",[v._v("X")]),v._v("，又假如"),_("strong",[v._v("你")]),v._v("看过这张纸之后确实相信我了；又因为协议是"),_("strong",[v._v("零知识")]),v._v("，那么如果把"),_("strong",[v._v("我")]),v._v("换成一个模拟器，模拟器也能"),_("strong",[v._v("伪造")]),v._v("一个假证明 "),_("code",[v._v("Y")]),v._v("，能够也让"),_("strong",[v._v("你")]),v._v("相信。")]),v._v(" "),_("p",[v._v("好了，问题来了：")]),v._v(" "),_("ul",[_("li",[v._v("你如何区分 "),_("code",[v._v("X")]),v._v(" 和 "),_("code",[v._v("Y")]),v._v(" ，孰真孰假？当然你无法区分，因为协议是零知识的，你必须不能区分")]),v._v(" "),_("li",[v._v("我同样可以把 "),_("code",[v._v("Y")]),v._v(" 出示给你看，那岂不是"),_("strong",[v._v("我")]),v._v("就可以欺骗你了吗？")])]),v._v(" "),_("p",[v._v("是不是不和谐了？请大家在此处思考两分钟。")]),v._v(" "),_("p",[v._v("(两分钟后 ......)")]),v._v(" "),_("p",[v._v("因为 NIZK 没有了交互，也就没了挑战过程，所有的证明过程都由 Alice 计算书写。理论上 Alice 确实是想写什么就写什么，没人拦得住。比如 Alice 就写"),_("strong",[v._v("理想世界")]),v._v("的假证明 "),_("code",[v._v("Y")]),v._v("。")]),v._v(" "),_("p",[v._v("想必深刻理解模拟器的朋友，在这里会发现一个关键点：模拟器必须"),_("strong",[v._v("只能")]),v._v("在"),_("strong",[v._v("理想世界")]),v._v("构造"),_("code",[v._v("Y")]),v._v("，也就是说，"),_("code",[v._v("Y")]),v._v(" 这么邪恶的东西只能存在于"),_("strong",[v._v("理想世界")]),v._v("，不能到"),_("strong",[v._v("现实世界")]),v._v("祸害人间。")]),v._v(" "),_("p",[v._v("继续思考 ......")]),v._v(" "),_("p",[v._v("还有一个更深层次的问题，请大家回忆下"),_("strong",[v._v("地图三染色问题")]),v._v("。之所以模拟器不能在"),_("strong",[v._v("现实世界")]),v._v("为非作歹，核心原因是他在理想世界有"),_("strong",[v._v("时间倒流")]),v._v("的超能力，而在"),_("strong",[v._v("现实世界")]),v._v("不存在这种黑魔法。现实世界的"),_("strong",[v._v("不存在性")]),v._v("是关键。")]),v._v(" "),_("p",[v._v("而且 NIZK "),_("strong",[v._v("没有交互")]),v._v(" 导致了一个严重的后果--模拟器没有办法使用"),_("strong",[v._v("时间倒流")]),v._v("这个超能力，当然似乎也就不能区分证明者在两个世界的行为。")]),v._v(" "),_("p",[v._v("换句话说，如果我们面对任何一个 NIZK 系统，似乎"),_("strong",[v._v("模拟器")]),v._v("就很难高高在上了，它好像只能飘落人间，成为一个普普通通的凡人。如果按此推论，假设模拟器不再具备超能力，那就意味着 Alice 和模拟器没有区别，Alice 也可以成为一个模拟器，再继续推论，Alice 就可以在"),_("strong",[v._v("现实世界")]),v._v("任意欺骗 Bob，那么这个失去了可靠性的证明系统就不再有价值。结论：任何的 NIZK 都不可靠。")]),v._v(" "),_("p",[v._v("这一定是哪里出了问题 ......")]),v._v(" "),_("p",[v._v("上面分析过程提到了交互挑战的缺失。确实如果 Bob 不参与 Alice 产生证明的过程，证明所包含的每一个比特都由 Alice 提供，似乎"),_("strong",[v._v("证明")]),v._v("本身不存在任何让 Bob 信任的"),_("strong",[v._v("根基")]),v._v("。这个从"),_("strong",[v._v("直觉")]),v._v("上似乎说不通。")]),v._v(" "),_("p",[v._v("那是不是说，没有 Bob 的参与就"),_("strong",[v._v("彻底")]),v._v("没办法建立"),_("strong",[v._v("信任根基")]),v._v("了呢？信任的根基还可以从哪里来呢？")]),v._v(" "),_("p",[v._v("答案是"),_("strong",[v._v("第三方")]),v._v("！")]),v._v(" "),_("p",[v._v("且慢，协议交互不是只有两方吗？Alice 和 Bob，哪来第三方？")]),v._v(" "),_("p",[v._v("需要用特殊的方式引入第三方，而且方法不止一种，我们先研究第一种。")]),v._v(" "),_("p",[v._v("😦 不是说的好好的，咱们不引入第三方吗？")]),v._v(" "),_("h2",{attrs:{id:"回顾-schnorr-协议"}},[_("a",{staticClass:"header-anchor",attrs:{href:"#回顾-schnorr-协议"}},[v._v("#")]),v._v(" 回顾 Schnorr 协议")]),v._v(" "),_("p",[v._v("再看一下老朋友--Schnorr 协议，它是一个三步协议：")]),v._v(" "),_("ol",[_("li",[v._v("Alice 发送一个承诺")]),v._v(" "),_("li",[v._v("Bob 发送随机数挑战")]),v._v(" "),_("li",[v._v("Alice 回应挑战")])]),v._v(" "),_("p",[_("img",{attrs:{src:t(665),alt:""}})]),v._v(" "),_("p",[v._v("接下来把这个三步的 Schnorr 协议变成一步。")]),v._v(" "),_("p",[v._v("看一下 Schnorr 协议的第二步，Bob 需要给出一个随机的挑战数 "),_("code",[v._v("c")]),v._v("。这里可以让 Alice 用下面这个式子来计算这个挑战数，从而达到去除协议第二步的目的。")]),v._v(" "),_("div",{staticClass:"language- line-numbers-mode"},[_("pre",{pre:!0,attrs:{class:"language-text"}},[_("code",[v._v("c = Hash(PK, R)\n")])]),v._v(" "),_("div",{staticClass:"line-numbers-wrapper"},[_("span",{staticClass:"line-number"},[v._v("1")]),_("br")])]),_("p",[v._v("其中 "),_("code",[v._v("R")]),v._v(" 是 Alice 发给 Bob 的椭圆曲线点，"),_("code",[v._v("PK")]),v._v(" 是公钥。大家可以好好看看这个利用哈希算法 "),_("code",[v._v("Hash")]),v._v(" 计算 "),_("code",[v._v("c")]),v._v(" 的式子。这个式子达到两个目的：")]),v._v(" "),_("ol",[_("li",[v._v("Alice 在产生承诺 "),_("code",[v._v("R")]),v._v(" 之前，没有办法预测 "),_("code",[v._v("c")]),v._v("，即使 "),_("code",[v._v("c")]),v._v(" 最终变相是 Alice 挑选的")]),v._v(" "),_("li",[_("code",[v._v("c")]),v._v(" 通过哈希函数计算，会均匀分布在一个整数域内，而且可以作为一个随机数（"),_("em",[v._v("注：请大家暂且这么理解，我们在后文再深入讨论")]),v._v("）")])]),v._v(" "),_("div",{staticClass:"custom-block warning"},[_("p",{staticClass:"title"}),_("p",[v._v("Alice 绝不能在产生 "),_("code",[v._v("R")]),v._v(" 之前预测到 "),_("code",[v._v("c")]),v._v("，不然 Alice 就等于变相具有了"),_("strong",[v._v("时间倒流")]),v._v("的超能力，能任意愚弄 Bob。")])]),_("p",[v._v("而一个密码学安全哈希函数是"),_("strong",[v._v("单向")]),v._v("的，比如 SHA256、SHA3、blake2 等等。这样一来，虽然 "),_("code",[v._v("c")]),v._v(" 是 Alice 计算的，但是 Alice 并没有能力通过挑选 "),_("code",[v._v("c")]),v._v(" 来作弊。因为只要 Alice 一产生 "),_("code",[v._v("R")]),v._v("， "),_("code",[v._v("c")]),v._v(" 就相当于固定下来了。假设 Alice 这个凡人在"),_("strong",[v._v("现实世界")]),v._v("没有反向计算哈希原像的能力。")]),v._v(" "),_("p",[_("img",{attrs:{src:t(666),alt:"schnorr-nizk"}})]),v._v(" "),_("p",[v._v("上图利用哈希函数把三步 Schnorr 协议合并为一步。Alice 可以直接发送："),_("code",[v._v("(R, c, z)")]),v._v("。又因为 Bob 拥有 "),_("code",[v._v("PK")]),v._v("，于是 Bob 可以自行计算出 "),_("code",[v._v("c")]),v._v("，于是 Alice 可以只发送 "),_("code",[v._v("(R, z)")]),v._v(" 即可。")]),v._v(" "),_("p",[v._v("我们把上面这个方案稍微变下形，就得到了"),_("strong",[v._v("数字签名")]),v._v("方案。所谓的数字签名，就是"),_("strong",[v._v("我")]),v._v("向"),_("strong",[v._v("你")]),v._v("出示一个字符串，比如"),_("strong",[v._v("白日依山尽，黄河入海流")]),v._v("，然后为了证明这句诗是我出示的，我需要签署某样东西。这个东西能证明我的身份和这句诗进行了关联。")]),v._v(" "),_("h2",{attrs:{id:"从-nizk-角度看数字签名"}},[_("a",{staticClass:"header-anchor",attrs:{href:"#从-nizk-角度看数字签名"}},[v._v("#")]),v._v(" 从 NIZK 角度看数字签名")]),v._v(" "),_("p",[v._v("不严格地说，数字签名方案相当于在证明")]),v._v(" "),_("ul",[_("li",[v._v("我拥有私钥")]),v._v(" "),_("li",[v._v("私钥和消息进行了关联计算")])]),v._v(" "),_("p",[v._v("我首先要证明个人身份。这个正是 Schnorr 协议的功能--向对方证明"),_("strong",[v._v("我拥有私钥")]),v._v("这个陈述。证明过程是零知识的：不泄露关于"),_("strong",[v._v("私钥")]),v._v("的任何知识。")]),v._v(" "),_("p",[v._v("那么如何和这句唐诗关联呢？我们修改下计算 "),_("code",[v._v("c")]),v._v(" 的过程：")]),v._v(" "),_("div",{staticClass:"language- line-numbers-mode"},[_("pre",{pre:!0,attrs:{class:"language-text"}},[_("code",[v._v('m = "白日依山尽，黄河入海流"\nc = Hash(m, R)\n')])]),v._v(" "),_("div",{staticClass:"line-numbers-wrapper"},[_("span",{staticClass:"line-number"},[v._v("1")]),_("br"),_("span",{staticClass:"line-number"},[v._v("2")]),_("br")])]),_("p",[v._v("这里为了保证攻击者不能随意伪造签名，正是利用了离散对数难题（DLP）与哈希函数满足抗第二原象（Secondary Preimage Resistance ）这个假设。")]),v._v(" "),_("div",{staticClass:"custom-block warning"},[_("p",{staticClass:"title"}),_("p",[v._v("这里严格点讲，为了保证数字签名的不可伪造性，需要证明 Schnorr 协议满足"),_("strong",[v._v("Simulation Soundness")]),v._v("这个更强的性质。这点请参考文献 [2]。")])]),_("p",[_("img",{attrs:{src:t(667),alt:""}})]),v._v(" "),_("p",[v._v("上图就是大家所熟知的数字签名方案 -- Schnorr 签名方案 [1]。在这里还有一个优化，Alice 发给 Bob 的内容不是 "),_("code",[v._v("(R, z)")]),v._v(" 而是 "),_("code",[v._v("(c, z)")]),v._v("，这是因为 "),_("code",[v._v("R")]),v._v(" 可以通过 "),_("code",[v._v("c")]),v._v(", "),_("code",[v._v("z")]),v._v(" 计算出来。")]),v._v(" "),_("div",{staticClass:"custom-block tip"},[_("p",{staticClass:"title"}),_("p",[v._v("为什么说这是一个"),_("strong",[v._v("优化")]),v._v("呢？目前针对椭圆曲线的攻击方法有 Shanks 算法、Lambda 算法 还有 Pollard's rho 算法， 请大家记住他们的算法复杂度大约都是 $O(\\sqrt{n})$[3]，其中 "),_("code",[v._v("n")]),v._v(" 是有限域大小的位数。假设我们采用了非常接近 "),_("code",[v._v("2^256")]),v._v(" 的有限域，也就是说 "),_("code",[v._v("z")]),v._v(" 是 256 比特，那么椭圆曲线群的大小也差不多要接近 256比特，这样一来，把 "),_("code",[v._v("2^256")]),v._v(" 开平方根后就是 "),_("code",[v._v("2^128")]),v._v("，所以说 256bit 椭圆曲线群的安全性只有 128 比特。那么，挑战数  "),_("code",[v._v("c")]),v._v(" 也只需要 128 比特就足够了。这样 Alice 发送 "),_("code",[v._v("c")]),v._v(" 要比发送 "),_("code",[v._v("R")]),v._v(" 要更节省空间，而后者至少需要 256 比特。"),_("code",[v._v("c")]),v._v(" 和 "),_("code",[v._v("z")]),v._v("两个数值加起来总共 384 比特。相比现在流行的 ECDSA 签名方案来说，可以节省"),_("code",[v._v("1/4")]),v._v(" 的宝贵空间。现在比特币开发团队已经准备将 ECDSA 签名方案改为一种类 Schnorr 协议的签名方案--muSig [4]，可以更灵活地支持多签和聚合。*")])]),_("p",[v._v("采用哈希函数的方法来把一个交互式的证明系统变成非交互式的方法被称为 "),_("strong",[v._v("Fiat-Shamir 变换")]),v._v(" [5]，它由密码学老前辈 Amos Fiat 和 Adi Shamir 两人在 1986 年提出。")]),v._v(" "),_("h2",{attrs:{id:"重建信任-随机预言精灵"}},[_("a",{staticClass:"header-anchor",attrs:{href:"#重建信任-随机预言精灵"}},[v._v("#")]),v._v(" 重建信任 -- 随机预言精灵")]),v._v(" "),_("p",[v._v("前文提到：失去了挑战，似乎失去了证明的"),_("strong",[v._v("信任根基")]),v._v("。而在 Schnorr 签名方案中，哈希函数担负起了"),_("strong",[v._v("挑战者")]),v._v("的角色，这个角色有一个非常学术的名字："),_("strong",[v._v("随机预言机")]),v._v("（Random Oracle）[6]。")]),v._v(" "),_("p",[v._v("可是这里为何用哈希？实际上当 Alice 要产生公共随机数时，需要一个叫做"),_("strong",[v._v("随机预言机")]),v._v("的玩意儿，这是什么？")]),v._v(" "),_("p",[v._v("开脑洞时间到！")]),v._v(" "),_("p",[v._v("设想这样的一个"),_("strong",[v._v("现实世界")]),v._v("：天上有一位"),_("strong",[v._v("精灵")]),v._v("，他手持一个双栏表格，左边一栏为字符串，右边一栏为数字。任何人，包括你我，包括 Alice 和 Bob，都可以发字符串给"),_("strong",[v._v("精灵")]),v._v("。")]),v._v(" "),_("p",[_("img",{attrs:{src:t(668),alt:""}})]),v._v(" "),_("p",[v._v("精灵在拿到字符串之后，会查表的左边栏，看看表格里有没有这个字符串，下面分两种情况：")]),v._v(" "),_("ul",[_("li",[v._v("情况一：如果左边栏找不到字符串，那么精灵会产生一个"),_("strong",[v._v("真随机数")]),v._v("，然后把字符串与随机数写入到表格中，然后把随机数返回地面上的凡人。")]),v._v(" "),_("li",[v._v("情况二：如果左边栏有这个字符串记录，那么精灵会将右边栏里面的数字直接返回给地面。")])]),v._v(" "),_("p",[v._v("大家会发现这个精灵的行为其实很像一个随机数发生器，但是又很不一样。不一样的地方在于当我们发送相同的字符串时，他会返回相同的数。这个精灵就是传说中的"),_("strong",[v._v("随机预言机")]),v._v("。")]),v._v(" "),_("p",[v._v("而在合并 Schnorr 协议过程中，其实我们需要的是一个这样的随机预言精灵，而不是一个哈希函数。两者有什么不同的地方？区别就是：")]),v._v(" "),_("ul",[_("li",[v._v("随机预言机每次对于新字符串返回的是一个具有一致性分布的"),_("strong",[v._v("真")]),v._v("随机数")]),v._v(" "),_("li",[v._v("哈希函数计算的结果并不是一个真正具有一致性分布的随机数")])]),v._v(" "),_("p",[v._v("那么为什么前面用的是哈希函数呢？这是因为在现实世界中，"),_("strong",[v._v("真正的随机预言机不存在！"),_("strong",[v._v("为什么呢？事实上，哈希函数不可能产生真的随机数，因为哈希函数是一个")]),v._v("确定性")]),v._v("算法，除了参数以外，再没有其它随机量被引入。")]),v._v(" "),_("p",[v._v("而一个具有密码学安全强度的哈希函数"),_("strong",[v._v("似乎")]),v._v("可以充当一个"),_("strong",[v._v("伪")]),v._v("随机预言机。那么合并后的安全协议需要额外增加一个很强的安全假设，这就是：")]),v._v(" "),_("div",{staticClass:"custom-block tip"},[_("p",{staticClass:"title"}),_("p",[v._v("一个密码学安全的哈希函数可以近似地模拟传说中的"),_("strong",[v._v("随机预言机")])])]),_("p",[v._v("因为这个假设无法被证明，所以我们只能信任这个假设，或者说当做一个公理来用。插一句，哈希函数的广义抗碰撞性质决定了它的输出可以模拟随机数，同时在很多情况下（并非所有），对哈希函数实施攻击难度很高，于是许多的密码学家都在大胆使用。")]),v._v(" "),_("p",[v._v("不使用这个假设的安全模型叫做"),_("strong",[v._v("标准模型")]),v._v("，而使用这个假设的安全模型当然不能叫"),_("strong",[v._v("非标准模型")]),v._v("，它有个好听的专有名词，叫做"),_("strong",[v._v("随机预言模型")]),v._v("。")]),v._v(" "),_("p",[v._v("世界上有两种不同类型的人，喜欢甜豆花的，不喜欢甜豆花的。同样，世界上的密码学家分为两种，喜欢随机预言模型的，和不喜欢随机预言模型的 [6]。")]),v._v(" "),_("h2",{attrs:{id:"构造根基-被绑架的精灵"}},[_("a",{staticClass:"header-anchor",attrs:{href:"#构造根基-被绑架的精灵"}},[v._v("#")]),v._v(" 构造根基 -- 被绑架的精灵")]),v._v(" "),_("p",[v._v("Schnorr 协议经过 Fiat-Shamir 变换之后，就具有 NIZK 性质。这不同于我们证明过的 SHVZK：SHVZK 要求验证者诚实，而 NIZK 则不再对验证者有任何不现实的要求。因为验证者不参与交互，所谓要求诚实的验证者这个问题就不复存在。")]),v._v(" "),_("div",{staticClass:"custom-block warning"},[_("p",{staticClass:"title"}),_("p",[v._v("如果验证者 Bob 不诚实会怎样？那么 Bob 有可能抽取出 Alice 的知识。但是对于三步 Schnorr 协议而言，它是否满足"),_("strong",[v._v("零知识")]),v._v("，目前还处于未知状态。 "),_("RouterLink",{attrs:{to:"/2021/02/14/zkp-03-pok/"}},[v._v("寻找知识")]),v._v(" 只证明它满足一个比较弱的性质：SHVZK。")],1)]),_("p",[v._v("但是 Schnorr 协议摇身一变成非交互零知识证明系统之后，就真正的"),_("strong",[v._v("零知识")]),v._v("了。")]),v._v(" "),_("p",[v._v("问题又来了：论断听起来似乎有道理，请问能证明吗？")]),v._v(" "),_("p",[v._v("时间到了，“翠花，上模拟器”")]),v._v(" "),_("p",[v._v("怎么用模拟器大法来构造一个"),_("strong",[v._v("理想世界")]),v._v("呢？大家可以想一下，我们之前使用过"),_("strong",[v._v("时间倒流")]),v._v("，还有使用修改"),_("strong",[v._v("随机数传送带")]),v._v("的超能力来让"),_("strong",[v._v("模拟器")]),v._v("来作弊。可是没有交互了，这就意味着："),_("strong",[v._v("时间倒流")]),v._v("超能力不能用；Bob 的随机数传送带也不存在了，"),_("strong",[v._v("篡改传送带")]),v._v("这个超能力也不能用！")]),v._v(" "),_("div",{staticClass:"custom-block warning"},[_("p",{staticClass:"title"}),_("p",[v._v("但模拟器总要具备某种"),_("strong",[v._v("超能力")]),v._v("，从而能够构建信任的"),_("strong",[v._v("根基")])])]),_("p",[v._v("（如果模拟器在没有超能力的情况下具备作弊能力，那相当于证明了协议的不可靠性）。")]),v._v(" "),_("p",[v._v("可能大家现在已经猜出来了，模拟器要在"),_("strong",[v._v("随机预言机")]),v._v("上动手脚。")]),v._v(" "),_("p",[v._v("先考虑下构造一个"),_("strong",[v._v("理想世界")]),v._v("来证明"),_("strong",[v._v("零知识")]),v._v("。在理想世界中，模拟器"),_("strong",[v._v("绑架")]),v._v("了负责提供预言的"),_("strong",[v._v("精灵")]),v._v("。当 Bob 向精灵索要一个随机数的时候，精灵并没有给一个真随机数，而是给 Zlice（模拟器假扮的 Alice）提前准备好的一个数（也符合一致性分布，保证不可区分性），"),_("strong",[v._v("精灵")]),v._v("无可奈何地返回 Bob 一个看起来随机，但实际上有后门的数字。"),_("strong",[v._v("所谓后门，就是这个数字是 Zlice 自己提前选择好的")]),v._v("。")]),v._v(" "),_("p",[_("img",{attrs:{src:t(669),alt:""}})]),v._v(" "),_("ol",[_("li",[v._v("Zlice 随机选择 "),_("code",[v._v("z")]),v._v("，随机选择 "),_("code",[v._v("c")]),v._v("，计算 "),_("code",[v._v("R'=z*G - c*PK")]),v._v("。")])]),v._v(" "),_("p",[_("img",{attrs:{src:t(670),alt:""}})]),v._v(" "),_("ol",{attrs:{start:"2"}},[_("li",[v._v("Zlice 将 "),_("code",[v._v("c")]),v._v(" 与 "),_("code",[v._v("(m, R')")]),v._v(" 写入精灵的表格。")])]),v._v(" "),_("p",[_("img",{attrs:{src:t(671),alt:""}})]),v._v(" "),_("ol",{attrs:{start:"3"}},[_("li",[v._v("Zlice 将签名 "),_("code",[v._v("(c, z)")]),v._v(" 发送给 Bob。")])]),v._v(" "),_("p",[_("img",{attrs:{src:t(672),alt:""}})]),v._v(" "),_("ol",{attrs:{start:"4"}},[_("li",[v._v("Bob 计算 "),_("code",[v._v("R = z*G - c*PK")]),v._v("，并向精灵发送 "),_("code",[v._v("(m, R)")]),v._v("，精灵返回 "),_("code",[v._v("c'")]),v._v("。请注意，这里 Bob 计算出来的 "),_("code",[v._v("R")]),v._v(" 和 Zlice 计算出来的 "),_("code",[v._v("R'")]),v._v(" 是相等。")])]),v._v(" "),_("p",[_("img",{attrs:{src:t(673),alt:""}})]),v._v(" "),_("ol",{attrs:{start:"5"}},[_("li",[v._v("Bob 验证 "),_("code",[v._v("c ?= c'")]),v._v("，看看精灵传回来的随机数和对方发过来的随机数是否相等。如果相等，则验证签名通过；否则验证失败。")])]),v._v(" "),_("p",[v._v("通过绑架"),_("strong",[v._v("精灵")]),v._v("，Zlice 同样可以提前预知随机数，这和时间倒流能达到同样的效果。")]),v._v(" "),_("p",[v._v("我们已经证明了模拟器 Zlice 的"),_("strong",[v._v("存在性")]),v._v("，于是证明了 NIZK。")]),v._v(" "),_("p",[v._v("接下来我们证明这个这个协议的"),_("strong",[v._v("可靠性")]),v._v("。设想在另一个"),_("strong",[v._v("理想世界")]),v._v("中，一个叫做"),_("strong",[v._v("抽取器")]),v._v("的玩意儿，也同样绑架了精灵。当无辜 Alice 的向"),_("strong",[v._v("精灵")]),v._v("索要一个随机数时，"),_("strong",[v._v("精灵")]),v._v("返回了一个 "),_("code",[v._v("c1")]),v._v("，"),_("strong",[v._v("抽取器")]),v._v("从精灵的表格偷窥到了 "),_("code",[v._v("c1")]),v._v("。当 Alice 计算出来 "),_("code",[v._v("z1")]),v._v(" 之后，然后这时候"),_("strong",[v._v("抽取器")]),v._v("仍然可以发动"),_("strong",[v._v("时间倒流")]),v._v("超能力，让 Alice 倒退到第二步，再次向"),_("strong",[v._v("精灵")]),v._v("要一个随机数，Alice 发送的字符串显然和第一次发送的字符串是相同的，"),_("code",[v._v("(R, m)")]),v._v("。按道理，因为 "),_("code",[v._v("(R, m)")]),v._v(" 已经写在精灵表格的"),_("strong",[v._v("左栏")]),v._v("，所以一个诚实的"),_("strong",[v._v("精灵")]),v._v("应该返回 "),_("code",[v._v("c1")]),v._v("。但是，"),_("strong",[v._v("抽取器")]),v._v("绑架了精灵，他把表格中对应 "),_("code",[v._v("(R, m)")]),v._v(" 这一行的"),_("strong",[v._v("右栏")]),v._v("改成了一个不同的数 "),_("code",[v._v("c2")]),v._v("。当 Alice 计算出另一个 "),_("code",[v._v("z2")]),v._v(" 之后，抽取器就完成了任务，通过下面的方程计算出 Alice 的私钥 "),_("code",[v._v("sk")]),v._v("：")]),v._v(" "),_("div",{staticClass:"language- line-numbers-mode"},[_("pre",{pre:!0,attrs:{class:"language-text"}},[_("code",[v._v("sk = (z1 - z2)/(c1 - c2)\n")])]),v._v(" "),_("div",{staticClass:"line-numbers-wrapper"},[_("span",{staticClass:"line-number"},[v._v("1")]),_("br")])]),_("h2",{attrs:{id:"fiat-shamir-变换-从-public-coin-到-nizk"}},[_("a",{staticClass:"header-anchor",attrs:{href:"#fiat-shamir-变换-从-public-coin-到-nizk"}},[v._v("#")]),v._v(" Fiat-Shamir 变换 -- 从 Public-Coin 到 NIZK")]),v._v(" "),_("p",[v._v("不仅仅对于 Schnorr 协议，对于任意的 "),_("strong",[v._v("Public-Coin 协议")]),v._v("，都可以用 Fiat-Shamir 变换来把整个协议"),_("strong",[v._v("压缩")]),v._v("成一步交互，也就是一个非交互式的证明系统，这个变换技巧最早来自于 Amos Fiat 与 Adi Shamir 两人的论文《How to Prove Yourself: Practical Solutions to Identification and Signature Problems》，发表在 1986 年的 Crypto 会议上 [5]。也有一说，这个技巧来源于 Manuel Blum [6]。")]),v._v(" "),_("p",[v._v("重申一遍：在 Public-coin 协议中，验证者 Bob 只做一类事情，就是产生一个随机数，然后挑战 Alice 。通过 Fiat-Shamir 变换，可以把 Bob 每次的"),_("strong",[v._v("挑战行为")]),v._v("用一次"),_("strong",[v._v("随机预言")]),v._v("来代替。")]),v._v(" "),_("p",[v._v("而在具体实现中，随机预言需要用一个具有密码学安全强度的哈希函数（不能随便选，一定要采用密码学安全的哈希），而哈希函数的参数应该是之前的所有上下文输入。下面是一个示例图，大家可以迅速理解这个 Fiat-Shamir 变换的做法。")]),v._v(" "),_("p",[_("img",{attrs:{src:t(674),alt:""}})]),v._v(" "),_("p",[v._v("前面提到：非交互式证明系统需要引入一个第三方来构建信任的"),_("strong",[v._v("根基")]),v._v("，使得 Bob 可以完全相信由 Alice 所构造的证明。在这里，第三方就是那个"),_("strong",[v._v("精灵")]),v._v("，用学术黑话就是"),_("strong",[v._v("随机预言机")]),v._v("（Random Oracle）。这个精灵并不是一个真实存在的第三方，而是一个虚拟的第三方，它同时存在于"),_("strong",[v._v("现实世界")]),v._v("与"),_("strong",[v._v("理想世界")]),v._v("。在"),_("strong",[v._v("现实世界")]),v._v("中，精灵是一个负责任的安静美男子，而在"),_("strong",[v._v("理想世界")]),v._v("中，它会被"),_("strong",[v._v("模拟器")]),v._v("绑架。")]),v._v(" "),_("p",[v._v("Public-Coin 协议还有一个好听的名字， "),_("strong",[v._v("Arthur-Merlin 游戏")]),v._v(" ......")]),v._v(" "),_("p",[_("img",{attrs:{src:t(675),alt:"圆桌骑士"}})]),v._v(" "),_("p",[v._v("如上图，左边的白袍就是 Merlin（魔法师梅林），中间拿剑的帅哥就是 King Arthur（亚瑟王）。两个角色来源于中世纪欧洲传说--亚瑟王的圆桌骑士。")]),v._v(" "),_("p",[v._v("Arthur 是一个不耐烦的国王，他随身携带一个硬币，而 Merlin 是一个有着无限制计算能力的神奇魔法师。魔法师为了说服国王相信某个"),_("strong",[v._v("论断")]),v._v("为真，会和国王进行到对话。但是国王比较懒，每次只会抛一个硬币，然后"),_("strong",[v._v("挑战")]),v._v("魔法师，而魔法师不但需要及时应对，而且需要让国王在 k 轮之后能够相信自己的论断。由于 Merlin 有魔法，所以亚瑟王抛的硬币都能被 Merlin 看到 [7]。")]),v._v(" "),_("p",[v._v("这与 "),_("RouterLink",{attrs:{to:"/2021/02/14/zkp-01-intro/"}},[v._v("初识零知识与证明")]),v._v(" 提到的交互式证明系统（Interactive Proof System，简称 "),_("code",[v._v("IP")]),v._v("）有些神似，但又不同。"),_("code",[v._v("IP")]),v._v(" 由 Goldwasser，Micali 与 Rackoff（简称 GMR）在 1985 年正式提出，它的证明能力覆盖很大一类的计算复杂性问题。而不同的地方在于：在 "),_("code",[v._v("IP")]),v._v(" 的定义中，证明者 Prover 和 验证者 Verifier 都是可以抛硬币的图灵机，Verifier 可以偷偷抛硬币，并对 Prover 隐藏；而在 Arthur-Merlin 游戏中，国王只能抛硬币，不仅如此，而且抛硬币的结果总会被 Merlin 知道。")],1),v._v(" "),_("p",[v._v("但是，Fiat-Shamir 变换只能在"),_("strong",[v._v("随机预言机模型")]),v._v("下证明安全，而用哈希函数实现随机预言的过程是否安全是缺少安全性证明的。不仅如此，"),_("strong",[v._v("随机预言机模型")]),v._v("下安全的协议可能是不安全的，已经有人找到了一些反例 [8]。更不幸的是，S. Goldwasser 与 Y. Tauman 在 2003 年证明了 Fiat-Shamir 变换本身也是"),_("strong",[v._v("存在安全反例")]),v._v("的 [9]。但是这并不意味着 Fiat-Shamir 变换不能用，只是使用过程要非常小心，不能盲目套用。")]),v._v(" "),_("p",[v._v("尽管如此，人们无法抵挡 Fiat-Shamir 变换的诱惑，其使用极其广泛。值得一提的是，最热的通用非交互零知识证明 zkSNARK 的各种方案中，Fiat-Shamir 变换比比皆是。比如大家可能耳熟能详的 Bulletproofs（防弹证明），此外还有一些暂时还不那么有名的通用零知识证明方案，比如 Hyrax，Ligero，Supersonic，Libra 等（我们后续会抽丝剥茧，逐一解读）。")]),v._v(" "),_("h2",{attrs:{id:"小心-fiat-shamir-变换的安全隐患"}},[_("a",{staticClass:"header-anchor",attrs:{href:"#小心-fiat-shamir-变换的安全隐患"}},[v._v("#")]),v._v(" 小心：Fiat-Shamir 变换的安全隐患")]),v._v(" "),_("p",[v._v("在 Fiat-Shamir 变换中，要尤其注意喂给哈希函数的参数，在实际的代码实现中，就有这样的案例，漏掉了哈希函数的部分参数：")]),v._v(" "),_("p",[v._v("比如在 "),_("code",[v._v("A, Hash(A), B, Hash(B)")]),v._v(" 中，第二个哈希函数就漏掉了参数 "),_("code",[v._v("A")]),v._v("，正确的做法应该是"),_("code",[v._v("A, Hash(A), B, Hash(A,B)")]),v._v("。这一类的做法会引入严重的安全漏洞，比如在瑞士的电子投票系统 SwissPost-Scytl 就在 Fiat-Shamir 变换的实现代码中多次漏掉了本来应该存在的参数，导致了攻击者不仅可以随意作废选票，还可以任意伪造选票，达到舞弊的目的 [10]。因此在工程实现中，请务必注意。")]),v._v(" "),_("p",[v._v("细心读者也许会回看一下 Schnorr 签名，大家会发现 Schnorr 签名的哈希算法似乎也漏掉了一个参数 "),_("code",[v._v("PK")]),v._v("，并不是严格的 Fiat-Shamir 变换，这被称为 Weak Fiat-Shamir 变换 [11]，不过这个特例并没有安全问题[3]，请未成年人不要随意模仿。")]),v._v(" "),_("p",[v._v("最近一些学者开始在标准模型下研究如何严格证明 Fiat-Shamir 变换的安全性，目前要么引入额外的强安全假设，要么针对某个特定协议进行证明，但似乎进展并不大。")]),v._v(" "),_("h2",{attrs:{id:"交互的威力"}},[_("a",{staticClass:"header-anchor",attrs:{href:"#交互的威力"}},[v._v("#")]),v._v(" 交互的威力")]),v._v(" "),_("p",[v._v("话说在 1985 年，当 GMR 三人的论文历经多次被拒之后终于被 STOC'85 接受，另一篇类似的工作也同时被 STOC'85 接受，这就是来自于匈牙利罗兰大学的 László Babai与来自以色列理工的 Shlomo Moran 两人撰写的论文《Arthur-Merlin Games: A Randomized Proof System, and a Hierarchy of Complexity Classes》[7]，引入了 Public-coin 交互式协议（顾名思义，Verifier 只公开抛硬币）。")]),v._v(" "),_("p",[v._v("国王 Arthur 的方法很简单，通过反复地"),_("strong",[v._v("随机")]),v._v("挑战来检验 Merlin 的论断，这符合我们前面讲述过的直觉：采用随机挑战来构建信任的"),_("strong",[v._v("根基")]),v._v("。Babai 在论文中证明了一个有趣的结论："),_("code",[v._v("AM[k]=AM[2]")]),v._v("，其中 "),_("code",[v._v("k")]),v._v(" 表示交互的次数，交互多次产生的效果居然和交互两次等价。所谓交互两次是指：Arthur 发一个挑战数，然后 Merlin 回应。")]),v._v(" "),_("blockquote",[_("p",[v._v("注：还有一类的问题属于 "),_("code",[v._v("MA")]),v._v("，这一类问题的交互顺序与 "),_("code",[v._v("AM")]),v._v(" 不同。"),_("code",[v._v("MA")]),v._v(" 中是 Merlin 先给出证明，然后 Arthur 抛硬币检验。已证明：MA 能处理的问题是 AM 的子集。")])]),v._v(" "),_("p",[v._v("不仅如此，Babai 还大胆猜测： "),_("code",[v._v("AM[poly]")]),v._v(" 与 "),_("code",[v._v("IP")]),v._v(" 是等价的。这是一个神奇的论断：国王很懒，他只需要通过抛多项式次硬币，就能成功挑战魔法师，而这种方式的表达能力居然完全等价于 GMR 描述的交互式证明系统 "),_("code",[v._v("IP")]),v._v("。果不其然，在 STOC'86 会议上，来自 S. Goldwasser 与 M. Sipser 的论文证明了这一点--"),_("code",[v._v("AM[poly] == IP")]),v._v("[12]。")]),v._v(" "),_("p",[_("img",{attrs:{src:t(676),alt:""}})]),v._v(" "),_("p",[v._v("这意味着：反复公开的"),_("strong",[v._v("随机挑战")]),v._v("威力无穷，它等价于任意的交互式证明系统。但是 "),_("code",[v._v("AM[poly]")]),v._v(" 和别的计算复杂性类的关系如何，是接下来的研究热点。")]),v._v(" "),_("p",[v._v("三年后，1989 年 11 月底，距今恰好三十年，年轻的密码学家 Noam Nisan 发出了一封邮件，把自己的临时学术结论发给了几个密码学家，然后他就跑去南美洲度假了。可是他不曾想到，这一个邮件会引爆历史上一场激烈的学术竞赛，M. Blum, S. Kannan、D. Lipton、D. Beaver、J. Feigenbaum、H. Karloff 和 C. Lund 等等一大群精英开始加入战斗。他们没日没夜地互相讨论，并且竞相发布自己的研究成果，终于在 12 月 26 号，刚好一个月，Adi Shamir 证明了下面的结论：")]),v._v(" "),_("div",{staticClass:"language- line-numbers-mode"},[_("pre",{pre:!0,attrs:{class:"language-text"}},[_("code",[v._v("AM[poly] == IP == PSPACE\n")])]),v._v(" "),_("div",{staticClass:"line-numbers-wrapper"},[_("span",{staticClass:"line-number"},[v._v("1")]),_("br")])]),_("p",[_("img",{attrs:{src:t(677),alt:"image-shamir"}})]),v._v(" "),_("p",[v._v("它解释了"),_("strong",[v._v("有效证明")]),v._v("这个概念的计算理论特征，并且解释了"),_("strong",[v._v("交互式证明系统")]),v._v("这个概念所能涵盖的计算能力。")]),v._v(" "),_("blockquote",[_("p",[v._v("注：NP 类 是 PSPACE 类的子集，前者大家比较熟悉，后者关联游戏或者下棋中的制胜策略 [13]。")])]),v._v(" "),_("p",[v._v("L. Babai 于是写了一篇文章，名为"),_("strong",[v._v("Email and the unexpected power of interaction")]),v._v("（电子邮件与交互的始料未及的威力）[14]，详细阐述了这一整个月在"),_("strong",[v._v("邮件交互")]),v._v("中精彩纷呈的学术竞赛，以及关于"),_("strong",[v._v("交互证明")]),v._v("的来龙去脉。")]),v._v(" "),_("h2",{attrs:{id:"公共参考串-另一种信任根基"}},[_("a",{staticClass:"header-anchor",attrs:{href:"#公共参考串-另一种信任根基"}},[v._v("#")]),v._v(" 公共参考串 -- 另一种"),_("strong",[v._v("信任根基")])]),v._v(" "),_("p",[v._v("除了采用"),_("strong",[v._v("随机预言机")]),v._v("之外，非交互零知识证明系统采用"),_("strong",[v._v("公共参考串")]),v._v("（Common Reference String），简称"),_("strong",[v._v("CRS")]),v._v("，完成随机挑战。它是在证明者 Alice 在构造 NIZK 证明之前由一个受信任的第三方产生的随机字符串，CRS 必须由一个受信任的第三方来完成，同时共享给 Alice 和验证者 Bob。")]),v._v(" "),_("p",[v._v("是的，这里又出现了"),_("strong",[v._v("第三方")]),v._v("！虽然第三方不直接参与证明，但是他要保证随机字符串产生过程的可信。而产生 CRS 的过程也被称为"),_("strong",[v._v("Trusted Setup")]),v._v("，这是大家又爱又恨的玩意儿。显然，在现实场景中引入第三方会让人头疼。CRS 到底用来作什么？Trusted Setup 的信任何去何从？这部分内容将留给本系列的下一篇。")]),v._v(" "),_("h2",{attrs:{id:"未完待续"}},[_("a",{staticClass:"header-anchor",attrs:{href:"#未完待续"}},[v._v("#")]),v._v(" 未完待续")]),v._v(" "),_("p",[v._v("非交互式零知识证明 NIZK 的"),_("strong",[v._v("信任根基")]),v._v("也需要某种形式的随机"),_("strong",[v._v("挑战")]),v._v("。一种"),_("strong",[v._v("挑战")]),v._v("形式是交给"),_("strong",[v._v("随机预言精灵")]),v._v("；另一种"),_("strong",[v._v("挑战")]),v._v("是通过 Alice 与 Bob 双方共享的随机字符串来实现。两种挑战形式本质上都引入了第三方，并且两者都必须提供可以让"),_("strong",[v._v("模拟器")]),v._v("利用的"),_("strong",[v._v("后门")]),v._v("，以使得模拟器在"),_("strong",[v._v("理想世界")]),v._v("具有某种"),_("strong",[v._v("优势")]),v._v("，而这种优势在"),_("strong",[v._v("现实世界")]),v._v("必须失效。")]),v._v(" "),_("p",[v._v("NIZK 散发着无穷魅力，让我不时惊叹，在过去三十多年里，先驱们所探寻到的精妙结论，同时还有如此之多的未知角落，在等待灵感之光的照射。")]),v._v(" "),_("p",[_("em",[v._v("致谢：特别感谢丁晟超，刘巍然，陈宇的专业建议和指正，感谢安比实验室小伙伴们(p0n1, even, aphasiayc, Vawheter, yghu, mr) 的修改建议。")])]),v._v(" "),_("p",[_("em",[v._v("致谢：自 Nisan 发起的密码学研究轶事参考自邓老师的文章 [15]。")])]),v._v(" "),_("h2",{attrs:{id:"参考文献"}},[_("a",{staticClass:"header-anchor",attrs:{href:"#参考文献"}},[v._v("#")]),v._v(" 参考文献")]),v._v(" "),_("ul",[_("li",[v._v('[1] Schnorr, Claus-Peter. "Efficient signature generation by smart cards." Journal of cryptology 4.3 (1991): 161-174.')]),v._v(" "),_("li",[v._v('[2] Paillier, Pascal, and Damien Vergnaud. "Discrete-log-based signatures may not be equivalent to discrete log." '),_("em",[v._v("International Conference on the Theory and Application of Cryptology and Information Security")]),v._v(". Springer, Berlin, Heidelberg, 2005.")]),v._v(" "),_("li",[v._v('[3] Pointcheval, David, and Jacques Stern. "Security arguments for digital signatures and blind signatures." '),_("em",[v._v("Journal of cryptology")]),v._v(" 13.3 (2000): 361-396.")]),v._v(" "),_("li",[v._v('[4] Maxwell, Gregory, Andrew Poelstra, Yannick Seurin, and Pieter Wuille. "Simple schnorr multi-signatures with applications to bitcoin." '),_("em",[v._v("Designs, Codes and Cryptography")]),v._v(" 87, no. 9 (2019): 2139-2164.")]),v._v(" "),_("li",[v._v('[5] Fiat, Amos, and Adi Shamir. "How to prove yourself: Practical solutions to identification and signature problems." Conference on the Theory and Application of Cryptographic Techniques. Springer, Berlin, Heidelberg, 1986.')]),v._v(" "),_("li",[v._v('[6] Bellare, Mihir, and Phillip Rogaway. "Random Oracles Are Practical: a Paradigm for Designing Efficient Protocols." '),_("em",[v._v("Proc. of the 1st CCS")]),v._v(" (1995): 62-73.")]),v._v(" "),_("li",[v._v('[7] László Babai, and Shlomo Moran. "Arthur-Merlin games: a randomized proof system, and a hierarchy of complexity classes." Journal of Computer and System Sciences 36.2 (1988): 254-276.m')]),v._v(" "),_("li",[v._v('[8] Canetti, Ran, Oded Goldreich, and Shai Halevi. "The random oracle methodology, revisited." Journal of the ACM (JACM)51.4 (2004): 557-594.')]),v._v(" "),_("li",[v._v('[9] Shafi Goldwasser, and Yael Tauman . "On the (in) security of the Fiat-Shamir paradigm." '),_("em",[v._v("44th Annual IEEE Symposium on Foundations of Computer Science, 2003. Proceedings.")]),v._v(". IEEE, 2003.")]),v._v(" "),_("li",[v._v('[10]Lewis, Sarah Jamie, Olivier Pereira, and Vanessa Teague. "Addendum to how not to prove your election outcome: The use of nonadaptive zero knowledge proofs in the ScytlSwissPost Internet voting system, and its implica tions for castasintended verifi cation." '),_("em",[v._v("Univ. Melbourne, Parkville, Australia")]),v._v(" (2019).")]),v._v(" "),_("li",[v._v('[11] Bernhard, David, Olivier Pereira, and Bogdan Warinschi. "How not to prove yourself: Pitfalls of the fiat-shamir heuristic and applications to helios." '),_("em",[v._v("International Conference on the Theory and Application of Cryptology and Information Security")]),v._v(". Springer, Berlin, Heidelberg, 2012.")]),v._v(" "),_("li",[v._v('[12] Goldwasser, Shafi, and Michael Sipser. "Private coins versus public coins in interactive proof systems." '),_("em",[v._v("Proceedings of the eighteenth annual ACM symposium on Theory of computing")]),v._v(". ACM, 1986.")]),v._v(" "),_("li",[v._v('[13] Papadimitriou, Christos H. "Games against nature." '),_("em",[v._v("Journal of Computer and System Sciences")]),v._v(" 31.2 (1985): 288-301.")]),v._v(" "),_("li",[v._v('[14] Babai, László. "E-mail and the unexpected power of interaction." '),_("em",[v._v("Proceedings Fifth Annual Structure in Complexity Theory Conference")]),v._v(". IEEE, 1990.")]),v._v(" "),_("li",[v._v('[15] Yi Deng. "零知识证明：一个略显严肃的科普." https://zhuanlan.zhihu.com/p/29491567')])])])}),[],!1,null,null,null);_.default=o.exports}}]);