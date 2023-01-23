
/*
The return object format MUST contain the field 'success':
{success:true}

If the result of your code is 'false' then return:
{success:false, erroeMessage:{the reason why it is false}}
The error Message is importent! it will be written in the audit log and help the user to understand what happen
*/

import { Client, Request } from '@pepperi-addons/debug-server';
import MyService from './my.service';
import { AddonVersion, AddonUUID } from '../addon.config.json'

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
        await createUDCs(service);
    } catch (err) {
        throw new Error(`Failed to create ADAL Tables. error - ${err}`);
    }

    return { success: true, resultObject: {} };
}

export async function uninstall(client: Client, request: Request): Promise<any> {
    try {
        const service = new MyService(client);
        await service.papiClient.post(`/user_defined_collection/schemes/UserTarget/hard_delete`);
        await service.papiClient.post(`/user_defined_collection/schemes/AccountTarget/hard_delete`);
    } catch (err) {
        throw new Error(`Failed to delete UDCs. error - ${err}`);
    }
    
    return {success:true,resultObject:{}}
}

export async function upgrade(client: Client, request: Request): Promise<any> {
    try {
        const service = new MyService(client);
        await createAbstractSchemes(service);
        await createUDCs(service);
    } catch (err) {
        throw new Error(`Failed to create Schemes. error - ${err}`);
    }
    return {success:true,resultObject:{}}
}

export async function downgrade(client: Client, request: Request): Promise<any> {
    return {success:true,resultObject:{}}
}


async function createAbstractSchemes(service) {
    await service.papiClient.post(`/addons/data/schemes/${AddonUUID}`,{
        Name: "userTarget",
        Type: "abstract",
        Fields: {
            User: {
                Type: "Resource",
                Resource: "users",
                Indexed: true,
                IndexedFields: {
                    Name: {Type: "String", Indexed: true},
                    ExternalID: {Type: "String", Indexed: true}
                }
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
        Name: "accountTarget",
        Type: "abstract",
        Fields: {
            Account: {
                Type: "Resource",
                Resource: "accounts",
                Indexed: true,
                IndexedFields: {
                    Name: {Type: "String", Indexed: true},
                    ExternalID: {Type: "String", Indexed: true}
                }
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

async function createUDCs(service) {
    const allUdcsNames = (await service.papiClient.get(`/user_defined_collection/schemes`)).map(udc => udc.Name);
    if(!allUdcsNames.includes("UserTarget")) {
        await service.papiClient.post(`/user_defined_collection/schemes`, {
            Name: "UserTarget",
            Extends: {
                AddonUUID: AddonUUID,
                Name: "userTarget"
            },
            Description: "Target for user"
        });
    }
    if(!allUdcsNames.includes("AccountTarget")) {
        await service.papiClient.post(`/user_defined_collection/schemes`, {
            Name: "AccountTarget",
            Extends: {
                AddonUUID: AddonUUID,
                Name: "accountTarget"
            },
            Description: "Target for account"
        });
    }
}
