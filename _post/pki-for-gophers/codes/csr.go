// +build ignore

package main

import (
	"codes/utils"
	"crypto/ecdsa"
	"crypto/elliptic"
	"crypto/rand"
	"crypto/x509"
	"crypto/x509/pkix"
	"time"
)

func main() {
	/// server side
	servPriv, err := ecdsa.GenerateKey(elliptic.P256(), rand.Reader)
	if err != nil {
		panic(err)
	}
	csr := &x509.CertificateRequest{
		Subject:  pkix.Name{CommonName: "my-server"},
		DNSNames: []string{"example.com"},
	}
	csrDER, err := x509.CreateCertificateRequest(rand.Reader, csr, servPriv)
	if err != nil {
		panic(err)
	}

	// send CSR to CA
	/// end server side

	/// CA side
	caPrivKey, caCert, err := utils.LoadKeyAndCert("ca")
	if err != nil {
		panic(err)
	}

	servCSR, err := x509.ParseCertificateRequest(csrDER)
	if err != nil {
		panic(err)
	}
	if err := servCSR.CheckSignature(); err != nil {
		panic(err)
	}

	// Certificate authority MUST validate CSR fields before using them to
	// generate a certificate

	servTmpl := &x509.Certificate{
		// Fields taken from CSR
		Subject:     servCSR.Subject,
		IPAddresses: servCSR.IPAddresses,
		DNSNames:    servCSR.DNSNames,

		// Fields that must be requested externally from the CSR
		SerialNumber: utils.RandSerialNumber(),
		NotBefore:    time.Now(),
		NotAfter:     time.Now().Add(time.Hour),
		KeyUsage:     x509.KeyUsageKeyEncipherment | x509.KeyUsageDigitalSignature,
		ExtKeyUsage:  []x509.ExtKeyUsage{x509.ExtKeyUsageServerAuth},
	}
	servCertDER, err := x509.CreateCertificate(rand.Reader, servTmpl, caCert, servCSR.PublicKey, caPrivKey)
	if err != nil {
		panic(err)
	}

	// send server cert to server
	_ = servCertDER

	/// end CA side
}
