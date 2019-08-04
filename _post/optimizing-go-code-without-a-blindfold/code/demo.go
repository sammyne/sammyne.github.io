package code

//go:generate echo $GOROOT

func copyList(in []string) []string {
	var out []string
	for _, s := range in {
		out = append(out, s)
	}

	return out
}
