# Growfolio

Track your investment portfolio 💰.

## Server

### Log in to server

    $ ssh root@161.35.247.132

### Database port forwarding

    $ ssh -L 25432:localhost:5432 -Nf root@161.35.247.132

## Configure Stripe webhook

### Forward events to local machine

    $ stripe listen --forward-to localhost:8080/api/v1/stripe/webhook

### Trigger events 

    $ stripe trigger checkout.session.completed

## Deploy

### Frontend

    (local) frontend $ npm run build
    (local) frontend $ make scp-build

TODO:
    (server) frontend $ pm2 reload nextjs???
    (server) frontend $ pm2 stop nextjs???
    (server) frontend $ pm2 start npm --name "nextjs" -- start???

Build runs locally, because it's killed when done on the server due to lack of resources...

### Backend

    (local) backend $ make build-production
    (local) backend $ make scp-build
    (server) backend $ make run-production
