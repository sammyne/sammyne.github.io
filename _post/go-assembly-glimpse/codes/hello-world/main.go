package main

func add(a, b int) int {
	sum := 0 // 不设置该局部变量 sum，add 栈空间大小会是 0
	sum = a + b
	return sum
}

func main() {
	println(add(1, 2))
}
