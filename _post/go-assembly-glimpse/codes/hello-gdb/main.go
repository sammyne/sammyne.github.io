package main

type Ier interface {
	add(a, b int) int
	sub(a, b int) int
}

type data struct {
	a, b int
}

func (*data) add(a, b int) int {
	return a + b
}

func (*data) sub(a, b int) int {
	return a - b
}

func main() {
	var t Ier = &data{3, 4}

	println(t.add(1, 2))
	println(t.sub(3, 2))
}
