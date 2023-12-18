import { Component, EventEmitter, Input, OnInit, Output, TemplateRef, ViewChild } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import { TranslateService } from '@ngx-translate/core';
import { PepAddonService, PepLayoutService, PepLoaderService, PepScreenSizeType } from '@pepperi-addons/ngx-lib';
import { config } from '../../addon.config';
import { AddonService } from "src/app/services/addon.service";
import { PepDialogData, PepDialogService } from "@pepperi-addons/ngx-lib/dialog";

@Component({
    selector: 'configuration-assistant',
    templateUrl: './configuration-assistant.component.html',
    styleUrls: ['./configuration-assistant.component.scss']
})
export class ConfigurationAssistantComponent implements OnInit {
    screenSize: PepScreenSizeType;
    dataIsIndexedFlag;
    configuration;
    dataView;
    dataSource;
    allActivitiesFieldsOptions = [];
    transactionLinesFieldsOptions = [];
    typeValuesOptions = [];
    statusValuesOptions = [];
    itemCategoryOptions = [];
    imagePath;
    dataLoaded = false;
    formValid;

    constructor(
        public router: Router,
        public activatedRoute: ActivatedRoute,
        public layoutService: PepLayoutService,
        public translate: TranslateService,
        public addonService: AddonService,
        public dialogService: PepDialogService,
        private pepAddonService: PepAddonService,
        public loaderService: PepLoaderService
    ) {
        this.layoutService.onResize$.subscribe(size => {
            this.screenSize = size;
        });
        this.addonService.addonUUID = config.AddonUUID;
        this.imagePath = this.pepAddonService.getAddonStaticFolder(config.AddonUUID) + 'assets/images/conf-preview.png';
    }

    ngOnInit() {
      this.dataIsIndexed().then(dataIsIndexedFlag => {
        this.dataIsIndexedFlag = dataIsIndexedFlag;
        if(dataIsIndexedFlag) {
          this.loaderService.show();
          this.addonService.getValuesForQueriesFilter().then(values => {
            for(const v of values.typeValues) {
              this.typeValuesOptions.push({ Key: v, Value: v });
            }
            for(const v of values.statusValues) {
              this.statusValuesOptions.push({ Key: v, Value: v });
            }
            this.translate.get('SLUGS_TEXT').toPromise().then(res => {
              this.configuration = this.defaultConfiguration();
              this.addonService.getConfiguration().then(savedConf => {
                if(savedConf) {
                  this.configuration.transactionTotalPrice = savedConf.transactionTotalPrice;
                  this.configuration.transactionTotalQuantity = savedConf.transactionTotalQuantity;
                  this.configuration.transactionLineTotalPrice = savedConf.transactionLineTotalPrice;
                  this.configuration.transactionLineTotalQuantity = savedConf.transactionLineTotalQuantity;
                  this.configuration.transactionType = savedConf.transactionType;
                  this.configuration.transactionStatus = savedConf.transactionStatus;
                  this.formValid = true;
                }
                this.dataView = this.getDataView();
                this.dataSource = this.getDataSource();
                this.dataLoaded = true;
                this.loaderService.hide();
              });
            });
          });
        }
      });
    }

    navigateToDataIndexSettings() {
        // navigate to data index settings
        window.location.href = '/settings/10979a11-d7f4-41df-8993-f06bfd778304/data_index';
    }

    navigateToPages() {
      // navigate to pages manager
      window.location.href = '/settings_block/50062e0c-9967-4ed4-9102-f2bc50602d41/pages';
    }

    async dataIsIndexed() {
        const all_activities_scheme = await this.addonService.getDataIndexScheme('all_activities');
        if(all_activities_scheme && all_activities_scheme.Fields && (Object.keys(all_activities_scheme.Fields)).length > 0) {
          const transaction_lines_scheme = await this.addonService.getDataIndexScheme('transaction_lines');
          for(const name in all_activities_scheme.Fields) {
            if(all_activities_scheme.Fields[name].Type == 'Integer' || all_activities_scheme.Fields[name].Type == 'Double')
              this.allActivitiesFieldsOptions.push({ Key: name, Value: name });
          }
          for(const name in transaction_lines_scheme.Fields) {
            if(transaction_lines_scheme.Fields[name].Type == 'Integer' || transaction_lines_scheme.Fields[name].Type == 'Double')
              this.transactionLinesFieldsOptions.push({ Key: name, Value: name });
            if(name.startsWith('Item.'))
              this.itemCategoryOptions.push({ Key: name, Value: name });
          }
          return true;
        }

        return false;
    }

    defaultConfiguration() {
		const transactionTypeDefault = this.tryGetValue(this.typeValuesOptions, "sales order");
		const transactionStatusDefault = this.tryGetValue(this.statusValuesOptions, "submitted");

        return {
            genericSlug: "insights",
            accountSlug: "account_insights",
            transactionTotalPrice: this.tryGetValue(this.allActivitiesFieldsOptions, "GrandTotal"),
            transactionTotalQuantity: this.tryGetValue(this.allActivitiesFieldsOptions, "QuantitiesTotal"),
            transactionLineTotalPrice: this.tryGetValue(this.transactionLinesFieldsOptions, "TotalUnitsPriceAfterDiscount"),
            transactionLineTotalQuantity: this.tryGetValue(this.transactionLinesFieldsOptions, "UnitsQuantity"),
            itemCategory: 'Item.MainCategory',
            transactionType: transactionTypeDefault ? transactionTypeDefault : this.createMultiSelectString(this.typeValuesOptions),
            transactionStatus: transactionStatusDefault ? transactionStatusDefault : this.createMultiSelectString(this.statusValuesOptions),
            slugsText: this.translate.instant('SLUGS_TEXT'),
            fieldsText: this.translate.instant('FIELDS_TEXT'),
            queriesText: this.translate.instant('QUERIES_FILTER_TEXT')
        }
    }

    getDataSource() {
        return this.configuration;
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
          },
          {
            FieldID: "genericSlug",
            Type: "TextBox",
            Title: "Generic insights slug",
            Mandatory: true,
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
            AdditionalProps: {
				regex: /^[^\sA-Z]*$/,
				regexError: "White spaces and capital letters are not allowed"
            }
          },
          {
            FieldID: "accountSlug",
            Type: "TextBox",
            Title: "Account insights slug",
            Mandatory: true,
            ReadOnly: false,
            Layout: {
              Origin: {
                X: 0,
                Y: 12,
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
				regex: /^[^\sA-Z]*$/,
				regexError: "White spaces and capital letters are not allowed"
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
            FieldID: 'fieldsText',
            Type: "RichTextHTML",
            Title: "",
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
            AdditionalProps: {
              renderTitle: false,
              renderEnlargeButton: false
            }
          },
          {
            FieldID: "transactionTotalPrice",
            Type: "ComboBox",
            Title: "Transaction total price",
            Mandatory: true,
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
            OptionalValues: this.allActivitiesFieldsOptions
          },
          {
            FieldID: "transactionTotalQuantity",
            Type: "ComboBox",
            Title: "Transaction total quantity",
            Mandatory: true,
            ReadOnly: false,
            Layout: {
              Origin: {
                X: 1,
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
            OptionalValues: this.allActivitiesFieldsOptions
          },
          {
            FieldID: "transactionLineTotalPrice",
            Type: "ComboBox",
            Title: "Transaction line total price",
            Mandatory: true,
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
            OptionalValues: this.transactionLinesFieldsOptions
          },
          {
            FieldID: "transactionLineTotalQuantity",
            Type: "ComboBox",
            Title: "Transaction line total quantity",
            Mandatory: true,
            ReadOnly: false,
            Layout: {
              Origin: {
                X: 1,
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
            OptionalValues: this.transactionLinesFieldsOptions
          },
          {
            FieldID: "itemCategory",
            Type: "ComboBox",
            Title: "item category",
            Mandatory: true,
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
            OptionalValues: this.itemCategoryOptions
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
                Y: 5,
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
          },
          {
            FieldID: "transactionType",
            Type: "MultiTickBox",
            Title: "Transaction type",
            Mandatory: true,
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
            OptionalValues: this.typeValuesOptions
          },
          {
            FieldID: "transactionStatus",
            Type: "MultiTickBox",
            Title: "Transaction status",
            Mandatory: true,
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
                Y: 13,
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
    this.loaderService.show();
    console.log(this.configuration);
    const genericSlugExists = await this.addonService.slugExists(this.configuration.genericSlug);
    const accountSlugExists = await this.addonService.slugExists(this.configuration.accountSlug);
	
    if(genericSlugExists || accountSlugExists) {
      const usedName = genericSlugExists ? this.configuration.genericSlug : this.configuration.accountSlug;
      const dataMsg = new PepDialogData({
        title: this.translate.instant('SLUG_EXISTS_TITLE',{name: usedName}),
        content: this.translate.instant('SLUG_EXISTS_MESSAGE'),
		actionsType: 'cancel-continue'
      });
      this.loaderService.hide();
      this.dialogService.openDefaultDialog(dataMsg).afterClosed().subscribe(async res => {
		if(res) {
			this.loaderService.show();
			await this.runLogic();
		}
	  });
    }
    else {
      await this.runLogic();
    }
   }

   async runLogic() {
	try {
		const savedConf = await this.addonService.saveConfiguration(this.configuration);
		console.log("done saving configuration");

        await this.addonService.createUDCs();
		console.log("done creating UDCs");

        const importedPages = await this.addonService.replaceFields(this.configuration);
		console.log("done importing pages");

        const gSlug = await this.addonService.createSlug(this.configuration.genericSlug);
        const accSlug = await this.addonService.createSlug(this.configuration.accountSlug);
        const slugsDataViews = await this.addonService.upsertSlugsDataViews(this.configuration);
        
        console.log('pages and queries imported, slugs created and mapped successfully')
        const dataMsg = new PepDialogData({
          title: this.translate.instant('SUCCESS_TITLE'),
          actionsType: 'close',
          content: this.translate.instant('SUCCESS_CONTENT')
        });
        this.loaderService.hide();
        this.dialogService.openDefaultDialog(dataMsg).afterClosed().subscribe(res => {});
      } catch(err) {
          const dataMsg = new PepDialogData({
          title: this.translate.instant('Run failed'),
          content: this.translate.instant(err)
        });
        this.loaderService.hide();
        this.dialogService.openDefaultDialog(dataMsg);
      }
   }

    formValidationChange(e) {
      this.formValid = e;
    }

    createMultiSelectString(optionsArray) {
      let str = '';
      for(const op of optionsArray)
        str = str+op.Value+';'
      str = str.slice(0, -1);
      return str;
    }

	// search the given value in the options array and return it if found, otherwise return empty string
    tryGetValue(options: {Key: string, Value: string}[], defaultValue: string): string {
	  const filteredOptions = options.filter(op => op.Value.toLowerCase() == defaultValue.toLowerCase()); // case insensitive comparison
      const res = filteredOptions.length > 0 ? filteredOptions[0].Value : "";
      return res;
    }
}
