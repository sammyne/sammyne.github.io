(window.webpackJsonp=window.webpackJsonp||[]).push([[30],{613:function(t,_,v){t.exports=v.p+"assets/img/stealth-address-cryptonote.64cf7acc.png"},658:function(t,_,v){"use strict";v.r(_);var e=v(6),r=Object(e.a)({},(function(){var t=this,_=t.$createElement,e=t._self._c||_;return e("ContentSlotsDistributor",{attrs:{"slot-key":t.$parent.slotKey}},[e("h2",{attrs:{id:"符号说明"}},[e("a",{staticClass:"header-anchor",attrs:{href:"#符号说明"}},[t._v("#")]),t._v(" 符号说明")]),t._v(" "),e("p",[t._v("为了描述方便，我们约定")]),t._v(" "),e("ul",[e("li",[t._v("大写字母表示椭圆曲线点")]),t._v(" "),e("li",[t._v("小写字母表示椭圆曲线方程所在群的某个标量")])]),t._v(" "),e("table",[e("thead",[e("tr",[e("th",{staticStyle:{"text-align":"right"}},[t._v("符号")]),t._v(" "),e("th",{staticStyle:{"text-align":"left"}},[t._v("含义")])])]),t._v(" "),e("tbody",[e("tr",[e("td",{staticStyle:{"text-align":"right"}},[e("code",[t._v("h(Y)")])]),t._v(" "),e("td",{staticStyle:{"text-align":"left"}},[t._v("将椭圆曲线点转为曲线方程所在群的一个标量值")])]),t._v(" "),e("tr",[e("td",{staticStyle:{"text-align":"right"}},[e("code",[t._v("n")])]),t._v(" "),e("td",{staticStyle:{"text-align":"left"}},[t._v("椭圆曲线所在群的阶")])]),t._v(" "),e("tr",[e("td",{staticStyle:{"text-align":"right"}},[e("code",[t._v("G")])]),t._v(" "),e("td",{staticStyle:{"text-align":"left"}},[t._v("椭圆曲线的基点")])])])]),t._v(" "),e("h2",{attrs:{id:"原理"}},[e("a",{staticClass:"header-anchor",attrs:{href:"#原理"}},[t._v("#")]),t._v(" 原理")]),t._v(" "),e("p",[e("a",{attrs:{href:"https://cryptonote.org/whitepaper.pdf",target:"_blank",rel:"noopener noreferrer"}},[t._v("Cryptonote 白皮书"),e("OutboundLink")],1),t._v("描述的"),e("strong",[t._v("双密钥隐形地址")]),t._v("如下")]),t._v(" "),e("p",[e("img",{attrs:{src:v(613),alt:"Cryptonote描述的双密钥隐形地址"}})]),t._v(" "),e("p",[t._v("其中，黄色高亮部分即为我们关注的隐形地址"),e("code",[t._v("P=h(r*A)*G+B")])]),t._v(" "),e("p",[t._v("双密钥指的是输出地址由"),e("strong",[t._v("花费密钥")]),t._v("和"),e("strong",[t._v("查看密钥")]),t._v("两个密钥组成")]),t._v(" "),e("ul",[e("li",[t._v("公开的"),e("strong",[t._v("查看密钥")]),t._v("会消除输出的不可关联性")]),t._v(" "),e("li",[t._v("只要"),e("strong",[t._v("花费密钥")]),t._v("是保密的，相应的输出就无法被盗用")])]),t._v(" "),e("p",[t._v("给定交易双方 Alice 和 Bob，")]),t._v(" "),e("ul",[e("li",[t._v("Alice 的花费密钥对为"),e("code",[t._v("(w,W)")]),t._v("，对应的查看密钥对为"),e("code",[t._v("(x, X)")])]),t._v(" "),e("li",[t._v("Bob 的花费密钥对为"),e("code",[t._v("(y,Y)")]),t._v("，对应的查看密钥对为"),e("code",[t._v("(z, Z)")])])]),t._v(" "),e("p",[t._v("Alice 要想 Bob 转账的流程如下")]),t._v(" "),e("h3",{attrs:{id:"alice-计算-bob-的隐形地址"}},[e("a",{staticClass:"header-anchor",attrs:{href:"#alice-计算-bob-的隐形地址"}},[t._v("#")]),t._v(" Alice 计算 Bob 的隐形地址")]),t._v(" "),e("ul",[e("li",[t._v("输入: Bob 的查看公钥"),e("code",[t._v("Z")])]),t._v(" "),e("li",[t._v("输出: 随机数"),e("code",[t._v("r")]),t._v("和椭圆曲线点"),e("code",[t._v("R=r*G")]),t._v("，Bob 的隐形地址"),e("code",[t._v("P")])]),t._v(" "),e("li",[t._v("流程\n"),e("ol",[e("li",[t._v("生成范围"),e("code",[t._v("[1, n)")]),t._v("内的随机整数"),e("code",[t._v("r")]),t._v("，计算"),e("code",[t._v("R=r*G")])]),t._v(" "),e("li",[t._v("以"),e("code",[t._v("P=h(r*Z)*G+Y")]),t._v("作为 Bob 的收款地址即可")])])])]),t._v(" "),e("blockquote",[e("p",[t._v("每笔交易应重新随机选取"),e("code",[t._v("r")]),t._v("，重用"),e("code",[t._v("r")]),t._v("给同一个收款地址转账会导致隐形地址碰撞而暴露隐形地址间的关联性。除非用于向第三方证明自己确实已经向 Bob 转账，"),e("code",[t._v("r")]),t._v("在计算得到"),e("code",[t._v("P")]),t._v("后可废弃。"),e("br"),t._v(" "),e("code",[t._v("R")]),t._v("需要以明文形式放到交易里。")])]),t._v(" "),e("h3",{attrs:{id:"bob-筛选属于自己的交易输出"}},[e("a",{staticClass:"header-anchor",attrs:{href:"#bob-筛选属于自己的交易输出"}},[t._v("#")]),t._v(" Bob 筛选属于自己的交易输出")]),t._v(" "),e("ul",[e("li",[t._v("输入: 一笔交易输出"),e("code",[t._v("txOut")]),t._v("的地址"),e("code",[t._v("P")]),t._v("和曲线点"),e("code",[t._v("R")]),t._v("，花费密钥对"),e("code",[t._v("(y,Y)")]),t._v("，查看密钥对"),e("code",[t._v("(z, Z)")])]),t._v(" "),e("li",[t._v("输出: 用于签发这笔输出的私钥"),e("code",[t._v("b")]),t._v("或"),e("code",[t._v("false")])]),t._v(" "),e("li",[t._v("流程\n"),e("ol",[e("li",[t._v("计算"),e("code",[t._v("P'=h(z*R)*G+Y")])]),t._v(" "),e("li",[t._v("如果"),e("code",[t._v("P!=P'")]),t._v("，则可断定"),e("code",[t._v("txOut")]),t._v("的收款方不是本人，输出"),e("code",[t._v("false")])]),t._v(" "),e("li",[t._v("计算并输出将来用于签发交易的私钥"),e("code",[t._v("b=h(z*R)+y")])])])])]),t._v(" "),e("h2",{attrs:{id:"分析"}},[e("a",{staticClass:"header-anchor",attrs:{href:"#分析"}},[t._v("#")]),t._v(" 分析")]),t._v(" "),e("h3",{attrs:{id:"优点"}},[e("a",{staticClass:"header-anchor",attrs:{href:"#优点"}},[t._v("#")]),t._v(" 优点")]),t._v(" "),e("ul",[e("li",[t._v("用户需要维护的公私钥只有一对，无须采用"),e("a",{attrs:{href:"https://github.com/bitcoin/bips/blob/master/bip-0032.mediawiki",target:"_blank",rel:"noopener noreferrer"}},[t._v("层次钱包"),e("OutboundLink")],1),t._v("生成一堆公私钥")])]),t._v(" "),e("h3",{attrs:{id:"缺点"}},[e("a",{staticClass:"header-anchor",attrs:{href:"#缺点"}},[t._v("#")]),t._v(" 缺点")]),t._v(" "),e("p",[t._v("相比于比特币")]),t._v(" "),e("ul",[e("li",[t._v("收款方压力增大，需要扫描整个链上的交易，这也是目前门罗币性能的一大瓶颈")])]),t._v(" "),e("h2",{attrs:{id:"todo"}},[e("a",{staticClass:"header-anchor",attrs:{href:"#todo"}},[t._v("#")]),t._v(" TODO")]),t._v(" "),e("ul",[e("li",[t._v("攻击??")]),t._v(" "),e("li",[t._v("安全性问题")])]),t._v(" "),e("h2",{attrs:{id:"references"}},[e("a",{staticClass:"header-anchor",attrs:{href:"#references"}},[t._v("#")]),t._v(" References")]),t._v(" "),e("ul",[e("li",[e("a",{attrs:{href:"https://cryptonote.org/whitepaper.pdf",target:"_blank",rel:"noopener noreferrer"}},[t._v("Cryptonote 白皮书"),e("OutboundLink")],1)])])])}),[],!1,null,null,null);_.default=r.exports}}]);