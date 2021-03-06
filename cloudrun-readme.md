# Deploy with Cloud Run

This application makes heavy use of websockets,
therefore you can't use the Cloud Run Managed Platform.
We will deploy it as containers in Anthos:

**NOTE: Currently, I can't get Cloud Run for Anthos
working on port 443.**

1. `export PROJECT_ID=[your-project-id]`

1. First build your container, and run this command:
   
    `gcloud builds submit --tag gcr.io/$PROJECT_ID/selfservicedesk`

1. Run these commands to set defaults:

    ```
    gcloud config set compute/zone europe-west1-b && gcloud config set run/platform gke && gcloud config set run/cluster selfservicedesk && gcloud config set run/cluster_location europe-west1
    ```

1. Run this command to create a cluster:

    ```
    gcloud beta container --project $PROJECT_ID clusters create "selfservicedesk" --region "europe-west1" --no-enable-basic-auth --cluster-version "1.13.11-gke.14" --machine-type "n1-standard-2" --image-type "COS" --disk-type "pd-standard" --disk-size "100" --scopes "https://www.googleapis.com/auth/devstorage.read_only","https://www.googleapis.com/auth/logging.write","https://www.googleapis.com/auth/monitoring","https://www.googleapis.com/auth/servicecontrol","https://www.googleapis.com/auth/service.management.readonly","https://www.googleapis.com/auth/trace.append" --num-nodes "3" --enable-stackdriver-kubernetes --enable-ip-alias --network "projects/selfservicedesk/global/networks/default" --subnetwork "projects/selfservicedesk/regions/europe-west1/subnetworks/default" --default-max-pods-per-node "110" --addons HorizontalPodAutoscaling,HttpLoadBalancing,CloudRun --enable-autoupgrade --enable-autorepair
    ```

    You will get a result something like this:

    *selfservicedesk  europe-west1  1.13.11-gke.14  35.195.243.241  n1-standard-2  1.13.11-gke.14  9          RUNNING*

1. Run this command to deploy to the cluster:

    ** I have to create this through the console,
    since the below command gives me problems. **

    *Service does not have any ready Revision.*

    * Select your image
    * Cloud Run for Anthos
    * Add these environment vars:

        LANGUAGE_CODE=en-US
        ENCODING=AUDIO_ENCODING_LINEAR_16
        SAMPLE_RATE_HERZ=16000
        SINGLE_UTTERANCE=true
        PROJECT_ID=[your-project-id]

1.  Configure the URL:

    `kubectl patch configmap config-domain --namespace knative-serving --patch \
'{"data": {"example.com": null, "[YOUR-DOMAIN]": ""}}'`

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
    kubectl create --namespace default secret tls istio-ingress-certs \
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

    and then I get this error:
    curl: (7) Failed to connect to selfservicedesk.cloudtricks.eu port 443: Connection refused

-------------------------------- 

GARBAGE - TESTING since I can't get HTTPS to work on my cluster


kubectl -n istio-system \
  patch gateway istio-autogenerated-k8s-ingress --type=json \
  -p='[{"op": "replace", "path": "/spec/servers/1/tls", "value": {"credentialName": "istio-ingress-certs", "mode": "SIMPLE", "privateKey": "/etc/istio/ingressgateway-certs/tls.key", "serverCertificate": "/etc/istio/ingressgateway-certs/tls.crt"}}]'

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