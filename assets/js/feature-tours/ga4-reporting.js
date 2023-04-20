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
import { createInterpolateElement, useEffect } from '@wordpress/element';

/*
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import { VIEW_CONTEXT_MAIN_DASHBOARD } from '../googlesitekit/constants';
import SupportLink from '../components/SupportLink';
import { isFeatureEnabled } from '../features';
import { CORE_UI } from '../googlesitekit/datastore/ui/constants';
const { useDispatch } = Data;

// Avoid console.log in tests.
const log = process?.stdout
	? ( ...args ) =>
			process.stdout.write(
				args.map( JSON.stringify ).join( ' ' ) + '\n'
			)
	: global.console.log;

const LoggingSupportLink = ( props ) => {
	const date = new Date();
	log( 'LoggingSupportLink', date, date.getTime() );

	const { setValue } = useDispatch( CORE_UI );

	useEffect( () => {
		setValue( 'forceInView', true );
	}, [ setValue ] );

	return <SupportLink { ...props } />;
};

const ga4Reporting = {
	slug: 'ga4Reporting',
	contexts: [ VIEW_CONTEXT_MAIN_DASHBOARD ],
	version: '1.999.0', // Change this version to the actual version when GA4 reporting is released to 100% of users.
	gaEventCategory: ( viewContext ) =>
		`${ viewContext }_dashboard-ga4-reporting`,
	checkRequirements: () => isFeatureEnabled( 'ga4Reporting' ),
	steps: [
		{
			target: '.googlesitekit-data-block--conversions .googlesitekit-data-block__title, .googlesitekit-analytics-cta--setup-conversions',
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
						// <LoggingSupportLink
						<LoggingSupportLink
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
			target: '.googlesitekit-table__head-item--sessions',
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
			target: '.googlesitekit-table__head-item--engagement-rate',
			title: __( 'New metric: engagement rate', 'google-site-kit' ),
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
