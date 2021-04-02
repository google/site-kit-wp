/**
 * ModuleAcquisitionChannelsWidget component.
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
 * External dependencies
 */
import PropTypes from 'prop-types';

/**
 * WordPress dependencies
 */
import { _x } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import { DATE_RANGE_OFFSET, MODULES_ANALYTICS, STORE_NAME } from '../../../datastore/constants';
import { CORE_USER } from '../../../../../googlesitekit/datastore/user/constants';
import SourceLink from '../../../../../components/SourceLink';
import { isZeroReport } from '../../../util';
import Header from './Header';
import PieChart from './PieChart';
import { Cell, Grid, Row } from '../../../../../material-components';
import AcquisitionChannelsTable from './AcquisitionChannelsTable';

const { useSelect } = Data;

export default function ModuleAcquisitionChannelsWidget( { Widget, WidgetReportZero, WidgetReportError } ) {
	const reportType = 'trafficsources-overview';

	const {
		hasFinishedResolution,
		report,
		error,
		url,
	} = useSelect( ( select ) => {
		const dates = select( CORE_USER ).getDateRangeDates( { offsetDays: DATE_RANGE_OFFSET } );
		const reportArgs = {
			...dates,
			dimensions: 'ga:channelGrouping',
			metrics: [
				{
					expression: 'ga:sessions',
					alias: 'Sessions',
				},
				{
					expression: 'ga:users',
					alias: 'Users',
				},
				{
					expression: 'ga:newUsers',
					alias: 'New Users',
				},
			],
			orderby: [
				{
					fieldName: 'ga:users',
					sortOrder: 'DESCENDING',
				},
			],
			limit: 10,
		};

		return {
			error: select( STORE_NAME ).getErrorForSelector( 'getReport', [ reportArgs ] ),
			hasFinishedResolution: select( STORE_NAME ).hasFinishedResolution( 'getReport', [ reportArgs ] ),
			report: select( STORE_NAME ).getReport( reportArgs ),
			url: select( MODULES_ANALYTICS ).getServiceReportURL( reportType ),
		};
	} );

	if ( error ) {
		return (
			<Widget Header={ Header }>
				<WidgetReportError moduleSlug="analytics" error={ error } />
			</Widget>
		);
	}

	if ( isZeroReport( report ) ) {
		return (
			<Widget Header={ Header }>
				<WidgetReportZero moduleSlug="analytics" />
			</Widget>
		);
	}

	return (
		<Widget
			noPadding={ hasFinishedResolution }
			Header={ () => (
				<Header />
			) }
			Footer={ () => (
				<SourceLink
					className="googlesitekit-data-block__source"
					name={ _x( 'Analytics', 'Service name', 'google-site-kit' ) }
					href={ url }
					external
				/>
			) }
		>
			<Grid>
				<Row>
					<Cell lgSize={ 4 } mdSize={ 4 } smSize={ 4 }>
						<PieChart report={ report } hasFinishedResolution={ hasFinishedResolution } />
					</Cell>
					<Cell lgSize={ 8 } mdSize={ 4 } smSize={ 4 }>
						<AcquisitionChannelsTable report={ report } hasFinishedResolution={ hasFinishedResolution } />
					</Cell>
				</Row>
			</Grid>
		</Widget>
	);
}

ModuleAcquisitionChannelsWidget.propTypes = {
	Widget: PropTypes.elementType.isRequired,
	WidgetReportError: PropTypes.elementType.isRequired,
	WidgetReportZero: PropTypes.elementType.isRequired,
};
