// +build ignore

package main

import (
	"codes/utils"
	"crypto/rand"
	"crypto/x509/pkix"
	"io/ioutil"
	"time"
)

// this is done by CA
func main() {
	caPrivKey, caCert, err := utils.LoadKeyAndCert("ca")
	if err != nil {
		panic(err)
	}

	_, serverCert, err := utils.LoadKeyAndCert("server")
	if err != nil {
		panic(err)
	}

	revoked := []pkix.RevokedCertificate{
		{SerialNumber: serverCert.SerialNumber, RevocationTime: time.Now()},
	}
	now := time.Now()
	exp := time.Now().Add(time.Hour)
	crlDER, err := caCert.CreateCRL(rand.Reader, caPrivKey, revoked, now, exp)
	if err != nil {
		panic(err)
	}

	if err := ioutil.WriteFile("crl.txt", crlDER, 0755); err != nil {
		panic(err)
	}
}
