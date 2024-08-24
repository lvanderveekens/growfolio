# Growfolio

Track your investment portfolio 💰.

<img width="1264" alt="Screenshot 2024-08-24 at 17 33 51" src="https://github.com/user-attachments/assets/3dd5b99a-8013-4f8a-9f20-3b6ad9d10411">
<img width="1264" alt="Screenshot 2024-08-24 at 17 34 02" src="https://github.com/user-attachments/assets/923a6517-213b-4821-9548-eb27c1ace6d6">
<img width="1264" alt="Screenshot 2024-08-24 at 17 34 09" src="https://github.com/user-attachments/assets/27783bc7-948f-45b1-865b-f4b8f41daa20">
<img width="1264" alt="Screenshot 2024-08-24 at 17 34 27" src="https://github.com/user-attachments/assets/d06dd4b2-416d-41d8-818d-597226c84ef5">

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

Stop the dev server first. 

    (local) frontend $ npm run build
    (local) frontend $ make copy-build
    (server) frontend $ pm2 reload nextjs

Build runs locally, because it's killed when done on the server due to lack of resources...

### Backend

    (local) backend $ make build-production

Stop the server instance first before copying.

    (local) backend $ make copy-build
    (server) backend $ make run-production
