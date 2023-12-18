import { PapiClient, InstalledAddon, Relation, AddonFile } from '@pepperi-addons/papi-sdk'
import { Client } from '@pepperi-addons/debug-server';
import config from '../addon.config.json'
import fetch from 'node-fetch';
import { AssistantConfiguration } from './models/configuration';
import { PAGES_NAMES_TO_KEYS } from './models/page-keys';

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

    async updateConfiguration(conf: AssistantConfiguration): Promise<AssistantConfiguration | undefined> {
        const confTable = this.papiClient.addons.data.uuid(config.AddonUUID).table("configurationAssistant");
        const savedConf = await confTable.upsert({Key: "1", Configuration: conf});
        return savedConf as AssistantConfiguration;
    }

    async getConfiguration(): Promise<AssistantConfiguration | undefined> {
        const confTable = this.papiClient.addons.data.uuid(config.AddonUUID).table("configurationAssistant");
        const conf = await confTable.find();
        if (conf.length > 0) {
			return conf[0].Configuration;
		}
    }

    async replaceFieldsAndImportFiles(configuration: AssistantConfiguration, assetsBaseUrl: string): Promise<any[]> {
        const basePath = `${assetsBaseUrl}/assets`;
        // const basePath = `${assetsBaseUrl}` // for debugging
        console.log(`ASSETS BASE URL: ${basePath}`);

        const pageAndQueryFilesNames = [
            {page: 'account_page', query: 'account_queries'},
            {page: 'manager_page', query: 'manager_queries'},
            {page: 'rep_page', query: 'rep_queries'}
        ];

		const importedPagesAsyncCalls = await Promise.all(pageAndQueryFilesNames.map(async names => {
			// uploading the page file to PFS
            const pageResponse = await fetch(`${basePath}/pages-to-import/${names.page}.json`);
            const pageData = await pageResponse.text();
            const pfsPageFile = await this.uploadDataToPFS(pageData, names.page);
            console.log(`PFS PAGE FILE: ${ JSON.stringify(pfsPageFile)}`);

            // manipulating the queries of the page
            const queryResponse = await fetch(`${basePath}/queries-to-import/${names.query}.json`);
            const queryData = await queryResponse.text();
            const result = this.replacePlaceholders(queryData, configuration);
            // then uploading the queries file to PFS
            const pfsQueryFile = await this.uploadDataToPFS(result, names.query);
            console.log(`PFS QUERY FILE: ${ JSON.stringify(pfsQueryFile)}`);

            // building the body for the recursive-import request
            const body = this.buildRecursiveImportBody(pfsPageFile, pfsQueryFile);

            console.log(`BODY SENT TO RECURSIVE IMPORT: ${ JSON.stringify(body)}`);
            const importedPageAsyncCall = await this.papiClient.post('/pages/import/file', body);

			await this.handleAsyncExecutionResult(importedPageAsyncCall, names.page);

			const page = (await this.papiClient.addons.api.uuid('50062e0c-9967-4ed4-9102-f2bc50602d41').file('internal_api').func('get_page_builder_data').get({key: PAGES_NAMES_TO_KEYS[names.page]})).page;

			// publish the page
			await this.papiClient.post(`/pages`, page);
			return importedPageAsyncCall;
		}));

        console.log(`DVAS IMPORTED PAGES ASYNC RESPONSES: ${ JSON.stringify(importedPagesAsyncCalls)}`);

        return importedPagesAsyncCalls;
    }

	replacePlaceholders(queryData: string, configuration: AssistantConfiguration): string {
		return queryData.replace(this.toRegex('GrandTotal_Placeholder'), configuration.transactionTotalPrice)
		.replace(this.toRegex('QuantitiesTotal_Placeholder'), configuration.transactionTotalQuantity)
		.replace(this.toRegex('UnitsQuantity_Placeholder'), configuration.transactionLineTotalPrice)
		.replace(this.toRegex('TotalUnitsPriceAfterDiscount_Placeholder'), configuration.transactionLineTotalQuantity)
		.replace(this.toRegex('Category_Placeholder'), configuration.itemCategory)
		.replace(this.toRegex('"SalesOrder_Placeholder"'), this.arrayToString(configuration.transactionType.split(";")))
		.replace(this.toRegex('"Submitted_Placeholder"'), this.arrayToString(configuration.transactionStatus.split(";")));
	}

	buildRecursiveImportBody(pfsPageFile: AddonFile, pfsQueryFile: AddonFile): any {
		return {
			URI: pfsPageFile.URL,
			Resources: [
				{
					URI: pfsQueryFile.URL,
					AddonUUID: "c7544a9d-7908-40f9-9814-78dc9c03ae77",
					Resource: "DataQueries"
				}
			]
		}
	}

    async uploadDataToPFS(data: any, fileName: string): Promise<AddonFile> {
        const base64QueryFile = btoa(data);
        const base64URI = `data:application/json;base64,${base64QueryFile}`
        const file: any = {
            Key: `${fileName}.json`,
            Name: fileName,
            Description: '',
            MIME: "application/json",
            URI: base64URI,
            Cache: false
        };
        return this.papiClient.post(`/addons/pfs/${this.client.AddonUUID}/confAssistantFiles`, file);
    }

    toRegex(str: string): RegExp {
        return new RegExp(str, "g");
    }

    arrayToString(arr: string[]): string {
        let str = ''
        for (const obj of arr) {
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

    private upsertSettingsRelation(blockRelationSlugName: string, blockRelationGroupName: string, blockRelationName: string, blockRelationDescription: string): Promise<any> {
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

    upsertRelations(): void {
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

    async deleteTargetScheme(schemeName: string): Promise<void> {
        const targetScheme = await this.papiClient.addons.data.schemes.get({where: `Name='${schemeName}'`}); // returns an array
        if (targetScheme.length > 0) {
            await this.papiClient.post(`/addons/data/schemes/${schemeName}/purge`);
        }
    }

	/** Poll an ActionUUID until it resolves to success our failure. The returned promise resolves to a boolean - true in case the execution was successful, false otherwise.
	* @param ExecutionUUID the executionUUID which should be polled.
	* @param interval the time interval in ms which will be waited between polling retries.
	* @param maxAttempts the maximum number of polling retries before giving up polling. Default value is 540, allowing for 9 minutes of polling, allowing graceful exit for install.
	*/
	public async pollExecution(papiClient: PapiClient, ExecutionUUID: string, interval = 1000, maxAttempts = 540): Promise<boolean>
	{
		let attempts = 0;

		const executePoll = async (resolve, reject): Promise<any> =>
		{
			console.log(`Polling ${ExecutionUUID}, attempt number ${attempts} out of ${maxAttempts}`);
			const result = await papiClient.auditLogs.uuid(ExecutionUUID).get();
			attempts++;

			if (this.isAsyncExecutionOver(result))
			{
				console.log(`Finished polling ${ExecutionUUID}, it's status is ${result.Status.Name}`);
				return resolve(result.Status.Name === 'Success');
			}
			else if (maxAttempts && attempts === maxAttempts)
			{
				console.log(`Exceeded max attempts polling ${ExecutionUUID}`);

				return resolve(false);
			}
			else
			{
				setTimeout(executePoll, interval, resolve, reject);
			}
		};

		return new Promise<boolean>(executePoll);
	}

	/**
	 * Determines whether or not an audit log has finished executing.
	 * @param auditLog - The audit log to poll
	 * @returns
	 */
	protected isAsyncExecutionOver(auditLog: any): boolean
	{
		return auditLog !== null && (auditLog.Status.Name === 'Failure' || auditLog.Status.Name === 'Success');
	}

	private async handleAsyncExecutionResult(asyncCall: any, pageName: string): Promise<void>
	{
		if (!asyncCall)
		{
			const errorMessage = `Error importing ${pageName}, got a null from async call.`;
			console.error(errorMessage);
			throw new Error(errorMessage);
		}
		const isAsyncRequestResolved = await this.pollExecution(this.papiClient!, asyncCall.ExecutionUUID!);
		if (!isAsyncRequestResolved)
		{
			const errorMessage = `Error importing ${pageName}. For more details see audit log: ${asyncCall.ExecutionUUID!}`;
			console.error(errorMessage);
			throw new Error(errorMessage);
		}
	}


}
export default MyService;
