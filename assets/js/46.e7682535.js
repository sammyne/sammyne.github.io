(window.webpackJsonp=window.webpackJsonp||[]).push([[46],{606:function(t,e,a){t.exports=a.p+"assets/img/JWT.52161a68.png"},735:function(t,e,a){"use strict";a.r(e);var s=a(2),n=Object(s.a)({},(function(){var t=this,e=t._self._c;return e("ContentSlotsDistributor",{attrs:{"slot-key":t.$parent.slotKey}},[e("h2",{attrs:{id:"什么是-jwt"}},[e("a",{staticClass:"header-anchor",attrs:{href:"#什么是-jwt"}},[t._v("#")]),t._v(" 什么是 JWT?")]),t._v(" "),e("p",[t._v("JWT 是 JSON Web Token 的缩写，它是一种开源标准（"),e("a",{attrs:{href:"https://tools.ietf.org/html/rfc7519",target:"_blank",rel:"noopener noreferrer"}},[t._v("RFC 7519"),e("OutboundLink")],1),t._v("），用来定义通信双方如何安全地交换信息的格式。")]),t._v(" "),e("p",[t._v("本身定义比较简单，结合实践经验，我总结了几点能够更好地帮助理解什么是JWT。")]),t._v(" "),e("div",{staticClass:"custom-block tip"},[e("p",{staticClass:"title"},[t._v("重点")]),e("ul",[e("li",[t._v("JWT 之所以叫 JSON Web Token，是因为其头部和载荷在编码之前都是 JSON 格式的数据")]),t._v(" "),e("li",[t._v("JWT 是一种标准，它有很多的实现方案，比如 jwt-auth，专门为 PHP 框架 laravel 打造，java 玩家可以看下java-jwt")]),t._v(" "),e("li",[t._v("JWT 规定以 JSON 的格式传递信息，负载的数据格式是 JSON，通常使用 base64 编码")]),t._v(" "),e("li",[t._v("JWT 是自包含的，Token 本身携带了验证信息，不需要借助其他工具就可以知道一个 Token 是否有效，以及查看载荷信息")]),t._v(" "),e("li",[t._v("JWT 的某些实现比如黑名单机制、Token 刷新等增强功能，可能也需要借助其他工具，但是这并不违背自包含特性。")])])]),e("h2",{attrs:{id:"jwt-的结构"}},[e("a",{staticClass:"header-anchor",attrs:{href:"#jwt-的结构"}},[t._v("#")]),t._v(" JWT 的结构")]),t._v(" "),e("p",[e("img",{attrs:{src:a(606),alt:"JWT 结构"}})]),t._v(" "),e("p",[t._v("上图直观地展示了 JWT 结构，三种颜色代表三个部分：头部、载荷、签名。")]),t._v(" "),e("h3",{attrs:{id:"头部"}},[e("a",{staticClass:"header-anchor",attrs:{href:"#头部"}},[t._v("#")]),t._v(" 头部")]),t._v(" "),e("p",[t._v("头部本身是 JSON 格式的。")]),t._v(" "),e("blockquote",[e("p",[t._v("注意这里说的是编码之前的格式。")])]),t._v(" "),e("p",[t._v("头部包括两个字段，token 的类型 "),e("code",[t._v("typ")]),t._v(" 和加密算法 "),e("code",[t._v("alg")]),t._v("。")]),t._v(" "),e("blockquote",[e("p",[t._v("注意：这里的加密算法是签名的加密算法，不是头部的加密算法，也不是载荷的加密算法。实际上头部并没有经过加密，只是通过 base64 编码成字符串。")])]),t._v(" "),e("h3",{attrs:{id:"载荷"}},[e("a",{staticClass:"header-anchor",attrs:{href:"#载荷"}},[t._v("#")]),t._v(" 载荷")]),t._v(" "),e("p",[t._v("载荷也是 JSON 格式的，经过 base64 编码成字符串。上图例子可以看到有 "),e("code",[t._v("sub")]),t._v("，"),e("code",[t._v("name")]),t._v(" 和 "),e("code",[t._v("iat")]),t._v(" 三个字段。实际上载荷的信息可以安全填写，符合 JSON 格式即可。")]),t._v(" "),e("p",[t._v("以下是一些标准字段，用来确保 jwt 有效工作。")]),t._v(" "),e("table",[e("thead",[e("tr",[e("th",{staticStyle:{"text-align":"right"}},[t._v("字段")]),t._v(" "),e("th",{staticStyle:{"text-align":"left"}},[t._v("说明")])])]),t._v(" "),e("tbody",[e("tr",[e("td",{staticStyle:{"text-align":"right"}},[t._v("iss")]),t._v(" "),e("td",{staticStyle:{"text-align":"left"}},[t._v("Issuer 的简写，代表 token 的颁发者")])]),t._v(" "),e("tr",[e("td",{staticStyle:{"text-align":"right"}},[t._v("sub")]),t._v(" "),e("td",{staticStyle:{"text-align":"left"}},[t._v("Subject 的简写，代表 token 的主题")])]),t._v(" "),e("tr",[e("td",{staticStyle:{"text-align":"right"}},[t._v("aud")]),t._v(" "),e("td",{staticStyle:{"text-align":"left"}},[t._v("Audience 的简写，代表 token 的接收目标")])]),t._v(" "),e("tr",[e("td",{staticStyle:{"text-align":"right"}},[t._v("exp")]),t._v(" "),e("td",{staticStyle:{"text-align":"left"}},[t._v("Expiration Time 的简写，代表 token 的过期时间，时间戳格式")])]),t._v(" "),e("tr",[e("td",{staticStyle:{"text-align":"right"}},[t._v("nbf")]),t._v(" "),e("td",{staticStyle:{"text-align":"left"}},[t._v("Not Before 的简写，代表 token 在这个时间之前不能被处理，主要是纠正服务器时间偏差")])]),t._v(" "),e("tr",[e("td",{staticStyle:{"text-align":"right"}},[t._v("iat")]),t._v(" "),e("td",{staticStyle:{"text-align":"left"}},[t._v("Issued At 的简写，代表 token 的颁发时间")])]),t._v(" "),e("tr",[e("td",{staticStyle:{"text-align":"right"}},[t._v("jti")]),t._v(" "),e("td",{staticStyle:{"text-align":"left"}},[t._v("JWT ID 的简写，代表 token 的 id。通常不同用户认证时，其 token 的 jti 是不同的")])])])]),t._v(" "),e("p",[t._v("以上字段都是 "),e("a",{attrs:{href:"https://tools.ietf.org/html/rfc7519",target:"_blank",rel:"noopener noreferrer"}},[t._v("RFC 7519"),e("OutboundLink")],1),t._v(" 标准确定的字段，通常由具体的实现框架来处理，使用者不需要关心。")]),t._v(" "),e("blockquote",[e("p",[t._v("注意：除了以上标准定义的字段，用户可以自由添加需要的信息。通常我们会把全局、经常使用、安全要求不高的信息写入载荷，比如用户 ID、用户名等信息。")])]),t._v(" "),e("h2",{attrs:{id:"jwt-认证流程"}},[e("a",{staticClass:"header-anchor",attrs:{href:"#jwt-认证流程"}},[t._v("#")]),t._v(" JWT 认证流程")]),t._v(" "),e("div",{staticClass:"language- line-numbers-mode"},[e("pre",{pre:!0,attrs:{class:"language-text"}},[e("code",[t._v("+---------+                              +--------+\n|  Client |                              | Server |\n+----+----+                              +--------+\n     |                                        |\n     |   1. (username, password)              |\n     +---------------------------------------\x3e+\n     |                                        +-----+\n     |                                        |     | 2. create a JWT with a secret\n     |                                        +<----+\n     |                               3. JWT   |\n     +<---------------------------------------+\n     |                                        |\n     |                                        |\n     |   4. JWT on Authorization Header       |\n     +---------------------------------------\x3e+\n     |                                        +-----+\n     |                                        |     | 5. check JWT signature and decode\n     |                          6. response   +<----+    user information from JWT\n     +<---------------------------------------+\n     |                                        |\n")])]),t._v(" "),e("div",{staticClass:"line-numbers-wrapper"},[e("span",{staticClass:"line-number"},[t._v("1")]),e("br"),e("span",{staticClass:"line-number"},[t._v("2")]),e("br"),e("span",{staticClass:"line-number"},[t._v("3")]),e("br"),e("span",{staticClass:"line-number"},[t._v("4")]),e("br"),e("span",{staticClass:"line-number"},[t._v("5")]),e("br"),e("span",{staticClass:"line-number"},[t._v("6")]),e("br"),e("span",{staticClass:"line-number"},[t._v("7")]),e("br"),e("span",{staticClass:"line-number"},[t._v("8")]),e("br"),e("span",{staticClass:"line-number"},[t._v("9")]),e("br"),e("span",{staticClass:"line-number"},[t._v("10")]),e("br"),e("span",{staticClass:"line-number"},[t._v("11")]),e("br"),e("span",{staticClass:"line-number"},[t._v("12")]),e("br"),e("span",{staticClass:"line-number"},[t._v("13")]),e("br"),e("span",{staticClass:"line-number"},[t._v("14")]),e("br"),e("span",{staticClass:"line-number"},[t._v("15")]),e("br"),e("span",{staticClass:"line-number"},[t._v("16")]),e("br"),e("span",{staticClass:"line-number"},[t._v("17")]),e("br"),e("span",{staticClass:"line-number"},[t._v("18")]),e("br"),e("span",{staticClass:"line-number"},[t._v("19")]),e("br"),e("span",{staticClass:"line-number"},[t._v("20")]),e("br")])]),e("ol",[e("li",[t._v("用户使用账号和密码登录，调用后端登录接口")]),t._v(" "),e("li",[t._v("服务器登录程序生成 jwt（注意这里小写指的是具体的 token），这一步通常是由 jwt 插件完成的，我们只需要配置 jwt 加密密钥、token 刷新时间和有效时间")]),t._v(" "),e("li",[t._v("服务器返回 jwt 给客户端")]),t._v(" "),e("li",[t._v("客户端之后的请求带上 token 即可，只要在 token 的有效期内")]),t._v(" "),e("li",[t._v("服务器收到客户端的请求，会验证 token 的合法性和有效性，验证通过之后处理请求")]),t._v(" "),e("li",[t._v("服务器发送响应给客户端")])]),t._v(" "),e("h2",{attrs:{id:"jwt-常见误区"}},[e("a",{staticClass:"header-anchor",attrs:{href:"#jwt-常见误区"}},[t._v("#")]),t._v(" JWT 常见误区")]),t._v(" "),e("ul",[e("li",[t._v("因为使用 base64 编码，JWT 是不安全的。这种理解是错误的，头部和载荷确实使用了 base64 编码，作用是编码而非加密，就是这么设计的，便于前端解码获取信息，所以头部和载荷不要存放保密信息。")]),t._v(" "),e("li",[t._v("JWT 是自包含的，不需要借助数据库和缓存。这种理解是错误的，当需要高级功能，比如 token 刷新、黑名单、多人共享账号等，还是需要借助缓存和数据库。")]),t._v(" "),e("li",[t._v("获取头部和载荷信息之后可以修改或者伪造 token。这是不可能的，即使头部和载荷的信息完全一样，但是加密的私钥不对，签名也是不对的，后端验证也没法通过。")])]),t._v(" "),e("h2",{attrs:{id:"参考文献"}},[e("a",{staticClass:"header-anchor",attrs:{href:"#参考文献"}},[t._v("#")]),t._v(" 参考文献")]),t._v(" "),e("ul",[e("li",[e("a",{attrs:{href:"https://jwt.io/introduction/",target:"_blank",rel:"noopener noreferrer"}},[t._v("Introduction to JSON Web Tokens"),e("OutboundLink")],1)]),t._v(" "),e("li",[e("a",{attrs:{href:"https://tools.ietf.org/html/rfc7519",target:"_blank",rel:"noopener noreferrer"}},[t._v("RFC 7519"),e("OutboundLink")],1)]),t._v(" "),e("li",[e("a",{attrs:{href:"https://zhuanlan.zhihu.com/p/355160217",target:"_blank",rel:"noopener noreferrer"}},[t._v("深入浅出之JWT(JSON Web Token)"),e("OutboundLink")],1)])])])}),[],!1,null,null,null);e.default=n.exports}}]);