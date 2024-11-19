mkcert \
  -cert-file g-1234.fps.goog.crt \
  -key-file g-1234.fps.goog.key \
  g-1234.fps.goog

cp g-1234.fps.goog.* ./bin/local-env/proxy/certs/

cp $(mkcert -CAROOT)/rootCA.pem ./bin/local-env/wordpress/ca-certificate/
