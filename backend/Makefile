BINARY_NAME=growfolio-backend
SERVER_IP=161.35.247.132

build: 
	go build -o ${BINARY_NAME} main.go

run:
	make build
	./${BINARY_NAME}

build-production:
	GOOS=linux GOARCH=amd64 go build -o ${BINARY_NAME} main.go

run-production:
	./${BINARY_NAME} 2>&1 > output.log &

scp-to-server:
	scp .env.prd root@${SERVER_IP}:/root/growfolio/backend/.env
	scp ${BINARY_NAME} root@${SERVER_IP}:/root/growfolio/backend
