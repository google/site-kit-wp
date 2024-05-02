/**
 * Services functions.
 *
 * Site Kit by Google, Copyright 2024 Google LLC
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
 * WordPress dependencies
 */
import apiFetch from '@wordpress/api-fetch';

/**
 * Internal dependencies
 */
import { CORE_SITE } from '../../../googlesitekit/datastore/site/constants';

const restFetchWpPages = async () => {
	try {
		const wpPages = await apiFetch( {
			path: '/wp/v2/pages?per_page=100',
		} ).then( ( pages ) =>
			pages.map( ( page ) => {
				return {
					title: page.title.rendered,
					path: new URL( page.link ).pathname,
				};
			} )
		);
		if ( wpPages ) {
			return wpPages;
		}
	} catch {
		return [];
	}
};
/**
 * Returns PAX services.
 *
 * @since 1.126.0
 *
 * @param {Object} registry Registry object to dispatch to.
 * @return {Object} An object containing various service interfaces.
 */
export function createPaxServices( registry ) {
	return {
		businessService: {
			getBusinessInfo: async () => {
				await registry
					.__experimentalResolveSelect( CORE_SITE )
					.getSiteInfo();

				/* eslint-disable sitekit/acronym-case */
				// Disabling rule because businessName and businessUrl are expected by PAX API.
				const businessName = registry.select( CORE_SITE ).getSiteName();
				const businessUrl = registry.select( CORE_SITE ).getHomeURL();

				return { businessName, businessUrl };
				/* eslint-enable sitekit/acronym-case */
			},
			// eslint-disable-next-line require-await
			fixBusinessInfo: async () => {
				return { retryReady: true };
			},
		},
		conversionTrackingService: {
			// eslint-disable-next-line require-await
			getSupportedConversionLabels: async () => {
				return { conversionLabels: [] };
			},
			// eslint-disable-next-line require-await
			getPageViewConversionSetting: async () => {
				const wordPressPages = await restFetchWpPages();
				return {
					enablePageViewConversion: true,
					websitePages: wordPressPages,
				};
			},
		},
		termsAndConditionsService: {
			notify: async () => {},
		},
	};
}
