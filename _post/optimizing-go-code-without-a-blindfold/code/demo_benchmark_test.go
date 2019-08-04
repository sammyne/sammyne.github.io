package code

import "testing"

var input = []string{"how", "do", "you", "do", "I'm", "fine"}

func BenchmarkCopyList(b *testing.B) {
	b.ReportAllocs()
	for i := 0; i < b.N; i++ {
		copyList(input)
	}
}
