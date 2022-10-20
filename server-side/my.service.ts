import { PapiClient, InstalledAddon, Relation } from '@pepperi-addons/papi-sdk'
import { Client } from '@pepperi-addons/debug-server';
import config from '../addon.config.json'

class MyService {

    papiClient: PapiClient
    bundleFileName = '';

    constructor(private client: Client) {
        this.papiClient = new PapiClient({
            baseURL: client.BaseURL,
            token: client.OAuthAccessToken,
            addonUUID: client.AddonUUID,
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
        const basePath = `${assetsBaseUrl}/assets`
        const debugPath = `../publish/assets`
        const pageAndQueryFilesNames = [{page: 'page1', query: 'query-to-import1'}]
        var fs = require('fs')
        for(const names of pageAndQueryFilesNames) {
            await fs.readFile(`${debugPath}/queries-to-import/${names.query}`, 'utf8', async (err,data) => {
                if (err) {
                    return console.log(err);
                }
                const pageData = await fs.readFile(`${debugPath}/pages-to-import/${names.page}`, 'utf8');
                const pfsPageFile = await this.uploadDataToPFS(pageData, names.page);

                var result = data.replace(this.toRegex('GrandTotal'), configuration.transactionTotalPrice)
                            .replace(this.toRegex('QuantitiesTotal'), configuration.transactionTotalQuantity)
                            .replace(this.toRegex('UnitsQuantity'), configuration.transactionLineTotalPrice)
                            .replace(this.toRegex('TotalUnitsPriceAfterDiscount'), configuration.transactionLineTotalQuantity)
                            .replace(this.toRegex('"Submitted"'), this.arrayToString(configuration.transactionType))
                            .replace(this.toRegex('"Sales Order"'), this.arrayToString(configuration.transactionStatus));

                const pfsQueryFile = await this.uploadDataToPFS(result, names.query);
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
                console.log(body)
            });
        }
    }

    async uploadDataToPFS(data, fileName) {
        const stringifiedQueryFile = JSON.stringify(JSON.parse(data));
        const base64QueryFile = btoa(stringifiedQueryFile);
        let file: any = {
            Name: fileName,
            Description: '',
            MIME: "text/javascript",
            URI: base64QueryFile,
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