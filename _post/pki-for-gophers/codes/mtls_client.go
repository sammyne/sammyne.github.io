// +build ignore

package main

import (
	"crypto/tls"
	"crypto/x509"
	"fmt"
	"io/ioutil"
	"net/http"
)

func main() {
	// Load the certificate and private key as a TLS certificate
	cliTLSCert, err := tls.LoadX509KeyPair("client.cert", "client.key")
	if err != nil {
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

	client := &http.Client{
		Transport: &http.Transport{
			TLSClientConfig: &tls.Config{
				Certificates: []tls.Certificate{cliTLSCert},
				RootCAs:      certPool,
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
