# Speech to Text / Text to Speech examples

Here are the steps, to run these examples locally:

1. Install the required libraries, run the following command in this *examples* folder:

    `npm install`

1. Start the simpleserver node app:

   `npm --EXAMPLE=1 --PORT=8080 --PROJECT_ID=[your-gcp-project-id] run start`

To switch to the various examples, edit the EXAMPLE variable to one of these:

* Example **1**: Dialogflow Speech Intent Detection
* Example **2**: Dialogflow Speech Detection through streaming
* Example **3**: Dialogflow Speech Intent Detection with Text to Speech output
* Example **4**: Speech to Text Transcribe Call
* Example **5**: Speech to Text Long Polling / Streaming
* Example **6**: Text to Speech

1. Browse to http://localhost:8080. Open the inspector, to preview the
Dialogflow results object.
