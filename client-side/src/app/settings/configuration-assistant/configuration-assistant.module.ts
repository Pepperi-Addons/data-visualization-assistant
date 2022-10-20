import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { HttpClientModule } from '@angular/common/http';
import { TranslateModule, TranslateStore } from '@ngx-translate/core';
import { PepNgxLibModule } from '@pepperi-addons/ngx-lib';
import { PepTopBarModule } from '@pepperi-addons/ngx-lib/top-bar';
import { PepSizeDetectorModule } from '@pepperi-addons/ngx-lib/size-detector';
import { PepPageLayoutModule } from '@pepperi-addons/ngx-lib/page-layout';
import { PepIconRegistry, PepIconModule, pepIconSystemClose } from '@pepperi-addons/ngx-lib/icon';
import { PepButtonModule } from '@pepperi-addons/ngx-lib/button';
import { PepDialogModule } from '@pepperi-addons/ngx-lib/dialog';
import { PepMenuModule } from '@pepperi-addons/ngx-lib/menu';
import { PepTextboxModule } from '@pepperi-addons/ngx-lib/textbox';
import { ConfigurationAssistantComponent } from './configuration-assistant.component';
import { AddonService } from 'src/app/services/addon.service';
import { PepGenericFormModule } from '@pepperi-addons/ngx-composite-lib/generic-form';
import { PepSelectModule } from '@pepperi-addons/ngx-lib/select';
import { MatDialogModule } from '@angular/material/dialog';

const pepIcons = [
    pepIconSystemClose,
];

export const routes: Routes = [
    {
        path: '',
        component: ConfigurationAssistantComponent
    }
];

@NgModule({
    declarations: [
        ConfigurationAssistantComponent
    ],
    imports: [
        CommonModule,
        // FormsModule,
        // ReactiveFormsModule,
        HttpClientModule,
        // PepNgxCompositeLibModule,
        PepNgxLibModule,
        PepSizeDetectorModule,
        PepIconModule,
        PepTopBarModule,
        PepMenuModule,
        PepPageLayoutModule,
        PepButtonModule,
        PepDialogModule,
        PepTextboxModule,
        MatDialogModule,
        PepGenericFormModule,
        PepSelectModule,
        TranslateModule.forChild(),
        RouterModule.forChild(routes)
    ],
    exports:[ConfigurationAssistantComponent],
    providers:[
        TranslateStore,
        AddonService
    ]
})
export class ConfigurationAssistantModule {
    constructor(
        private pepIconRegistry: PepIconRegistry,
    ) {
        this.pepIconRegistry.registerIcons(pepIcons);
    }
}
