import { DoBootstrap, Injector, NgModule, Type } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { TranslateLoader, TranslateModule, TranslateService } from '@ngx-translate/core';
import { PepAddonService } from '@pepperi-addons/ngx-lib';
import { AppComponent } from './app.component';
import { AppRoutingModule } from './app.routes';
import { SettingsComponent, SettingsModule } from './settings';
import { ConfigurationAssistantModule } from './settings/configuration-assistant/configuration-assistant.module';
import { HttpClientModule } from '@angular/common/http';

import { config } from './app.config';

@NgModule({
    declarations: [
        AppComponent,
    ],
    imports: [
        BrowserModule,
        BrowserAnimationsModule,
        HttpClientModule,
        SettingsModule,
        ConfigurationAssistantModule,
        TranslateModule.forRoot({
            loader: {
                provide: TranslateLoader,
                useFactory: (addonService: PepAddonService) => 
                    PepAddonService.createMultiTranslateLoader(config.AddonUUID, addonService, ['ngx-lib', 'ngx-composite-lib']),
                deps: [PepAddonService]
            }
        }),
        AppRoutingModule,
    ],
    providers: [],
    bootstrap: []
})
export class AppModule implements DoBootstrap {
    constructor(
        private injector: Injector,
        translate: TranslateService,
        private pepAddonService: PepAddonService
    ) {
        this.pepAddonService.setDefaultTranslateLang(translate);
    }

    ngDoBootstrap() {
        this.pepAddonService.defineCustomElement(`settings-element-${config.AddonUUID}`, SettingsComponent, this.injector);

        // this.pepAddonService.defineCustomElement(`block-element-${config.AddonUUID}`, BlockComponent, this.injector);
        // this.pepAddonService.defineCustomElement(`block-editor-element-${config.AddonUUID}`, BlockEditorComponent, this.injector);
    }
}

