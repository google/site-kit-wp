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

interface SiteKitFrontendGlobal {
	gtagUserData?: boolean;
	gtagEvent?: ( event: string, params?: unknown ) => void;
	easyDigitalDownloadsCurrency?: string;
	edddata?: { purchase?: Record< string, unknown > };
	wcdata?: {
		currency?: string;
		products?: Array< Record< string, unknown > >;
		purchase?: Record< string, unknown >;
		// eslint-disable-next-line camelcase
		add_to_cart?: Record< string, unknown >;
		eventsToTrack?: string[];
	};
	[ key: string ]: unknown;
}

interface JQueryInstance {
	on(
		event: string,
		handler: ( ...args: unknown[] ) => void
	): JQueryInstance;
	each( handler: ( this: unknown, index: number ) => void ): JQueryInstance;
	find( selector: string ): JQueryInstance;
	closest( selector: string ): JQueryInstance;
	hasClass( className: string ): boolean;
	attr( name: string ): string | undefined;
	data( name: string ): unknown;
	ready( handler: () => void ): JQueryInstance;
	length: number;
	jquery?: string;
	// eslint-disable-next-line sitekit/acronym-case
	[ key: number ]: HTMLElement;
}

interface JQueryLike {
	( selector: unknown, context?: unknown ): JQueryInstance;
	[ key: string ]: unknown;
}

interface MarionetteLike {
	Object: {
		extend( definition: Record< string, unknown > ): {
			new (): unknown;
		};
	};
	[ key: string ]: unknown;
}

interface BackboneLike {
	Radio: {
		channel( name: string ): unknown;
	};
	[ key: string ]: unknown;
}

interface MailchimpLike {
	forms: {
		on(
			event: string,
			handler: ( form: unknown, data: unknown ) => void
		): void;
	};
	[ key: string ]: unknown;
}

interface PUMLike {
	hooks: {
		addAction(
			name: string,
			handler: ( ...args: unknown[] ) => void
		): void;
	};
	[ key: string ]: unknown;
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
	var _googlesitekit: SiteKitFrontendGlobal | undefined;
	var _googlesitekitConsentCategoryMap: Record< string, string[] >;
	var _googlesitekitConsents: Record< string, string > | undefined;
	var wp_consent_type: string | undefined;
	var wp_fallback_consent_type: string | undefined;
	var wp_has_consent: ( ( category: string ) => boolean ) | undefined;
	var waitfor_consent_hook: unknown;
	var gtag: ( ...args: unknown[] ) => void;
	var jQuery: JQueryLike | undefined;
	var Backbone: BackboneLike | undefined;
	var Marionette: MarionetteLike | undefined;
	var mc: unknown;
	var mc4wp: MailchimpLike | undefined;
	var PUM: PUMLike | undefined;
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
