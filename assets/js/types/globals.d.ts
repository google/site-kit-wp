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
import type { ContentEventsConfig } from '@/js/event-providers/content-events';
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

	// The frontend global shared by the event providers. This is not fully typed
	// yet. We will keep improving it as we migrate more files that use it.
	var _googlesitekit:
		| {
				// A cached page still holds the configuration an older release
				// wrote, so any field can be missing.
				contentEvents?: Partial< ContentEventsConfig >;
				gtagUserData?: boolean;
				gtagEvent?: (
					name: string,
					data?: Record< string, unknown >
				) => void;
				[ key: string ]: unknown;
		  }
		| undefined;

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
		enabledFeatures?: string[];
	};

	// This is not fully typed yet. We will keep improving it as we migrate more files that use it.
	// eslint-disable-next-line camelcase
	var gtag: Window[ 'gtag' ] | undefined;

	var _googlesitekitConsentCategoryMap:
		| Record< string, string[] >
		| undefined;
	var _googlesitekitConsents: Record< string, string > | undefined;

	// Third-party WP Consent API globals.
	// eslint-disable-next-line camelcase
	var wp_consent_type: string | undefined;
	// eslint-disable-next-line camelcase
	var wp_fallback_consent_type: string | undefined;
	// eslint-disable-next-line camelcase
	var wp_has_consent: ( ( category: string ) => boolean ) | undefined;
	// eslint-disable-next-line camelcase
	var waitfor_consent_hook: boolean | undefined;

	// Third-party WordPress plugin globals — no public type packages available.
	/* eslint-disable @typescript-eslint/no-explicit-any */
	var jQuery: any;
	var mc4wp: any;
	var Marionette: any;
	var Backbone: any;
	var PUM: any;
	/* eslint-enable @typescript-eslint/no-explicit-any */
}
