# You should have `mkcert` in your system'.
# For MacOS : `brew install mkcert`
# For Linux : https://github.com/FiloSottile/mkcert

# We will not use Firefox for Mirrorize, so you can ignore `certutil` or `firefox` related warnings. But if you want, feel free to do. 

mkcert -install
mkcert localhost 127.0.0.1 ::1