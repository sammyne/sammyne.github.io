// +build ignore

package main

import (
	"crypto/tls"
	"crypto/x509"
	"fmt"
	"io/ioutil"
	"net"
	"net/http"

	"golang.org/x/crypto/ocsp"
)

//func verifyOCSP(s *tls.ConnectionState) error {
func verifyOCSP(s tls.ConnectionState) error {
	if len(s.OCSPResponse) == 0 {
		return fmt.Errorf("remote didn't provide ocsp staple response")
	}
	for _, chain := range s.VerifiedChains {
		if n := len(chain); n < 2 {
			return fmt.Errorf("verified chain contained too few certificates: %d", n)
		}

		serverCert := chain[0]
		caCert := chain[1]

		resp, err := ocsp.ParseResponseForCert(s.OCSPResponse, serverCert, caCert)
		if err != nil {
			return fmt.Errorf("invalid ocsp staple data: %v", err)
		}
		if err := resp.CheckSignatureFrom(caCert); err != nil {
			return fmt.Errorf("invalid ocsp signature: %v", err)
		}
		if resp.Status != ocsp.Good {
			return fmt.Errorf("certificate revoked /cn=%s", serverCert.Subject.CommonName)
		}
	}
	return nil
}

func main() {
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
			//TLSClientConfig: &tls.Config{RootCAs: certPool},
			DialTLS: func(network, addr string) (net.Conn, error) {
				tlsClientConfig := &tls.Config{RootCAs: certPool}
				conn, err := tls.Dial(network, addr, tlsClientConfig)
				if err != nil {
					return nil, err
				}
				if err := verifyOCSP(conn.ConnectionState()); err != nil {
					conn.Close()
					return nil, fmt.Errorf("ocsp validation failed: %v", err)
				}
				return conn, nil
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
