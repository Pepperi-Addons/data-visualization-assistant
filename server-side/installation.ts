
/*
The return object format MUST contain the field 'success':
{success:true}

If the result of your code is 'false' then return:
{success:false, erroeMessage:{the reason why it is false}}
The error Message is importent! it will be written in the audit log and help the user to understand what happen
*/

import { Client, Request } from '@pepperi-addons/debug-server';
import MyService from './my.service';
import { AddonUUID } from '../addon.config.json'
import semver from 'semver';

export async function install(client: Client, request: Request): Promise<any> {
    try {
        const service = new MyService(client);
        service.upsertRelations();
        await service.papiClient.addons.data.schemes.post({
            Name: "configurationAssistant",
            Type: 'data',
            Fields: {
                Key: {
                    Type: "String"
                },
                Configuration: {
                    Type: "Object",
                    Fields: {}
                }
            }
        });
        await service.papiClient.post(`/addons/data/schemes/${AddonUUID}`,{
            Name: 'confAssistantFiles',
            Type: 'pfs'
        });
        await createAbstractSchemes(service);
    } catch (err) {
        throw new Error(`Failed to create ADAL Tables. error - ${err}`);
    }

    return { success: true, resultObject: {} };
}

export async function uninstall(client: Client, request: Request): Promise<any> {
    const service = new MyService(client);
    await deleteUDCs(service);
    return {success:true,resultObject:{}};
}

export async function upgrade(client: Client, request: Request): Promise<any> {
    try {
        // versions earlier than 0.6.17 don't have abstracts and udcs
        if (request.body.FromVersion && semver.compare(request.body.FromVersion, '0.6.17') < 0) {
            const service = new MyService(client);
            await createAbstractSchemes(service);
        }
    } catch (err) {
        throw new Error(`Failed to create Schemes. error - ${err}`);
    }
    return {success:true,resultObject:{}}
}

export async function downgrade(client: Client, request: Request): Promise<any> {
    return {success:true,resultObject:{}}
}


async function createAbstractSchemes(service: MyService) {
    const coreResourcesUUID = "fc5a5974-3b30-4430-8feb-7d5b9699bc9f";
    await service.papiClient.post(`/addons/data/schemes/${AddonUUID}`,{
        Name: "user_target",
        Type: "abstract",
        Fields: {
            User: {
                Type: "Resource",
                Resource: "users",
                AddonUUID: coreResourcesUUID,
                Indexed: true,
                IndexedFields: {
                    Name: {Type: "String", Indexed: true},
                    ExternalID: {Type: "String", Indexed: true}
                },
                ApplySystemFilter: true
            },
            Date: {
                Type: "DateTime",
                Indexed: true
            },
            Target: {
                Type: "Double",
                Indexed: true
            }
        }
    });
    await service.papiClient.post(`/addons/data/schemes/${AddonUUID}`,{
        Name: "account_target",
        Type: "abstract",
        Fields: {
            Account: {
                Type: "Resource",
                Resource: "accounts",
                AddonUUID: coreResourcesUUID,
                Indexed: true,
                IndexedFields: {
                    Name: {Type: "String", Indexed: true},
                    ExternalID: {Type: "String", Indexed: true}
                },
                ApplySystemFilter: true
            },
            Date: {
                Type: "DateTime",
                Indexed: true
            },
            Target: {
                Type: "Double",
                Indexed: true
            }
        }
    });
}


async function deleteUDCs(service: MyService) {
    try {
        await service.papiClient.post(`/user_defined_collections/schemes`, {
            Name: "UserTarget",
            Hidden: true
        });
        await service.papiClient.post(`/user_defined_collections/schemes`, {
            Name: "AccountTarget",
            Hidden: true
        });
    } catch (err) {
        throw new Error(`Failed to delete UDCs. error - ${err}`);
    }
}
    
