// +build ignore

package main

import (
	"crypto/ecdsa"
	"crypto/elliptic"
	"crypto/rand"
	"crypto/x509"
	"crypto/x509/pkix"
	"time"

	"codes/utils"
)

func main() {
	caPrivKey, caCert, err := utils.LoadKeyAndCert("ca")
	if err != nil {
		panic(err)
	}

	cliPriv, err := ecdsa.GenerateKey(elliptic.P256(), rand.Reader)
	if err != nil {
		panic(err)
	}
	cliTmpl := &x509.Certificate{
		Subject:      pkix.Name{CommonName: "my-client"},
		SerialNumber: utils.RandSerialNumber(),
		NotBefore:    time.Now(),
		NotAfter:     time.Now().Add(time.Hour),
		KeyUsage:     x509.KeyUsageKeyEncipherment | x509.KeyUsageDigitalSignature,
		ExtKeyUsage:  []x509.ExtKeyUsage{x509.ExtKeyUsageClientAuth},
	}

	cliCert, err := x509.CreateCertificate(rand.Reader, cliTmpl, caCert, cliPriv.Public(),
		caPrivKey)
	if err != nil {
		panic(err)
	}

	const owner = "client"
	if err := utils.DumpCert(cliCert, owner); err != nil {
		panic(err)
	}

	if err := utils.DumpPrivKey(cliPriv, owner); err != nil {
		panic(err)
	}
}
