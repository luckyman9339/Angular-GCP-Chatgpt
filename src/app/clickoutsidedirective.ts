import { Directive, ElementRef, Output, EventEmitter, HostListener } from '@angular/core';
import { AppComponent } from './app.component';

@Directive({
  selector: '[clickOutside]'
})
export class ClickOutsideDirective {
  @Output() clickOutside = new EventEmitter<boolean>();

  constructor(private elementRef: ElementRef) {}

  @HostListener('document:click', ['$event.target'])
  public onClick(targetElement: EventTarget): void {
    const clickedInside = this.elementRef.nativeElement.contains(targetElement as Node);
    if (!clickedInside) {
      // console.log('Clicked inside page, close menu')
      this.clickOutside.emit(false);
    }
  }
}
