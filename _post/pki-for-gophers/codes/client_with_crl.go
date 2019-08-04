// +build ignore

package main

import (
	"codes/utils"
	"crypto/tls"
	"crypto/x509"
	"fmt"
	"io/ioutil"
	"net/http"
)

func main() {
	crlDER, err := ioutil.ReadFile("crl.txt")
	if err != nil {
		panic(err)
	}

	crl, err := x509.ParseCRL(crlDER)
	if err != nil {
		panic(err)
	}

	_, caCert, err := utils.LoadKeyAndCert("ca")
	if err != nil {
		panic(err)
	}
	if err := caCert.CheckCRLSignature(crl); err != nil {
		panic(err)
	}

	caCertPEM, err := ioutil.ReadFile("ca.cert")
	if err != nil {
		panic(err)
	}

	// Configure a client to trust the server
	certPool := x509.NewCertPool()
	if ok := certPool.AppendCertsFromPEM(caCertPEM); !ok {
		panic("invalid cert in PEM")
	}

	verifyPeerCert := func(raw [][]byte, chains [][]*x509.Certificate) error {
		for _, chain := range chains {
			for _, cert := range chain {
				for _, r := range crl.TBSCertList.RevokedCertificates {
					if cert.SerialNumber.Cmp(r.SerialNumber) != 0 {
						continue
					}
					return fmt.Errorf("certificate was revoked: /cn=%s", cert.Subject.CommonName)
				}
			}
		}
		return nil
	}

	client := &http.Client{
		Transport: &http.Transport{
			TLSClientConfig: &tls.Config{
				RootCAs:               certPool,
				VerifyPeerCertificate: verifyPeerCert,
			},
		},
	}

	resp, err := client.Get("https://localhost:8443/")
	if err != nil {
		panic(err)
	}
	defer resp.Body.Close()

	body, err := ioutil.ReadAll(resp.Body)
	if err != nil {
		panic(err)
	}
	fmt.Println("response goes as")
	fmt.Printf("%s\n", body)
}
