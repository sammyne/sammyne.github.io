---
title: 常数时间
date: 2019-07-07 12:25
categories:
  - software engineering
tags: 
  - golang
---

> 原文：https://dave.cheney.net/2019/06/10/constant-time

这篇文章是对我关于个人所最喜爱Go特性的[dotGO 2019演讲](https://www.youtube.com/watch?v=pN_lm6QqHcw)的延伸。

多年以前，Rob Pike有言：

> 数字就是数字，一个.go源文件绝不会出现0x80ULL  
> -- Rob Pike, [The Go Programming Language](https://www.youtube.com/watch?v=rKnDgT73v8s)

这短句折射着Go的常量世界之美。如Rob所提及那样，我们也许对数字即常量都习以为常了。这篇文章将会展示一些你所不了解的关于Go `const`关键字的特性。

## 为什么常量如此之美  
我们先从为什么常量是美妙说起。用上我心头的是以下3件事：
- *不变性*（immutability）：常量是Go里面仅有的为数不多的用于表达不变性的方式  
- *明确性*（clarity）：常量让我们可以从代码中提炼出魔幻数字，赋予他们名字和语义  
- *性能*（performance）：能够告知编译器某物不变是实现优化的关键，诸如常量折叠（??），常量传递，分支和不可达代码精简等都和这相关  
  
## 一个难点
为了演示Go常量的强大，让我们小试身手：声明一个值为自然机器字的比特位数的常量。

~~`unsafe.Sizeof`的返回的不是常量 [1]。~~  我们可以采用build标签，手动地记录每个Go平台的自然字大小，或者可以采用以下表达式：

```go
const uintSize = 32 << (^uint(0) >> 32 & 1)
```

这类遍布Go源码库的表达式的工作原理基本一致。如果当前平台是64位的，那么异或或对所有0取反的运算得到一个比特位全1的数，准确来讲事64个比特位。

```go
11111111 11111111 11111111 11111111 11111111 11111111 11111111 11111111
```

如果右移32位会得到低32位是1的数。

```go
00000000 00000000 00000000 00000000 11111111 11111111 11111111 11111111
```

将其和1进行与运算得到1，
```go
00000000 00000000 00000000 00000000 11111111 11111111 11111111 11111111 & 1 = 1
```

最后将32左移一位得到64[2]

```go
32 << 1 = 64
```

这是常量表达式的例子之一。所有这些运算都发生在编译时，所得结果自身是一个常量。如果你瞅一眼`runtime`包，尤其关于垃圾回收部分，你会看到常量表达式如何基于代码编译的目标机器字的大小构造复杂的不变式。

可见，这操作有点骚见，但大多数编译会在编译时为你执行常量折叠操作。

## 常量也是值  

Go的常量是值，而每个值都具有类型。Go允许用户自定义类型具有自己的方法。因此，一个常量值可以有自己的方法集。如果对此有所惊讶的话，我们来看一个也许习以为常的例子。

```go
const timeout = 500 * time.Millisecond
fmt.Println("The timeout is", timeout) // 500ms
```

上述例子中，无类型字面常量500乘于`time.Millisecond`（本身是`time.Duration`类型）。Go的赋值规则是：除非显式声明，否则赋值符号左手边的类型由右手边的类型推断得到。500是无类型常量，会被转换为`time.Duration`，然后乘于常量`time.Millisecond`。

综上，`timeout`是`time.Duration`类型的常量，值为 500000000。

然而为什么`fmt.Println`的打印结果是 500ms，而不是 500000000呢？

因为[`time.Duration`](https://godoc.org/time#Duration)有一个[`String`](https://godoc.org/time#Duration.String)方法，使得任意`time.Duration`类型，包括常量，都知道如何友好地展示自己。

现在我们知道常量具有类型和类型可以声明方法，我们可以推断：*常量值来实现接口*。事实上`fmt.Println`就是这样一个不久前遇到的例子，它不要求值具有`String`方法，而是要求值实现`Stringer`接口。

让我们聊一聊这个特性可以如何帮助优化代码。在那之前，我先稍微离题谈一下单例模式。

## 单例  
无论是Go还是其他语言，我都不是单例模式的粉丝。单例模式加大了测试难度且在不同之间引入不必要的耦合。个人认为：单例模式通常不是用于创建某物的唯一实例，而是开辟空间用于协调注册事宜。`net/http.DefaultServeMux`就是这么一个优秀样例。

```go
package http

// DefaultServeMux is the default ServeMux used by Serve.
var DefaultServeMux = &defaultServeMux

var defaultServeMux ServeMux
```

`defaultServeMux`怎么看都不是单例，我们可以随便新建另外一个`ServeMux`。事实上，`http`包为我们随意创建`ServeMux`提供了一个辅助函数。

```go
// NewServeMux allocates and returns a new ServeMux.
func NewServeMux() *ServeMux { return new(ServeMux) }
```

`http.DefaultServeMux`不是单例。然而，事物作为真正单例的情形是存在的，因为他们仅能表示唯一的事物。进城的文件描述符就是这么一个好样例；0、1和2分别代表标准输入、标准输出和标准错误输出。

对它们来说，名字是次要的，1总是表示标准输出，但文件描述符1永远只有一个。因此，以下两个运算是等价的：

```go
fmt.Fprintf(os.Stdout, "Hello dotGo\n")
syscall.Write(1, []byte("Hello dotGo\n"))
```

我们看一下`os`包是如何定义`Stdin`，`Stdout`和`Stderr`的：

```go
package os

var (
    Stdin  = NewFile(uintptr(syscall.Stdin), "/dev/stdin")
    Stdout = NewFile(uintptr(syscall.Stdout), "/dev/stdout")
    Stderr = NewFile(uintptr(syscall.Stderr), "/dev/stderr")
)
```

这种声明方式存在几个问题：首先，它们的类型是`*os.File`，不符合`io.Reader`和`io.Writer`接口。用户一致抱怨此设定使得替代它们变得困难。然而，想要替换这类变量的想法是我离题所谈想要表达的（反对的？）。程序一旦启动，我们能够安全地替换`os.Stdout`的值而不引发数据竞态么？

我觉得此替换操作一般是不可行的。通常来讲，如果某个操作不是安全的，作为程序猿就不应该让用户有它是安全的错觉，[避免他们依赖这种行为](http://www.hyrumslaw.com/)。

我们是否可以更改`os.Stdout`和类似的变量的定义，使得它们保持可监控的读写行为且保持不变呢？用变量就可以很容易实现这种想法。

```go
type readfd int

func (r readfd) Read(buf []byte) (int, error) {
    return syscall.Read(int(r), buf)
}

type writefd int

func (w writefd) Write(buf []byte) (int, error) {
    return syscall.Write(int(w), buf)
}

const (
    Stdin  = readfd(0)
    Stdout = writefd(1)
    Stderr = writefd(2)
)

func main() {
    fmt.Fprintf(Stdout, "Hello world")
}
```

事实上，这项更改仅会引入一个标准库的编译错误[3]。

## 哨兵型错误值  
哨兵型错误值是另一种看起来像常量，而实际不是的变量。`io.EOF`、`sql.ErrNoRows`和`crypto/x509.ErrUnsupportedAlgorithm`等都是哨兵型错误值。它们都可归类为*预期型*错误，且因为都是预期的，它们也期望得到我们的检查。

为了比较所得错误及其期望值，我们需要导入定义这个错误的包。根据定义，因为哨兵型错误是导出的公有变量，例如`io`包等任何导入这个变量的代码都可以修改`io.EOF`的值。

```go
package nelson

import "io"

func init() {
    io.EOF = nil // haha!
}
```

这个稍后会再提及。已知`io.EOF`的名字，我们可以导入声明它的包，这对将其与我们的错误值比较来说是必须的，而一旦导入，这个错误值就可以被我修改了。历史传统和碰运气的想法不建议我们编写这样的代码，但是技术上限制不了这种行为。

替换`io.EOF`基本上会被立即发现。但是替换少用的哨兵型错误值会触发一些有趣的边际效应。

```go
package innocent

import "crypto/rsa"

func init() {
    rsa.ErrVerification = nil // 🤔
}
```

如果你期望竞态检查器能够发现如此骚操作的话，我建议你和那些编写testing框架时替换掉`os.Stdout`而不惊动竞态检查器的老哥聊一聊。

## 可互换性  
我又想离题一会，谈一下常量的最重要性质。常量不仅不可变，使得我们不能覆写它们的声明是不够的，它们还是**可互换的**。如此重要的限制并没有得到应有的关注。

可互换是等同的意思。钱就是体现可互换型的好例子。现在你借我10美元，回头我还你。作为金融手段常规操作，你给我了一张10美元的支票，我还你的是10张1元美钞。可互换的事物在定义上是等同的，而等同是有助于编程的强大手段之一。

```go
var myEOF = errors.New("EOF") // io/io.go line 38
fmt.Println(myEOF == io.EOF)  // false
```

暂且不说坏人对代码库的影响，哨兵型错误的最大挑战在设计时它们表现为单例而不是常量。即使遵循`io`包完全一致的流程创建我们的EOF值，`myEOF`和`io.EOF`也是不等的。`myEOF`和`io.EOF`不可互换，替代彼此。程序会发现这个不同点。

在没有保证不可变性、可互换性和等价性的前提下，Go的哨兵型错误不是常量表达式的事实会引发一系列奇怪的现象。但是如果它们是常量呢？

## 常量型错误  
理想的哨兵型错误应该表现为常量，不可变也可互换。让我们回顾一下Go的内置`error`接口的工作原理。

```go
type error interface {
    Error() string
}
```

任何具有`Error() string`方法的类型都满足`error`接口，具体包括用户自定义类型、`string`等基本类型的派生类型和常量字符串等。基于上述背景，看一下以下`error`实现：

```go
type Error string

func (e Error) Error() string {
    return string(e)
}
```

这个错误类型可用作常量表达式：

```go
const err = Error("EOF")
```

不同于作为结构体的`error.errorString`，紧凑的结构体字面量初始值并不是也不能作为一个常量表达式。

```go
const err2 = errors.errorString{"EOF"} // doesn't compile
```

而刚才定义的`Error`类型不是变量，它们是不可变的。

```go
const err = Error("EOF")
err = Error("not EOF")   // doesn't compile
```

而且，两个内容一致的字符串常量是恒等的。

```go
const str1 = "EOF"
const str2 = "EOF"
fmt.Println(str1 == str2) // true
```

这也就意味着派生于string的类型的两个相同内容的常量也是相等的。

```go
type Error string

const err1 = Error("EOF")
const err2 = Error("EOF")
fmt.Println(err1 == err2) // true
```

换句话讲，相等的常量`Error`值是一样的，就像字面常量1和其他任意字面常量1相等。

现在基本组件在手，我们可以创建类似`io.EOF`和`rsa.ErrVerfication`的、不可变的、可互换的常量型哨兵型错误了。

```go
% git diff
diff --git a/src/io/io.go b/src/io/io.go
index 2010770e6a..355653b4b8 100644
--- a/src/io/io.go
+++ b/src/io/io.go
@@ -35,7 +35,12 @@ var ErrShortBuffer = errors.New("short buffer")
 // If the EOF occurs unexpectedly in a structured data stream,
 // the appropriate error is either ErrUnexpectedEOF or some other error
 // giving more detail.
-var EOF = errors.New("EOF")
+const EOF = ioError("EOF")
+
+type ioError string
+
+func (e ioError) Error() string { return string(e) }
```

上述变更也许有点过度使用Go 1的规范，但是没有明文规定我们不能在自己写的包里面采用这种常量错误模式。

## 总结

Go的常量牛逼。仅看到它们的不变性的话，会错过很多有趣的东西。Go的常量有助于编写更加正确且更加难以误用的程序。

今天本文列举了数字型常量外的3种使用常量方式。

接下来就看你表现了，期待你对这些想法的拓展哟~

[1] 几个评审人提醒我这是不对的。`unsafe.Sizeof`是常量表达式。为我的不准确表达抱歉= =   
[2] 32比特的字大小计算就留给您小试身手吧  
[3] 讽刺的是，没能这样做的正是`testing`包，它采用了本节所警告的替换  

## 相关博文

1. [常量型错误](https://dave.cheney.net/2016/04/07/constant-errors)
2. [监控错误](https://dave.cheney.net/2014/12/24/inspecting-errors)
3. [Go，没有包级别的变量话](https://dave.cheney.net/2017/06/11/go-without-package-scoped-variables)
4. [检查完错误之余别忘优雅地处理它们](https://dave.cheney.net/2016/04/27/dont-just-check-errors-handle-them-gracefully)