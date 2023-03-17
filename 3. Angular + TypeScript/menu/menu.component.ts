import { Component, HostListener } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

interface menuItem {
    link: string;
    text: string;
}

@Component({
    selector: 'menu',
    templateUrl: './menu.component.html',
    styleUrls: ['./menu.component.scss']
})
export class MenuComponent {
    constructor(private _route: ActivatedRoute) { }

    show: boolean = false;

    @HostListener("click", ["$event"])
    onHostClick(event: any) {
        event.stopPropagation();
    }

    @HostListener("window:click")
    onClick() {
        //close menu on click outside
        this.show = false;
    }

    toggleMenu() {
        this.show = !this.show;
    }

    menuItems: menuItem[] = [
        {
            link: "#whatWeDo",
            text: "What We Do?"
        },
        {
            link: "#vision",
            text: "Our Vision"
        },
        {
            link: "#cases",
            text: "Cases"
        },
        {
            link: "#technologies",
            text: "Technologies and Tools"
        },
        {
            link: "#whatPeopleSay",
            text: "What People Say"
        },
        {
            link: "#whoWeAre",
            text: "Who We Are?"
        },
        {
            link: "#footer",
            text: "Have A Project?"
        },
    ]
}
