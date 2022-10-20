import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { TranslateLoader, TranslateModule, TranslateService, TranslateStore } from '@ngx-translate/core';

import { PepNgxLibModule, PepAddonService } from '@pepperi-addons/ngx-lib';

import { SettingsRoutingModule } from './settings.routes';
import { SettingsComponent } from './settings.component';

import { config } from '../app.config';
import { ConfigurationAssistantModule } from './configuration-assistant/configuration-assistant.module';

@NgModule({
    declarations: [
        SettingsComponent
    ],
    imports: [
        CommonModule,
        PepNgxLibModule,
        ConfigurationAssistantModule,
        TranslateModule.forChild({
            loader: {
                provide: TranslateLoader,
                useFactory: (addonService: PepAddonService) => 
                    PepAddonService.createMultiTranslateLoader(config.AddonUUID , addonService, ['ngx-lib', 'ngx-composite-lib']),
                deps: [PepAddonService]
            }
        }),
        SettingsRoutingModule,
    ],
    providers: [
        TranslateStore,
        // When loading this module from route we need to add this here (because only this module is loading).
    ]
})
export class SettingsModule {
    constructor(
        translate: TranslateService,
        private pepAddonService: PepAddonService
    ) {
        this.pepAddonService.setDefaultTranslateLang(translate);
    }
}
