/**
 * Site Kit by Google, Copyright 2023 Google LLC
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
import { createInterpolateElement } from '@wordpress/element';

/*
 * Internal dependencies
 */
import { VIEW_CONTEXT_MAIN_DASHBOARD } from '../googlesitekit/constants';
import SupportLink from '../components/SupportLink';

const noBorderStyles = {
	border: '0',
};

const reportTableStyles = {
	spotlight: {
		...noBorderStyles,
		// The `15px` margins on the top and bottom, plus half of the padding
		// added in these styles.
		margin: '-42px 0 0 6px',
		padding: '12px 0 20px 0',
	},
};

const ga4Reporting = {
	slug: 'ga4Reporting',
	contexts: [ VIEW_CONTEXT_MAIN_DASHBOARD ],
	version: '1.999.0', // Change this version to the actual version when GA4 reporting is released to 100% of users.
	gaEventCategory: ( viewContext ) => `${ viewContext }_ga4-metrics`,
	steps: [
		{
			target: '.googlesitekit-data-block--conversions .googlesitekit-data-block__title, .googlesitekit-analytics-cta--setup-conversions',
			styles: { spotlight: noBorderStyles },
			title: __(
				'See the new metrics from Google Analytics 4',
				'google-site-kit'
			),
			content: createInterpolateElement(
				__(
					'"Conversions" have replaced "Goals," since "Goals" no longer exist in GA4. <a>Learn how to set up Conversions</a>',
					'google-site-kit'
				),
				{
					a: (
						<SupportLink
							path="/analytics/answer/12966437"
							inverse
							external
							hideExternalIndicator
							standalone
						/>
					),
				}
			),
			placement: 'auto',
		},
		{
			target: '.googlesitekit-table__head-item--sessions:not(.googlesitekit-table__head-item--badge)',
			styles: reportTableStyles,
			title: __(
				'"Sessions" has replaced "Unique Pageviews"',
				'google-site-kit'
			),
			content: createInterpolateElement(
				__(
					'A session is a period of time during which a user interacts with your website or app. <a>Learn more</a>',
					'google-site-kit'
				),
				{
					a: (
						<SupportLink
							path="/analytics/answer/9191807"
							inverse
							external
							hideExternalIndicator
							standalone
						/>
					),
				}
			),
			placement: 'auto',
		},
		{
			target: '.googlesitekit-table__head-item--engagement-rate:not(.googlesitekit-table__head-item--badge)',
			title: __( 'New metric: engagement rate', 'google-site-kit' ),
			styles: reportTableStyles,
			content: createInterpolateElement(
				__(
					'Engagement rate shows the percentage of engaged sessions, the opposite of bounce rate. <a>Learn more</a>',
					'google-site-kit'
				),
				{
					a: (
						<SupportLink
							path="/analytics/answer/11109416"
							inverse
							external
							hideExternalIndicator
							standalone
						/>
					),
				}
			),
			placement: 'auto',
		},
	],
};

export default ga4Reporting;
