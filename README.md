[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)

# Google Cloud / Dialogflow - Self Service Desk Demo

**By Lee Boonstra, Developer Advocate @ Google Cloud.**

[![Open in Cloud Shell](http://gstatic.com/cloudssh/images/open-btn.svg)](https://console.cloud.google.com/cloudshell/editor?cloudshell_git_repo=https%3A%2F%2Fgithub.com%2Fsavelee%2Fselfservicedesk&cloudshell_tutorial=TUTORIAL.md)

TODO

1. Download the service account key.

2. Assign the key to environment var: **OOGLE_APPLICATION_CREDENTIALS**

 LINUX/MAC
 `export GOOGLE_APPLICATION_CREDENTIALS=/path/to/service_account.json`
 WIN
 `set GOOGLE_APPLICATION_CREDENTIALS=c:\keys\key-ssd.json`

3.  Login: `gcloud auth login`

4. Compile the proto (TODO automate this)

`cd grpc`
`npm run-script compile-proto`
`npm run-script watch`