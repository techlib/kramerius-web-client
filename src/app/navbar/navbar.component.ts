import { LibrarySearchService } from './../services/library-search.service';
import { Router } from '@angular/router';
import { Component, OnInit, Input } from '@angular/core';
import { Translator } from 'angular-translator';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss']
})
export class NavbarComponent implements OnInit {

  @Input() autocomplete;
  @Input() input;

  searchStr;

  constructor(public translator: Translator,
    public router: Router,
    public service: LibrarySearchService) {
  }

  ngOnInit() {
  }

  onSelected(event) {
    if (event) {
      const uuid = event['originalObject']['PID'];
      const title = event['title'];
      this.router.navigate(['/search'], { queryParams: { q: title } });
    }
  }

  onLanguageChanged(lang: string) {
    localStorage.setItem('lang', lang);
    this.translator.language = lang;
  }

  onKeyUp(event) {
    if (event.keyCode === 13) {
      let q = this.searchStr;
      if (q == null) {
        q = '';
      }
      this.router.navigate(['/search'], { queryParams: { q: q } });
    }
  }


}
