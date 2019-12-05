/*
 * Copyright 2019 Google LLC
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are
 * met:
 *
 *     * Redistributions of source code must retain the above copyright
 * notice, this list of conditions and the following disclaimer.
 *     * Redistributions in binary form must reproduce the above
 * copyright notice, this list of conditions and the following disclaimer
 * in the documentation and/or other materials provided with the
 * distribution.
 *     * Neither the name of Google Inc. nor the names of its
 * contributors may be used to endorse or promote products derived from
 * this software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
 * "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
 * LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
 * A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
 * OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
 * SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
 * LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
 * DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
 * THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 *
 */

declare function require(name:string);

// the generated Dialogflow proto
const Dialogflow = require('./pbjs-genfiles/proto').google.cloud.dialogflow.v2beta1;
// for service account auth
const {GoogleAuth} = require('google-auth-library');
// to fetch the gRPC url 
import fetch from 'node-fetch';

const languageCode = 'en-GB';

async function main() {
  
  const auth = new GoogleAuth({
    scopes: [
      'https://www.googleapis.com/auth/cloud-platform',
      'https://www.googleapis.com/auth/dialogflow',
    ]
  });
  const client = await auth.getClient();
  const projectId = await auth.getProjectId();
  
  // the urls to make the RPC calls to
  const detectUrl = 'https://dialogflow.googleapis.com/$rpc/google.cloud.dialogflow.v2beta1.Sessions/DetectIntent';
  // const streamingUrl = 'https://dialogflow.googleapis.com/$rpc/google.cloud.dialogflow.v2beta1.Sessions/StreamingDetectIntent';
  
  //const headers = await client.getRequestHeaders();
  
  const headers = {
    "authorization": "Bearer " + "ya29.c.KmCzB3uE8YVcOe_o_KLaOU4CQseH_rQwlvYmXSpCY0fn9TqUDkie4OJXrY8sn45SrHe-YdCAXkC-Grpy73YG4U3sk3LMtcY8h9JO3o9xOHOVLMER45ZkCvJHACwK5GUmUlY",
  }
  headers['Content-Type'] = 'application/x-protobuf';

  console.log('Headers :');
  console.log(headers);

  console.log('Dialoglow Proto');
  //console.log(Dialogflow);

  // the formatted requests, based on the specs in the documentation
  const request = Dialogflow.DetectIntentRequest.fromObject({
    session: `projects/${projectId}/agent/sessions/mysessionid`,
    queryInput: {
        text: {
          text: 'Hello, how are you doing?',
          languageCode
        }
      }
  });

  console.log(request);

  // encode the request to a request buffer, by using the encode helper
  // method, part of the generated Proto.
  const requestBuffer = Dialogflow.DetectIntentRequest.encode(
    request
  ).finish();

  // Fetch URL
  const fetchResult = await fetch(detectUrl, {
    headers,
    method: 'post',
    body: requestBuffer,
  });
  if (!fetchResult.ok) {
    throw new Error(fetchResult.statusText);
  }

  // Format the response buffer to readable code
  const responseArrayBuffer = await fetchResult.arrayBuffer();

  // Make the results readable
  const response = Dialogflow.DetectIntentResponse.decode(
    Buffer.from(responseArrayBuffer)
  );

  // Log the results
  console.log(response);
  return response;
}
main().catch(err => {
    console.error(err);
});

 
 


