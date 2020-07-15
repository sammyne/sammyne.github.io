---
title: 保持模块的兼容性
date: 2020-07-15
categories:
  - language
tags:
  - golang
---

> 原文：[Keeping Your Modules Compatible](https://blog.golang.org/module-compatibility)

## 引言

这是以下系列的第 5 部分：
- 第 1 部分 -- [使用 Go 模块][using-go-modules]
- 第 2 部分 -- [迁移到 Go 模块][migrating-to-go-modules]
- 第 3 部分 -- [发布 Go 模块][publishing-go-modules]
- 第 4 部分 -- [Go 模块：v2 和更多][v2-go-modules]
- **第 5 部分 -- 保持模块的兼容性**

随着时间流逝，我们为我们的模块新添特性、改变行为和重构模块的公开接口等，推进模块不断演进。正如 Go 模块：v2 和更多所讨论，对 v1+ 版模块的破坏性变更必须作为一个大版本更变的一部分（或者采用一个新的模块路径）。

然而，发布新的大版本给我们的用户带来不少问题。他们必须找到新版本，学习新的 API，更新代码。一些用户可能永不更新，这也就意味着我们必须为此一直维护两个版本的代码。因此，以兼容的方式来变更已有的包通常是更加可取的。

## 添加一个函数
破坏性的变更通常表现为往一个函数添加新的参数。我们接下来会展示一些应对此类变更的方式，但是在此之前，先看个失败的方法。

对于要添加的新参数有明确的默认值时，我们通常倾向于将其添加为可变参数。为了拓展以下函数

```go
func Run(name string)
```

添加一个默认值为 0 的额外变量 `size`，我们可能会尝试如下

```go
func Run(name string, size ...int)
```

因为这样一来，目前所有调用这个函数的地方依然能够继续工作。这方面是真的，但是其他使用 `Run` 的地方就不一定了，例如：

```go
package mypkg
var runner func(string) = yourpkg.Run
```

旧的 `Run` 函数能够在此正常运行时因为它的类型是 `func(string)`，但是新的 `Run` 函数的类型伟 `func(string, ...int)`，因此，赋值操作就会编译阶段报错了。

这个例子说明调用兼容性不足以保持向后兼容。事实上，没有向后兼容的变更能够应用在函数的签名上。

与其改变函数签名，添加新函数式可行的。例如， `context` 包添加到标准库之后，将 `context.Context` 作为函数的第一个参数添加给函数是常见实践之一。但是，稳定的 API 不能改变已有的导出函数来接收一个 `context.Context`，否则就会破坏所有那个函数的地方。

所以，新函数被添加了出来。例如，`database/sql` 包的 `Query` 方法的签名为（目前依然是这样）：

```go
func (db *DB) Query(query string, args ...interface{}) (*Rows, error)
```

`context` 包引入创建出来之后，Go 团队为 `database/sql` 添加了如下新方法：

```go
func (db *DB) QueryContext(ctx context.Context, query string, args ...interface{}) (*Rows, error)
```

为了避免复制代码，旧方法调用新方法：

```go
func (db *DB) Query(query string, args ...interface{}) (*Rows, error) {
    return db.QueryContext(context.Background(), query, args...)
}
```

添加新方法允许用户按照自己的节奏迁移到新的 API。由于方法名接近会被排序方法一起，且 `Context` 在方法名中，这种 `database/sql` 的拓展方式没有降低包的可读性或理解容易度。

如果预见到未来这个函数还需要更多参数，我们可以提前规划好，用一个可选参数作为函数签名的一部分。最快实现方式之一是如 `crypto/tls.Dial` 函数那样添加单个结构体参数：

```go
func Dial(network, addr string, config *Config) (*Conn, error)
```

`Dial` 执行的 TLS 握手需要网络类型和地址，但它的许多其他参数都是有合理默认值的。传递值为 `nil` 的 `config` 是采用这些默认值；而传入设置了默写字段值的 `Config` 结构体则会覆盖默写默认值。将来添加新的 TLS 配置参数只需要往 `Config` 结构体添加新的字段，这是一个向后兼容的变更（几乎一直都是这样的--参见后续的“维护结构体的兼容性”）。

有时新添函数和添加选项的技巧可通过将选项设为方法接收者的方式结合起来使用。以 `net` 包监听特定网络地址的不断演进为例。Go 1.11 之前，`net` 包只提供一个如下签名的 `Listen` 函数：

```go
func Listen(network, address string) (Listener, error)
```

到了 Go 1.11，两个新特性被添加到 `net` 的监听：传入一个上下文 `context`，并允许调用者提供一个“控制函数”来在创建之后绑定之前调整裸连接。新接口可以是一个新函数接收一个 `context`、网络、地址和控制函数。但是包作者考虑到将来可能还需要更多选项，因此添加了一个 [ListenConfig] 结构。预期定义一个名字冗长的底层函数，他们给 `ListenConfig` 添加了一个 `Listen` 方法：

```go
type ListenConfig struct {
    Control func(network, address string, c syscall.RawConn) error
}

func (*ListenConfig) Listen(ctx context.Context, network, address string) (Listener, error)
```

另一种考虑未来添加新选项的方式是“选项类型”模式，这种模式下，选项作为可变参数传递，每个选项都是一个改变要创建值的状态的函数。具体细节在 Rob Pike 的博客 [Self-referential functions and the design of options] 有详细描述。一个常见样例是 [google.golang.org/grpc][grpc] 的 [`DialOption`][DialOption]。

选项类型在函数参数中充当和结构体选项一样的角色：它们是传递改变行为配置的一种可拓展的方法。选择哪种方式纯粹看个人所好。以这个 gRPC 选项类型的 `DialOption` 的简单使用为例：

```go
grpc.Dial("some-target",
  grpc.WithAuthority("some-authority"),
  grpc.WithMaxDelay(time.Second),
  grpc.WithBlock())
```

也可以改写为如下结构体选项：

```go
notgrpc.Dial("some-target", &notgrpc.Options{
  Authority: "some-authority",
  MaxDelay:  time.Minute,
  Block:     true,
})
```

函数式选项有些缺点：它们要求每次调用时都在选项前书写包名；它们增加了包命名空间的大小；而且如果提供两次的同一选项会触发的后果不明。而另一方面，函数的结构体选项通常为 `nil`，让一些人觉得不好看。一个类型的零值具有合法意义时，要规定选项应该使用其默认值是比较难搞的，通常需要一个指针或者额外的布尔值。

以上两种方式都是确保我们模块的公开 API 未来拓展性的理性选择。

## 使用接口

有时，新特性要求改变公开的接口：例如，一个接口需要添加新方法。直接往接口添加函数是破坏性的变更--这样的话，我们那要怎样才能支持这个公开的接口新添方法呢？

基本思想是定一个具有新方法的新接口，然后每处使用旧接口的地方，动态检查提供的类型是旧类型还是新类型。

让我们以 [archive/tar] 包为例描述这种方法。[tar.NewReader] 接收一个 `io.Reader`，但是随着时间推移，Go 团队发现如果能够调用 `Seek` 从一个文件头部跳到下一个文件头部会更加高效。但是，他们又不能往 `io.Reader` 添加 `Seek` 方法：那样做的话会破坏所有实现 `io.Reader` 的结构。

另一种不行的方式是让 `tar.NewReader` 接收 [`io.ReadSeeker`][io.ReadSeeker] 而不是 `io.Reader`，这样可以同时支持 `io.Reader` 的方法和 `Seek`（通过 `io.Seeker` 的方式）。但是，我们前面也看到，改变函数签名时破坏性的更变。

因此，它们觉得保持 `tar.NewReader` 的签名不变，但是在 `tar.Reader` 的方法里面检查并支持传入的参数是 `io.Seeker` 的类型的情形。

```go
package tar

type Reader struct {
  r io.Reader
}

func NewReader(r io.Reader) *Reader {
  return &Reader{r: r}
}

func (r *Reader) Read(b []byte) (int, error) {
  if rs, ok := r.r.(io.Seeker); ok {
    // Use more efficient rs.Seek.
  }
  // Use less efficient r.r.Read.
}
```

（实际代码参见 [reader.go]）

但我们遇到这种需要往现有接口添加方法的情形时，可以采用这种策略。一开始先创建拥有新方法的新接口，或者找到具有新方法的现有接口。然后，分离需要支持新方法的相关函数，检查类型是否符合第二个接口，一旦符合则执行使用这个借口的代码。

这种策略只适用于缺乏新方法的旧接口被一直支持的情形，限制这我们模块的未来拓展性。

如果可能，最好能够完全避免这类问题。例如涉及构造函数时，偏向返回具体类型。使用具体类型允许我们将来添加函数而不惊扰用户，接口就不一定能做到。这个属性允许将来我们的模块被更好地拓展。

温馨提示：如果你需要使用一个接口，这个接口不准备允许用户实现，这时我们可以添加一个非导出的方法。这样做可以防止定义在我们包外的类型在没有使用内嵌的情况下满足我们的接口，让我们以后能够添加方法而不会破坏用户的实现。例如，[`testing.TB` 的 `private()`][TB.private()] 方法：

```go
type TB interface {
    Error(args ...interface{})
    Errorf(format string, args ...interface{})
    // ...

    // A private method to prevent users implementing the
    // interface and so future additions to it will not
    // violate Go 1 compatibility.
    private()
}
```

这个话题在 Jonathan Amsterdam 的 Detecting Incompatible API Changes 的演讲中也有细节描述（[视频](https://www.youtube.com/watch?v=JhdL5AkH-AQ)，[幻灯片](https://github.com/gophercon/2019-talks/blob/master/JonathanAmsterdam-DetectingIncompatibleAPIChanges/slides.pdf)）。

## 添加配置方法

到目前为止，我们讨论的都是明显的破坏性变更，这种变更会改变某个类型或函数导致用户代码编译失败。然而，行为变更也是破坏用户代码，即使用户代码能够继续编译。例如，许多用户希望 [json.Decoder] 忽略 JSON 字符串中没有在参数结构体里面出现的字段。当 Go 团队想要为这种情况返回错误时，他们必须小心翼翼。如果没有提供一个主动选择的机制而直接返回错误，许多依赖这个方法的用户可能开始收到之前一直没有碰到的错误。

因此，与其为所有用户改变行为，他们给 `Decoder` 结构体添加了一个配置方法：[Decoder.DisallowUnknownFields]。调用这个方法让用户主动选择新的行为，反之则为现有用户保持旧的行为。

## 维持结构体的兼容性

综上可见，函数签名的任何改变都是破坏性的变更。对于结构体的话，情况要好一些。如果我们有一个导出的结构体类型，我们几乎总是可以添加一个字段或者移除非导出字段而不会破坏兼容性。添加字段时，确保它的零值是有意义的，并且保持旧的行为，使得现有没有给这个字段赋值的代码能够继续工作。

之前由于作者认为以后可能会支持更多选项， 他们在 Go 1.11 往 `net` 包引入了 `ListenConfig`。事实证明他们是正确的。在 Go 1.13，[KeepAlive] 字段被添加进来用于允许关闭 keep-alive 或者改变它的时长。默认的零值维持了原有的启用默认时长的 keep-alive 特性。

这里还有一种隐晦的字段添加方式会出其不意地破坏用户代码。如果结构体的所有字段类型都是可比较的--即这些类型的值可以用 `==` 和 `!=` 比较，并且这些值用作 map 的键时，整个结构体类型都是可比较的。这种情况下，添加一个心得不可比较的字段会使得现有的整个结构体类型变得不可比较，破坏任何比较这个结构体类型的值的代码。

为了使得一个结构体可比较，不要往其添加任何不可比较的字段。我们可以写个简单的测试来验证这一点，或者借用即将发布的 [gorelease] 工具来检查这个问题。

为了一开始就禁止比较，确保结构体有一个不可比较的字段类型即可。它可能本来就有了--除切片、map 和函数外的类型都是可比较的--如果还没有的话，我们按以下方式添加一个：

```go
type Point struct {
        _ [0]func()
        X int
        Y int
}
```

`func()` 类型是不可比较的，同时 0 长度的数组不会占用任何空间。我们可以定义一个类型来表明我们的意图：

```go
type doNotCompare [0]func()

type Point struct {
        doNotCompare
        X int
        Y int
}
```

我们应该在结构体里面使用 `doNotCompare` 吗？如果我们已经定义了用作指针的结构体--即它拥有指针方法，还可能有一个返回指针的构造函数 `NewXXX`--这时添加 `doNotCompare` 就可能小题大作了。指针类型的用户是理解这种类型的每个值都是不同的：即如果他们想要比较两个值的话，他们应该直接比较指针。

如果我们想要定义像 `Point` 例子那样直接用作值类型的结构体的话，通常情况下我们都是想要它是可比较的。对于我们不需要让值类型的结构体被比较的少数情况，添加一个 `doNotCompare` 字段使得我们以后可以自由地改变结构体而无需担心破坏任何比较。缺点就是，这个类型无法用作 map 的键。

## 结论

一开始从零开始设计 API 时，请仔细思考这份 API 应对以后新变更的可拓展程度。如果我们确实需要添加新特性，谨记规则：添加而不要改变或者删除，同时不要忘了例外情况--接口、函数参数和返回值是没法以向后兼容的方式添加的。

如果我们需要大幅度第改变我们的 API，或者一份 API 已经开始随着更多新特性的加入而偏离初衷，这时就应该引入新的大版本升级了。但是大多数情况下，实施一个向后兼容的变更是容易的且能够避免给我们的用户带来阵痛。

[archive/tar]: https://pkg.go.dev/archive/tar?tab=doc
[Decoder.DisallowUnknownFields]: https://pkg.go.dev/encoding/json?tab=doc#Decoder.DisallowUnknownFields
[DialOption]: https://pkg.go.dev/google.golang.org/grpc?tab=doc#DialOption
[gorelease]: https://pkg.go.dev/golang.org/x/exp/cmd/gorelease?tab=doc
[grpc]: https://pkg.go.dev/google.golang.org/grpc?tab=doc
[io.ReadSeeker]: https://pkg.go.dev/io?tab=doc#ReadSeeker
[json.Decoder]: https://pkg.go.dev/encoding/json?tab=doc#Decoder
[KeepAlive]: https://pkg.go.dev/net@go1.13?tab=doc#ListenConfig
[ListenConfig]: https://pkg.go.dev/net@go1.11?tab=doc#ListenConfig
[migrating-to-go-modules]: https://blog.golang.org/migrating-to-go-modules
[TB.private()]: https://github.com/golang/go/blob/83b181c68bf332ac7948f145f33d128377a09c42/src/testing/testing.go#L564-L567
[publishing-go-modules]: https://blog.golang.org/publishing-go-modules
[reader.go]: https://github.com/golang/go/blob/60f78765022a59725121d3b800268adffe78bde3/src/archive/tar/reader.go#L837
[Self-referential functions and the design of options]: https://commandcenter.blogspot.com/2014/01/self-referential-functions-and-design.html
[tar.NewReader]: https://pkg.go.dev/archive/tar?tab=doc#NewReader
[using-go-modules]: https://blog.golang.org/using-go-modules
[v2-go-modules]: https://blog.golang.org/v2-go-modules
