ssh: 
	ssh root@161.35.247.132

port-forward-db:
	ssh -L 35432:localhost:5432 -Nf root@161.35.247.132
