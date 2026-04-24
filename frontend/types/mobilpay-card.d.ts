declare module "mobilpay-card" {
    export class Mobilpay {
        constructor(signature: string, publicKeyPath: string, privateKeyPath: string);
        setClientParams(params: {
            billing: {
                firstName: string;
                lastName: string;
                email: string;
                phone: string;
                address: string;
            },
            shipping?: {
                firstName: string;
                lastName: string;
                email: string;
                phone: string;
                address: string;
            }
        }): void;
        buildRequest(payload: {
            amount: number;
            currency: string;
            orderId: string;
            details: string;
            returnUrl: string;
            confirmUrl: string;
        }): { env_key: string; data: string };
        buildResponse(env_key: string, data: string): {
            action: string;
            error?: { code: string; message: string };
            orderId: string;
            processedAmount: number;
        };
    }
}
