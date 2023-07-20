/**
 * Key Metrics Selection Panel Metrics Listing
 *
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
import { useCallback, useRef } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { Checkbox } from 'googlesitekit-components';
import Data from 'googlesitekit-data';
import {
	KM_ANALYTICS_LOYAL_VISITORS,
	KM_ANALYTICS_NEW_VISITORS,
	KM_ANALYTICS_TOP_TRAFFIC_SOURCE,
	KM_ANALYTICS_ENGAGED_TRAFFIC_SOURCE,
	KM_ANALYTICS_POPULAR_CONTENT,
	KM_ANALYTICS_ADSENSE_TOP_EARNING_CONTENT,
	KM_ANALYTICS_POPULAR_PRODUCTS,
	KM_ANALYTICS_TOP_CITIES,
	KM_ANALYTICS_TOP_COUNTRIES,
	KM_ANALYTICS_TOP_CONVERTING_TRAFFIC_SOURCE,
	KM_SEARCH_CONSOLE_POPULAR_KEYWORDS,
	CORE_USER,
} from '../../../googlesitekit/datastore/user/constants';
import Accordion from '../../Accordion';
const { useSelect, useDispatch } = Data;

export default function Metrics() {
	const { current: keyMetricsMetaData } = useRef( {
		[ KM_ANALYTICS_LOYAL_VISITORS ]: {
			title: __( 'Loyal visitors', 'google-site-kit' ),
			description: __(
				'Portion of people who visited your site more than once',
				'google-site-kit'
			),
		},
		[ KM_ANALYTICS_NEW_VISITORS ]: {
			title: __( 'Audience growth', 'google-site-kit' ),
			description: __(
				'How many new visitors you got and how the overall audience changed',
				'google-site-kit'
			),
		},
		[ KM_ANALYTICS_TOP_TRAFFIC_SOURCE ]: {
			title: __( 'Top traffic source', 'google-site-kit' ),
			description: __(
				'Channel which brought in the most visitors to your site',
				'google-site-kit'
			),
		},
		[ KM_ANALYTICS_ENGAGED_TRAFFIC_SOURCE ]: {
			title: __( 'Most engaged traffic source', 'google-site-kit' ),
			description: __(
				'Visitors coming via this channel spent the most time on your site',
				'google-site-kit'
			),
		},
		[ KM_ANALYTICS_POPULAR_CONTENT ]: {
			title: __( 'Most popular content', 'google-site-kit' ),
			description: __(
				'Pages that brought in the most visitors',
				'google-site-kit'
			),
		},
		[ KM_ANALYTICS_ADSENSE_TOP_EARNING_CONTENT ]: {
			title: __( 'Top earning content', 'google-site-kit' ),
			description: __(
				'Pages that earned the most AdSense revenue',
				'google-site-kit'
			),
		},
		[ KM_ANALYTICS_POPULAR_PRODUCTS ]: {
			title: __( 'Most popular products', 'google-site-kit' ),
			description: __(
				'Products that brought in the most visitors',
				'google-site-kit'
			),
		},
		[ KM_SEARCH_CONSOLE_POPULAR_KEYWORDS ]: {
			title: __( 'How people find your site', 'google-site-kit' ),
			description: __(
				'What people searched for before they came to your site',
				'google-site-kit'
			),
		},
		[ KM_ANALYTICS_TOP_CITIES ]: {
			title: __( 'Top cities by traffic', 'google-site-kit' ),
			description: __(
				'Which cities you get the most visitors from',
				'google-site-kit'
			),
		},
		[ KM_ANALYTICS_TOP_COUNTRIES ]: {
			title: __( 'Top countries by traffic', 'google-site-kit' ),
			description: __(
				'Which countries you get the most visitors from',
				'google-site-kit'
			),
		},
		[ KM_ANALYTICS_TOP_CONVERTING_TRAFFIC_SOURCE ]: {
			title: __( 'Top converting traffic source', 'google-site-kit' ),
			description: __(
				'Channel which brought in the most visits that resulted in conversions',
				'google-site-kit'
			),
		},
	} );

	const selectedMetrics = useSelect( ( select ) =>
		select( CORE_USER ).getUserPickedMetrics()
	);
	const keyMetricsSettings = useSelect( ( select ) =>
		select( CORE_USER ).getKeyMetricsSettings()
	);

	const { setKeyMetricsSetting } = useDispatch( CORE_USER );

	const onMetricCheckboxChange = useCallback(
		( event, metric ) => {
			const { widgetSlugs } = keyMetricsSettings;

			setKeyMetricsSetting(
				'widgetSlugs',
				event.target.checked
					? widgetSlugs.concat( [ metric ] )
					: widgetSlugs.filter( ( slug ) => slug !== metric )
			);
		},
		[ keyMetricsSettings, setKeyMetricsSetting ]
	);

	return (
		<div className="googlesitekit-km-selection-panel-metrics">
			{ Object.keys( keyMetricsMetaData ).map( ( metric ) => {
				const { title, description } = keyMetricsMetaData[ metric ];

				const id = `key-metric-selection-checkbox-${ metric }`;

				return (
					<div
						key={ id }
						className="googlesitekit-km-selection-panel-metrics__metric-item"
					>
						<Accordion
							title={
								<Checkbox
									checked={ selectedMetrics?.includes(
										metric
									) }
									onChange={ ( event ) => {
										onMetricCheckboxChange( event, metric );
									} }
									onClick={ ( event ) => {
										event.stopPropagation();
									} }
									disabled={
										! selectedMetrics?.includes( metric ) &&
										selectedMetrics?.length > 3
									}
									id={ id }
									name={ id }
									value={ metric }
								>
									{ title }
								</Checkbox>
							}
							disabled={
								! selectedMetrics?.includes( metric ) &&
								selectedMetrics?.length > 3
							}
						>
							{ description }
						</Accordion>
					</div>
				);
			} ) }
		</div>
	);
}
