[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)

# Google Cloud / Dialogflow - Self Service Desk Demo

**By Lee Boonstra, Developer Advocate @ Google Cloud.**

[![Open in Cloud Shell](http://gstatic.com/cloudssh/images/open-btn.svg)](https://console.cloud.google.com/cloudshell/editor?cloudshell_git_repo=https%3A%2F%2Fgithub.com%2Fsavelee%2Fselfservicedesk&cloudshell_tutorial=TUTORIAL.md)


# Setup Local Environment

1. Set the project ID: export PROJECT_ID=[gcp-project-id]

1. Set the project: `gcloud config set project $PROJECT_ID`

1. Download the service account key.

1. Assign the key to environment var: **GOOGLE_APPLICATION_CREDENTIALS**

 LINUX/MAC
 `export GOOGLE_APPLICATION_CREDENTIALS=/path/to/service_account.json`
 WIN
 `set GOOGLE_APPLICATION_CREDENTIALS=c:\keys\key-ssd.json`

1. Login: `gcloud auth login`

1. Open **env.txt**, change the environment variables and rename the file to **.env**

1. Build the client-side Angular app:
    
    `cd client`
    `npm install`
    `npm run-script build`

1. Start the server Typescript app, which is exposed on port 3000:

    `cd ../server`
    `npm install`
    `npm run-script watch`

1. Browse to http://localhost:3000

## Deploy with Cloud Run

1. Run these commands from the root of the project:
   
    `gcloud builds submit --tag gcr.io/$PROJECT_ID/selfservicedesk`

    `gcloud run deploy --image gcr.io/$PROJECT_ID/selfservicedesk --platform managed`

