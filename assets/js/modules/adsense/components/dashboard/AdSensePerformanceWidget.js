/**
 * AdSensePerformanceWidget component.
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

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { isUndefined } from 'lodash';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';

import {
	readableLargeNumber,
} from '../../../../util';
import DataBlock from '../../../../components/data-block.js';
import PreviewBlock from '../../../../components/preview-block';
import { STORE_NAME as CORE_USER } from '../../../../googlesitekit/datastore/user/constants';
import { STORE_NAME } from '../../datastore/constants';
import getDataErrorComponent from '../../../../components/notifications/data-error';
import getNoDataComponent from '../../../../components/notifications/nodata';

const { useSelect } = Data;

function AdSensePerformanceWidget( ) {
	const {
		error,
		loading,
		prevRange,
		currentRange,
	} = useSelect( ( select ) => {
		const store = select( STORE_NAME );
		const dateRange = select( CORE_USER ).getDateRange();
		const prevDateRange = dateRange.replace( 'last', 'prev' );
		const commonArgs = {
			metrics: [ 'EARNINGS', 'PAGE_VIEWS_RPM', 'IMPRESSIONS', 'PAGE_VIEWS_CTR' ],
		};
		const currentRangeArgs = {
			dateRange,
			...commonArgs,
		};

		const prevRangeArgs = {
			dateRange: prevDateRange,
			...commonArgs,
		};
		return {
			error: store.getErrorForSelector( 'getReport', [ currentRange ] ) || store.getErrorForSelector( 'getReport', [ prevRangeArgs ] ),
			loading: store.isResolving( 'getReport', [ currentRange ] ) || store.isResolving( 'getReport', [ prevRangeArgs ] ),
			prevRange: store.getReport( prevRangeArgs ),
			currentRange: store.getReport( currentRangeArgs ),

		};
	} );

	if ( loading ) {
		return <PreviewBlock width="100%" height="250px" />;
	}
	if ( ! loading && error ) {
		return getDataErrorComponent( 'adsense', error.message, true, true, false, error );
	}

	if ( ! currentRange?.totals || ! prevRange?.totals ) {
		return getNoDataComponent( __( 'AdSense', 'google-site-kit' ) );
	}

	const dataBlocks = currentRange.totals ? [
		{
			className: 'googlesitekit-data-block--page-rpm',
			title: __( 'Earnings', 'google-site-kit' ),
			datapoint: readableLargeNumber( currentRange.totals[ 0 ] ),
			change: ( ! isUndefined( prevRange.totals ) ) ? prevRange.totals[ 0 ] : 0,
			changeDataUnit: '%',
		},
		{
			className: 'googlesitekit-data-block--page-rpm',
			title: __( 'Page RPM', 'google-site-kit' ),
			datapoint: readableLargeNumber( currentRange.totals[ 1 ] ),
			change: ( ! isUndefined( prevRange.totals ) ) ? prevRange.totals[ 1 ] : 0,
			changeDataUnit: '%',
		},
		{
			className: 'googlesitekit-data-block--impression',
			title: __( 'Impressions', 'google-site-kit' ),
			datapoint: readableLargeNumber( currentRange.totals[ 2 ] ),
			change: ! isUndefined( prevRange.totals ) ? prevRange.totals[ 2 ] : 0,
			changeDataUnit: '%',
		},
		{
			className: 'googlesitekit-data-block--impression',
			title: __( 'Page CTR', 'google-site-kit' ),
			datapoint: readableLargeNumber( currentRange.totals[ 3 ] ),
			change: ! isUndefined( prevRange.totals ) ? prevRange.totals[ 3 ] : 0,
			changeDataUnit: '%',
		},
	] : [];

	return (
		<section className="mdc-layout-grid">
			<div className="mdc-layout-grid__inner">
				{ dataBlocks.map( ( block, i ) => {
					return (
						<div key={ i } className="
								mdc-layout-grid__cell
								mdc-layout-grid__cell--align-top
								mdc-layout-grid__cell--span-2-phone
								mdc-layout-grid__cell--span-2-tablet
								mdc-layout-grid__cell--span-3-desktop
							">
							<DataBlock
								stat={ i }
								className={ block.className }
								title={ block.title }
								datapoint={ block.datapoint }
								change={ block.change }
								changeDataUnit={ block.changeDataUnit }
								context={ block.context }
								selected={ block.selected }
								handleStatSelection={ block.handleStatSelection }
							/>
						</div>
					);
				} ) }
			</div>
		</section>
	);
}
export default AdSensePerformanceWidget;
