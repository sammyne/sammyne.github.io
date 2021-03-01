---
title: Gophers 的 PKI 教程
date: 2019-08-04
categories:
  - language
tags:
  - golang
  - crypto
  - pki
---

> 原文：[GopherCon 2019 - PKI for Gophers](https://about.sourcegraph.com/go/gophercon-2019-pki-for-gophers)

## 概览

TLS 协议容易掌握，但是 PKI 就难得多了。本文介绍 Go 元件用于生成层级证书、测量 mTLS、硬件保护的密钥和诸如 Let's Encrypt 和 Certificate Transparency 等公开基础设施。

Google 的一名安全工程师，[Eric Chiang](https://twitter.com/erchiang)，会在此 Gophercon 2019 大会给我们展示面向 Go 编程的 PKI 教程！以下是其现场演讲的直播链接。

- [查看幻灯片](https://docs.google.com/presentation/d/16y-HTvL7ASzf9JspCBX0OVmhwUWVoLj9epzJfNMQRr8/preview?slide=id.p`)
- [主讲人 Twitter](https://twitter.com/erchiang)

鉴于演讲的代码量比较大，后续的内容要和上面的 PPT 一起看哟，往下阅读时需要对照相应的幻灯片。

## 开场白

相信每个人都有所察觉：HTTPS 流量比例两年以来在不断上升，达到当下浏览时间的 80-95%。

TLS 也成为了当今后端通信的期望选项。HTTPS 在不断小幅增长，其中纽约时报正在将它们的系统迁移到 HTTPS，Google 也发布了支持增长事实的 HTTPS 数据使用报告。

## 开场白：当下的安全工程

当前围绕安全工程的焦点主要集中在保护 VPN 和企业网络的内部基础设施。无论是前后端通信还是后端和其他服务的通信，通通都得加密。

## Go 的 HTTPS

Go 语言里配置 HTTPS 的步骤包括：生成签名、公钥和私钥（私钥不公开、不共享，公钥则会共享给任何能够访问它的人）。私钥签发文档，如后续 [“用 Go 构建 CA”](#用-go-构建-ca)节所示

ECDSA 签名算法用私钥对消息的哈希签名。任何持有公钥的人都能验证哈希（译者注：此处应指“签名结果”）来自签名方。

## 什么是证书？

HTTPS 通信要求我们持有证书。这些证书是被签发的文档，包含用于服务和保护通信流量的信息和元数据。证书包含公钥，使得私钥持有者才能构造相应域名的流量包。

## 证书认证机构（CA）

证书认证机构用于避免笔记本电脑必须存储每个网站证书的冗余问题。对外提供服务的证书会请求 CA 签发一份证书，从而通过传递式的信任机制得到认证。这时不用相信每份证书，我们只需要相信认证机构及其签发并声称合法的那部分证书即可。

## 用 Go 构建 CA

Go 代码用一些基本要素创建一份 ECDSA X509 证书的示例如下。所创建的证书能够签发其他证书，实现类似 CA 的功能。

> `utils`包参见 [github](https://github.com/sammyne/sammyne.github.io/blob/vuepress/_post/pki-for-gophers/codes/utils)

<!-- prettier-ignore -->
<<< @/_post/pki-for-gophers/codes/ca.go

这份证书是自签名的，经过序列化等操作后得到类似如下结果

- 证书
  ```bash
  -----BEGIN CERTIFICATE-----
  MIIBODCB36ADAgECAgiNXfgV9oemsDAKBggqhkjOPQQDAjAQMQ4wDAYDVQQDEwVt
  eS1jYTAeFw0xOTA4MDQwNjA1MTdaFw0xOTA4MDQwNzA1MTdaMBAxDjAMBgNVBAMT
  BW15LWNhMFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAEJA8Ica95m5oJ+e7n/9N0
  j92hwbplOoZvEu4PipGHwapk9L+BV15NmlbG78Kwz56+8k04HYoZ9Uy1qCuAWbWn
  q6MjMCEwDgYDVR0PAQH/BAQDAgKkMA8GA1UdEwEB/wQFMAMBAf8wCgYIKoZIzj0E
  AwIDSAAwRQIgP7cbl57e7QrSktuzuBHCPV58E3VFnrxS07Os65Y1RzECIQC18GFP
  qpAtsCvDSXVFziepUY6ysvShXm9GHlFzkr2roQ==
  -----END CERTIFICATE-----
  ```
- 私钥
  ```bash
  -----BEGIN EC PRIVATE KEY-----
  MHcCAQEEIFmRVOszR6jYVT67w9Vqll2XJHep82CJgDEBXVSolrvqoAoGCCqGSM49
  AwEHoUQDQgAEJA8Ica95m5oJ+e7n/9N0j92hwbplOoZvEu4PipGHwapk9L+BV15N
  mlbG78Kwz56+8k04HYoZ9Uy1qCuAWbWnqw==
  -----END EC PRIVATE KEY-----
  ```

下面代码段则展示用 CA 的私钥签发服务器所需证书的流程。所得证书也经过同样的序列化流程得到类似上面 CA 证书序列化的结果。

<!-- prettier-ignore -->
<<< @/_post/pki-for-gophers/codes/certify_server.go

服务器机器部署一个简单的 HTTP 服务器，但是加持了我们创建且被 CA 签名的证书所配置的 TLS 设定。代码如下

<!-- prettier-ignore -->
<<< @/_post/pki-for-gophers/codes/server.go

客户端必须相信 CA。创建一个服务器证书池，填入根 CA 证书。客户端后续基于服务器证书池抵御监听和篡改等攻击。代码如下

<!-- prettier-ignore -->
<<< @/_post/pki-for-gophers/codes/client.go

运行操作如下

```bash
cd codes
# 生成ca证书和公私钥
go run ca.go
# 生成服务器证书和公私钥
go run certify_server.go
# 启动服务器
go run server.go
# 启动客户端
go run client.go

# 客户端输出结果如下
response goes as
You're using HTTPS
```

## 服务器到客户端的认证流程

服务器要如何验证客户端？例如，一个后端服务或数据库想要验证客户端是经过许可的。

服务器向客户端展示证书以实现验证的流程一样，客户端也可以向服务器出示客户端证书。实现方式可基于同一个 CA：CA 签发客户端证书，服务器相信 CA，因此也会隐式地相信客户端证书。

生成客户端证书的代码如下

<!-- prettier-ignore -->
<<< @/_post/pki-for-gophers/codes/certify_client.go

类似一般的客户端和 CA 之间的交互，验证客户端的服务器也必须相信 CA，因此，服务器端也设置了证书池，设定`clientAuth`为`RequireAndVerifyClientCert`（这也是目前应该设置的唯一值）以要求验证客户端。

双向认证版的服务器端代码如下

<!-- prettier-ignore -->
<<< @/_post/pki-for-gophers/codes/mtls_server.go

相应的客户端代码如下

<!-- prettier-ignore -->
<<< @/_post/pki-for-gophers/codes/mtls_client.go

运行流程

```bash
cd codes
# 服务器和ca证书和上一版本一样
# 生成客户端证书
go run certify_client.go
# 启动服务器
go run mtls_server.go
# 打开另一个终端启动客户端
go run mtls_client.go

# 客户端输出如下
response goes as
You're using HTTPS
```

现在，服务器和客户端就建立起了双向认证的通道。

## TLS vs. PKI

TLS 要来得容易些，但是公钥基础设施（PKI）则要难一些。好在 Go 为搭建这套基础设施的设计了优秀的接口。管理现实系统和私钥不仅是其中最难的部分，也是需要理解并正确操作的最重要部分。

> 译者注：原文把公钥基础设施翻译为 Private Key Infrastructure 是不对的

## 证书签发请求 CSR

前面的例子假设我们持有所有相关私钥，但是现实世界的 CA 是不会公开自己私钥的。因此，需要一种方式让 CA 签发我们的证书来获得它的授权。这时就该证书签发请求（Certificate Signing Request）进场了。

Go 语言中，我们可以创建这样的证书请求。CA 会签发证书，因此需要传入 CA 的私钥。相关操作如下

<!-- prettier-ignore -->
<<< @/_post/pki-for-gophers/codes/csr.go

## 证书所有权

假设现有如下场景：两个域名分别为 foo.com 和 bar.com 的、跑在 GCE 服务上，收到一份签发请求时 CA 无法区分 foo.com **确实**是 foo.com，还是 bar.com 假冒的。

GCE 中，元数据用于提供一个 JWT token（此处不深究细节），本质上是一份被 GCE 签名的文档。这份文档描述了 GCE 端请求的实例名称等内容。因此，收到一份 CSR 时，CA 可以验证请求来自声称的平台。然后 CA 端解析 CSR，拉取 JWT 得到实例 ID。上述步骤使得 CA 能够明智地决定是否签发 CSR。

## 证书吊销列表 (CRL)

吊销证书通过吊销列表的形式实现。本质上，这是 CA 声明吊销的、不再相信的证书列表。Go 语言里，CA 的操作姿势如下：创建一份包含待吊销证书序列号的列表，然后用 CA 私钥对这个列表签名得到一份证书吊销列表（Certificate Revocation List）。私钥的作用是表明 CRL 经过 CA 授权后发布的。CRL 文件接下来会分发给客户端。基于 CA 私钥的签名，客户端可以确信所列举的证书是被 CA 吊销的。

CA 吊销服务器的证书，生成相应 CRL

<!-- prettier-ignore -->
<<< @/_post/pki-for-gophers/codes/crl.go

加载 CRL 的客户端程序如下

<!-- prettier-ignore -->
<<< @/_post/pki-for-gophers/codes/client_with_crl.go

检查 CRL 的作用

```bash
cd codes
# 启动服务器
go run server.go
# 没有加载CRL的客户端应该能够拿到正确反馈
go run client.go
# 加载CRL的客户端应该报错
go run client_with_crl.go

# 没有加载CRL的客户端输出结果如下
response goes as
You're using HTTPS

# 加载CRL的客户端输出结果如下
panic: Get https://localhost:8443/: certificate was revoked: /cn=my-server
```

## OCSP (Online Cerificate Status Protocol)

对百到千级别大小的吊销列表，CRL 完全够用了。但开放的互联网下，这种方案就略显不足了。这是可利用 OCSP 向 CA 查询证书是否合法。CA 需要反馈证书在一小段时间内是否合法。但是，这种方案也有问题。CA 可能处理不了由此带来的大量请求。再者，考虑到隐私的话，请求 CA 验证所访问网页的证书会使得 CA 知晓我们浏览历史，这显然是不好的。OCSA stapling 应运而生。

实现 OCSP stapling 的`Certificate`的`OCSPStaple`字段用法如下示例代码。CA 端利用`golang.org/x/net/crypto/ocsp`响应类型来创建 OCSP 响应。给`DialTLS`传入一份自定义的 TLS 配置，然后在里面执行额外验证，例如，验证 OCSP 响应不合法时直接退出。

服务器示例代码如下

<!-- prettier-ignore -->
<<< @/_post/pki-for-gophers/codes/server_with_ocsp.go

客户端示例代码如下

<!-- prettier-ignore -->
<<< @/_post/pki-for-gophers/codes/client_with_ocsp.go

## 服务器名字标识（SNI）

转换 CA 证书要比客户端证书复杂得多。云服务提供商发现客户端使用 SNI（Server Name Identification）时会中断 TLS 通信。SNI 面向的是一个前台服务器为后台多个服务器通信提供正确证书的问题。假想如下场景：一个诸如 Cloudflare 的服务器作为前台，后台管理着其他多个 TLS 服务器。前台服务器想要为其代理通信的后台服务器提供证书，而不是提供自己的证书（访问网页时，应该展示网站的证书而不是作为前台代理诸如 Cloudflare 的服务器证书）。

Go 很人性地允许我们灵活地验证证书。SNI 则是一种比较新奇的方式。哈萨克斯坦政府正是通过 SNI 来屏蔽网站的，而且还推行其他疯狂的措施，包括要求人们安装政府不安全的证书。Cloudflare 是利用*加密版 SNI*来解决上述问题的公司之一。更多详情，参见 Let's Encrypt 的 SNI 挑战问题和域名前置等。目前 Go 并不支持加密版 SNI。

## 基于证书的授权

正如客户端想要验证服务器，服务器也会根据不同访问权限为客户端提供不同服务。例如，绿色密钥被赋予访问数据库的完整权限，而橙色密钥则只有读权限。第 58 页 PPT 展示了根据用于验证的证书实现上述需求的方式。

## 硬件密钥

硬件加固的密钥也是很好玩的。电脑已经可用于存储密钥。电脑的保护密钥就是这样做的。硬件加固密钥是通过把私钥存到硬件实现的。用户态下，我们无法访问到这个密钥。硬件提供这样一个接口用于接收签名请求--“不要告诉我私钥，只需用设备上的私钥帮我签名即可”。系统出问题遭受攻击时，攻击者必须利用内核级 API 才能进行操作，而不是靠我们泄露私钥文件的路径。（@TODO: 此句的翻译有待商榷）

Go 的`Certificate`结构的`PrivateKey`可用于实现条件式接口，例如，向其提供一个能够利用接口方法执行 ECDSA 算法的`ECDSAKey`。

但是，TL;DR 在此声明一下：永远不要假设私钥会出现在内存中。它可能会存在其他密钥管理系统或硬件，因此，我们需要做的就是简单地将私钥传入所有 API。

## LetsEncrypt

LetsEncrypt 简直不要太好，Go 也对它有很好的集成。LetsEncrypt 是一个 CA，签发证书时会给指定域名发送挑战，要求另一端的服务器证明对域名的控制权。强力安利一波 LetsEncrypt!

[autocert](https://godoc.org/golang.org/x/crypto/acme/autocert)是个优秀的 Go 包，能够简单地自动向我们提供被信任的证书。第 72 页 PPT 展示操作方式。需要注意的是：环境需要安全存储在诸如桶等地方。

## Certificate transparency

Certificate transparency 是当今 Chrome 浏览器新颖且不可或缺的一部分。它试图解决恶意 CA 发放不合理证书而不被发现的问题。例如，一个小 CA 为 Google.com 或 Facebook.com 的情形就是非常糟糕的。Certificate transparency 就是为此而来的。

Certificate transparency 是 CA 已发放证书的一个日志列表，所有已发放证书都会出现在这里。它是个经过加密证明的日志，确保了它的有效性。它利用了签名证书的时间戳。

Certificate transparency 的 [Go 实现](https://github.com/google/certificate-transparency-go) 可列举这些证书。通过这种方式，我们可以检查是否有其他人获得某个 DNS 记录或私钥的使用权，并给我们的域名申请了证书。

## 小结

PKI 的话题是很广泛的，没有对 PKI 的明确定义。个人建议如下：

- **上手 HTTPS！**--不要再用 HTTP 给用户访问后端服务的机会了。我们要尽可能多这样做，毕竟生产环境用的就是 HTTPS
- 编写脚本用于生成证书，别用 HTTP
- 谨记注意网络安全
