declare namespace KurentoJsonRpc {
	class JsonRpcClient {
		constructor(configuration: any);
		send(method: string, params: any, callback: any): void;
		close(): void;
		forceClose(millis: number): void;
		reconnect(): void;
	}
}
export = KurentoJsonRpc;