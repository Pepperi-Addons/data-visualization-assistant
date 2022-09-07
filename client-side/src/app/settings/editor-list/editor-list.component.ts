import { Component, EventEmitter, Input, OnInit, Output, ViewChild } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import { TranslateService } from '@ngx-translate/core';

import { PepLayoutService, PepScreenSizeType } from '@pepperi-addons/ngx-lib';
import { PepSelectionData } from '@pepperi-addons/ngx-lib/list';
import { config } from '../../addon.config';
import { AddonService } from "src/app/services/addon.service";

@Component({
    selector: 'editor-list',
    templateUrl: './editor-list.component.html',
    styleUrls: ['./editor-list.component.scss']
})
export class EditorListComponent implements OnInit {
    screenSize: PepScreenSizeType;
    dataIsIndexedFlag;
    configuration;
    dataView;// = this.getDataView()
    dataSource;// = this.getDataSource()

    constructor(
        public router: Router,
        public activatedRoute: ActivatedRoute,
        public layoutService: PepLayoutService,
        public translate: TranslateService,
        public addonService: AddonService
    ) {
        this.layoutService.onResize$.subscribe(size => {
            this.screenSize = size;
        });
    }

    ngOnInit() {
        this.addonService.addonUUID = config.AddonUUID;
        this.dataIsIndexedFlag = this.dataIsIndexed();
        this.configuration = this.emptyConfiguration();
        this.dataView = this.getDataView()
        this.dataSource = this.getDataSource()
    }

    openDialog() {
    }

    navigateToDataIndexSettings() {
        // navigate to data index settings
        this.router.navigate(['../../../settings/10979a11-d7f4-41df-8993-f06bfd778304/data_index'], {
            relativeTo: this.activatedRoute,
            queryParamsHandling: 'preserve'
        })
    }

    async dataIsIndexed() {
        const all_activities_scheme = await this.addonService.getDataIndexSchemes();
        if(all_activities_scheme && (Object.keys(all_activities_scheme.Fields)).length > 0)
            return true;

        return false;
    }

    emptyConfiguration() {
        return {
            genericSlug: "",
            accountSlug: ""
        }
    }

    getDataSource(){
        return this.configuration
   }

   getDataView() {
       return {
         Type: "Form",
         Hidden: false,
         Columns: [],
         Context: {
           Object: {
             Resource: "transactions",
             InternalID: 0,
             Name: "Object Name",
           },
           Name: "Context Name",
           ScreenSize: "Tablet",
           Profile: {
             InternalID: 0,
             Name: "Profile Name",
           },
         },
         Fields: [
           {
             FieldID: "Name",
             Type: "TextBox",
             Title: "Name",
             Mandatory: false,
             ReadOnly: false,
             Layout: {
               Origin: {
                 X: 0,
                 Y: 0,
               },
               Size: {
                 Width: 2,
                 Height: 0,
               },
             },
             Style: {
               Alignment: {
                 Horizontal: "Stretch",
                 Vertical: "Stretch",
               },
             },
           },
           {
            FieldID: "Type",
            Type: "Title",
            Title: "Type",
            Mandatory: false,
            ReadOnly: true,
            Layout: {
              Origin: {
                X: 0,
                Y: 1,
              },
              Size: {
                Width: 2,
                Height: 0,
              },
            },
            Style: {
              Alignment: {
                Horizontal: "Stretch",
                Vertical: "Stretch",
              },
            },
            OptionalValues: [{Key: 'String', Value: 'String'},
                             {Key: 'Number', Value: 'Number'},
                             {Key: 'Date', Value: 'Date'},
                             {Key: 'Boolean', Value: 'Boolean'}]
          },
          {
            FieldID: "DefaultValue",
            Type: "TextBox",
            Title: "Default Value",
            Mandatory: false,
            ReadOnly: false,
            Layout: {
              Origin: {
                X: 0,
                Y: 2,
              },
              Size: {
                Width: 2,
                Height: 0,
              },
            },
            Style: {
              Alignment: {
                Horizontal: "Stretch",
                Vertical: "Stretch",
              },
            },
          },
          {
            FieldID: "PreviewValue",
            Type: "TextBox",
            Title: "Preview Value",
            Mandatory: false,
            ReadOnly: false,
            Layout: {
              Origin: {
                X: 0,
                Y: 3,
              },
              Size: {
                Width: 2,
                Height: 0,
              },
            },
            Style: {
              Alignment: {
                Horizontal: "Stretch",
                Vertical: "Stretch",
              },
            },
          }
         ],
         Rows: [],
       };
   }
}
