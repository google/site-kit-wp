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
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import { CORE_USER } from '../../../../../googlesitekit/datastore/user/constants';
import {
	DATE_RANGE_OFFSET,
	MODULES_ANALYTICS,
} from '../../../datastore/constants';
import { isZeroReport } from '../../../util';
import { Cell, Grid, Row } from '../../../../../material-components';
import PreviewBlock from '../../../../../components/PreviewBlock';
import PreviewTable from '../../../../../components/PreviewTable';
import Header from './Header';
import AcquisitionChannelsTable from './AcquisitionChannelsTable';
import PieChart from './PieChart';
import Footer from './Footer';
const { useSelect, useInViewSelect } = Data;

export default function ModuleAcquisitionChannelsWidget( props ) {
	const { Widget, WidgetReportZero, WidgetReportError } = props;

	const isGatheringData = useInViewSelect( ( select ) =>
		select( MODULES_ANALYTICS ).isGatheringData()
	);

	const dates = useSelect( ( select ) =>
		select( CORE_USER ).getDateRangeDates( {
			offsetDays: DATE_RANGE_OFFSET,
		} )
	);

	const args = {
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

	const error = useSelect( ( select ) =>
		select( MODULES_ANALYTICS ).getErrorForSelector( 'getReport', [ args ] )
	);

	const loaded = useSelect( ( select ) =>
		select( MODULES_ANALYTICS ).hasFinishedResolution( 'getReport', [
			args,
		] )
	);

	const report = useInViewSelect( ( select ) =>
		select( MODULES_ANALYTICS ).getReport( args )
	);

	if ( ! loaded || isGatheringData === undefined ) {
		return (
			<Widget Header={ Header } Footer={ Footer }>
				<Grid>
					<Row>
						<Cell lgSize={ 4 } mdSize={ 4 } smSize={ 4 }>
							<PreviewBlock
								width="282px"
								height="282px"
								shape="circular"
							/>
						</Cell>
						<Cell lgSize={ 8 } mdSize={ 4 } smSize={ 4 }>
							<PreviewTable rows={ 4 } rowHeight={ 50 } />
						</Cell>
					</Row>
				</Grid>
			</Widget>
		);
	}

	if ( error ) {
		return (
			<Widget Header={ Header } Footer={ Footer }>
				<WidgetReportError moduleSlug="analytics" error={ error } />
			</Widget>
		);
	}

	const isZeroData = isZeroReport( report );
	if ( isGatheringData && isZeroData ) {
		return (
			<Widget Header={ Header } Footer={ Footer }>
				<WidgetReportZero moduleSlug="analytics" />
			</Widget>
		);
	}

	return (
		<Widget Header={ Header } Footer={ Footer } noPadding>
			<Grid>
				<Row>
					{ ! isZeroData && (
						<Cell lgSize={ 4 } mdSize={ 4 } smSize={ 4 }>
							<PieChart report={ report } />
						</Cell>
					) }

					<Cell
						lgSize={ isZeroData ? 12 : 8 }
						mdSize={ 8 }
						smSize={ 4 }
					>
						<AcquisitionChannelsTable report={ report } />
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
