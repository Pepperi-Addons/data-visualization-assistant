import jwt from 'jwt-decode';
import { MenuDataView, PapiClient } from '@pepperi-addons/papi-sdk';
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
        private httpService: PepHttpService) {
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

    async getValuesForQueriesFilter() {
        const schemaData = await this.papiClient.get(`/addons/api/10979a11-d7f4-41df-8993-f06bfd778304/data_index_meta_data/all_activities_schema`);
        return { typeValues: schemaData.Fields["Type"].OptionalValues, statusValues: schemaData.Fields["StatusName"].OptionalValues };
    }

    //TODO: add slug to page mapping
    async createSlug(slugName) {
        const slugBody = {
            slug : {
                Key: slugName,
                Name: slugName,
                Description: "created by configuration-assistant",
                Slug: slugName
            },
            isDelete: false,
            selectedObj: null
        };
        return this.papiClient.post(`/addons/api/4ba5d6f9-6642-4817-af67-c79b68c96977/api/slugs`,slugBody);
    }

    async slugExists(slugName) {
        const res = await this.papiClient.get(`/addons/api/4ba5d6f9-6642-4817-af67-c79b68c96977/api/slugs?where=Slug=${slugName}`);
        return res.length > 0;
    }

    async upsertSlugsDataViews(configuration) {
        //get rep data view, then update it
        const res = await this.papiClient.get(`/addons/api/4ba5d6f9-6642-4817-af67-c79b68c96977/api/get_slugs_data_views_data`);
        const repDataView = res.dataViews.find(data => data.Context?.Profile?.Name?.toLowerCase() === 'rep');
        repDataView.Fields.push({FieldID: configuration.genericSlug, Title: "uuid of the imported page"});
        repDataView.Fields.push({FieldID: configuration.accountSlug, Title: "uuid of the imported page"});
        return this.papiClient.post('/meta_data/data_views', repDataView);
    }

    async saveConfiguration(configuration) {
        return this.papiClient.post("/addons/api/948219c4-b9a6-4fb2-814d-153d3b359a70/api/configuration", configuration);
    }

    async getConfiguration() {
        return this.papiClient.get("/addons/api/948219c4-b9a6-4fb2-814d-153d3b359a70/api/configuration");
    }

    replaceFields(configuration) {
        const body = {
            Configuration: configuration,
            Path: ''
        };
        return this.papiClient.post("/addons/api/948219c4-b9a6-4fb2-814d-153d3b359a70/api/replace_fields", configuration);

    }
}