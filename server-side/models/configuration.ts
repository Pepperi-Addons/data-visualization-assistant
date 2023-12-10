import { AddonData } from "@pepperi-addons/papi-sdk";

export interface AssistantConfiguration extends AddonData {
	accountSlug: string;
	genericSlug: string;
	fieldsText: string;
	queriesText: string;
	slugsText: string;
	itemCategory: string;
	transactionLineTotalPrice: string;
	transactionLineTotalQuantity: string;
	transactionStatus: string;
	transactionTotalPrice: string;
	transactionTotalQuantity: string;
	transactionType: string;
}
