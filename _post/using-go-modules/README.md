---
title: 使用 Go Modules
date: 2019-11-23
categories:
  - language
tags:
  - golang
---

> 原文：[Using Go Modules](https://blog.golang.org/using-go-modules)，发表于 2019-03-19。译者根据最新的 Go 1.13.4 版本进行了相应更新

## 简介
这篇博文是以下系列的第一部分：
- **第 1 部 - 使用 Go Modules（本篇博文）**
- [第 2 部 - 迁移到 Go Modules](https://blog.golang.org/migrating-to-go-modules)
- [第 3 部 - 发布 Go Modules](https://blog.golang.org/publishing-go-modules)
- [第 4 部 - Go Modules：v2 及其未来](https://blog.golang.org/v2-go-modules)

Go 1.11 和 1.12 开始纳入[对 modules 的支持](https://golang.org/doc/go1.11#modules)，这是 Go [新的依赖管理系统](https://blog.golang.org/versioning-proposal)，明确依赖版本信息且使之更加容易管理。这篇博文会介绍使用 modules 所需的基本操作知识。

一个 module 是一个 [Go 包](https://golang.org/ref/spec#Packages)的集合，保存在一个文件树中。这个文件树的根目录有一个 `go.mod` 文件。`go.mod` 文件定义了 module 的 *module path*（用作根目录的导入路径）和**所需依赖**（其他 modules 的成功构建需要）。每个所需依赖都书写为一个 module path 和一个特定的[语义化版本](http://semver.org/)。

从 Go 1.11 开始，对于当前或其任何父目录具有 `go.mod` 文件且*在 $GOPATH/src 之外*的目录，go 命令默认会启用 modules。（$GOPATH/src 内部的话，出于兼容性考虑，go 命令仍会以旧的 GOPATH 模式运行，即使能够找到一个 go.mod 文件。详情参见 [go 命令文档](https://golang.org/cmd/go/#hdr-Preliminary_module_support)）。从 Go 1.13 开始，module 模式成为所有开发的默认模式。

本篇博文逐步介绍使用 modules 开发 Go 代码时会遇到的一系列常用操作：
- 创建新 module
- 添加依赖
- 升级依赖
- 添加一个新大版本号的依赖
- 将依赖升级到一个新的大版本
- 移除未被使用的依赖

## 创建新 module
让我们创建一个新的 module 吧。

在 $GOPATH/src 之外的某处创建一个新的空目录，cd 进入这个目录，新建一个名为 `hello.go` 的源文件：

```go
package hello

func Hello() string {
    return "Hello, world."
}
```

并在 `hello_test.go` 编写一个测试：

```go
package hello

import "testing"

func TestHello(t *testing.T) {
    want := "Hello, world."
    if got := Hello(); got != want {
        t.Errorf("Hello() = %q, want %q", got, want)
    }
}
```

到此为止，这个目录包含一个包，但不是一个 module，因为没有相应的 go.mod 文件。假设我们的工作目录为 `/home/gopher/hello`，立即执行 `go test`，我们会看到：

```bash
$ go test
PASS
ok      _/home/gopher/hello    0.020s
$
```

最后一行总结了包的全部测试情况。由于我们既不在 $GOPATH 也不在任何 module 内，go 命令不知道当前目录的导入路径，而是基于目录名称虚构了一个假的：`_/home/gopher/hello`。

使用 `go mod init` 命令把当前目录转变为一个 module，重新执行 `go test`：

```bash
$ go mod init example.com/hello
go: creating new go.mod: module example.com/hello
$ go test
PASS
ok      example.com/hello    0.020s
$
```

恭喜你！你已经编写并测试了你的第一个 module。

`go mod init` 命令创建的 `go.mod` 文件如下：

```bash
$ cat go.mod
module example.com/hello

go 1.13
$
```

`go.mod` 只会存在 module 的根目录。子目录的包导入路径由 module 路径拼接上子目录的路径。例如，如果我们新建一个子目录 `world`，我们不需要（也不想要）在那里执行 `go mod init`。这个包会被自动识别为 `example.com/hello` module 的一部分，具有导入路径 `example.com/hello/world`。

## 添加依赖

Go modules 的主要动机是改善使用（也即，添加依赖于）其他开发者所写代码的体验。

让我们更新 `hello.go` 文件，导入 `rsc.io/quote`，使用它来实现 `Hello`：

```go
package hello

import "rsc.io/quote"

func Hello() string {
    return quote.Hello()
}
```

现在再次执行测试：

```bash
$ go test
go: finding rsc.io/quote v1.5.2
go: downloading rsc.io/quote v1.5.2
go: extracting rsc.io/quote v1.5.2
go: finding rsc.io/sampler v1.3.0
go: finding golang.org/x/text v0.0.0-20170915032832-14c0d48ead0c
go: downloading rsc.io/sampler v1.3.0
go: extracting rsc.io/sampler v1.3.0
go: downloading golang.org/x/text v0.0.0-20170915032832-14c0d48ead0c
go: extracting golang.org/x/text v0.0.0-20170915032832-14c0d48ead0c
PASS
ok      example.com/hello    0.023s
$
```

go 命令基于 `go.mod` 列举的依赖 module 版本确定导入的包。遇到导入 `go.mod` 所列举的所有 module 都不提供的包的情况时，go 命令会自动查找包含这个包的 module，并把其最新版本添加到 `go.mod`（此处的“最新”定义为最新的打标签的稳定（非[预发布](https://semver.org/#spec-item-9)）版本，没有的话就是最新打标签的预发布版本，再没有的话就选最新没打标签的版本）。在我们的示例里，`go test` 将 `rsc.io/quote` 定向到 `rsc.io/quote v1.5.2` module。它还下载了 `rsc.io/quote` 使用的两个依赖 `rsc.io/sampler` 和 `golang.org/x/text`。`go.mod` 只会记录直接依赖：

```bash
$ cat go.mod
module example.com/hello

go 1.13

require rsc.io/quote v1.5.2
$
```

因为 `go.mod` 已经最新且下载的 modules 会被缓存到本地（在 $GOPATH/pkg/mod），以后执行 `go test` 不会重复此项工作:

```bash
$ go test
PASS
ok      example.com/hello    0.020s
$
```

注意了：go 命令确实使得添加新依赖变得快速和容易，但是也不会没有代价的。我们的 module 现在诸如正确性、安全性和合适的版权证书等方面就显式地*依赖*于新的依赖。想要了解更多的话，参见 Russ Cox 的博文：[Our Software Dependency Problem](https://research.swtch.com/deps)

如上可见，添加一项直接依赖经常会引入其他间接依赖。`go list -m all` 命令会列举出当前 module 和它的所有依赖：

```bash
$ go list -m all
example.com/hello
golang.org/x/text v0.0.0-20170915032832-14c0d48ead0c
rsc.io/quote v1.5.2
rsc.io/sampler v1.3.0
$
```

`go list` 的输出中，当前 module 也被称为 `main module` 总是在第一行，而后是根据 module path 排序的依赖。

`golang.org/x/text`的版本`v0.0.0-20170915032832-14c0d48ead0c`是[伪版本](https://golang.org/cmd/go/#hdr-Pseudo_versions)的示例，是 go 命令规定的特定没打标签的 commit 的版本语法。

除了 `go.mod` 之外，go 命令还维护者一个称为 `go.sum` 的文件，包含着特定版本 module 内容的[加密哈希](https://golang.org/cmd/go/#hdr-Pseudo_versions)：

```bash
$ cat go.sum
golang.org/x/text v0.0.0-20170915032832-14c0d48ead0c h1:qgOY6WgZO...
golang.org/x/text v0.0.0-20170915032832-14c0d48ead0c/go.mod h1:Nq...
rsc.io/quote v1.5.2 h1:w5fcysjrx7yqtD/aO+QwRjYZOKnaM9Uh2b40tElTs3...
rsc.io/quote v1.5.2/go.mod h1:LzX7hefJvL54yjefDEDHNONDjII0t9xZLPX...
rsc.io/sampler v1.3.0 h1:7uVkIFmeBqHfdjD+gZwtXXI+RODJ2Wc4O7MPEh/Q...
rsc.io/sampler v1.3.0/go.mod h1:T1hPZKmBbMNahiBKFy5HrXp6adAjACjK9...
$
```

go 命令使用 `go.sum` 文件确保将来下载的这些 modules 会和第一次下载的一致，保证我们项目依赖的 modules 不会非由于恶意、意外或其他理由发生非预期的变更。`go.mod`和`go.sum`都应该纳入版本管理系统。

## 升级依赖

Go modules 基于语义化版本标签来引用特定版本。一个语义化版本由 3 部分组成：major、minor 和 patch。以 v0.1.2 为例，大版本为 0，小版本号为 1，补丁版本号为 2。让我们演示一些小版本更新。后面小节会描述大版本升级。

从 `go list -m all` 的输出可以看到我们使用的 `golang.org/x/text` 的没打标签的版本。让我们升级到最新的打标签的版本，并测试一切安好：

```bash
$ go get golang.org/x/text
go: finding golang.org/x/text v0.3.0
go: downloading golang.org/x/text v0.3.0
go: extracting golang.org/x/text v0.3.0
$ go test
PASS
ok      example.com/hello    0.013s
$
```

哇！一切正常。再看看 `go list -m all`和`go.mod`文件：

```bash
$ go list -m all
example.com/hello
golang.org/x/text v0.3.0
rsc.io/quote v1.5.2
rsc.io/sampler v1.3.0
$ cat go.mod
module example.com/hello

go 1.12

require (
    golang.org/x/text v0.3.0 // indirect
    rsc.io/quote v1.5.2
)
$
```

`golang.org/x/text`包升级到了最新打标签的版本（v0.3.0）。`go.mod`文件也被更新后指向 v0.3.0。`indirect`注释注明这不是当前 module 直接使用的依赖，只是被其他 module 依赖间接使用而已。详情请查看 `go help modules`。

现在，让我们尝试升级 `rsc.io/sampler` 的小版本。同样的方式，执行 `go get` 然后执行测试：

```bash
$ go get rsc.io/sampler
go: finding rsc.io/sampler v1.99.99
go: downloading rsc.io/sampler v1.99.99
go: extracting rsc.io/sampler v1.99.99
$ go test
--- FAIL: TestHello (0.00s)
    hello_test.go:8: Hello() = "99 bottles of beer on the wall, 99 bottles of beer, ...", want "Hello, world."
FAIL
exit status 1
FAIL    example.com/hello    0.014s
$
```

噢哦！测试不通过表明 `rsc.io/sampler` 的最新版本和我们的用法不兼容。让我们查看一下这个 module 的可用打标签的版本：

```bash
$ go list -m -versions rsc.io/sampler
rsc.io/sampler v1.0.0 v1.2.0 v1.2.1 v1.3.0 v1.3.1 v1.99.99
$
```

我们一直用的是 v1.3.0；显然 v1.99.99 用不上。或许我们可以用 v1.3.1 试试：

```bash
$ go get rsc.io/sampler@v1.3.1
go: finding rsc.io/sampler v1.3.1
go: downloading rsc.io/sampler v1.3.1
go: extracting rsc.io/sampler v1.3.1
$ go test
PASS
ok      example.com/hello    0.022s
$
```

注意 `go get` 的参数里面显式的 `@v1.3.1`。通常情况下，所有传给`go get`的参数都可以接受一个显式的版本号；默认值为`@latest`，指向之前描述的最新版本。

## 添加一个新大版本号的依赖

为我们的包添加一个新函数：`func Proverb`返回一个 Go 的并发谚语，返回值由 `quote.Concurrency`（依赖 `rsc.io/quote/v3` module）提供。首先，我们需要更新 `hello.go`，添加新函数：

```go
package hello

import (
    "rsc.io/quote"
    quoteV3 "rsc.io/quote/v3"
)

func Hello() string {
    return quote.Hello()
}

func Proverb() string {
    return quoteV3.Concurrency()
}
```

然后再 `hello_test.go` 添加测试：

```go
func TestProverb(t *testing.T) {
    want := "Concurrency is not parallelism."
    if got := Proverb(); got != want {
        t.Errorf("Proverb() = %q, want %q", got, want)
    }
}
```

接下来测试我们的代码：

```bash
$ go test
go: finding rsc.io/quote/v3 v3.1.0
go: downloading rsc.io/quote/v3 v3.1.0
go: extracting rsc.io/quote/v3 v3.1.0
PASS
ok      example.com/hello    0.024s
$
```

注意：我们的 module 现在依赖了 `rsc.io/quote` 和 `rsc.io/quote/v3`：

```bash
$ go list -m rsc.io/q...
rsc.io/quote v1.5.2
rsc.io/quote/v3 v3.1.0
$
```

Go module 的每个不同大版本号（v1，v2，依次类推）都会使用不同的 module path：从 v2 开始，路径必须以大版本结尾。在上面的例子中，`rsc.io/quote`的`v3`版本不再是`rsc.io/quote`，而是以 `rsc.io/quote/v3` module 路径来标识自己。这个习惯用法被称为[语义化导入版本管理](https://research.swtch.com/vgo-import)，它赋予不兼容的包（具有不同的大版本）不同名字。相反的是，`rsc.io/quote`的`v1.6.0`应该和`v1.5.2`后向兼容，因此，它重用了名字 `rsc.io/quote`（上一小节中，`rsc.io/sampler v1.99.99`*理应*和`rsc.io/sampler v1.3.0`后向兼容，可能原因是 bugs 和基于 module 行为的错误客户端假设）。

**`go`命令只允许一次构建包含特定 module 路径的至多一个版本**，也即至多一个大版本：一个`rsc.io/quote`，一个`rsc.io/quote/v2`，一个`rsc.io/quote/v3`，依次类推。这样可以明确告诉 module 作者一个 module 路径的可能重复规则：一个程序不可能在构建时同时包含`rsc.io/quote v1.5.2`和`rsc.io/quote v1.6.0`。同时，允许一个 module 具有不同大版本（因为他们具有不同路径）使得 module 消费者能够逐步升级大版本号。这个例子里面，我们想要使用`rsc.io/quote/v3 v3.1.0`提供的`quote.Concurrency`，但是又没准备好移除`rsc.io/quote v1.5.2`。逐步增量迁移的能力对于大程序或代码库尤为重要。

## 将依赖升级到一个新的大版本

让我们完全从`rsc.io/quote`迁移到只使用`rsc.io/quote/v3`。由于大版本变了，我们应该预料到一些 API 可能已被移除、重命名或者以其他不兼容的方式更改。查阅文档，我们发现`Hello`变成了`HelloV3`：

```bash
$ go doc rsc.io/quote/v3
package quote // import "rsc.io/quote/v3"

Package quote collects pithy sayings.

func Concurrency() string
func GlassV3() string
func GoV3() string
func HelloV3() string
func OptV3() string
$
```

我们可以把`hello.go`的`quote.Hello()`为`quoteV3.HelloV3()`：

```go
package hello

import quoteV3 "rsc.io/quote/v3"

func Hello() string {
    return quoteV3.HelloV3()
}

func Proverb() string {
    return quoteV3.Concurrency()
}
```

到此为止，导入路径重命名就不用了，我们可以撤销重命名如下：

```go
package hello

import "rsc.io/quote/v3"

func Hello() string {
    return quote.HelloV3()
}

func Proverb() string {
    return quote.Concurrency()
}
```

让我们重新运行测试以确保一切正常：

```bash
$ go test
PASS
ok      example.com/hello       0.014s
```

## 移除未被使用的依赖

我们已经移除了对`rsc.io/quote`的所有依赖，但是它依然出现在`go list -m all`和`go.mod`文件中：

```bash
$ go list -m all
example.com/hello
golang.org/x/text v0.3.0
rsc.io/quote v1.5.2
rsc.io/quote/v3 v3.1.0
rsc.io/sampler v1.3.1
$ cat go.mod
module example.com/hello

go 1.13

require (
    golang.org/x/text v0.3.0 // indirect
    rsc.io/quote v1.5.2
    rsc.io/quote/v3 v3.0.0
    rsc.io/sampler v1.3.1 // indirect
)
$
```

为什么？因为构建一个包时（使用`go build`或`go test`等命令），可以很容易发现缺失而需要添加的东西，但是这时并不能安全地移除某些东西。只有在检查了 module 的所有包以及这些包所有可能的 build tag 组合之后，才能移除一个依赖。一个平常的构建命令没有加载这份信息，所以它不可以安全地移除依赖。

`go mod tidy`命令清除这些没用的依赖：

```bash
$ go mod tidy
$ go list -m all
example.com/hello
golang.org/x/text v0.3.0
rsc.io/quote/v3 v3.1.0
rsc.io/sampler v1.3.1
$ cat go.mod
module example.com/hello

go 1.12

require (
    golang.org/x/text v0.3.0 // indirect
    rsc.io/quote/v3 v3.1.0
    rsc.io/sampler v1.3.1 // indirect
)

$ go test
PASS
ok      example.com/hello    0.020s
$
```

## 结论

Go modules 是 Go 未来的依赖管理系统。Module 功能已经在所有支持的 Go 版本（即 Go 1.11 和 Go 1.12）中可用。

这篇博文介绍了使用 Go modules 的以下流程：
- `go mod init`新建一个新 module，初始化一份`go.mod`文件来描述这个 module
- `go build`，`go test`和其他包构建命令根据需要向`go.mod`添加新依赖
- `go list -m all`打印当前 module 的依赖
- `go get`改变依赖的所需版本（或者添加新依赖）
- `go mod tidy`移除部可用的依赖

鼓励大家在本地开发时把 module 用起来，添加`go.mod`和`go.sum`文件到你们的项目。如果想要提交反馈或帮助塑造 Go 未来的依赖管理系统的话，请给我们提交 [bug 报告](https://golang.org/issue/new)或[体验报告](https://golang.org/wiki/ExperienceReports)。

感谢大家的反馈和优化 modules 的帮助。