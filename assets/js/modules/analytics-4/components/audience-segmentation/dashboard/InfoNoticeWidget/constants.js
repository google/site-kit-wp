/**
 * Constants related to audience segmentation info notices.
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
import { __ } from '@wordpress/i18n';

/**
 * UI key to display audience segmentation info notice.
 *
 * @since 1.135.0
 * @private
 */
export const AUDIENCE_INFO_NOTICE_HIDE_UI =
	'audience-segmentation-info-notice-ui';

/**
 * Slug for audience segmentation info notice.
 *
 * @since 1.130.0
 * @private
 */
export const AUDIENCE_INFO_NOTICE_SLUG = 'audience-segmentation-info-notice';

// Notice slugs: new-visitors, compare-metrics, custom-audiences, purchasers, returning-visitors, compare-new-returning, or compare-cities

/**
 * List of info notices for audiences.
 *
 * @since 1.130.0
 * @private
 */
export const AUDIENCE_INFO_NOTICES = [
	{
		slug: 'new-visitors',
		content: __(
			'The higher the portion of new visitors you have, the more your audience is growing. Looking at what content brings them to your site may give you insights on how to reach even more people.',
			'google-site-kit'
		),
	},
	{
		slug: 'compare-metrics',
		content: __(
			'Select up to three visitor groups to display on the dashboard and easily compare metrics between them.',
			'google-site-kit'
		),
	},
	{
		slug: 'custom-audiences',
		content: __(
			'Configure your own custom audiences in Analytics to gain deeper insights into visitor behavior, for example consider creating an “Existing customers” or “Subscribers” segment, depending on what goals you have for your site.',
			'google-site-kit'
		),
	},
	{
		slug: 'purchasers',
		content: __(
			'Select the Purchasers visitor group to gain insights into which visitors bring the most revenue to your site.',
			'google-site-kit'
		),
	},
	{
		slug: 'returning-visitors',
		content: __(
			'The more returning visitors your site has, the stronger and more loyal an audience you’re building. Check which content brings people back to your site - it might help you create a strategy to build a community.',
			'google-site-kit'
		),
	},
	{
		slug: 'compare-new-returning',
		content: __(
			'Compare the ratio of “new” to “returning” visitors – this can give you insights on whether you have more people stopping by as a one-off, or more loyal visitors.',
			'google-site-kit'
		),
	},
	{
		slug: 'compare-cities',
		content: __(
			'Check the cities which bring you more new vs more returning visitors – there might be new audiences you could engage with in locations you hadn’t thought about.',
			'google-site-kit'
		),
	},
];
