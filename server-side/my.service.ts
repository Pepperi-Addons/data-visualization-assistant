import { PapiClient, InstalledAddon, Relation } from '@pepperi-addons/papi-sdk'
import { Client } from '@pepperi-addons/debug-server';
import config from '../addon.config.json'
import fetch from 'node-fetch';

class MyService {

    papiClient: PapiClient
    papiClientForImport: PapiClient
    bundleFileName = '';

    constructor(private client: Client) {
        this.papiClient = new PapiClient({
            baseURL: client.BaseURL,
            token: client.OAuthAccessToken,
            addonUUID: client.AddonUUID,
            addonSecretKey: client.AddonSecretKey,
            actionUUID: client.ActionUUID
        });
        this.papiClientForImport = new PapiClient({
            baseURL: client.BaseURL,
            token: client.OAuthAccessToken,
            addonUUID: '50062e0c-9967-4ed4-9102-f2bc50602d41', // pages addon uuid
            addonSecretKey: client.AddonSecretKey,
            actionUUID: client.ActionUUID
        });
        this.bundleFileName = `file_${this.client.AddonUUID}`;
    }
    
    // For page block template
    private upsertRelation(relation): Promise<any> {
        return this.papiClient.post('/addons/data/relations', relation);
    }

    async updateConfiguration(conf) {
        const confTable = this.papiClient.addons.data.uuid(config.AddonUUID).table("configurationAssistant");
        const savedConf = await confTable.upsert({Key: "1", Configuration: conf});
        return savedConf;
    }

    async getConfiguration() {
        const confTable = this.papiClient.addons.data.uuid(config.AddonUUID).table("configurationAssistant");
        const conf = await confTable.find();
        if(conf.length > 0)
            return conf[0].Configuration;
        return null;
    }

    async replaceFieldsAndImportFiles(configuration, assetsBaseUrl) {
        const basePath = `${assetsBaseUrl}/assets`;
        // const basePath = `../publish/assets` // for debugging
        console.log(`ASSETS BASE URL: ${basePath}`);
        var importedPages: any[] = [];
        const pageAndQueryFilesNames = [
            {page: 'account_page', query: 'account_queries'},
            {page: 'manager_page', query: 'manager_queries'},
            {page: 'rep_page', query: 'rep_queries'}
        ];
        
        for(const names of pageAndQueryFilesNames) {
            // uploading the page file to PFS
            const pageResponse = await fetch(`${basePath}/pages-to-import/${names.page}.json`);
            const pageData = await pageResponse.text();
            const pfsPageFile = await this.uploadDataToPFS(pageData, names.page);
            console.log("PFS PAGE FILE: " + JSON.stringify(pfsPageFile));

            // manipulating the queries of the page 
            const queryResponse = await fetch(`${basePath}/queries-to-import/${names.query}.json`);
            const queryData = await queryResponse.text();
            var result = queryData.replace(this.toRegex('GrandTotal_Placeholder'), configuration.transactionTotalPrice)
                        .replace(this.toRegex('QuantitiesTotal_Placeholder'), configuration.transactionTotalQuantity)
                        .replace(this.toRegex('UnitsQuantity_Placeholder'), configuration.transactionLineTotalPrice)
                        .replace(this.toRegex('TotalUnitsPriceAfterDiscount_Placeholder'), configuration.transactionLineTotalQuantity)
                        .replace(this.toRegex('"SalesOrder_Placeholder"'), this.arrayToString(configuration.transactionType.split(";")))
                        .replace(this.toRegex('"Submitted_Placeholder"'), this.arrayToString(configuration.transactionStatus.split(";")));
            // then uploading the queries file to PFS
            const pfsQueryFile = await this.uploadDataToPFS(result, names.query);
            console.log("PFS QUERY FILE: " + JSON.stringify(pfsQueryFile));
            
            // building the body for the recursive-import request
            const body = {
                URI: pfsPageFile.URL,
                Resources: [
                    {
                        URI: pfsQueryFile.URL,
                        AddonUUID: "c7544a9d-7908-40f9-9814-78dc9c03ae77",
                        Resource: "DataQueries"
                    }
                ]
            }
            console.log("BODY SENT TO RECURSIVE IMPORT: " +JSON.stringify(body));
            const importedPage = await this.papiClient.post('/pages/import/file', body);
            importedPages.push(importedPage);
        }
        console.log("DVAS IMPORTED PAGES RESPONSES: " + JSON.stringify(importedPages));
        return importedPages;
    }

    async uploadDataToPFS(data, fileName) {
        const base64QueryFile = btoa(data);
        const base64URI = `data:application/json;base64,${base64QueryFile}`
        let file: any = {
            Key: `${fileName}.json`,
            Name: fileName,
            Description: '',
            MIME: "application/json",
            URI: base64URI,
            Cache: false
        };
        return this.papiClient.post(`/addons/pfs/${this.client.AddonUUID}/confAssistantFiles`,file);
    }

    toRegex(str) {
        return new RegExp(str,"g");
    }

    arrayToString(arr) {
        let str = ''
        for(let obj of arr) {
            str += `"${obj}",`
        }
        str = str.slice(0, -1);
        return str;
    }

    private getCommonRelationProperties(
        relationName: 'SettingsBlock' | 'PageBlock' | 'AddonBlock', 
        blockRelationName: string,
        blockRelationDescription: string,
        blockName: string
    ): Relation {
        return {
            RelationName: relationName,
            Name: blockRelationName,
            Description: blockRelationDescription,
            Type: "NgComponent",
            SubType: "NG14",
            AddonUUID: this.client.AddonUUID,
            AddonRelativeURL: this.bundleFileName,
            ComponentName: `${blockName}Component`, // This is should be the block component name (from the client-side)
            ModuleName: `${blockName}Module`, // This is should be the block module name (from the client-side)
            ElementsModule: 'WebComponents',
            ElementName: `${blockName.toLocaleLowerCase()}-element-${this.client.AddonUUID}`,
        };
    }

    private upsertSettingsRelation(blockRelationSlugName: string, blockRelationGroupName: string, blockRelationName: string, blockRelationDescription: string) {
        const blockName = 'Settings';

        const blockRelation: Relation = this.getCommonRelationProperties(
            'SettingsBlock',
            blockRelationName,
            blockRelationDescription,
            blockName);

        blockRelation['SlugName'] = blockRelationSlugName;
        blockRelation['GroupName'] = blockRelationGroupName;
        
        return this.upsertRelation(blockRelation);
    }

    private upsertBlockRelation(blockRelationName: string, isPageBlock: boolean): Promise<any> {
        const blockName = 'Block';

        const blockRelation: Relation = this.getCommonRelationProperties(
            isPageBlock ? 'PageBlock' : 'AddonBlock',
            blockRelationName,
            `${blockRelationName} block`,
            blockName);

        // For Page block we need to declare the editor data.
        if (isPageBlock) {
            blockRelation['EditorComponentName'] = `${blockName}EditorComponent`; // This is should be the block editor component name (from the client-side)
            blockRelation['EditorModuleName'] = `${blockName}EditorModule`; // This is should be the block editor module name (from the client-side)}
            blockRelation['EditorElementName'] = `${blockName.toLocaleLowerCase()}-editor-element-${this.client.AddonUUID}`;
        }
        
        return this.upsertRelation(blockRelation);
    }

    upsertRelations() {
        // For settings block use this.
        const blockRelationSlugName = 'configuration_assistant';
        const blockRelationGroupName = 'CHANGE_TO_SETTINGS_GROUP_NAME';
        const blockRelationName = 'CHANGE_TO_SETTINGS_RELATION_NAME';
        const blockRelationDescription = 'CHANGE_TO_SETTINGS_DESCRIPTION';
        this.upsertSettingsRelation(blockRelationSlugName, blockRelationGroupName, blockRelationName, blockRelationDescription);

        // For page block use this.
        // // TODO: change to block name (this is the unique relation name and the description that will be on the block).
        // const blockRelationName = 'CHANGE_TO_BLOCK_RELATION_NAME';
        // this.upsertBlockRelation(blockRelationName, true);

        // For addon block use this.
        // // TODO: change to block name (this is the unique relation name and the description that will be on the block).
        // const blockRelationName = 'CHANGE_TO_BLOCK_RELATION_NAME';
        // this.upsertBlockRelation(blockRelationName, false);
    }

    getAddons(): Promise<InstalledAddon[]> {
        return this.papiClient.addons.installedAddons.find({});
    }

}
export default MyService;