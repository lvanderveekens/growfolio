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

#### Run production build

    (local) frontend $ npm run build

Verify there are no errors...

#### Copy build to server

    (local) frontend $ make scp-build

#### Log in to server

    (local) $ ssh root@161.35.247.132

#### Start frontend

    (server) frontend $ npm run start

### Backend

    (local) backend $ make build-production
    (local) backend $ make scp-build
    (server) backend $ make run-production
