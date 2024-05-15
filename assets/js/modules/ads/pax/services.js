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
import { MODULES_ADS } from '../datastore/constants';
import { formatPaxDate } from './utils';
import { CORE_USER } from '../../../googlesitekit/datastore/user/constants';
import { DATE_RANGE_OFFSET } from '../../analytics-4/datastore/constants';

const restFetchWpPages = async () => {
	try {
		const wpPages = await apiFetch( {
			path: '/wp/v2/pages?per_page=100',
		} );

		return wpPages.map( ( page ) => {
			return {
				title: page.title.rendered,
				path: new URL( page.link ).pathname,
			};
		} );
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
 * @param {Object} _global  The global window object.
 * @return {Object} An object containing various service interfaces.
 */
export function createPaxServices( registry, _global = global ) {
	const { select, __experimentalResolveSelect: resolveSelect } = registry;
	const accessToken =
		_global?._googlesitekitPAXConfig?.authAccess?.oauthTokenAccess?.token;

	return {
		authenticationService: {
			// Ignore the ESLint rule that requires `await` in the function body.
			//
			// We mark this function as `async` to make it clear that it returns a
			// promise and in case, in the future, anything here wants to be async.
			//
			// Marking this function as `async` makes it clear that this will be
			// allowed.
			//
			// eslint-disable-next-line require-await
			get: async () => {
				return { accessToken };
			},
			// eslint-disable-next-line require-await
			fix: async () => {
				return { retryReady: true };
			},
		},
		businessService: {
			getBusinessInfo: async () => {
				await resolveSelect( CORE_SITE ).getSiteInfo();

				/* eslint-disable sitekit/acronym-case */
				// Disabling rule because businessName and businessUrl are expected by PAX API.
				const businessName = select( CORE_SITE ).getSiteName();
				const businessUrl = select( CORE_SITE ).getHomeURL();

				return { businessName, businessUrl };
				/* eslint-enable sitekit/acronym-case */
			},
			// eslint-disable-next-line require-await
			fixBusinessInfo: async () => {
				return { retryReady: true };
			},
		},
		conversionTrackingService: {
			getSupportedConversionLabels: async () => {
				await resolveSelect( MODULES_ADS ).getModuleData();
				const conversionEvents =
					select( MODULES_ADS ).getSupportedConversionEvents() || [];

				return { conversionLabels: conversionEvents };
			},
			getPageViewConversionSetting: async () => {
				const websitePages = await restFetchWpPages();
				return {
					websitePages,
				};
			},
			// eslint-disable-next-line require-await
			getSupportedConversionTrackingTypes: async () => {
				return {
					conversionTrackingTypes: [
						// @TODO: Include TYPE_CONVERSION_EVENT in a future update.
						// 'TYPE_CONVERSION_EVENT',
						'TYPE_PAGE_VIEW',
					],
				};
			},
		},
		termsAndConditionsService: {
			notify: async () => {},
		},
		partnerDateRangeService: {
			// Ignore the ESLint rule that requires `await` in the function body.
			//
			// We mark this function as `async` to make it clear that it returns a
			// promise and in case, in the future, anything here wants to be async.
			//
			// Marking this function as `async` makes it clear that this will be
			// allowed.
			//
			// eslint-disable-next-line require-await
			get: async () => {
				const { startDate, endDate } = registry
					.select( CORE_USER )
					.getDateRangeDates( {
						offsetDays: DATE_RANGE_OFFSET,
					} );

				return {
					startDate: formatPaxDate( startDate ),
					endDate: formatPaxDate( endDate ),
				};
			},
		},
	};
}
