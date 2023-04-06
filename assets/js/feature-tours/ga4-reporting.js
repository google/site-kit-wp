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
import Link from '../components/Link';

const ga4Reporting = {
	slug: 'ga4Reporting',
	contexts: [ VIEW_CONTEXT_MAIN_DASHBOARD ],
	version: '1.98.0',
	gaEventCategory: ( viewContext ) =>
		`${ viewContext }_dashboard-ga4-reporting`,
	steps: [
		{
			target: '.googlesitekit-data-block--conversions .googlesitekit-data-block__title',
			title: __(
				'See the new metrics from Google Analytics 4',
				'google-site-kit'
			),
			content: createInterpolateElement(
				__(
					'"Conversions" have replaced "Goals", since "Goals" no longer exist in GA4. <a>Learn how to set up Conversions</a>',
					'google-site-kit'
				),
				{
					a: (
						<Link
							href="https://support.google.com/analytics/answer/12966437"
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
			target: '.googlesitekit-table__head-item--sessions',
			title: __(
				'"Sessions" has replaced "Bounce rate"',
				'google-site-kit'
			),
			content: __(
				'An engaged session is a session that lasts 10 seconds or longer, has 1 or more conversion events, or has 2 or more page or screen views.',
				'google-site-kit'
			),
			placement: 'auto',
		},
		{
			target: '.googlesitekit-table__head-item--engagement-rate',
			title: __( 'New metric: engagement rate', 'google-site-kit' ),
			content: createInterpolateElement(
				__(
					'Google Analytics 4 focuses on measuring Engagement rate instead of Bounce rate. <a>Learn more</a>',
					'google-site-kit'
				),
				{
					a: (
						<Link
							href="https://support.google.com/analytics/answer/12195621"
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
