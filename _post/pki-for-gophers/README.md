---
date: 2019-08-04
---

# Gophers的PKI教程

> 原文：[GopherCon 2019 - PKI for Gophers](https://about.sourcegraph.com/go/gophercon-2019-pki-for-gophers)

## 概览

TLS协议容易掌握，但是PKI就难得多了。本文介绍Go元件用于生成层级证书、测量mTLS、硬件保护的密钥和诸如Let's Encrypt和Certificate Transparency等公开基础设施。

Google的一名安全工程师，[Eric Chiang](https://twitter.com/erchiang)，会在此Gophercon 2019大会给我们展示面向Go编程的PKI教程！以下是其现场演讲的直播链接。

- [查看幻灯片](https://docs.google.com/presentation/d/16y-HTvL7ASzf9JspCBX0OVmhwUWVoLj9epzJfNMQRr8/preview?slide=id.p`)
- [主讲人Twitter](https://twitter.com/erchiang)

鉴于演讲的代码量比较大，后续的内容要和上面的PPT一起看哟，往下阅读时需要对照相应的幻灯片。

## 开场白

相信每个人都有所察觉：HTTPS流量比例两年以来在不断上升，达到时下浏览时间的80-95%。

TLS也成为了当今后端通信的期望选项。HTTPS在不断小幅增长，其中纽约时报正在将它们的系统迁移到HTTPS，Google也发布了支持增长事实的HTTPS数据使用报告。

## 开场白：时下的安全工程

当前围绕安全工程的焦点主要集中在保护VPN和企业网络的内部基础设施。无论是前后端通信还是后端和其他服务的通信，通通都得加密。

## Go的HTTPS

Go语言里配置HTTPS的步骤包括：生成签名、公钥和私钥（私钥不公开、不共享，公钥则会共享给任何能够访问它的人）。私钥签发文档，如后续“用Go构建CA”节所示


ECDSA签名算法用私钥堆消息的哈希签名。任何持有公钥的人都能验证哈希（译者注：此处应指“签名结果”）来自签名方。

## 什么是证书？

HTTPS通信要求我们持有证书。这些证书是被签发的文档，包含用于服务和保护通信流量的信息和元数据。证书包含公钥，使得私钥持有者才能构造相应域名的流量包。

## 证书认证机构（CA）

证书认证机构用于避免笔记本电脑必须存储每个网站证书的冗余问题。对外提供服务的证书会请求CA签发一份证书，从而通过传递式的信任机制得到认证。这时不用相信每份证书，我们只需要相信认证机构及其签发并声称合法的那部分证书即可。

## 用Go构建CA

Go代码用一些基本要素创建一份ECDSA X509格式的证书的示例如下。所创建的证书能够签发其他证书，实现类似CA的功能。

> `utils`包参见@TODO: add the link to source file

<<< @/_post/pki-for-gophers/codes/ca.go

```go
package main

import (
	"crypto/ecdsa"
	"crypto/elliptic"
	"crypto/rand"
	"crypto/x509"
	"crypto/x509/pkix"
	"encoding/binary"
	"math/big"
	"time"

	"codes/utils"
)

func main() {
	caPriv, err := ecdsa.GenerateKey(elliptic.P256(), rand.Reader)
	if err != nil {
		panic(err)
	}

	// Generate a self-signed certificate
	caTmpl := &x509.Certificate{
		Subject:               pkix.Name{CommonName: "my-ca"},
		SerialNumber:          utils.RandSerialNumber(), // Choose a random, big number
		BasicConstraintsValid: true,
		IsCA:                  true,
		NotBefore:             time.Now(),
		NotAfter:              time.Now().Add(time.Hour),
		KeyUsage: x509.KeyUsageKeyEncipherment |
			x509.KeyUsageDigitalSignature |
			x509.KeyUsageCertSign,
	}

	caCertDER, err := x509.CreateCertificate(rand.Reader, caTmpl, caTmpl, caPriv.Public(), caPriv)
	if err != nil {
		panic(err)
	}

	const owner = "ca"
	if err := utils.DumpCert(caCertDER, owner); err != nil {
		panic(err)
	}

	if err := utils.DumpPrivKey(caPriv, owner); err != nil {
		panic(err)
	}
}
```

> 源码参见@TODO: codes/ca.go文件

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

下面代码段则展示用CA的私钥签发服务器所需证书的流程。所得证书也经过同样的序列化流程得到类似上面CA证书序列化类似的结果。

```go
// +build ignore

package main

import (
	"crypto/ecdsa"
	"crypto/elliptic"
	"crypto/rand"
	"crypto/x509"
	"crypto/x509/pkix"
	"time"

	"codes/utils"
)

func main() {
	caPrivKey, caCert, err := utils.LoadKeyAndCert("ca")
	if err != nil {
		panic(err)
	}

	// Generate a key pair and certificate template
	servPriv, err := ecdsa.GenerateKey(elliptic.P256(), rand.Reader)
	if err != nil {
		panic(err)
	}
	servTmpl := &x509.Certificate{
		Subject:      pkix.Name{CommonName: "my-server"},
		SerialNumber: utils.RandSerialNumber(),
		NotBefore:    time.Now(),
		NotAfter:     time.Now().Add(time.Hour),
		DNSNames:     []string{"localhost"},
		KeyUsage:     x509.KeyUsageKeyEncipherment | x509.KeyUsageDigitalSignature,
		ExtKeyUsage:  []x509.ExtKeyUsage{x509.ExtKeyUsageServerAuth},
	}
	// Sign the serving cert with the CA private key
	servCertDER, err := x509.CreateCertificate(rand.Reader, servTmpl, caCert, servPriv.Public(), caPrivKey)
	if err != nil {
		panic(err)
	}

	if err := utils.DumpCert(servCertDER, "server"); err != nil {
		panic(err)
	}

	if err := utils.DumpPrivKey(servPriv, "server"); err != nil {
		panic(err)
	}
}
```

> 源码参见@TODO: codes/certify_server.go文件

服务器机器上部署一个简单的HTTP服务器，但是加持了我们创建和CA签名的证书所配置的TLS设定。代码如下

```go
// +build ignore

package main

import (
	"crypto/tls"
	"fmt"
	"net/http"
)

func main() {
	// Load the certificate and private key as a TLS certificate
	servTLSCert, err := tls.LoadX509KeyPair("server.cert", "server.key")
	if err != nil {
		panic(err)
	}

	serv := http.Server{
		Addr: "localhost:8443",
		Handler: http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			fmt.Fprintln(w, "You're using HTTPS")
		}),
		// Configure TLS options
		TLSConfig: &tls.Config{Certificates: []tls.Certificate{servTLSCert}},
	}

	// Begin serving TLS
	if err := serv.ListenAndServeTLS("", ""); err != nil {
		panic(err)
	}
}
```

> 源码参见@TODO: codes/server.go文件

客户端必须相信CA。创建一个服务器证书池，填入根CA证书。客户端后续基于服务器证书池抵御监听和篡改等攻击。代码如下

```go
// +build ignore

package main

import (
	"crypto/tls"
	"crypto/x509"
	"fmt"
	"io/ioutil"
	"net/http"
)

func main() {
	caCertPEM, err := ioutil.ReadFile("ca.cert")
	if err != nil {
		panic(err)
	}

	// Configure a client to trust the server
	certPool := x509.NewCertPool()
	if ok := certPool.AppendCertsFromPEM(caCertPEM); !ok {
		panic("invalid cert in PEM")
	}

	client := &http.Client{
		Transport: &http.Transport{
			TLSClientConfig: &tls.Config{RootCAs: certPool},
		},
	}

	resp, err := client.Get("https://localhost:8443/")
	if err != nil {
		panic(err)
	}
	defer resp.Body.Close()

	body, err := ioutil.ReadAll(resp.Body)
	if err != nil {
		panic(err)
	}
	fmt.Println("response goes as")
	fmt.Printf("%s\n", body)
}
```

> 源码参见@TODO: codes/client.go文件

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

服务器向客户端展示证书以进行验证的流程一样，客户端也可以向服务器出示客户端证书。实现方式可基于同一个CA：CA签发客户端证书，服务器相信CA，因此也会隐式地相信客户端证书。

生成客户端证书的代码如下
```go
// +build ignore

package main

import (
	"crypto/ecdsa"
	"crypto/elliptic"
	"crypto/rand"
	"crypto/x509"
	"crypto/x509/pkix"
	"time"

	"codes/utils"
)

func main() {
	caPrivKey, caCert, err := utils.LoadKeyAndCert("ca")
	if err != nil {
		panic(err)
	}

	cliPriv, err := ecdsa.GenerateKey(elliptic.P256(), rand.Reader)
	if err != nil {
		panic(err)
	}
	cliTmpl := &x509.Certificate{
		Subject:      pkix.Name{CommonName: "my-client"},
		SerialNumber: utils.RandSerialNumber(),
		NotBefore:    time.Now(),
		NotAfter:     time.Now().Add(time.Hour),
		KeyUsage:     x509.KeyUsageKeyEncipherment | x509.KeyUsageDigitalSignature,
		ExtKeyUsage:  []x509.ExtKeyUsage{x509.ExtKeyUsageClientAuth},
	}

	cliCert, err := x509.CreateCertificate(rand.Reader, cliTmpl, caCert, cliPriv.Public(),
		caPrivKey)
	if err != nil {
		panic(err)
	}

	const owner = "client"
	if err := utils.DumpCert(cliCert, owner); err != nil {
		panic(err)
	}

	if err := utils.DumpPrivKey(cliPriv, owner); err != nil {
		panic(err)
	}
}
```

> 源码参见@TODO: codes/certify_client.go文件

类似一般的客户端和CA之间的交互，验证客户端的服务器也必须相信CA，因此，服务器端也设置了证书池，设定`clientAuth`为`RequireAndVerifyClientCert`（这也是目前应该设置的唯一值）以要求验证客户端。

双向认证版的服务器端代码如下
```go
// +build ignore

package main

import (
	"crypto/tls"
	"crypto/x509"
	"fmt"
	"io/ioutil"
	"net/http"
)

func main() {
	// Load the certificate and private key as a TLS certificate
	servTLSCert, err := tls.LoadX509KeyPair("server.cert", "server.key")
	if err != nil {
		panic(err)
	}

	// Configure a client to trust the server
	certPool := x509.NewCertPool()
	if caCertPEM, err := ioutil.ReadFile("ca.cert"); err != nil {
		panic(err)
	} else if ok := certPool.AppendCertsFromPEM(caCertPEM); !ok {
		panic("invalid cert in PEM")
	}

	serv := http.Server{
		Addr: "localhost:8443",
		Handler: http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			fmt.Fprintln(w, "You're using HTTPS")
		}),
		// Configure TLS options
		TLSConfig: &tls.Config{
			// MUST use RequireAndVerifyClientCert to require a client cert
			ClientAuth:   tls.RequireAndVerifyClientCert,
			ClientCAs:    certPool,
			Certificates: []tls.Certificate{servTLSCert},
		},
	}

	// Begin serving TLS
	if err := serv.ListenAndServeTLS("", ""); err != nil {
		panic(err)
	}
}
```

> 源码参见@TODO: codes/mtls_server.go文件

相应的客户端代码如下

```go
// +build ignore

package main

import (
	"crypto/tls"
	"crypto/x509"
	"fmt"
	"io/ioutil"
	"net/http"
)

func main() {
	// Load the certificate and private key as a TLS certificate
	cliTLSCert, err := tls.LoadX509KeyPair("client.cert", "client.key")
	if err != nil {
		panic(err)
	}

	caCertPEM, err := ioutil.ReadFile("ca.cert")
	if err != nil {
		panic(err)
	}

	// Configure a client to trust the server
	certPool := x509.NewCertPool()
	if ok := certPool.AppendCertsFromPEM(caCertPEM); !ok {
		panic("invalid cert in PEM")
	}

	client := &http.Client{
		Transport: &http.Transport{
			TLSClientConfig: &tls.Config{
				Certificates: []tls.Certificate{cliTLSCert},
				RootCAs:      certPool,
			},
		},
	}

	resp, err := client.Get("https://localhost:8443/")
	if err != nil {
		panic(err)
	}
	defer resp.Body.Close()

	body, err := ioutil.ReadAll(resp.Body)
	if err != nil {
		panic(err)
	}
	fmt.Println("response goes as")
	fmt.Printf("%s\n", body)
}
```

> 源码参见@TODO: codes/mtls_client.go文件

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
TLS要来得容易些，但是公钥基础设施（PKI）则要难一些。但是Go为搭建这套基础设施的设计了优秀的接口。管理现实系统和私钥是其中最难的部分。但也是需要理解并正确操作的最重要部分。

> 译者注：原文把公钥基础设施翻译为Private Key Infrastructure是不对的

## 证书签发请求 CSR

前面的例子假设我们持有所有相关私钥，但是现实世界的CA是不会公开自己的私钥的。因此，需要一种方式让CA签发我们的证书来获得它的授权。这时就该证书签发请求（Certificate Signing Request）进场了。

Go语言中，我们可以创建这样的证书请求。CA会签发证书，因此需要传入CA的私钥。的相关操作如下

```go
// +build ignore

package main

import (
	"codes/utils"
	"crypto/ecdsa"
	"crypto/elliptic"
	"crypto/rand"
	"crypto/x509"
	"crypto/x509/pkix"
	"time"
)

func main() {
	/// server side
	servPriv, err := ecdsa.GenerateKey(elliptic.P256(), rand.Reader)
	if err != nil {
		panic(err)
	}
	csr := &x509.CertificateRequest{
		Subject:  pkix.Name{CommonName: "my-server"},
		DNSNames: []string{"example.com"},
	}
	csrDER, err := x509.CreateCertificateRequest(rand.Reader, csr, servPriv)
	if err != nil {
		panic(err)
	}

	// send CSR to CA
	/// end server side

	/// CA side
	caPrivKey, caCert, err := utils.LoadKeyAndCert("ca")
	if err != nil {
		panic(err)
	}

	servCSR, err := x509.ParseCertificateRequest(csrDER)
	if err != nil {
		panic(err)
	}
	if err := servCSR.CheckSignature(); err != nil {
		panic(err)
	}

	// Certificate authority MUST validate CSR fields before using them to
	// generate a certificate

	servTmpl := &x509.Certificate{
		// Fields taken from CSR
		Subject:     servCSR.Subject,
		IPAddresses: servCSR.IPAddresses,
		DNSNames:    servCSR.DNSNames,

		// Fields that must be requested externally from the CSR
		SerialNumber: utils.RandSerialNumber(),
		NotBefore:    time.Now(),
		NotAfter:     time.Now().Add(time.Hour),
		KeyUsage:     x509.KeyUsageKeyEncipherment | x509.KeyUsageDigitalSignature,
		ExtKeyUsage:  []x509.ExtKeyUsage{x509.ExtKeyUsageServerAuth},
	}
	servCertDER, err := x509.CreateCertificate(rand.Reader, servTmpl, caCert, servCSR.PublicKey, caPrivKey)
	if err != nil {
		panic(err)
	}

	// send server cert to server
	_ = servCertDER

	/// end CA side
}
```

> 源码参见@TODO: codes/csr.go文件

## 证书所有权

假设现有如下场景：两个域名分别为foo.com和bar.com的、跑在GCE的服务，收到一份签发请求时CA无法区分foo.com**确实**是foo.com，还是bar.com假冒的。

GCE中，元数据用于提供一个JWT token（此处不深究细节），本质上是一份被GCE签名的文档。这份文档描述了GCE端请求的诸如实例名称等内容。因此，收到一份CSR时，CA可以验证请求来自声称的平台。然后CA端解析CSR，拉取JWT得到实例ID。上述步骤使得CA能够明智地决定是否签发CSR。

## 证书吊销列表 (CRL)

吊销证书通过吊销列表的形式实现。本质上，这是CA声明吊销的、不再相信的证书列表。Go语言里，CA的操作姿势如下：创建一份包含待吊销证书序列号的列表，然后用CA私钥对这个列表签名得到一份证书吊销列表（Certificate Revocation List）。私钥的作用是表明CRL经过CA授权后发布的。CRL文件接下来会分发给客户端，基于CA私钥的签名，客户端可以确信所列举的证书是被CA吊销的。

CA吊销服务器的证书，生成相应CRL
```go
// +build ignore

package main

import (
	"codes/utils"
	"crypto/rand"
	"crypto/x509/pkix"
	"io/ioutil"
	"time"
)

// this is done by CA
func main() {
	caPrivKey, caCert, err := utils.LoadKeyAndCert("ca")
	if err != nil {
		panic(err)
	}

	_, serverCert, err := utils.LoadKeyAndCert("server")
	if err != nil {
		panic(err)
	}

	revoked := []pkix.RevokedCertificate{
		{SerialNumber: serverCert.SerialNumber, RevocationTime: time.Now()},
	}
	now := time.Now()
	exp := time.Now().Add(time.Hour)
	crlDER, err := caCert.CreateCRL(rand.Reader, caPrivKey, revoked, now, exp)
	if err != nil {
		panic(err)
	}

	if err := ioutil.WriteFile("crl.txt", crlDER, 0755); err != nil {
		panic(err)
	}
}
```

> 源码参见@TODO: codes/crl.go文件

加载CRL的客户端程序如下

```go
// +build ignore

package main

import (
	"codes/utils"
	"crypto/tls"
	"crypto/x509"
	"fmt"
	"io/ioutil"
	"net/http"
)

func main() {
	crlDER, err := ioutil.ReadFile("crl.txt")
	if err != nil {
		panic(err)
	}

	crl, err := x509.ParseCRL(crlDER)
	if err != nil {
		panic(err)
	}

	_, caCert, err := utils.LoadKeyAndCert("ca")
	if err != nil {
		panic(err)
	}
	if err := caCert.CheckCRLSignature(crl); err != nil {
		panic(err)
	}

	caCertPEM, err := ioutil.ReadFile("ca.cert")
	if err != nil {
		panic(err)
	}

	// Configure a client to trust the server
	certPool := x509.NewCertPool()
	if ok := certPool.AppendCertsFromPEM(caCertPEM); !ok {
		panic("invalid cert in PEM")
	}

	verifyPeerCert := func(raw [][]byte, chains [][]*x509.Certificate) error {
		for _, chain := range chains {
			for _, cert := range chain {
				for _, r := range crl.TBSCertList.RevokedCertificates {
					if cert.SerialNumber.Cmp(r.SerialNumber) != 0 {
						continue
					}
					return fmt.Errorf("certificate was revoked: /cn=%s", cert.Subject.CommonName)
				}
			}
		}
		return nil
	}

	client := &http.Client{
		Transport: &http.Transport{
			TLSClientConfig: &tls.Config{
				RootCAs:               certPool,
				VerifyPeerCertificate: verifyPeerCert,
			},
		},
	}

	resp, err := client.Get("https://localhost:8443/")
	if err != nil {
		panic(err)
	}
	defer resp.Body.Close()

	body, err := ioutil.ReadAll(resp.Body)
	if err != nil {
		panic(err)
	}
	fmt.Println("response goes as")
	fmt.Printf("%s\n", body)
}
```

> 源码参见@TODO: codes/client_with_crl.go文件

检查CRL的作用
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

对百到千级别大小的吊销列表，CRL完全够用了。但开放的互联网下，这种方案就略显不足了。这是可利用OCSP向CA查询证书是否合法。CA需要反馈证书在一小段时间内是否合法。但是，这种方案也有问题。CA可能处理不了由此带来的大量请求。再者，考虑到隐私的话，请求CA验证所访问网页的证书会使得CA知晓我们浏览历史，这显然是不好的。OCSA stapling应运而生。

实现OCSP stapling的`Certificate`的`OCSPStaple`字段用法如下示例代码。CA端利用`golang.org/x/net/crypto/ocsp`响应类型来创建OCSP响应。给`DialTLS`传入一份自定义的TLS配置，然后在里面执行额外验证，例如，验证OCSP响应不合法时直接退出。

服务器示例代码如下
```go
// +build ignore

package main

import (
	"codes/utils"
	"crypto/tls"
	"fmt"
	"net/http"
	"time"

	"golang.org/x/crypto/ocsp"
)

func main() {
	caPrivKey, caCert, err := utils.LoadKeyAndCert("ca")
	if err != nil {
		panic(err)
	}

	_, serverCert, err := utils.LoadKeyAndCert("server")
	if err != nil {
		panic(err)
	}

	ocspResp := ocsp.Response{
		Status:       ocsp.Good,
		SerialNumber: serverCert.SerialNumber,
		ThisUpdate:   time.Now(),
		NextUpdate:   time.Now().Add(time.Minute),
	}
	ocspStaple, err := ocsp.CreateResponse(caCert, serverCert, ocspResp, caPrivKey)
	if err != nil {
		panic(err)
	}

	// Load the certificate and private key as a TLS certificate
	servTLSCert, err := tls.LoadX509KeyPair("server.cert", "server.key")
	if err != nil {
		panic(err)
	}
	servTLSCert.OCSPStaple = ocspStaple

	serv := http.Server{
		Addr: "localhost:8443",
		Handler: http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			fmt.Fprintln(w, "You're using HTTPS")
		}),
		// Configure TLS options
		TLSConfig: &tls.Config{Certificates: []tls.Certificate{servTLSCert}},
	}

	// Begin serving TLS
	if err := serv.ListenAndServeTLS("", ""); err != nil {
		panic(err)
	}
}
```

> 源码参见@TODO: codes/server_with_ocsp.go文件

客户端示例代码如下

```go
// +build ignore

package main

import (
	"crypto/tls"
	"crypto/x509"
	"fmt"
	"io/ioutil"
	"net"
	"net/http"

	"golang.org/x/crypto/ocsp"
)

//func verifyOCSP(s *tls.ConnectionState) error {
func verifyOCSP(s tls.ConnectionState) error {
	if len(s.OCSPResponse) == 0 {
		return fmt.Errorf("remote didn't provide ocsp staple response")
	}
	for _, chain := range s.VerifiedChains {
		if n := len(chain); n < 2 {
			return fmt.Errorf("verified chain contained too few certificates: %d", n)
		}

		serverCert := chain[0]
		caCert := chain[1]

		resp, err := ocsp.ParseResponseForCert(s.OCSPResponse, serverCert, caCert)
		if err != nil {
			return fmt.Errorf("invalid ocsp staple data: %v", err)
		}
		if err := resp.CheckSignatureFrom(caCert); err != nil {
			return fmt.Errorf("invalid ocsp signature: %v", err)
		}
		if resp.Status != ocsp.Good {
			return fmt.Errorf("certificate revoked /cn=%s", serverCert.Subject.CommonName)
		}
	}
	return nil
}

func main() {
	caCertPEM, err := ioutil.ReadFile("ca.cert")
	if err != nil {
		panic(err)
	}

	// Configure a client to trust the server
	certPool := x509.NewCertPool()
	if ok := certPool.AppendCertsFromPEM(caCertPEM); !ok {
		panic("invalid cert in PEM")
	}

	client := &http.Client{
		Transport: &http.Transport{
			//TLSClientConfig: &tls.Config{RootCAs: certPool},
			DialTLS: func(network, addr string) (net.Conn, error) {
				tlsClientConfig := &tls.Config{RootCAs: certPool}
				conn, err := tls.Dial(network, addr, tlsClientConfig)
				if err != nil {
					return nil, err
				}
				if err := verifyOCSP(conn.ConnectionState()); err != nil {
					conn.Close()
					return nil, fmt.Errorf("ocsp validation failed: %v", err)
				}
				return conn, nil
			},
		},
	}

	resp, err := client.Get("https://localhost:8443/")
	if err != nil {
		panic(err)
	}
	defer resp.Body.Close()

	body, err := ioutil.ReadAll(resp.Body)
	if err != nil {
		panic(err)
	}
	fmt.Println("response goes as")
	fmt.Printf("%s\n", body)
}
```

> 源码参见@TODO: codes/client_with_ocsp.go文件

## 服务器名字标识（SNI） 

转换CA证书要比客户端证书复杂得多。云服务提供商发现客户端使用SNI（Server Name Identification）时会中断TLS通信。SNI面向的是一个前台服务器为后台多个服务器通信提供正确证书的问题。假想如下场景：一个诸如Cloudflare的服务器作为前台，后台管理着其他多个TLS服务器。前台服务器想要为其代理通信的后台服务器提供证书，而不是提供自己的证书（访问网页时，应该展示的是网站的证书而不是作为前台代理诸如Cloudflare的服务器证书）。

Go很人性地允许我们灵活地验证证书。SNI则是一种比较新奇的方式。哈萨克斯坦政府正是通过SNI来屏蔽网站的，而且还推行其他疯狂的措施，包括要求人们安装政府不安全的证书。Cloudflare是利用*加密版SNI*来解决上述问题的公司之一。更多详情，参见Let's Encrypt的SNI挑战问题和域名前置等。目前Go并不支持加密版SNI。

## 基于证书的授权

正如客户端想要验证服务器，服务器也会根据不同访问权限为客户端提供不同服务。例如，绿色密钥被赋予访问数据库的完整权限，而橙色密钥则只有读权限。第58页PPT展示了根据用于验证的证书实现上述需求的方式。

## 硬件密钥

硬件加固的密钥也是很好玩的。电脑已经可用于存储密钥。电脑的保护密钥就是这样做的。硬件加固密钥是通过把私钥存到硬件实现的。用户态下，我们无法访问到这个密钥。硬件提供这样一个接口用于接收签名请求--“不要告诉我私钥，只需用设备上的私钥帮我签名即可”。系统出问题遭受攻击时，攻击者必须利用内核级API才能进行操作，而不是靠我们泄露私钥文件的路径。（@TODO: 此句的翻译有待商榷）

Go的`Certificate`结构的`PrivateKey`可用于实现条件式接口，例如，向其提供一个能够利用接口方法执行ECDSA算法的`ECDSAKey`。

但是，TL;DR 在此声明一下：永远不要假设私钥会出现在内存中。它可能会存在其他密钥管理系统或硬件，因此，我们需要做就是简单地将私钥传入所有API。

## LetsEncrypt

LetsEncrypt简直不要太好，Go也对它有很好的集成。LetsEncrypt是一个CA，签发证书时会给指定域名发送挑战，要求另一端的服务器证明对域名的控制权。强力安利一波LetsEncrypt!

`golang.org/x/crypto/acme/autocert`是个优秀的Go包，能够简单地自动向我们提供被信任的证书。第72页PPT展示操作方式。需要注意的是：环境需要安全存储在诸如桶等地方。

## Certificate transparency  

Certificate transparency是当今Chrome浏览器新颖切不可或缺的一部分。它试图解决恶意CA发放不合理证书而不被发现的问题。例如，一个小CA为Google.com或Facebook.com的情形就是非常糟糕的。Certificate transparency就是为此而来的。

Certificate transparency是CA已发放证书的一个日志列表，所有已发放证书都会出现在这里。它是个经过加密证明的日志，确保了它的有效性。它利用了签名证书的时间戳。

Certificate transparency的[Go实现](@TODO:) 可列举这些证书。通过这种方式，我们可以检查是否有其他人获得某个DNS记录或私钥的使用权，并给我们的域名申请了证书。

## 小结

PKI的话题是很广泛的，没有对PKI的明确定义。个人建议如下：
- **上手HTTPS！**--不要再用HTTP给用户访问后端服务的机会了。我们要尽可能多这样做，毕竟生产环境用得就是HTTPS  
- 编写脚本用于生成证书，别用HTTP
- 谨记注意网络安全  