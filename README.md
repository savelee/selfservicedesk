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

## Deploy with Cloud Run

This application makes heavy use of websockets,
therefore you can't use the Cloud Run Managed Platform.
We will deploy it as containers in Anthos:

1. Run this command to create a cluster:

    `gcloud container clusters create selfservicedesk \
  --addons=HorizontalPodAutoscaling,HttpLoadBalancing,CloudRun \
  --machine-type=n1-standard-4 \
  --enable-stackdriver-kubernetes \
  --zone=europe-west4-a \
  --scopes cloud-platform`

1. Run this command to build the container:
   
    `gcloud builds submit --tag gcr.io/$PROJECT_ID/selfservicedesk`

1. Run this command to deploy to the cluster:

    `gcloud run deploy --image gcr.io/$PROJECT_ID/selfservicedesk --platform gke --cluster selfservicedesk --cluster-location europe-west4-a --update-env-vars PROJECT_ID=$PROJECT_ID,LANGUAGE_CODE=en-US,ENCODING=AUDIO_ENCODING_LINEAR_16,SAMPLE_RATE_HERZ=16000,SINGLE_UTTERANCE=true`

