import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { HttpClientModule } from '@angular/common/http';

import { TranslateModule } from '@ngx-translate/core';

import { PepNgxLibModule, PepAddonService } from '@pepperi-addons/ngx-lib';
import { PepTopBarModule } from '@pepperi-addons/ngx-lib/top-bar';
import { PepSizeDetectorModule } from '@pepperi-addons/ngx-lib/size-detector';
import { PepPageLayoutModule } from '@pepperi-addons/ngx-lib/page-layout';
import { PepIconRegistry, PepIconModule, pepIconSystemClose } from '@pepperi-addons/ngx-lib/icon';
import { PepButtonModule } from '@pepperi-addons/ngx-lib/button';
import { PepDialogModule } from '@pepperi-addons/ngx-lib/dialog';
import { PepMenuModule } from '@pepperi-addons/ngx-lib/menu';
import { PepTextboxModule } from '@pepperi-addons/ngx-lib/textbox';

import { PepGenericListModule } from '@pepperi-addons/ngx-composite-lib/generic-list';

import { EditorListComponent } from './editor-list.component';
import { AddonService } from 'src/app/services/addon.service';
import { PepGenericFormModule } from '@pepperi-addons/ngx-composite-lib/generic-form';
import { MatDialogModule } from '@angular/material/dialog';

const pepIcons = [
    pepIconSystemClose,
];

export const routes: Routes = [
    {
        path: '',
        component: EditorListComponent
    }
];

@NgModule({
    declarations: [
        EditorListComponent
    ],
    imports: [
        CommonModule,
        HttpClientModule,
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
        PepGenericListModule,
        TranslateModule.forChild(),
        RouterModule.forChild(routes)
    ],
    exports:[EditorListComponent],
    providers:[
        AddonService
    ]
})
export class EditorListModule {
    constructor(
        private pepIconRegistry: PepIconRegistry,
    ) {
        this.pepIconRegistry.registerIcons(pepIcons);
    }
}
