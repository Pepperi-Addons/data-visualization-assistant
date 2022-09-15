import jwt from 'jwt-decode';
import { PapiClient } from '@pepperi-addons/papi-sdk';
import { Injectable } from '@angular/core';
import { PepDataConvertorService, PepHttpService, PepSessionService } from '@pepperi-addons/ngx-lib';


@Injectable()
export class AddonService {

    accessToken = '';
    parsedToken: any
    papiBaseURL = ''
    addonUUID;
    queries: [] = [];
    get papiClient(): PapiClient {
        return new PapiClient({
            baseURL: this.papiBaseURL,
            token: this.session.getIdpToken(),
            addonUUID: this.addonUUID,
            suppressLogging: true
        })
    }

    constructor(
        public session: PepSessionService,
        public pepperiDataConverter: PepDataConvertorService,
        private pepHttp: PepHttpService) {
            const accessToken = this.session.getIdpToken();
            this.parsedToken = jwt(accessToken);
            this.papiBaseURL = this.parsedToken["pepperi.baseurl"]
    }
    ngOnInit() {
    }

    async get(endpoint: string): Promise<any> {
        return await this.papiClient.get(endpoint);
    }

    async post(endpoint: string, body: any): Promise<any> {
        return await this.papiClient.post(endpoint, body);
    }

    async getDataIndexScheme(scheme) {
        this.addonUUID = '10979a11-d7f4-41df-8993-f06bfd778304'; // papi-data-index uuid
        return this.papiClient.get(`/addons/data/schemes/${scheme}`)
    }

    //TODO: add slug to page mapping
    async createSlugAndMapping(slugName) {
        const slugBody = {
            slug : {
                Key: slugName,
                Name: slugName,
                Description: "created by configuration-assistant",
                Slug: slugName
            }
        }
        return this.papiClient.post('/slugs',slugBody)
    }
}