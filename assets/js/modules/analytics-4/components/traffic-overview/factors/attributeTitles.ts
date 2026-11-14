/**
 * Key factor attribute titles.
 *
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
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { BenchmarkingKeyFactorAttributeKind } from '@/js/modules/analytics-4/utils/benchmarking/types';

/**
 * The title a key factor card shows above each kind of attribute, such as
 * "Landing page" above a page path.
 *
 * `REFERRING_SITE` and `PLATFORM` are both the session's source. A `Referral`
 * or `Organic Social` card calls it a referring site, and a paid or video card
 * calls it a platform.
 *
 * @since n.e.x.t
 */
export const KEY_FACTOR_ATTRIBUTE_TITLES: Record<
	BenchmarkingKeyFactorAttributeKind,
	string
> = {
	TRAFFIC_CHANNEL: __( 'Traffic channel', 'google-site-kit' ),
	LANDING_PAGE: __( 'Landing page', 'google-site-kit' ),
	SEARCH_KEYWORD: __( 'Search keyword', 'google-site-kit' ),
	REFERRING_SITE: __( 'Referring site', 'google-site-kit' ),
	PLATFORM: __( 'Platform', 'google-site-kit' ),
	CAMPAIGN: __( 'Campaign', 'google-site-kit' ),
	DEVICE: __( 'Device', 'google-site-kit' ),
	USER_TYPE: __( 'Visitor type', 'google-site-kit' ),
};
