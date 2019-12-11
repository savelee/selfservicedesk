declare function require(name: string);
import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';


@Component({
  selector: 'app-dialogflow',
  templateUrl: './dialogflow.component.html',
  styleUrls: ['./dialogflow.component.scss']
})
export class DialogflowComponent implements OnInit {

  constructor(private http: HttpClient) {
    //console.log(this.http.get('/auth').subscribe(data => console.log(data)));
  }

  ngOnInit() {
    // this.detectIntent();
  }

}
