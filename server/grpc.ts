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

// the generated Dialogflow proto
const Dialogflow = require('../pbjs-genfiles/proto').google.cloud.dialogflow.v2beta1;
// for service account auth
const auth = require('google-auth-library');
// const {GoogleAuth} = require('google-auth-library');
// to fetch the gRPC url 
const fetch = require('node-fetch');

async function main() {
  let headers = {};

  if (process.env['GOOGLE_APPLICATION_CREDENTIALS']) {
    // service account authentication
    const serviceUri =
      'https://dialogflow.googleapis.com/google.cloud.dialogflow.v2beta1.Sessions';
    const googleAuth = new auth.GoogleAuth();
    const client = await googleAuth.getClient();
    headers = await client.getRequestHeaders(serviceUri);
  } else if (process.env['GOOGLE_API_KEY']) {
    // API key authentication
    headers = {'X-Goog-Api-Key': process.env['GOOGLE_API_KEY']};
  } else {
    throw new Error(
      'Please set one of environment variables: GOOGLE_APPLICATION_CREDENTIALS or GOOGLE_API_KEY'
    );
  }

  /*
      const auth = new GoogleAuth({
      scopes: 'https://www.googleapis.com/auth/cloud-platform'
    });
    const client = await auth.getClient();
    const projectId = await auth.getProjectId();
    const url = `https://dns.googleapis.com/dns/v1/projects/${projectId}`;
    const res = await client.request({ url });
    console.log(res.data);
  */


  headers['Content-Type'] = 'application/x-protobuf';

  // the urls to make the RPC calls to
  const detectUrl = 'https://dialogflow.googleapis.com/$rpc/google.cloud.dialogflow.v2beta1.Sessions/DetectIntent';
  const streamingUrl = 'https://dialogflow.googleapis.com/$rpc/google.cloud.dialogflow.v2beta1.Sessions/StreamingDetectIntent';
  
  // the formatted requests, based on the specs in the documentation
  const request = Dialogflow.DetectIntent.fromObject({
    session: 'projects/myprojectid/agent/sessions/mysessionid',
    query_input: 'Hello, how are you doing?'
  });

  // encode the request to a request buffer, by using the encode helper
  // method, part of the generated Proto.
  const requestBuffer = Dialogflow.DetectIntent.encode(
    request
  ).finish();

  // Fetch URL
  const fetchResult = await fetch(url, {
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
  const response = Dialogflow.DetectIntent.decode(
    Buffer.from(responseArrayBuffer)
  );

  // Log the results
  console.log(response);
  return response;
}
main().catch(err => {
    console.error(err);
});

 
 


