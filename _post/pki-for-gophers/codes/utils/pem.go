package utils

import (
	"crypto/ecdsa"
	"crypto/x509"
	"encoding/pem"
	"io/ioutil"
)

func DumpCert(cert []byte, owner string) error {
	certPEM := pem.EncodeToMemory(&pem.Block{Bytes: cert, Type: "CERTIFICATE"})
	return ioutil.WriteFile(owner+".cert", certPEM, 0755)
}

func DumpPrivKey(priv *ecdsa.PrivateKey, owner string) error {
	keyDER, err := x509.MarshalECPrivateKey(priv)
	if err != nil {
		return err
	}

	keyPEM := pem.EncodeToMemory(&pem.Block{Bytes: keyDER, Type: "EC PRIVATE KEY"})
	return ioutil.WriteFile(owner+".key", keyPEM, 0755)
}

func LoadKeyAndCert(name string) (*ecdsa.PrivateKey, *x509.Certificate, error) {
	keyPEM, err := ioutil.ReadFile(name + ".key")
	if err != nil {
		return nil, nil, err
	}
	block, _ := pem.Decode(keyPEM)

	key, err := x509.ParseECPrivateKey(block.Bytes)
	if err != nil {
		return nil, nil, err
	}

	certPEM, err := ioutil.ReadFile(name + ".cert")
	if err != nil {
		return nil, nil, err
	}
	block, _ = pem.Decode(certPEM)

	cert, err := x509.ParseCertificate(block.Bytes)
	if err != nil {
		return nil, nil, err
	}

	return key, cert, nil
}
