import { Component, OnInit, OnDestroy } from '@angular/core';
import { HttpErrorResponse, HttpResponse } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import { JhiEventManager, JhiAlertService } from 'ng-jhipster';

import { IPreferences } from 'app/shared/model/preferences.model';
import { AccountService } from 'app/core';
import { PreferencesService } from './preferences.service';

@Component({
    selector: 'jhi-preferences',
    templateUrl: './preferences.component.html'
})
export class PreferencesComponent implements OnInit, OnDestroy {
    preferences: IPreferences[];
    currentAccount: any;
    eventSubscriber: Subscription;
    currentSearch: string;

    constructor(
        protected preferencesService: PreferencesService,
        protected jhiAlertService: JhiAlertService,
        protected eventManager: JhiEventManager,
        protected activatedRoute: ActivatedRoute,
        protected accountService: AccountService
    ) {
        this.currentSearch =
            this.activatedRoute.snapshot && this.activatedRoute.snapshot.params['search']
                ? this.activatedRoute.snapshot.params['search']
                : '';
    }

    loadAll() {
        if (this.currentSearch) {
            this.preferencesService
                .search({
                    query: this.currentSearch
                })
                .pipe(
                    filter((res: HttpResponse<IPreferences[]>) => res.ok),
                    map((res: HttpResponse<IPreferences[]>) => res.body)
                )
                .subscribe((res: IPreferences[]) => (this.preferences = res), (res: HttpErrorResponse) => this.onError(res.message));
            return;
        }
        this.preferencesService
            .query()
            .pipe(
                filter((res: HttpResponse<IPreferences[]>) => res.ok),
                map((res: HttpResponse<IPreferences[]>) => res.body)
            )
            .subscribe(
                (res: IPreferences[]) => {
                    this.preferences = res;
                    this.currentSearch = '';
                },
                (res: HttpErrorResponse) => this.onError(res.message)
            );
    }

    search(query) {
        if (!query) {
            return this.clear();
        }
        this.currentSearch = query;
        this.loadAll();
    }

    clear() {
        this.currentSearch = '';
        this.loadAll();
    }

    ngOnInit() {
        this.loadAll();
        this.accountService.identity().then(account => {
            this.currentAccount = account;
        });
        this.registerChangeInPreferences();
    }

    ngOnDestroy() {
        this.eventManager.destroy(this.eventSubscriber);
    }

    trackId(index: number, item: IPreferences) {
        return item.id;
    }

    registerChangeInPreferences() {
        this.eventSubscriber = this.eventManager.subscribe('preferencesListModification', response => this.loadAll());
    }

    protected onError(errorMessage: string) {
        this.jhiAlertService.error(errorMessage, null, null);
    }
}
