/**
 * LegacySearchConsoleDashboardWidgetTopLevel component.
 *
 * Site Kit by Google, Copyright 2021 Google LLC
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
import { __, _x } from '@wordpress/i18n';
import { Fragment } from '@wordpress/element';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import DataBlock from '../../../../components/DataBlock';
import withData from '../../../../components/higherorder/withData';
import { TYPE_MODULES } from '../../../../components/data';
import {
	extractSearchConsoleDashboardData,
	isDataZeroSearchConsole,
} from '../../util';
import Sparkline from '../../../../components/Sparkline';
import PreviewBlock from '../../../../components/PreviewBlock';
import {
	getTimeInSeconds,
	trackEvent, untrailingslashit,
} from '../../../../util';
import extractForSparkline from '../../../../util/extract-for-sparkline';
import CTA from '../../../../components/legacy-notifications/cta';
import { CORE_SITE } from '../../../../googlesitekit/datastore/site/constants';
import { CORE_USER } from '../../../../googlesitekit/datastore/user/constants';
import { STORE_NAME, DATE_RANGE_OFFSET } from '../../datastore/constants';
import getNoDataComponent from '../../../../components/legacy-notifications/nodata';
import { generateDateRangeArgs } from '../../util/report-date-range-args';

const { useSelect } = Data;

function LegacySearchConsoleDashboardWidgetTopLevel( { data } ) {
	const { error } = data;

	const url = useSelect( ( select ) => select( CORE_SITE ).getCurrentEntityURL() );
	const propertyID = useSelect( ( select ) => select( STORE_NAME ).getPropertyID() );
	const isDomainProperty = useSelect( ( select ) => select( STORE_NAME ).isDomainProperty() );
	const referenceSiteURL = useSelect( ( select ) => {
		return untrailingslashit( select( CORE_SITE ).getReferenceSiteURL() );
	} );
	const { startDate, endDate } = useSelect( ( select ) => select( CORE_USER ).getDateRangeDates( { offsetDays: DATE_RANGE_OFFSET } ) );

	const serviceBaseURLArgs = {
		resource_id: propertyID,
		...generateDateRangeArgs( { startDate, endDate } ),
	};
	if ( url ) {
		serviceBaseURLArgs.page = `!${ url }`;
	} else if ( isDomainProperty && referenceSiteURL ) {
		serviceBaseURLArgs.page = `*${ referenceSiteURL }`;
	}

	const serviceURL = useSelect( ( select ) => select( STORE_NAME ).getServiceURL(
		{
			path: '/performance/search-analytics',
			query: serviceBaseURLArgs,
		} )
	);

	if ( error ) {
		trackEvent( 'plugin_setup', 'search_console_error', error.message );

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
				{ getNoDataComponent( _x( 'Search Console', 'Service name', 'google-site-kit' ) ) }
			</div>
		);
	}

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
						link: serviceURL,
						external: true,
					} }
					sparkline={
						<Sparkline
							data={ extractForSparkline( dataMap, 2 ) }
							change={ totalImpressionsChange }
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
						link: serviceURL,
						external: true,
					} }
					sparkline={
						<Sparkline
							data={ extractForSparkline( dataMap, 1 ) }
							change={ totalClicksChange }
						/>
					}
				/>
			</div>
		</Fragment>
	);
}

export default withData(
	LegacySearchConsoleDashboardWidgetTopLevel,
	[
		{
			type: TYPE_MODULES,
			identifier: 'search-console',
			datapoint: 'searchanalytics',
			data: {
				url: global._googlesitekitLegacyData.permaLink,
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
