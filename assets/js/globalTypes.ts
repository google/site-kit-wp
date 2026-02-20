/* eslint-disable @typescript-eslint/no-namespace */
/* eslint-disable no-var */
/* eslint-disable @typescript-eslint/no-explicit-any */

declare global {
	namespace globalThis {
		/**
		 * Global variable set by the server containing base data.
		 */
		var _googlesitekitBaseData:
			| {
					/**
					 * Array of enabled feature flags.
					 *
					 * If a feature flag's string is included in this array, it is considered
					 * enabled.
					 *
					 * All available feature flags can be found in `feature-flags.json`.
					 */
					enabledFeatures: string[];
					[ key: string ]: any;
			  }
			| undefined;
	}
}

// `declare global` blocks can only exist in modules.
//
// Every module must have an export, even if it's empty,
// so we add this dummy export.
export {};
