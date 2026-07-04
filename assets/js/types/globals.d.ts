/**
 * Site Kit by Google, Copyright 2026 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * Internal dependencies
 */
import { GATrackingEventArgs } from './GATrackingEventArgs';

/* eslint-disable no-var */

declare global {
	interface Window {
		gtag: ( ...args: unknown[] ) => void;
		_googlesitekitAnalyticsTrackingData?: import('@/js/analytics-advanced-tracking/types').AdvancedTrackingEvent[];
		googlesitekitAdminPointersTracking: {
			register: (
				slug: string,
				tracking: Record< string, GATrackingEventArgs >
			) => {
				onDismiss: null | ( () => void );
			};
		};
	}

	// eslint-disable-next-line camelcase
	var __webpack_public_path__: string;

	var _googlesitekitAPIFetchData: {
		nonce: string;
		nonceEndpoint: string;
		rootURL: string;
		preloadedData: Record< string, unknown >;
	};

	var googlesitekit: Record< string, unknown >;

	// This is not fully typed yet. We will keep improving it as we migrate more files that use it.
	var _googlesitekitLegacyData: {
		admin: {
			siteURL: string;
			resetSession: boolean | null;
		};
		local: string;
	};

	// This is not fully typed yet. We will keep improving it as we migrate more files that use it.
	var _googlesitekitBaseData: {
		assetsURL: string;
	};
}
