---
title: Go 的 Context 包使用规则  
date: 2019-10-26
categories:
- language
tags:
- golang
- engineering
---

> 原文：[Context Package Semantics In Go](https://www.ardanlabs.com/blog/2019/09/context-package-semantics-in-go.html)

## 引言

Go 语言内置的 `go` 关键字可用于创建协程，但是并没有提供关键字或直接支持关闭协程。现实世界的服务程序中，超时退出协程的能力对维护服务的健康和操作至关重要。没有任何能够永远执行的请求或任务，这也就使得辨别和管理延时成为了每个程序员的责任。

Go 开发团队为此问题提供的解决方案是 `context` 包。这个包由 [Sameer Ajmani](https://twitter.com/Sajma) 编写，并在 2014 年 Gotham 的 Go 大会发布出来。他也为 Go 的博客写了一篇文章。

- 演讲视频：[https://vimeo.com/115309491](https://vimeo.com/115309491)
- Slide Deck：[https://talks.golang.org/2014/gotham-context.slide#1](https://talks.golang.org/2014/gotham-context.slide#1)
- 博客文章：[https://blog.golang.org/context](https://blog.golang.org/context)

上述资料发布以及个人和 Sameer 多年来的谈话之后，很多语义都有所演进。本篇博文将会阐述这些语义并尽量用代码来演示给你看。

## 服务器从外部收到的请求应该创建一个 `Context`
创建 `Context` 的时机永远都是在处理请求或任务的尽可能早的时候。开发周期中，早期引入 `Context` 会强制你在设计 API 时把 `Context` 作为第一个参数。即使你无法 100% 确定函数是否需要 `Context` ，从少数函数移除 `Context` 要比添加来得容易。

代码片段 1   
[https://github.com/ardanlabs/service/blob/master/internal/platform/web/web.go#L75](https://github.com/ardanlabs/service/blob/master/internal/platform/web/web.go#L75)
```go{6,7,12}
// Handle is our mechanism for mounting Handlers for a given HTTP verb and path
// pair, this makes for really easy, convenient routing.
func (a *App) Handle(verb, path string, handler Handler, mw ...Middleware) {
    // ...
    // The function to execute for each request.
    h := func(w http.ResponseWriter, r *http.Request, params map[string]string) {
        ctx, span := trace.StartSpan(r.Context(), "internal.platform.web")
        defer span.End()
        // ...

    // Add this handler for the specified verb and route.
    a.TreeMux.Handle(verb, path, h)
}
```

代码片段 1 展示的代码源自我们在 Ardan Labs 培训时用的 [service](https://github.com/ardanlabs/service) 项目。第 6 行定义了一个 handler 函数，这个函数在第 12 行绑定到所有路由。所有进来的请求都是先由这个函数处理的。第 7 行为请求创建了一个 [`span`](https://opencensus.io/)，第一个参数是一个`Context`。这是 service 源码里面第一次需要用到 `Context` 的地方。

最完美的是 `http.Request` 已经包含了一个 `Context`。这是在 Go 1.7 [引入](https://golang.org/doc/go1.7#context) 的。这也就意味着代码不需要手动地创建一个顶层的 `Context`。如果使用的是 Go 1.7 之前的版本（这里原文应该有误），我们就要在调用 `StartSpan` 函数之前通过 `context.Background()` 函数创建一个空的 `Context`。

代码片段 2   
[https://golang.org/pkg/context/#Background](https://golang.org/pkg/context/#Background)
```go
ctx := context.Background()
ctx, span := trace.StartSpan(ctx, "internal.platform.web")
defer span.End()
```

代码片段 2 展示了 Go 1.7 之前的代码实现方式。这个包的文档说明是这样的，

> `Background`返回一个非 `nil`的空 `Context`。它绝不会被取消，无法携带任何值，并且没有截止日期。它通常用于 `main` 函数、初始化或测试，并且作为所接收到请求最顶层的 `Context`。

Go 的习惯用法是把所有 `Context` 值命名为 `ctx`。因为 `Context` 是一个接口，所以我们不应该使用它的指针。

代码片段 3  
[https://golang.org/pkg/context/#Context](https://golang.org/pkg/context/#Context)
```go
type Context interface {
    Deadline() (deadline time.Time, ok bool)
    Done() <-chan struct{}
    Err() error
    Value(key interface{}) interface{}
}
```

每个接受 `Context` 的函数都会得到接口值的一个副本。

## 对服务器的调用应该接受一个 `Context`

这项语义的初衷是使得顶层调用可以告知下层调用它们愿意等待的时长。一个很好的例子是 `http` 包里，1.7 版对 `Do` 方法的改动用于尊重请求的超时。

代码片段 4   
[https://play.golang.org/p/9x4kBKO-Y6q](https://play.golang.org/p/9x4kBKO-Y6q)
```go{14-18,21-22,35}
package main

import (
	"context"
	"io"
	"log"
	"net/http"
	"os"
	"time"
)

func main() {
	// Create a new request.
	req, err := http.NewRequest("GET", "https://www.ardanlabs.com/blog/post/index.xml", nil)
	if err != nil {
		log.Println("ERROR:", err)
		return
	}

	// Create a context with a timeout of 50 milliseconds.
	ctx, cancel := context.WithTimeout(req.Context(), 50*time.Millisecond)
	defer cancel()

	// Bind the new context into the request.
	req = req.WithContext(ctx)

	// Make the web call and return any error. Do will handle the
	// context level timeout.
	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		log.Println("ERROR:", err)
		return
	}

	// Close the response body on the return.
	defer resp.Body.Close()

	// Write the response to stdout.
	io.Copy(os.Stdout, resp.Body)
}
```

代码片段 4 演示的程序对 Ardan rss 博客流的请求，超时时间为 50 毫秒。14-18 行对给定的 URL 发起一次 `GET` 请求。21-22 行创建了一个超时时间为 50 毫秒的 `Context`。1.7 版后 `Request` 值引入一项新的 API -- `WithContext`。这个方法提供了更新 `Request` 的 `Context` 值的接口。

第 35 行，真正的请求通过调用 `http` 包 `DefaultClient` 实例的 `Do` 方法发起。这个 `Do` 方法会遵守如今设置给 `Request` 的这 50 毫秒超时时间。正如你所见，这份代码（上层函数）告诉 `Do` 方法（底层函数）我们所能容忍 `Do` 完成操作的最大时长。

## 不要把 `Context` 存到结构体类型，而应该显示地将 `Context` 传给每个需要的函数
实际上，任何执行 I/O 的函数都应该接受一个 `Context` 值作为第一个参数，并遵守用户设定的超时或期限。对于 `Request`，我们还需要考虑后向兼容的问题。所以我们并没有改动 API，而是采用了上一节展示的实现方式。

凡事皆有例外。对本篇博文和所有接收 `Context` 的标准库 API 来说，习惯用法是用第一个参数接收 `Context` 值。

代码片段 5
```go
type Resolver
    func (r *Resolver) LookupAddr(ctx context.Context, addr string) (names []string, err error)
    func (r *Resolver) LookupCNAME(ctx context.Context, host string) (cname string, err error)
    func (r *Resolver) LookupHost(ctx context.Context, host string) (addrs []string, err error)
    func (r *Resolver) LookupIPAddr(ctx context.Context, host string) ([]IPAddr, error)
    func (r *Resolver) LookupMX(ctx context.Context, name string) ([]*MX, error)
    func (r *Resolver) LookupNS(ctx context.Context, name string) ([]*NS, error)
    func (r *Resolver) LookupPort(ctx context.Context, network, service string) (port int, err error)
    func (r *Resolver) LookupSRV(ctx context.Context, service, proto, name string) (cname string, addrs []*SRV, err error)
    func (r *Resolver) LookupTXT(ctx context.Context, name string) ([]string, error)
```

代码片段 5 展示 `net` 包的一个例子，所有方法的第一个参数都是 `Context` 并且采用了 `ctx` 命名风格。

## 函数调用链的函数之间必须传递 `Context`
鉴于 `Context` 绑定到请求或任务，这是一条非常重要的规则。我们需要这个 `Context` 和在请求或任务处理过程的任何变更都能得到传递和遵守。

代码片段 6

https://github.com/ardanlabs/service/blob/master/internal/user/user.go#L34

> 对应源码的原链接已失效= =

```go{3,6,11}
// List returns all the existing users in the system.
func (u *User) List(ctx context.Context, w http.ResponseWriter, r *http.Request, params map[string]string) error {
    ctx, span := trace.StartSpan(ctx, "handlers.User.List")
    defer span.End()

    users, err := user.List(ctx, u.db)
    if err != nil {
        return err
    }

    return web.Respond(ctx, w, users, http.StatusOK)
}
```

如代码片段 6 实现的是一个名为 `List` 的 handler 函数，函数处理用户发向这个端点的 HTTP 请求。由于需要是请求的一部分且执行 I/O，这个 handler 接收 `Context` 作为第一个参数。如我们所见，3、6 和 11 行都把同一个 `Context` 值沿着调用栈向下传递。

因为这个函数不需要改变 `Context`，所以不需要创建一个新的 `Context`。如果这个函数创建一个新的顶层 `Context`，请求源自上层调用的现有全部上下文信息都会丢失。这不会是你想要的。

代码片段 7

https://github.com/ardanlabs/service/blob/master/internal/user/user.go#L34

> 对应源码的原链接已失效= =

```go{3,9}
// List retrieves a list of existing users from the database.
func List(ctx context.Context, db *sqlx.DB) ([]User, error) {
    ctx, span := trace.StartSpan(ctx, "internal.user.List")
    defer span.End()

    users := []User{}
    const q = `SELECT * FROM users`

    if err := db.SelectContext(ctx, &users, q); err != nil {
        return nil, errors.Wrap(err, "selecting users")
    }

    return users, nil
}
```

代码片段 7 展示了 代码片段 6 第 6 行调用的 `List` 定义。再次可见，这个方法接收一个 `Context` 作为第一个参数。这个值再次在第 3 和 9 行往下传递。由于第 9 行是一个数据库调用，这个函数应该遵守之前调用方在 `Context` 里面设置的所有超时信息。

## 利用 `WithCancel`、`WithDeadline`、`WithTimeout` 或 `WithValue` 来更新一个 `Context`

因为每个函数都可以根据它们的特定需求添加或修改 `Context` 且这些变动不应该影响到之前调用的所有函数，`Context` 通过值传递。这就意味着任何对 `Context` 值的改动都会创建一个新的 `Context`，这个新值继续向下传递。

代码片段 8

[https://play.golang.org/p/8RdBXtfDv1w](https://play.golang.org/p/8RdBXtfDv1w)
```go{16,17}
package main

import (
	"context"
	"fmt"
	"time"
)

func main() {

	// Set a duration.
	duration := 150 * time.Millisecond

	// Create a context that is both manually cancellable and will signal
	// cancel at the specified duration.
	ctx, cancel := context.WithTimeout(context.Background(), duration)
	defer cancel()

	// Create a channel to receive a signal that work is done.
	ch := make(chan data, 1)

	// Ask the goroutine to do some work for us.
	go func() {

		// Simulate work.
		time.Sleep(50 * time.Millisecond)

		// Report the work is done.
		ch <- data{"123"}
	}()

	// Wait for the work to finish. If it takes too long, move on.
	select {
	case d := <-ch:
		fmt.Println("work complete", d)

	case <-ctx.Done():
		fmt.Println("work cancelled")
	}
}
```

代码片段 8 的小程序展示 `WithTimeout` 函数自然通过值传递 `Context` 的方式。第 16 行对 `WithTimeout` 的调用返回一个新的 `Context` 值和一个 `cancel` 函数。由于函数调用需要一个父 `Context`，代码使用 `Background` 函数创建了一个上层的空 `Context`。这正是 `Background` 函数的用法之一。

后续流程使用的是 `WithTimeout` 函数常见的 `Context` 值。调用链后面的任何函数需要自己特定的超时或期限的话，也应该以这个新的 `Context` 为父亲调用合适的 `With` 函数。

这里尤其需要注意的一点是：`With` 函数返回的任何 `cancel` 函数都需要在外层函数返回前执行。这也正是如第 17 行在 `With` 调用之后立即使用 `defer` 关键字的惯性用法的缘由。没有这样做会导致程序泄露内存。

## 一个 `Context` 被取消后，所有从它派生的 `Context` 也会被取消

`Context` API 这种值传递方式意味着：每个新的 `Context` 都会获得父 `Context` 的所有信息再加上新添的更改。这意味着一旦父 `Context` 被取消了，所有从它派生的子 `Context` 也会被取消。

代码片段 9

[https://play.golang.org/p/PmhTXiCZUP1](https://play.golang.org/p/PmhTXiCZUP1)
```go{4,13-25,28-29}
func main() {

	// Create a Context that can be cancelled.
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	// Use the Waitgroup for orchestration.
	var wg sync.WaitGroup
	wg.Add(10)

	// Create ten goroutines that will derive a Context from
	// the one created above.
	for i := 0; i < 10; i++ {
		go func(id int) {
			defer wg.Done()

			// Derive a new Context for this goroutine from the Context
			// owned by the main function.
			ctx := context.WithValue(ctx, key, id)

			// Wait until the Context is cancelled.
			<-ctx.Done()
			fmt.Println("Cancelled:", id)
		}(i)
	}

	// Cancel the Context and any derived Context's as well.
	cancel()
	wg.Wait()
}
```

代码片段 9 展示的程序在第 4 行创建了一个可取消的 `Context` 值。然后 13-25 行创建了 10 个 goroutine。每个 goroutine 在第 19 行把他们独有的 ID 放入自己的 `Context`。`WithValue` 调用时采用的父 `Context` 是 `main` 函数的 `Context`。然后第 29 行使得每个 goroutine 等待直至它们的 `Context` 被取消。

第 28 行主 goroutine 取消它的 `Context`，然后在第 29 行等待全部 10 个 goroutine 直至收到信号，然后关掉整个程序。一旦 `cancel` 函数被调用，第 22 行的全部 10 个 goroutine 都会变成非阻塞，打印说明它们都被取消了。一个 `cancel` 调用取消了所有 `Context`。

这也演示了同一个 `Context` 可以传给不同 goroutine 里面运行的函数。`Context` 能够安全地被多个 goroutine 同时使用。

## 即使函数允许，也不要传递 `nil` 类型的 `Context`。无法确定要用的 `Context` 时，传递一个 `TODO` 类型的 `Context`

本人最喜欢的 `Context` 包的一部分是 `TODO` 函数。我一直坚信着程序猿总是会编写代码草稿的。这和作家为不同版本的文章打草稿没什么区别。写代码时我们永远都无法预知所有问题，但是基于足够的了解继续向前还是比较有希望的。最后结果是：我们会不断地学习、重构和测试。

我见过很多次需要一个 `Context` 却又不确定其来源的情况。由于不用负责创建上层的 `Context`，所以使用 `Background` 函数是不合适的。我需要的是一个临时的上层 `Context` 直到我弄明白真正的 `Context` 来源。这就是使用 `TODO` 函数替代 `Background` 函数的时机。

## `Context` 的值只应用于请求作用域内跨越进程和 API 的数据，而不用于给函数传递可选参数

这可能是所有规则中最重要的一条。当函数需要数据来保证成功执行时，不要使用 `Context` 值给函数传递这份数据。也就是说，函数应该能够以一个空的 `Context` 值来运行自身逻辑。如果函数需要 `Context` 包含特定信息而这份信息缺失时，程序应该执行失败并且示意应用关闭。

借助 `Context` 给函数传递数据的一个常见误用是处理数据库连接的场景。通常情况下，我们会遵循以下顺序在程序里转移数据。

- 将数据作为函数参数传递。这是在程序里转移数据不加任何掩饰的最清晰的方式
- 通过接收者传递数据。如果需要数据的函数无法改变自身的方法签名，我们可以使用一个方法，而通过接收者来传递数据

### 使用接收者的小例

请求处理器时第二条规则的一个经典实例。由于处理器函数绑定到特定的声明，它的函数签名无法改变。

代码片段 10

https://github.com/ardanlabs/service/blob/master/cmd/sales-api/internal/handlers/user.go#L24

> 对应源码的原链接已失效= =

```go{5}
func (u *User) List(ctx context.Context, w http.ResponseWriter, r *http.Request, params map[string]string) error {
	ctx, span := trace.StartSpan(ctx, "handlers.User.List")
	defer span.End()

	users, err := user.List(ctx, u.db)
	if err != nil {
		return err
	}

	return web.Respond(ctx, w, users, http.StatusOK)
}
```

代码片段 10 展示了 `service` 项目的 `List` 处理器。这些方法的签名绑定到 web 框架定义的结构，无法改变。然而，执行第 5 行的逻辑调用又需要一个数据库连接。这份代码从接收者而不是传入的 `Context` 值拉取了连接池。

代码片段 11

https://github.com/ardanlabs/service/blob/master/cmd/sales-api/internal/handlers/user.go#L15

> 对应源码的原链接已失效= =

```go
 // User represents the User API method handler set.
 type User struct {
	db            *sqlx.DB
	authenticator *auth.Authenticator

	// ADD OTHER STATE LIKE THE LOGGER AND CONFIG HERE.
}
```

代码片段 11 展示了接收者的类型声明。请求处理器需要所有东西都定义为字段。这使得不用隐藏信息而业务逻辑层又能以空的 `Context` 值正常工作。

代码片段 12

https://github.com/ardanlabs/service/blob/master/cmd/sales-api/internal/handlers/routes.go#L14

> 对应源码的原链接已失效= =

```go
// API constructs an http.Handler with all application routes defined.
func API(shutdown chan os.Signal, log *log.Logger, db *sqlx.DB, authenticator *auth.Authenticator) http.Handler {
	// ...

	// Register user management and authentication endpoints.
	u := User{
		db:            db,
		authenticator: authenticator,
	}

	app.Handle("GET", "/v1/users", u.List)
}
```

代码片段 12 展示了构造一个 `User` 值，然后把 `List` 方法注册到给定路由的代码。再次可以看到，由于处理器函数的签名无法改变，借助接收者和方法是显式传递数据的其他方式中最优的。

#### 调试或追踪数据可以通过 `Context` 值安全传递

`Context` 能存取得值是一些调试或追踪信息。

代码片段 13

https://github.com/ardanlabs/service/blob/master/internal/platform/web/web.go#L23

> 对应源码的原链接已失效= =

```go
// Values represent state for each request.
type Values struct {
	TraceID    string
	Now        time.Time
	StatusCode int
}
```

代码片段 13 声明了一个为每个新请求创建并存到每个 `Context` 的类型。给定的三个字段提供追踪和调试请求的信息。这些信息在请求的逐步处理过程中被收集。

代码片段 14

https://github.com/ardanlabs/service/blob/master/internal/platform/web/web.go#L75

> 对应源码的原链接已失效= =

```go{11-15}
// Handle is our mechanism for mounting Handlers for a given HTTP verb and path
// pair, this makes for really easy, convenient routing.
func (a *App) Handle(verb, path string, handler Handler, mw ...Middleware) {
// ...

	// The function to execute for each request.
	h := func(w http.ResponseWriter, r *http.Request, params map[string]string) {

	// Set the context with the required values to
	// process the request.
	v := Values{
		TraceID: span.SpanContext().TraceID.String(),
		Now:     time.Now(),
	}
	ctx = context.WithValue(ctx, KeyValues, &v)
```

代码片段 14 演示了第 11 行构造 `Values` 类型，然后在第 15 行存入 `Context`。一般是日志中间件最需要这些信息。

代码片段 15

https://github.com/ardanlabs/service/blob/master/internal/mid/logger.go#L20

> 对应源码的原链接已失效= =

```go{7-10}
// Create the handler that will be attached in the middleware chain.
h := func(ctx context.Context, w http.ResponseWriter, r *http.Request, params map[string]string) error {
	// ...

	// If the context is missing this value, request the service
	// to be shutdown gracefully.
	v, ok := ctx.Value(web.KeyValues).(*web.Values)
	if !ok {
		return web.NewShutdownError("web value missing from context")
	}
	// ...
	log.Printf("%s : (%d) : %s %s -> %s (%s)",
		v.TraceID, v.StatusCode,
		r.Method, r.URL.Path,
		r.RemoteAddr, time.Since(v.Now),
	)
```

代码片段 15 的第 7-10 行展示了通过 `Context` 传递信息的方式。这段代码试图从 `Context` 取出 `Values` 数据，并检查是否有可用数据。如果数据缺失，说明存在关键的完整性问题，这个服务需要关闭。实现方式为服务代码给应用程序回传一个特殊的错误值。

如果通过 `Context` 给业务逻辑传递数据库连接或用户信息的话，我们会遇到两个问题：
- 需要检查完整性和一个快速关闭服务的机制
- 测试和调试变得更加困难和更加复杂。在代码更好的清晰度和可读性方面，我们渐行渐远

## 结论

`Context` 包定义了一组 API，用于来支持限期、取消信号和限定请求在 API 边界或 goroutine 之间传递数据。这份 API 对我们编写的任何应用都是至关重要的。理解这些规则对我们编写可靠和完整的软件是不可或缺的。

这篇博文尝试拆解了 Go 团队定义的规则。有幸的话，你现在对如何更加有效地利用 `Context` 有了更好的理解。你可以获取到所有示例代码。有任何疑问的话，直接给我发邮件就好。

## 小结
- 服务器从外部收到的请求应该创建一个 `Context`
- 对服务器的调用应该接受一个 `Context`
- 不要把 `Context` 存到结构体类型，而应该显示地将 `Context` 传给每个需要的函数
- 函数调用链的函数之间必须传递 `Context`
- 利用 `WithCancel`、`WithDeadline`、`WithTimeout` 或 `WithValue` 来更新一个 `Context`
- 一个 `Context` 被取消后，所有从它派生的 `Context` 也会被取消
- 同一个 `Context` 可以传给不同 goroutine 里面运行的函数。`Context` 能够安全地被多个 goroutine 同时使用
- 即使函数允许，也不要传递 `nil` 类型的 `Context`。无法确定要用的 `Context` 时，传递一个 `TODO` 类型的 `Context`
- `Context` 的值只应用于请求作用域内跨越进程和 API 的数据，而不用于给函数传递可选参数