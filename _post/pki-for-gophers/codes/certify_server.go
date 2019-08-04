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

	// Generate a key pair and certificate template
	servPriv, err := ecdsa.GenerateKey(elliptic.P256(), rand.Reader)
	if err != nil {
		panic(err)
	}
	servTmpl := &x509.Certificate{
		Subject:      pkix.Name{CommonName: "my-server"},
		SerialNumber: utils.RandSerialNumber(),
		NotBefore:    time.Now(),
		NotAfter:     time.Now().Add(time.Hour),
		DNSNames:     []string{"localhost"},
		KeyUsage:     x509.KeyUsageKeyEncipherment | x509.KeyUsageDigitalSignature,
		ExtKeyUsage:  []x509.ExtKeyUsage{x509.ExtKeyUsageServerAuth},
	}
	// Sign the serving cert with the CA private key
	servCertDER, err := x509.CreateCertificate(rand.Reader, servTmpl, caCert, servPriv.Public(), caPrivKey)
	if err != nil {
		panic(err)
	}

	const owner = "server"
	if err := utils.DumpCert(servCertDER, owner); err != nil {
		panic(err)
	}

	if err := utils.DumpPrivKey(servPriv, owner); err != nil {
		panic(err)
	}
}
