/**
 * SearchConsoleDashboardWidgetTopLevel component.
 *
 * Site Kit by Google, Copyright 2019 Google LLC
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
 * External dependencies
 */
import DataBlock from 'GoogleComponents/data-block';
import withData from 'GoogleComponents/higherorder/withdata';
import { TYPE_MODULES } from 'GoogleComponents/data';

/**
 * WordPress dependencies
 */
import { __, _x } from '@wordpress/i18n';
import { Component, Fragment } from '@wordpress/element';

/**
 * Internal dependencies
 */
import {
	extractSearchConsoleDashboardData,
	isDataZeroSearchConsole,
} from './util';
import Sparkline from 'GoogleComponents/sparkline';
import PreviewBlock from 'GoogleComponents/preview-block';
import {
	getTimeInSeconds,
	extractForSparkline,
	getSiteKitAdminURL,
	sendAnalyticsTrackingEvent,
} from 'GoogleUtil';
import CTA from 'GoogleComponents/notifications/cta';

class SearchConsoleDashboardWidgetTopLevel extends Component {
	render() {
		const { data } = this.props;

		const { error } = data;
		if ( error ) {
			sendAnalyticsTrackingEvent( 'plugin_setup', 'search_console_error', error.message );

			return (
				<div className="
					mdc-layout-grid__cell
					mdc-layout-grid__cell--span-4-phone
					mdc-layout-grid__cell--span-4-tablet
					mdc-layout-grid__cell--span-6-desktop
				">
					<CTA
						title={ __( 'Something went wrong', 'google-site-kit' ) }
						description={ error.message }
						error
					/>
				</div>
			);
		}

		// Waiting for withData resolution.
		if ( ! data ) {
			return null;
		}

		// Handle empty data.
		if ( ! data.length ) {
			return (
				<div className="
					mdc-layout-grid__cell
					mdc-layout-grid__cell--span-4-phone
					mdc-layout-grid__cell--span-4-tablet
					mdc-layout-grid__cell--span-6-desktop
				">
					<CTA
						title={ __( 'Search Console Data Empty', 'google-site-kit' ) }
						description={ __( 'Search Console data is not yet available, please check back later.', 'google-site-kit' ) }
						ctaLink={ '' }
						ctaLabel={ '' }
					/>
				</div>
			);
		}

		const href = getSiteKitAdminURL(
			'googlesitekit-module-search-console',
			{}
		);

		const {
			totalClicks,
			totalImpressions,
			totalClicksChange,
			totalImpressionsChange,
			dataMap,
		} = extractSearchConsoleDashboardData( data );

		return (
			<Fragment>
				<div className="
					mdc-layout-grid__cell
					mdc-layout-grid__cell--align-bottom
					mdc-layout-grid__cell--span-2-phone
					mdc-layout-grid__cell--span-2-tablet
					mdc-layout-grid__cell--span-3-desktop
				">
					<DataBlock
						className="overview-total-impressions"
						title={ __( 'Impressions', 'google-site-kit' ) }
						datapoint={ totalImpressions }
						change={ totalImpressionsChange }
						changeDataUnit="%"
						source={ {
							name: _x( 'Search Console', 'Service name', 'google-site-kit' ),
							link: href,
						} }
						sparkline={
							<Sparkline
								data={ extractForSparkline( dataMap, 2 ) }
								change={ totalImpressionsChange }
								id="search-console-impressions-sparkline"
							/>
						}
					/>
				</div>
				<div className="
					mdc-layout-grid__cell
					mdc-layout-grid__cell--align-bottom
					mdc-layout-grid__cell--span-2-phone
					mdc-layout-grid__cell--span-2-tablet
					mdc-layout-grid__cell--span-3-desktop
				">
					<DataBlock
						className="overview-total-clicks"
						title={ __( 'Clicks', 'google-site-kit' ) }
						datapoint={ totalClicks }
						change={ totalClicksChange }
						changeDataUnit="%"
						source={ {
							name: _x( 'Search Console', 'Service name', 'google-site-kit' ),
							link: href,
						} }
						sparkline={
							<Sparkline
								data={ extractForSparkline( dataMap, 1 ) }
								change={ totalClicksChange }
								id="search-console-clicks-sparkline"
							/>
						}
					/>
				</div>
			</Fragment>
		);
	}
}

export default withData(
	SearchConsoleDashboardWidgetTopLevel,
	[
		{
			type: TYPE_MODULES,
			identifier: 'search-console',
			datapoint: 'searchanalytics',
			data: {
				url: global.googlesitekit.permaLink,
				dimensions: 'date',
				compareDateRanges: true,
			},
			priority: 1,
			maxAge: getTimeInSeconds( 'day' ),
			context: [ 'Single', 'Dashboard' ],
		},
	],
	<Fragment>
		<div className="
			mdc-layout-grid__cell
			mdc-layout-grid__cell--align-bottom
			mdc-layout-grid__cell--span-2-phone
			mdc-layout-grid__cell--span-2-tablet
			mdc-layout-grid__cell--span-3-desktop
		">
			<PreviewBlock width="100%" height="202px" />
		</div>
		<div className="
			mdc-layout-grid__cell
			mdc-layout-grid__cell--align-bottom
			mdc-layout-grid__cell--span-2-phone
			mdc-layout-grid__cell--span-2-tablet
			mdc-layout-grid__cell--span-3-desktop
		">
			<PreviewBlock width="100%" height="202px" />
		</div>
	</Fragment>,
	{
		inGrid: true,
	},
	isDataZeroSearchConsole
);
