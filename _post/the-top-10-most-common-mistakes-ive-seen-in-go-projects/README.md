---
title: 我在Go项目遇到的10大最常见误用  
date: 2019-07-20
categories:
- language
- engineering
tags: 
- golang
---

> 原文：[The Top 10 Most Common Mistakes I’ve Seen in Go Projects](https://itnext.io/the-top-10-most-common-mistakes-ive-seen-in-go-projects-4b79d4f6cd65)

这篇博文列举我在 go 项目中遇到的最常见误用。描述顺序和主次无关。

## 表示"未知"的枚举值  

看个简单例子：

```go
type Status uint32

const (
	StatusOpen Status = iota
	StatusClosed
	StatusUnknown
)
```

这里用`iota`创建了一种枚举类型，产生以下效果：

```go
StatusOpen = 0
StatusClosed = 1
StatusUnknown = 2
```

设想`Status`类型作为JSON请求的一部分，会被序列化/反序列化的情况。我们可以为此设计以下数据结构：

```go
type Request struct {
	ID        int    `json:"Id"`
	Timestamp int    `json:"Timestamp"`
	Status    Status `json:"Status"`
}
```

从而得到类似如下形式的请求：

```json
{
  "Id": 1234,
  "Timestamp": 1563362390,
  "Status": 0
}
```

目前为止，一次寻常，`status`会被反序列化为`StatusOpen`。

那么，再看这样一个请求，它的`status`留空（因为某某原因）：

```json
{
  "Id": 1235,
  "Timestamp": 1563362390
}
```

这种情况下，`Request`的`Status`字段会被初始化为**零值**（`uint32`的零值为`0`），即被设置为`StatusOpen`而不是`StatusUnknown`。

最佳实践往往是将表示“未知”状态的值设为`0`对应的枚举值：

```go
type Status uint32

const (
	StatusUnknown Status = iota
	StatusOpen
	StatusClosed
)
```

此时，如果`status`不是 JSON 请求的一部分，它会按预期被初始化为`StatusUnknown`。

## 性能测试  

正确地测试性能难度挺大的。影响给定结果的因素多种多样。

常见错误之一来自某些编译器优化作怪。以 [teivah/bitvector](https://github.com/teivah/bitvector/?source=post_page---------------------------) 的实例来看：

```go
func clear(n uint64, i, j uint8) uint64 {
	return (math.MaxUint64<<j | ((1 << i) - 1)) & n
}
```

这个函数将特定范围内的比特置 0。为了测试它的性能，我们的代码可能如下：

```go
func BenchmarkWrong(b *testing.B) {
	for i := 0; i < b.N; i++ {
		clear(1221892080809121, 10, 63)
	}
}
```

这个性能测试中，编译器发现`clear`是个叶子函数（没有调用其他函数）后会内联它。一旦这个函数被内联，编译器进一步发现不会产生**副作用**。因此，`clear`就会被移除而产生不准确的结果。

一个应对方法是将结果赋给某个全局变量：

```go
var result uint64

func BenchmarkCorrect(b *testing.B) {
	var r uint64
	for i := 0; i < b.N; i++ {
		r = clear(1221892080809121, 10, 63)
	}
	result = r
}
```

此时，编译器无法推断这个调用是否会产生副作用，使得性能测试变得准确的。

### 延伸阅读

> [High Performance Go Workshop](https://dave.cheney.net/high-performance-go-workshop/dotgo-paris.html?source=post_page---------------------------#watch_out_for_compiler_optimisations)  
> Watch out for compiler optimisations.  
> -- dave.cheney.net

## 遍地指针

值传递会创建这个变量的一个副本，而指针传递则只会拷贝相应的内存地址。

因此，指针传递总是更快的，对吧？

如果你是这么认为的，请看看[这个例子](https://gist.github.com/teivah/a32a8e9039314a48f03538f3f9535537?source=post_page---------------------------)。这项性能测试对比对一个 0.3KB 的数据结构传指针和传值得对比。0.3KB 不大，但和我们大多数日常所见的数据结构类型差不多。

个人本地机器运行这些性能测试后，发现值传递比指针传递要快 **4 倍多**。是否觉得有点反常的样子？

对结果的原因分析涉及到 Go 管理内存的方式。我做不到 [William Kennedy](https://www.ardanlabs.com/blog/2017/05/language-mechanics-on-stacks-and-pointers.html?source=post_page---------------------------)大 神那般精彩绝伦的讲解，但是姑且归纳如下。

变量会被分配在**堆**或**栈**上。可简略地总结为：

- 栈存储特定**协程**执行过程**实时所需**的变量。函数一旦返回（译者注：应该是指变量涉及的步骤执行完），变量就会被出栈
- 堆存储**共享**变量（全局变量等）

看到返回值的简单例子：

```go
func getFooValue() foo {
	var result foo
	// Do something
	return result
}
```

这里，`result`变量在当前协程中创建。变量会被压入协程的栈空间。一旦函数返回，客户端会收到这个值的一个副本。变量本身会出栈。它会一直存在内存直至被其它值覆盖，但是**已经无法被访问了**。

对应地，返回指针的例子：

```go
func getFooPointer() *foo {
	var result foo
	// Do something
	return &result
}
```

`result`变量仍然是在当前协程中创建，但是客户端会收到一个指针（变量地址的副本）。`result`变量出栈的话，就**无法**再被客户端**访问**。

对于这种情形，Go 编译器会为`result`变量执行逃逸操作，把它放到共享变量区：**堆**。

指针传递还有一种情形如下：

```go
func main()  {
	p := &foo{}
	f(p)
}
```

由于`f`在同一协程内调用，`p`变量无须逃逸操作。`p`只需压入栈以供后续函数访问即可。

那为啥栈会如此**快**呢？理由主要有二：  
- 栈不依赖**垃圾回收器**。如我们所见，变量在创建时入栈，在函数返回后出栈，不会涉及复杂的流程用于重新获取无用的变量等
- 栈只属于一个协程，所以和堆对比，存储变量时不用进行同步。这也有助性能提升

综上，创建函数时，默认选项应该是**值而不是指针**。指针只有在需要共享变量时使用。

遇到性能问题时，一个备选项是分析某些特定情形下指针能否派上用场。通过`go build -gcflags "-m -m"`命令可以查看编译器何时会对变量进行逃逸操作。

但是，对于日常使用，值基本够了。

### 延伸阅读  

> [Language Mechanics On Stacks And Pointers](https://www.ardanlabs.com/blog/2017/05/language-mechanics-on-stacks-and-pointers.html?source=post_page---------------------------)  
> Prelude This is the first post in a four part series that will provide an understanding of the mechanics and design...
> -- www.ardanlabs.com

> [Understanding Allocations: the Stack and the Heap - GopherCon SG 2019](https://youtu.be/ZMZpH4yT7M0)

## Breaking a `for`/`switch` or a `for`/`select`  

`f()`返回`true`时下面的程序会如何执行：

```go
for {
  switch f() {
  case true:
    break
  case false:
    // Do something
  }
}
```

`break`会执行，然后跳出`switch`语句，但**不是 `for` 循环**。

类似问题代码：

```go
for {
  select {
  case <-ch:
  // Do something
  case <-ctx.Done():
    break
  }
}
```

`break`只会跳出`select`语句，而不是for循环。

应对这种`for`/`switch`或`for`/`select`的方法之一是采用 **标记型 `break`** 如下：

```go
loop:
	for {
		select {
		case <-ch:
		// Do something
		case <-ctx.Done():
			break loop
		}
	}
```

## 错误处理  

Go 在错误处理方面的经验还是比较少的。因此错误处理成为 Go 2 最让人期待的特性是有道理的。

当前标准库（Go 1.13 之前）只提供用于构造错误的函数。如果还不够用的话，建议瞅瞅 [pkg/errors](https://github.com/pkg/errors?source=post_page---------------------------)。

这个库推行以下没能得到一致遵循的好规范：

> 错误应该仅被处理**一次**。打印错误也**是**处理错误。因此，一个错误要么打印出来，要么向上传递。

当前标准库想要支持这个规范是比较困难的，它无法为错误添加上下文信息以形成某种层级结构。

看个预期会触发 DB 错误的 REST 调用例子：

```
unable to server HTTP POST request for customer 1234
 |_ unable to insert customer contract abcd
     |_ unable to commit transaction
```

`pkg/errors`在手的话，我们可以操作如下：

```go
func postHandler(customer Customer) Status {
	err := insert(customer.Contract)
	if err != nil {
		log.WithError(err).Errorf("unable to server HTTP POST request for customer %s", customer.ID)
		return Status{ok: false}
	}
	return Status{ok: true}
}

func insert(contract Contract) error {
	err := dbQuery(contract)
	if err != nil {
		return errors.Wrapf(err, "unable to insert customer contract %s", contract.ID)
	}
	return nil
}

func dbQuery(contract Contract) error {
	// Do something then fail
	return errors.New("unable to commit transaction")
}
```

最初的错误（不是第三方库返回的）可以通过`errors.New`创建。中间层，`insert`加入更多上下文包装一下它。然后，顶级函数打印出错误。每层要么返回错误，要么处理错误。

我们可能遇到需要查看错误的根源以实现重试的场景。假设我们依赖第三方的`db`包处理数据库访问。这个库可能会返回一个称为`db.DBError`的临时错误。为了确定是否需要重试，我们必须检查错误根源如下：

```go
func postHandler(customer Customer) Status {
	err := insert(customer.Contract)
	if err != nil {
		switch errors.Cause(err).(type) {
		default:
			log.WithError(err).Errorf("unable to server HTTP POST request for customer %s", customer.ID)
			return Status{ok: false}
		case *db.DBError:
			return retry(customer)
		}

	}
	return Status{ok: true}
}

func insert(contract Contract) error {
	err := db.dbQuery(contract)
	if err != nil {
		return errors.Wrapf(err, "unable to insert customer contract %s", contract.ID)
	}
	return nil
}
```

查看错误根源通过`errors.Cause`实现，由 pkg/errors 包提供。

我遇到的常见错误是以半吊子的方式使用 pkg/errors，天真地检查错误如下：

```go
switch err.(type) {
default:
  log.WithError(err).Errorf("unable to server HTTP POST request for customer %s", customer.ID)
  return Status{ok: false}
case *db.DBError:
  return retry(customer)
}
```

上述例子中，如果`db.DBError`被包装了，重试就永不会触发。

> [Don’t just check errors, handle them gracefully](https://dave.cheney.net/2016/04/27/dont-just-check-errors-handle-them-gracefully?source=post_page---------------------------)   
> This post is an extract from my presentation at the recent GoCon spring conference in Tokyo, Japan. I've spent a lot of ...  
> -- dave.cheney.net

## 切片初始化

某些情形下，我们其实能够预知切片的最终长度。例如，将`Foo`切片转换为`Bar`切片，两个切片的长度是相等的。

我经常看到如下初始切片的方式：

```go
var bars []Bar
bars := make([]Bar, 0)
```

切片不是什么神奇结构。它的底层实现了在空间不足时的容量增长策略。那种情况下，它会创建一个新数组（容量更大）然后把元素逐一拷贝过去。

现在请脑补一下由于`[]Foo`包含大量元素需要多次重复这种增长操作的情形。插入操作的平摊复杂度（平均情况下）为`O(1)`，但是现实操作总是附带**性能代价**的。

因此，如果预知最终长度，我们可以：  
- 初始为特定长度：
    ```go
    func convert(foos []Foo) []Bar {
        bars := make([]Bar, len(foos))
        for i, foo := range foos {
            bars[i] = fooToBar(foo)
        }
        return bars
    }
    ```
- 或者初始化长度为 0 但容量特定：
    ```go
    func convert(foos []Foo) []Bar {
        bars := make([]Bar, 0, len(foos))
        for _, foo := range foos {
            bars = append(bars, fooToBar(foo))
        }
        return bars
    }
    ```

最佳选项是啥？选项 1 会稍微快一点。但你可能更喜欢第二个，因为它使代码风格一致：无论是否预知长度，总是通过`append`在切片最后添加元素。

## 上下文管理  

开发者时常不理解`context.Context`。据官方文档：

> 上下文在 API 边界之间传递截止时间、取消信号和其他值

如果泛化的描述使得一些人没能理解`context.Context`的来源和使用姿势。

让我们尝试深入分解它。上下文能够携带：

- **截止日期**：表现为时间段（例如，250 毫秒）或时间点（例如，2019-01-08 01:00:00），一旦超过了，我们必须取消当前活动（和 I/O 请求，等待通道输入等）  
- **取消信号**（基本表现为`<-chan struct{}`）：行为也是类似的。一旦收到信号，必须停止当前活动。例如，假设我们收到两个请求。一个是插入数据而另一个是取消前一个请求（因为它不再有效之类的）。这种行为可用通过对第一个调用使用可取消的上下文，这个取消信号会在我们收到第二个请求时触发
- 一组键/值（都是`interface{}`类型）  

还有两点想说的：其一，上下文是**可组合的**，所以上下文是可以同时携带截止日期和一组键/值对的。其二，多个协程可以**共享**同一上下文使得取消信号可以停止**多个操作**。

回归主题，我遇到的一个误用如下：

某个基于 [urfave/cli](https://github.com/urfave/cli)（如果不了解的话，只需知道这是个创建命令行程序的优秀库就行）的 Go 程序。一旦启动，开发者从应用程序上下文派生自己的上下文。这意味着一旦程序停止，urfave/cli 库关联的上下文会触发取消信号。

我曾遇到的例子是调用 gRPC 端点是直接将这个上下文传给了调用函数。这其实**不是**我们想要的。

我们其实是想要告诉 gRPC 库：例如，*当程序停止或 100 毫秒后请取消当前请求*。

这么做只需简单地创建一个组合式上下文。如果`parent`是程序级上下文（由 urfave/cli 创建），可以简单操作如下：

```go
ctx, cancel := context.WithTimeout(parent, 100 * time.Millisecond)
response, err := grpcClient.Send(ctx, request)
```

上下文理解起来并不是很难，而且是个人觉得 Go 语言提供最好特性之一。

### 延伸阅读  

> [Understanding the context package in golang](http://p.agnihotry.com/post/understanding_the_context_package_in_golang/?source=post_page---------------------------)  
> The context package in go can come in handy while interacting with APIs and slow processes, especially in ...  
> -- p.agnihotry.com

> [gRPC and Deadlines](https://grpc.io/blog/deadlines/?source=post_page---------------------------)  
> When you use gRPC, the gRPC library takes care of communication, marshalling, unmarshalling, and deadline enforcement ...   
> -- grpc.io

## 没有启用`-race`选项  
我经常看到的错误是测试 Go 程序时没有启用`-race`选项。

据[报告](https://blog.acolyer.org/2019/05/17/understanding-real-world-concurrency-bugs-in-go/)分析，尽管 Go 目标是“为实现并发编程更简单和更少错误而设计”，我们依然在并发问题上受苦受难。  

显然，Go 的竞态检测器不可能查出每个并发问题。但是，它是个非常有用的工具，理应在测试程序时被一直启用。

### 延伸阅读  

> [Does the Go race detector catch all data race bugs?](https://medium.com/@val_deleplace/does-the-race-detector-catch-all-data-races-1afed51d57fb?source=post_page---------------------------)   
> TL;DR: it detects the data race conditions when they occur.   
> -- medium.com

## 用文件名作为输入  
另一个常见错误是以文件名为函数输入。
假设我们需要实现一个函数用于计算文件的空行数目。最自然的实现一般如下：

```go
func count(filename string) (int, error) {
	file, err := os.Open(filename)
	if err != nil {
		return 0, errors.Wrapf(err, "unable to open %s", filename)
	}
	defer file.Close()

	scanner := bufio.NewScanner(file)
	count := 0
	for scanner.Scan() {
		if scanner.Text() == "" {
			count++
		}
	}
	return count, nil
}
```

`filename`用作输入，然后我们打开文件，实现相关逻辑，感觉没问题吧？

那么，现在我们想要对这个函数进行**单元测试**，覆盖正常文件、空文件、不同编码类型的问题等。复杂度猛然飙升。

Go 引入了两个精妙的抽象类型：`io.Reader`和`io.Writer`。传入`io.Reader`而不是文件名即可抽象掉数据源。

文件？HTTP 载荷？字节缓冲区？都无所谓，只需通过统一的`Read`方法读取数据即可。

对于我们的情形，甚至可以通过缓存输入的方式来一行行地读取数据，采用`bufio.Reader`和它的`ReadLine`方法：

```go
func count(reader *bufio.Reader) (int, error) {
	count := 0
	for {
		line, _, err := reader.ReadLine()
		if err != nil {
			switch err {
			default:
				return 0, errors.Wrapf(err, "unable to read")
			case io.EOF:
				return count, nil
			}
		}
		if len(line) == 0 {
			count++
		}
	}
}
```

打开文件的责任分发到`count`客户端程序：

```go
file, err := os.Open(filename)
if err != nil {
  return errors.Wrapf(err, "unable to open %s", filename)
}
defer file.Close()
count, err := count(bufio.NewReader(file))
```

第二种实现使得函数能够处理任意类型的数据源，也使得可以通过`string`伪造`bufio.Reader`以**便于**单元测试：

```go
count, err := count(bufio.NewReader(strings.NewReader("input")))
```

## 协程与循环计数器  

最后一个常见错误出现在协程使用循环计算器的场景。

以下例子的输入是啥？

```go
ints := []int{1, 2, 3}
for _, i := range ints {
  go func() {
    fmt.Printf("%v\n", i)
  }()
}
```

会是顺序不定的`1 2 3`吗？不是哟。

这个例子中，每个协程共享同一变量实例，因此它很有可能是输出`3 3 3`。

这个问题由两种解决方法。第一种是将`i`的值传给闭包（里层的那个函数）：

```go
ints := []int{1, 2, 3}
for _, i := range ints {
  go func(i int) {
    fmt.Printf("%v\n", i)
  }(i)
}
```

另一种是在 for 循环作用域内创建另一个变量：

```go
ints := []int{1, 2, 3}
for _, i := range ints {
  i := i
  go func() {
    fmt.Printf("%v\n", i)
  }()
}
```

执行`i := i`看起来有点怪，但是完全合法的。在一次循环里意味着另一个作用域。因此，`i := i`创建另一个名为`i`的变量。当然，我们想要为`i`赋予其他名字以提高可读性也是可以的。

### 延伸阅读  

> [Common Mistakes: Using goroutines on loop iterator variables](https://github.com/golang/go/wiki/CommonMistakes?source=post_page---------------------------#using-goroutines-on-loop-iterator-variables)  
> The Go programming language. Contribute to golang/go development by creating an account on GitHub.  
> -- github.com

还有其他更多想要提及的错误吗？欢迎追加 :)