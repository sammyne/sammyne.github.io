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
	servTLSCert, err := tls.LoadX509KeyPair("server.cert", "server.key")
	if err != nil {
		panic(err)
	}

	// Configure a client to trust the server
	certPool := x509.NewCertPool()
	if caCertPEM, err := ioutil.ReadFile("ca.cert"); err != nil {
		panic(err)
	} else if ok := certPool.AppendCertsFromPEM(caCertPEM); !ok {
		panic("invalid cert in PEM")
	}

	serv := http.Server{
		Addr: "localhost:8443",
		Handler: http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			fmt.Fprintln(w, "You're using HTTPS")
		}),
		// Configure TLS options
		TLSConfig: &tls.Config{
			// MUST use RequireAndVerifyClientCert to require a client cert
			ClientAuth:   tls.RequireAndVerifyClientCert,
			ClientCAs:    certPool,
			Certificates: []tls.Certificate{servTLSCert},
		},
	}

	// Begin serving TLS
	if err := serv.ListenAndServeTLS("", ""); err != nil {
		panic(err)
	}
}
