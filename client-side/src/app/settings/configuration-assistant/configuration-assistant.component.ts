import { Component, EventEmitter, Input, OnInit, Output, ViewChild } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import { TranslateService } from '@ngx-translate/core';
import { PepLayoutService, PepScreenSizeType } from '@pepperi-addons/ngx-lib';
import { config } from '../../addon.config';
import { AddonService } from "src/app/services/addon.service";

@Component({
    selector: 'configuration-assistant',
    templateUrl: './configuration-assistant.component.html',
    styleUrls: ['./configuration-assistant.component.scss']
})
export class ConfigurationAssistantComponent implements OnInit {
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
        if(all_activities_scheme && (Object.keys(all_activities_scheme.Fields)).length > 0) {}
            return true;

        return false;
    }

    emptyConfiguration() {
        return {
            genericSlug: "dashboard",
            accountSlug: "account_dashboard",
            transactionTotalPrice: "",
            transactionTotalQuantity: "",
            transactionLineTotalPrice: "",
            transactionLineTotalQuantity: ""
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
             FieldID: '',
             Type: "Separator",
             Title: "Slugs & pages to create",
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
            FieldID: "genericSlug",
            Type: "TextBox",
            Title: "Generic dashboard slug",
            Mandatory: false,
            ReadOnly: false,
            Layout: {
              Origin: {
                X: 0,
                Y: 1,
              },
              Size: {
                Width: 1,
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
            FieldID: "accountSlug",
            Type: "TextBox",
            Title: "Account dashboard slug",
            Mandatory: false,
            ReadOnly: false,
            Layout: {
              Origin: {
                X: 0,
                Y: 2,
              },
              Size: {
                Width: 1,
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
            FieldID: "",
            Type: "Separator",
            Title: "Fields to accumulate",
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
          },
          {
            FieldID: "transactionTotalPrice",
            Type: "TextBox",
            Title: "Transaction total price",
            Mandatory: false,
            ReadOnly: false,
            Layout: {
              Origin: {
                X: 0,
                Y: 4,
              },
              Size: {
                Width: 1,
                Height: 0,
              },
            },
            Style: {
              Alignment: {
                Horizontal: "Stretch",
                Vertical: "Stretch",
              },
            },
            OptionalValues: [{Key: 'test', Value: 'test'},
                             {Key: 'test1', Value: 'test1'}]
          },
          {
            FieldID: "transactionTotalQuantity",
            Type: "TextBox",
            Title: "Transaction total quantity",
            Mandatory: false,
            ReadOnly: false,
            Layout: {
              Origin: {
                X: 1,
                Y: 4,
              },
              Size: {
                Width: 1,
                Height: 0,
              },
            },
            Style: {
              Alignment: {
                Horizontal: "Stretch",
                Vertical: "Stretch",
              },
            },
            OptionalValues: [{Key: 'test', Value: 'test'}]
          },
          {
            FieldID: "transactionLineTotalPrice",
            Type: "TextBox",
            Title: "Transaction line total price",
            Mandatory: false,
            ReadOnly: false,
            Layout: {
              Origin: {
                X: 0,
                Y: 5,
              },
              Size: {
                Width: 1,
                Height: 0,
              },
            },
            Style: {
              Alignment: {
                Horizontal: "Stretch",
                Vertical: "Stretch",
              },
            },
            OptionalValues: [{Key: 'test', Value: 'test'},
                             {Key: 'test1', Value: 'test1'}]
          },
          {
            FieldID: "transactionLineTotalQuantity",
            Type: "TextBox",
            Title: "Transaction line total quantity",
            Mandatory: false,
            ReadOnly: false,
            Layout: {
              Origin: {
                X: 1,
                Y: 5,
              },
              Size: {
                Width: 1,
                Height: 0,
              },
            },
            Style: {
              Alignment: {
                Horizontal: "Stretch",
                Vertical: "Stretch",
              },
            },
            OptionalValues: [{Key: 'test', Value: 'test'}]
          },
          {
            FieldID: "",
            Type: "Separator",
            Title: "Queries filter",
            Mandatory: false,
            ReadOnly: false,
            Layout: {
              Origin: {
                X: 0,
                Y: 6,
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
            FieldID: "transactionType",
            Type: "TextBox",
            Title: "Transaction type",
            Mandatory: false,
            ReadOnly: false,
            Layout: {
              Origin: {
                X: 0,
                Y: 7,
              },
              Size: {
                Width: 1,
                Height: 0,
              },
            },
            Style: {
              Alignment: {
                Horizontal: "Stretch",
                Vertical: "Stretch",
              },
            },
            OptionalValues: [{Key: 'test', Value: 'test'},
                             {Key: 'test1', Value: 'test1'}]
          },
          {
            FieldID: "transactionStatus",
            Type: "TextBox",
            Title: "Transaction status",
            Mandatory: false,
            ReadOnly: false,
            Layout: {
              Origin: {
                X: 0,
                Y: 8,
              },
              Size: {
                Width: 1,
                Height: 0,
              },
            },
            Style: {
              Alignment: {
                Horizontal: "Stretch",
                Vertical: "Stretch",
              },
            },
            OptionalValues: [{Key: 'test', Value: 'test'}]
          },
          {
            FieldID: "",
            Type: "Separator",
            Title: "",
            Mandatory: false,
            ReadOnly: false,
            Layout: {
              Origin: {
                X: 0,
                Y: 9,
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
         ],
         Rows: [],
       };
   }

   onRun() {
   }
}
