[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)

# Google Cloud / Dialogflow - Self Service Desk Demo

**By Lee Boonstra, Developer Advocate @ Google Cloud.**

[![Open in Cloud Shell](http://gstatic.com/cloudssh/images/open-btn.svg)](https://console.cloud.google.com/cloudshell/editor?cloudshell_git_repo=https%3A%2F%2Fgithub.com%2Fsavelee%2Fselfservicedesk&cloudshell_tutorial=TUTORIAL.md)

Airport SelfServiceDesk demo, to demonstrate how microphone streaming to GCP works, from a web application.

In this demo, you can start recording your voice, it will display answers on a screen.

# Setup Local Environment

These steps will deploy a Node JS application with a Angular client, to a cluster with **Cloud Run for Anthos**.
It will also deploy a Dialogflow Agent, for intent matching.

1. Set the PROJECT_ID variable: export PROJECT_ID=[gcp-project-id]

1. Set the project: `gcloud config set project $PROJECT_ID`

1. Download the service account key.

1. Assign the key to environment var: **GOOGLE_APPLICATION_CREDENTIALS**

 LINUX/MAC
 `export GOOGLE_APPLICATION_CREDENTIALS=/path/to/service_account.json`
 WIN
 `set GOOGLE_APPLICATION_CREDENTIALS=c:\keys\key-ssd.json`

1. Login: `gcloud auth login`

1. Open **env.txt**, change the environment variables and rename the file to **.env**

1. Enable APIs:

 ```
  gcloud services enable \
  container.googleapis.com \ 
  containerregistry.googleapis.com \
  cloudbuild.googleapis.com \
  run.googleapis.com \
  cloudtrace.googleapis.com \
  dialogflow.googleapis.com \
  logging.googleapis.com \
  dns.googleapis.com \
  monitoring.googleapis.com \
  sourcerepo.googleapis.com \
  translate.googleapis.com
```

2. Build the client-side Angular app:
    
    ```
    cd client && npm install
    npm run-script build
    ```

3. Start the server Typescript app, which is exposed on port 8080:

    ```
    cd ../server && npm install
    npm run-script watch
    ```

4. Browse to http://localhost:8080

## Setup Dialogflow

1. Create a Dialogflow agent at: http://console.dialogflow.com

1. Zip the contents of the *dialogflow* folder, from this repo.

1. Click **settings**, **Import**, and upload the Dialogflow agent zip, you just created.

## Deploy with App Engine Flex

This demo makes heavy use of websockets and
the microphone `getUserMedia()` HTML5 API requires
to run over HTTPS. Therefore, I deploy this demo
with a custom runtime, so I can include my own **Dockerfile**.

1. Edit the **app.yaml** to tweak the environment variables.
Set the correct Project ID.

1. Deploy with: `gcloud app deploy`

1. Browse: `gcloud app browse`


## Deploy with Cloud Run

This application makes heavy use of websockets,
therefore you can't use the Cloud Run Managed Platform.
We will deploy it as containers in Anthos:

**NOTE: Currently, I can't get Cloud Run for Anthos
working on port 443.**

1. Run this command to build the container:
   
    `gcloud builds submit --tag gcr.io/$PROJECT_ID/selfservicedesk`

1. Run these commands to set defaults:

    ```
    gcloud config set compute/zone europe-west1-b && gcloud config set run/platform gke && gcloud config set run/cluster selfservicedesk && gcloud config set run/cluster_location europe-west1-b
    ```

1. Run this command to create a cluster:

    ```
    gcloud beta container clusters create selfservicedesk \
    --addons=HorizontalPodAutoscaling,HttpLoadBalancing,CloudRun \
    --machine-type=n1-standard-2 \
    --num-nodes=3 \
    --cluster-version=1.14.7-gke.23 \
    --enable-stackdriver-kubernetes
    ```

    You will get a result something like this:

    *selfservicedesk  europe-west1-b  1.14.7-gke.23   34.76.247.19  n1-standard-2  1.14.7-gke.23  3          RUNNING*

1.  Configure the URL:

    `kubectl patch configmap config-domain --namespace knative-serving --patch \
'{"data": {"example.com": null, "[YOUR-DOMAIN]": ""}}'`

1. Run this command to deploy to the cluster:

    `gcloud run deploy selfservicedesk --image gcr.io/selfservicedesk/selfservicedesk@sha256:dc5d554279f744b257829eb7b398568077b7cb9494da6638e9932e9df325c5b2 --platform gke --cluster selfservicedesk --cluster-location europe-west1-b --update-env-vars PROJECT_ID=selfservicedesk,LANGUAGE_CODE=en-US,ENCODING=AUDIO_ENCODING_LINEAR_16,SAMPLE_RATE_HERZ=16000,SINGLE_UTTERANCE=true`

1. Since this is not the Cloud Run managed platform, I have to map the URL to a custom domain:

    `gcloud beta run domain-mappings create --service selfservicedesk --domain [yourdomain.com]`

    This will return an external ip, you can use:

    `gcloud compute addresses create selfservicedesk --region europe-west1 --addresses [exernal-ip]`

    After you've mapped your service to a custom domain in Cloud Run, you need to update your DNS records at your domain registrar.

    *Select the type returned in the DNS record in the previous step: A, or AAAA, or CNAME. Use the name www to map to www.example.com. Use the name @ to map example.com.*

    `gcloud run domain-mappings describe --domain [your-domain.com]`

1. And in order for websockets to work out, it has to run over HTTPS, therefore run Certbot from your Cloud Shell.
https://cloud.google.com/run/docs/gke/enabling-cluster-https

    ```
    wget https://dl.eff.org/certbot-auto
chmod a+x ./certbot-auto
    ```

    ```
    ./certbot-auto certonly --manual --preferred-challenges dns -d '*.yourdomain.com'
    ```

    You have to manually renew the cert every 90 days.

    To non-interactively renew *all* of your certificates, run
   `certbot-auto renew`.

    After certbot completes, you have two output files, privkey.pem and fullchain.pem. These files are used when you import a TLS certificate/private key into a Kubernetes Secret:

    ```
    sudo mkdir /home/keys/
    sudo chmod 777 /etc/letsencrypt/live/
    cd /etc/letsencrypt/live/[your-domain]
    sudo cp privkey.pem /home/keys/
    sudo cp fullchain.pem /home/keys/
    kubectl create --namespace default secret tls ingressgateway-certs \
--key /home/keys/privkey.pem \
--cert /home/keys/fullchain.pem
    ```

    It returns: **secret/istio-ingress-certs created**
    **secret/ingressgateway-certs created**

    Next we will edit the gateway in Vim:

    kubectl edit gateway gke-system-gateway --namespace knative-serving`

    Browse to the end of the line, and hit *i* to insert:
    ```
    - hosts:
      - "*"
      port:
        name: https
        number: 443
        protocol: HTTPS
      tls:
        mode: SIMPLE #PASSTHROUGH
        privateKey: /etc/istio/ingressgateway-certs/tls.key
        serverCertificate: /etc/istio/ingressgateway-certs/tls.crt
    ```
-------------------------------- 
and now i have no idea
how to add the tls


        credentialName: "istio-ingress-certs" # must be the same as secret

cat <<EOF | kubectl apply -f -
apiVersion: networking.istio.io/v1alpha3
kind: Gateway
metadata:
  name: gke-system-gateway
  namespace: knative-serving
spec:
  selector:
    istio: ingressgateway # use istio default ingress gateway
  servers:
  - port:
      number: 443
      name: https
      protocol: HTTPS
    tls:
      mode: SIMPLE
      credentialName: "istio-ingress-certs" # must be the same as secret
    hosts:
    - "selfservicedesk.cloudtricks.eu"
EOF

cat <<EOF | kubectl apply -f -
apiVersion: networking.istio.io/v1alpha3
kind: Gateway
metadata:
  name: gke-system-gateway
  namespace: knative-serving
spec:
  selector:
    istio: ingressgateway
  servers:
  - port:
      number: 80
      name: http
      protocol: HTTP
    hosts:
    - "*"
    tls:
      httpsRedirect: true
  - port:
      number: 443
      name: https
      protocol: HTTPS
    hosts:
    - "*"
    tls:
      mode: SIMPLE
      privateKey: /etc/istio/ingressgateway-certs/tls.key
      serverCertificate: /etc/istio/ingressgateway-certs/tls.crt
EOF

cat <<EOF | kubectl apply -f -
apiVersion: networking.istio.io/v1alpha3
kind: VirtualService
metadata:
  name: ssd
spec:
  hosts:
  - "selfservicedesk.cloudtricks.eu"
  gateways:
  - mygateway
  http:
  - match:
    - uri:
        prefix: /status
    - uri:
        prefix: /delay
    route:
    - destination:
        port:
          number: 8000
        host: ssd
EOF

cat << EOF > knative-ingress-gateway-patch.yaml
spec:
  selector:
    istio: ilbgateway
  servers:
  - hosts:
    - '*'
    port:
      name: http
      number: 80
      protocol: HTTP
  - hosts:
    - '*'
    port:
      name: https
      number: 443
      protocol: HTTPS
    tls:
      mode: SIMPLE
      privateKey: /etc/istio/istio-ingress-certs/tls.key
      serverCertificate: /etc/istio/istio-ingress-certs/tls.crt
EOF


  tls:
  - secretName: istio-ingress-certs

tls:
  - hosts:
    - selfservicedesk.cloudtricks.eu
    secretName: istio-ingress-certs

  - port:
      number: 443
      name: https
      protocol: HTTPS
    tls:
      mode: SIMPLE
      serverCertificate: /etc/istio/istio-ingress-certs/tls.crt
      privateKey: /etc/istio/istio-ingress-certs/tls.key
    hosts:
    - selfservicedesk.cloudtricks.eu

```
kubectl apply -f - <<EOF
apiVersion: networking.istio.io/v1alpha3
kind: Gateway
spec:
  selector:
    istio: ingressgateway
  servers:
    - hosts:
      - "*"
      port:
        name: http
        number: 80
        protocol: HTTP
    - hosts:
      - "*"
      port:
        name: https
        number: 443
        protocol: HTTPS
      tls:
        mode: SIMPLE
        privateKey: /etc/istio/istio-ingress-certs/tls.key
        serverCertificate: /etc/istio/istio-ingress-certs/tls.crt
EOF
```

    Edit **istio-ingress** YAML in **GKE -> Services & Ingresses** and add the following block as ingressgateway
    spec:

    ```
    servers:
    - hosts:
      - "*"
      port:
        name: http
        number: 80
        protocol: HTTP
    - hosts:
      - "*"
      port:
        name: https
        number: 443
        protocol: HTTPS
      tls:
        mode: SIMPLE
        privateKey: /etc/istio/istio-ingress-certs/tls.key
        serverCertificate: /etc/istio/istio-ingress-certs/tls.crt
    ```

    kubectl get svc istio-ingress -n gke-system 

 