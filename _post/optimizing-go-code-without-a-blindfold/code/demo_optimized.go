// +build ignore

package code

func copyList(in []string) []string {
	out := make([]string, len(in))
	for i, s := range in {
		out[i] = s
	}

	return out
}
