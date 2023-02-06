declare namespace NodeJS {
	interface Global {
		googlesitekit?: {
			[ key: string ]: any;
		};
		wp?: {
			[ key: string ]: any;
		};
	}
}
