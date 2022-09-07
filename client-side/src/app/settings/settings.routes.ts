import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { SettingsComponent } from './settings.component';

const routes: Routes = [
    {
        path: ':settingsSectionName/:addonUUID/:slugName',
        component: SettingsComponent,
        children: [
            {
                path: '**',
                loadChildren: () => import('./editor-list/editor-list.module').then(m => m.EditorListModule),
            }
        ]
    }
];

@NgModule({
    imports: [
        RouterModule.forChild(routes),
    ],
    exports: [RouterModule]
})
export class SettingsRoutingModule { }



