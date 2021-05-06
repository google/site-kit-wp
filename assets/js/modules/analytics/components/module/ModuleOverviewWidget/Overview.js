/**
 * Overview component the ModuleOverviewWidget widget.
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
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { Grid, Row, Cell } from '../../../../../material-components';
import DataBlock from '../../../../../components/DataBlock';
import { calculateChange } from '../../../../../util';

function getDatapointAndChange( [ report ], selectedStat, divider = 1 ) {
	return {
		datapoint: report?.data?.totals?.[ 0 ]?.values?.[ selectedStat ] / divider,
		change: calculateChange(
			report?.data?.totals?.[ 1 ]?.values?.[ selectedStat ],
			report?.data?.totals?.[ 0 ]?.values?.[ selectedStat ],
		),
	};
}

export default function Overview( { report, selectedStat, handleStatSelection } ) {
	const dataBlocks = [
		{
			title: __( 'Users', 'google-site-kit' ),
			className: 'googlesitekit-data-block--users googlesitekit-data-block--button-1',
			...getDatapointAndChange( report, 0 ),
		},
		{
			title: __( 'Sessions', 'google-site-kit' ),
			className: 'googlesitekit-data-block--sessions googlesitekit-data-block--button-2',
			...getDatapointAndChange( report, 1 ),
		},
		{
			title: __( 'Bounce Rate', 'google-site-kit' ),
			className: 'googlesitekit-data-block--bounce googlesitekit-data-block--button-3',
			datapointUnit: '%',
			invertChangeColor: true,
			...getDatapointAndChange( report, 2, 100 ),
		},
		{
			title: __( 'Session Duration', 'google-site-kit' ),
			className: 'googlesitekit-data-block--duration googlesitekit-data-block--button-4',
			datapointUnit: 's',
			...getDatapointAndChange( report, 3 ),
		},
	];

	return (
		<Grid>
			<Row>
				{ dataBlocks.map( ( block, i ) => (
					<Cell key={ i } smSize={ 2 } mdSize={ 2 } lgSize={ 3 }>
						<DataBlock
							stat={ i }
							className={ block.className }
							title={ block.title }
							datapoint={ block.datapoint }
							change={ block.change }
							changeDataUnit="%"
							context="button"
							selected={ selectedStat === i }
							handleStatSelection={ handleStatSelection }
							datapointUnit={ block.datapointUnit }
							invertChangeColor={ block.invertChangeColor }
						/>
					</Cell>
				) ) }
			</Row>
		</Grid>
	);
}

Overview.propTypes = {
	report: PropTypes.arrayOf( PropTypes.object ),
	selectedStat: PropTypes.number.isRequired,
	handleStatSelection: PropTypes.func.isRequired,
};
