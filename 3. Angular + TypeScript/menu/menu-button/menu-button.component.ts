import { Component, Input } from '@angular/core';
import { map } from 'rxjs/operators';
import { HeaderService } from '../../../services/header.service';

@Component({
    selector: 'menu-button',
    templateUrl: './menu-button.component.html',
    styleUrls: ['./menu-button.component.scss']
})
export class MenuButtonComponent {
    constructor(private _headerService: HeaderService) {
    }

    whiteDots$ = this._headerService.whiteHeader$.pipe(
        map(value => !value)
    );

    @Input()
    pressed: boolean = false;
}
