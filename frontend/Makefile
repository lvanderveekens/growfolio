SERVER_IP=161.35.247.132

copy-build:
	rsync -av -e ssh --exclude='client-development-fallback' --exclude='client-development' --exclude='server-development' .next/ root@${SERVER_IP}:~/growfolio/frontend/.next/

ssh: 
	ssh root@161.35.247.132
