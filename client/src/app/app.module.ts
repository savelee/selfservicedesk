import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { HttpClientModule } from '@angular/common/http';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { MicrophoneComponent } from './microphone/microphone.component';
import { DialogflowComponent } from './dialogflow/dialogflow.component';

@NgModule({
  declarations: [
    AppComponent,
    MicrophoneComponent,
    DialogflowComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
