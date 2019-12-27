#!/bin/bash

bold() {
  echo ". $(tput bold)" "$*" "$(tput sgr0)";
}

err() {
  echo "$*" >&2;
}

bold "Set all vars..."
set -a
  source ./properties
  set +a
set -a
  source .env
  set +a

bold "Starting the setup process in project $PROJECT_ID..."
bold "Enable APIs..."
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


bold "Creating a service account $SERVICE_ACCOUNT_NAME..."

gcloud iam service-accounts create \
  $SERVICE_ACCOUNT_NAME \
  --display-name $SERVICE_ACCOUNT_NAME

SA_EMAIL=$(gcloud iam service-accounts list --filter="displayName:$SERVICE_ACCOUNT_NAME" --format='value(email)')
  
if [ -z "$SA_EMAIL" ]; then
  err "Service Account email is empty. Exiting."
fi

bold "Adding policy binding to $SERVICE_ACCOUNT_NAME email: $SA_EMAIL..."
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member serviceAccount:$SA_EMAIL \
  --role roles/clouddebugger.agent
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member serviceAccount:$SA_EMAIL \
  --role roles/dialogflow.admin
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member serviceAccount:$SA_EMAIL \
  --role roles/dialogflow.reader
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member serviceAccount:$SA_EMAIL \
  --role roles/errorreporting.admin
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member serviceAccount:$SA_EMAIL \
  --role roles/logging.logWriter
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member serviceAccount:$SA_EMAIL \
  --role roles/iam.serviceAccountKeyAdmin
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member serviceAccount:$SA_EMAIL \
  --role roles/dns.admin

bold "Saving the key..."
gcloud iam service-accounts keys create ../master.json \
  --iam-account $SERVICE_ACCOUNT_NAME@$PROJECT_ID.iam.gserviceaccount.com

GOOGLE_APPLICATION_CREDENTIALS=../master.json
ACCESS_TOKEN="$(gcloud auth application-default print-access-token)"

bold "Creating Storage bucket..."
gsutil mb gs://$GCLOUD_STORAGE_BUCKET_NAME/

bold "Zipping Intents..."
zip -r dialogflow/airportagent/agent.zip dialogflow/airportagent

bold "Uploading Intents to $GCLOUD_STORAGE_BUCKET_NAME..."
gsutil cp dialogflow/agent/agent.zip gs://$GCLOUD_STORAGE_BUCKET_NAME/

bold "Create a Dialogflow Agent..."
echo $ACCESS_TOKEN

JSONPROD="{\"defaultLanguageCode\":\"en\",\"displayName\":\"$PROD_AGENT_NAME\",\"parent\":\"projects/$PROJECT_ID\",\"timeZone\":\"Europe/Madrid\"}"
curl -H "Content-Type: application/json; charset=utf-8"  \
-H "Authorization: Bearer $ACCESS_TOKEN" \
-d $JSONPROD "https://dialogflow.googleapis.com/v2/projects/$PROJECT_ID/agent"

IMPORTFILES="{\"agentUri\":\"gs://$GCLOUD_STORAGE_BUCKET_NAME/agent.zip\"}"

bold "Import Intents to Prod"
curl -X POST \
-H "Authorization: Bearer $ACCESS_TOKEN" \
-H "Content-Type: application/json; charset=utf-8" \
-d $IMPORTFILES \
https://dialogflow.googleapis.com/v2/projects/$PROJECT_ID/agent:import

bold "Setup & Deployment complete!"