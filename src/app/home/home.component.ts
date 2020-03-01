import { Component, OnInit, AfterViewInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit, AfterViewInit {

  constructor(public dialog: MatDialog) {
  }

  ngAfterViewInit() {
  }

  showAbout() {
    const dialogRef = this.dialog.open(AboutDialog);

    dialogRef.afterClosed().subscribe(result => {
      console.log(`Dialog result: ${result}`); 
    });
  }

  ngOnInit() {
  }

}

@Component({
  selector: 'about-dialog',
  templateUrl: 'about-dialog.html',
})
export class AboutDialog {}
