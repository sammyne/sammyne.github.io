package utils

import (
	"crypto/rand"
	"encoding/binary"
	"math/big"
)

func RandSerialNumber() *big.Int {
	var sn int64
	if err := binary.Read(rand.Reader, binary.LittleEndian, &sn); err != nil {
		panic(err)
	}

	return big.NewInt(sn)
}
