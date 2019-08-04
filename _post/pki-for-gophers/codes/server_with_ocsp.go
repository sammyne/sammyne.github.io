// +build ignore

package main

import (
	"codes/utils"
	"crypto/tls"
	"fmt"
	"net/http"
	"time"

	"golang.org/x/crypto/ocsp"
)

func main() {
	caPrivKey, caCert, err := utils.LoadKeyAndCert("ca")
	if err != nil {
		panic(err)
	}

	_, serverCert, err := utils.LoadKeyAndCert("server")
	if err != nil {
		panic(err)
	}

	ocspResp := ocsp.Response{
		Status:       ocsp.Good,
		SerialNumber: serverCert.SerialNumber,
		ThisUpdate:   time.Now(),
		NextUpdate:   time.Now().Add(time.Minute),
	}
	ocspStaple, err := ocsp.CreateResponse(caCert, serverCert, ocspResp, caPrivKey)
	if err != nil {
		panic(err)
	}

	// Load the certificate and private key as a TLS certificate
	servTLSCert, err := tls.LoadX509KeyPair("server.cert", "server.key")
	if err != nil {
		panic(err)
	}
	servTLSCert.OCSPStaple = ocspStaple

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
