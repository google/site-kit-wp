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
 * Shared ambient declarations covering the Site Kit WordPress globals and the
 * browser globals consumed by the top-level entry files in `assets/js/*`.
 *
 * Declarations describe only the surface actually used by the migrated entry
 * files and stay deliberately permissive (open-ended via index signatures) so
 * this file does not need to evolve with internal API shape changes.
 */

interface GoogleSiteKitGlobal {
	api?: unknown;
	components?: unknown;
	data?: unknown;
	i18n?: unknown;
	modules?: unknown;
	notifications?: unknown;
	widgets?: unknown;
	[ key: string ]: unknown;
}

interface GoogleSiteKitLegacyData {
	admin: {
		resetSession?: boolean;
		[ key: string ]: unknown;
	};
	[ key: string ]: unknown;
}

interface GoogleSiteKitBaseData {
	assetsURL: string;
	[ key: string ]: unknown;
}

interface GoogleSiteKitAPIFetchData {
	nonce?: string;
	nonceEndpoint?: string;
	preloadedData?: Record< string, unknown >;
	rootURL?: string;
}

interface AdminPointerTrackingEventConfig {
	category?: string;
	action?: string;
	label?: string;
}

interface AdminPointerTrackingConfig {
	view?: AdminPointerTrackingEventConfig;
	click?: AdminPointerTrackingEventConfig;
	dismiss?: AdminPointerTrackingEventConfig;
}

interface GoogleSiteKitAdminPointersTracking {
	register?: (
		slug: string,
		tracking: AdminPointerTrackingConfig
	) => { onDismiss: ( () => void ) | null };
}

declare global {
	/* eslint-disable no-var, camelcase */
	var __webpack_public_path__: string;
	var googlesitekit: GoogleSiteKitGlobal | undefined;
	var _googlesitekitLegacyData: GoogleSiteKitLegacyData;
	var _googlesitekitBaseData: GoogleSiteKitBaseData;
	var _googlesitekitAPIFetchData: GoogleSiteKitAPIFetchData | undefined;
	var _googlesitekitAnalyticsTrackingData: object[] | undefined;
	/* eslint-enable no-var, camelcase */

	interface Window {
		googlesitekit?: GoogleSiteKitGlobal;
		googlesitekitAdminPointersTracking?: GoogleSiteKitAdminPointersTracking;
		_googlesitekitLegacyData?: GoogleSiteKitLegacyData;
		_googlesitekitBaseData?: GoogleSiteKitBaseData;
		_googlesitekitAPIFetchData?: GoogleSiteKitAPIFetchData;
		_googlesitekitAnalyticsTrackingData?: object[];
		gtag: ( ...args: unknown[] ) => void;
	}
}

export {};
