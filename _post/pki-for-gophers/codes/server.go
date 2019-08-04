// +build ignore

package main

import (
	"crypto/tls"
	"fmt"
	"net/http"
)

func main() {
	// Load the certificate and private key as a TLS certificate
	servTLSCert, err := tls.LoadX509KeyPair("server.cert", "server.key")
	if err != nil {
		panic(err)
	}

	serv := http.Server{
		Addr: "localhost:8443",
		Handler: http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			fmt.Fprintln(w, "You're using HTTPS")
		}),
		// Configure TLS options
		TLSConfig: &tls.Config{Certificates: []tls.Certificate{servTLSCert}},
	}

	// Begin serving TLS
	if err := serv.ListenAndServeTLS("", ""); err != nil {
		panic(err)
	}
}
