import { Component, EventEmitter, Input, OnInit, Output, TemplateRef, ViewChild } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import { TranslateService } from '@ngx-translate/core';
import { PepAddonService, PepLayoutService, PepScreenSizeType } from '@pepperi-addons/ngx-lib';
import { config } from '../../addon.config';
import { AddonService } from "src/app/services/addon.service";
import { PepDialogActionButton, PepDialogData, PepDialogService } from "@pepperi-addons/ngx-lib/dialog";

@Component({
    selector: 'configuration-assistant',
    templateUrl: './configuration-assistant.component.html',
    styleUrls: ['./configuration-assistant.component.scss']
})
export class ConfigurationAssistantComponent implements OnInit {
  @ViewChild ('dialog', {read: TemplateRef}) dialog: TemplateRef<any>;
    screenSize: PepScreenSizeType;
    dataIsIndexedFlag;
    configuration;
    dataView;
    dataSource;
    allActivitiesFieldsOptions = [];
    transactionLinesFieldsOptions = [];
    typeValuesOptions = [];
    statusValuesOptions = [];
    imagePath;
    dataLoaded = false;

    constructor(
        public router: Router,
        public activatedRoute: ActivatedRoute,
        public layoutService: PepLayoutService,
        public translate: TranslateService,
        public addonService: AddonService,
        public dialogService: PepDialogService,
        private pepAddonService: PepAddonService
    ) {
        this.layoutService.onResize$.subscribe(size => {
            this.screenSize = size;
        });
        this.dataIsIndexedFlag = this.dataIsIndexed();
        this.configuration = this.emptyConfiguration();
        this.dataView = this.getDataView();
        this.dataSource = this.getDataSource();
        this.addonService.addonUUID = config.AddonUUID;
        this.imagePath = this.pepAddonService.getAddonStaticFolder(config.AddonUUID) + 'assets/images/conf-preview.png';
    }

    ngOnInit() {
        // const savedConf = await this.addonService.getConfiguration();
        // const values = await this.addonService.getValuesForQueriesFilter();
        // for(const v of values.typeValues) {
        //   this.typeValuesOptions.push({ key: v, value: v });
        // }
        // for(const v of values.statusValues) {
        //   this.statusValuesOptions.push({ key: v, value: v });
        // }
        // if(savedConf) {
        //   this.configuration.transactionTotalPrice = savedConf.transactionTotalPrice;
        //   this.configuration.transactionTotalQuantity = savedConf.transactionTotalQuantity;
        //   this.configuration.transactionLineTotalPrice = savedConf.transactionLineTotalPrice;
        //   this.configuration.transactionLineTotalQuantity = savedConf.transactionLineTotalQuantity;
        // }
        this.dataLoaded = true;
    }

    openDialog() {
    }

    navigateToDataIndexSettings() {
        // navigate to data index settings
        window.location.href = '/settings/10979a11-d7f4-41df-8993-f06bfd778304/data_index';
    }

    async dataIsIndexed() {
        const all_activities_scheme = await this.addonService.getDataIndexScheme('all_activities');
        if(all_activities_scheme && (Object.keys(all_activities_scheme.Fields)).length > 0) {
          const transaction_lines_scheme = await this.addonService.getDataIndexScheme('transaction_lines');
          for(const name in all_activities_scheme.Fields) {
            this.allActivitiesFieldsOptions.push({ key: name, value: name });
          }
          for(const name in transaction_lines_scheme.Fields) {
            this.transactionLinesFieldsOptions.push({ key: name, value: name });
          }
          return true;
        }

        return false;
    }

    emptyConfiguration() {
        return {
            genericSlug: "dashboard",
            accountSlug: "account_dashboard",
            transactionTotalPrice: "",
            transactionTotalQuantity: "",
            transactionLineTotalPrice: "",
            transactionLineTotalQuantity: "",
            transactionType: [],
            transactionStatus: [],
            slugsText: this.translate.instant('SLUGS_TEXT'),
            fieldsText: this.translate.instant('FIELDS_TEXT'),
            queriesText: this.translate.instant('QUERIES_FILTER_TEXT')
        }
    }

    getDataSource() {
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
            FieldID: 'slugsText',
            Type: "RichTextHTML",
            Title: "",
            AdditionalProps: {
              renderTitle: false,
              renderEnlargeButton: false
            },
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
            FieldID: "genericSlug",
            Type: "TextBox",
            Title: "Generic dashboard slug",
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
            AdditionalProps: {
              regex: /^\S*$/,
              regexError: "White spaces are not allowed"
            }
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
                Y: 3,
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
            AdditionalProps: {
              regex: /^\S*$/,
              regexError: "White spaces are not allowed"
            }
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
                Y: 4,
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
            FieldID: 'fieldsText',
            Type: "RichTextHTML",
            Title: "",
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
            AdditionalProps: {
              renderTitle: false,
              renderEnlargeButton: false
            }
          },
          {
            FieldID: "transactionTotalPrice",
            // Type: "TextBox",
            Type: "ComboBox",
            Title: "Transaction total price",
            Mandatory: false,
            ReadOnly: false,
            Layout: {
              Origin: {
                X: 0,
                Y: 6,
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
            OptionalValues: this.allActivitiesFieldsOptions
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
                Y: 6,
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
            OptionalValues: this.allActivitiesFieldsOptions
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
            OptionalValues: this.transactionLinesFieldsOptions
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
            OptionalValues: this.transactionLinesFieldsOptions
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
                Y: 8,
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
            FieldID: 'queriesText',
            Type: "RichTextHTML",
            Title: "",
            AdditionalProps: {
              renderTitle: false,
              renderEnlargeButton: false
            },
            Mandatory: false,
            ReadOnly: false,
            Layout: {
              Origin: {
                X: 0,
                Y: 9,
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
            FieldID: "transactionType",
            // Type: "MultiTickBox",
            Type: "TextBox",
            Title: "Transaction type",
            Mandatory: false,
            ReadOnly: false,
            Layout: {
              Origin: {
                X: 0,
                Y: 10,
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
            OptionalValues: this.typeValuesOptions
          },
          {
            FieldID: "transactionStatus",
            // Type: "MultiTickBox",
            Type: "TextBox",
            Title: "Transaction status",
            Mandatory: false,
            ReadOnly: false,
            Layout: {
              Origin: {
                X: 0,
                Y: 11,
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
            OptionalValues: this.statusValuesOptions
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
                Y: 12,
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

   async onRunClicked() {
    console.log(this.configuration)
    const genericSlugExists = await this.addonService.slugExists(this.configuration.genericSlug);
    const accountSlugExists = await this.addonService.slugExists(this.configuration.accountSlug);
    if(genericSlugExists || accountSlugExists) {
      const badName = genericSlugExists ? this.configuration.genericSlug : this.configuration.accountSlug;
      const dataMsg = new PepDialogData({
        title: this.translate.instant('SLUG_EXISTS_ERROR_TITLE',{name: badName}),
        // actionsType: 'close',
        content: this.translate.instant('SLUG_EXISTS_ERROR')
      });
      const config = this.dialogService.getDialogConfig({ minWidth: '30rem' }, 'regular');
      const refd = this.dialogService.openDefaultDialog(dataMsg,config);
      // refd.afterClosed().subscribe(res => {
      //   console.log('dialog', res);
      // })
    }
    else {
      const gSlug = await this.addonService.createSlug(this.configuration.genericSlug);
      const accSlug = await this.addonService.createSlug(this.configuration.accountSlug);
      const slugsDataViews = await this.addonService.upsertSlugsDataViews(this.configuration);
      const savedConf = await this.addonService.saveConfiguration(this.configuration);
      const dataMsg = new PepDialogData({
        title: this.translate.instant('SUCCESS_TITLE'),
        actionsType: 'close',
        content: this.translate.instant('SUCCESS_CONTENT')
      });
      this.dialogService.openDefaultDialog(dataMsg);
    }
   }
}
