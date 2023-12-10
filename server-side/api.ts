import { AssistantConfiguration } from './models/configuration';
import MyService from './my.service'
import { Client, Request } from '@pepperi-addons/debug-server'

// add functions here
// the real function is runnning on another typescript file
export async function configuration(client: Client, request: Request): Promise<AssistantConfiguration | undefined> {
    const service = new MyService(client);
    if (request.method === 'POST') {
        return await service.updateConfiguration(request.body);
    }
    else if (request.method === 'GET') {
        return await service.getConfiguration();
    }
}

export async function replace_fields(client: Client, request: Request): Promise<any[] | undefined> {
    const service = new MyService(client);
    if (request.method === 'POST') {
        return await service.replaceFieldsAndImportFiles(request.body, client.AssetsBaseUrl);
    }
}
