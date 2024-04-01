/**
 * Google Analytics 4 report argument utilities.
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
 * External dependencies
 */
import invariant from 'invariant';
import { isEmpty, isPlainObject } from 'lodash';

/**
 * Internal dependencies
 */
import {
	REPORT_ARGS_DATA_FILTERS_KEY,
	REPORT_ARGS_SELECTED_DIMENSION_KEY,
	REPORT_ARGS_SELECTED_METRIC_KEY,
} from '../constants';
import { DATE_RANGE_OFFSET } from '../datastore/constants';
import { CORE_USER } from '../../../googlesitekit/datastore/user/constants';
import { CORE_SITE } from '../../../googlesitekit/datastore/site/constants';

/**
 * Generates a set of report detail arguments for a Google Analytics 4 report.
 *
 * @since 1.98.0
 *
 * @param {Object} details Report details.
 * @return {Object} Report detail arguments.
 */
export function generateReportDetailArgs( details ) {
	invariant(
		isPlainObject( details ),
		'A valid details object is required.'
	);

	const { metric, dimension } = details;

	invariant(
		! metric || typeof metric === 'string',
		'A valid metric string is required.'
	);

	invariant(
		! dimension || typeof dimension === 'string',
		'A valid dimension string is required.'
	);

	if ( isEmpty( details ) ) {
		return {};
	}

	const detailArgs = {};

	if ( metric ) {
		detailArgs[ REPORT_ARGS_SELECTED_METRIC_KEY ] = JSON.stringify( [
			metric,
		] );
	}

	if ( dimension ) {
		detailArgs[ REPORT_ARGS_SELECTED_DIMENSION_KEY ] = JSON.stringify( [
			dimension,
		] );
	}

	return detailArgs;
}

/**
 * Generates a set of report filter arguments for a Google Analytics 4 report.
 *
 * @since 1.98.0
 *
 * @param {Object} filters Report filters.
 * @return {Object} Report filter arguments.
 */
export function generateReportFilterArgs( filters ) {
	invariant(
		isPlainObject( filters ),
		'A valid filters object is required.'
	);

	invariant(
		Reflect.ownKeys( filters ).every( ( dimensionName ) => {
			const dimensionValue = filters[ dimensionName ];
			return (
				typeof dimensionName === 'string' &&
				typeof dimensionValue === 'string'
			);
		} ),
		'A valid set of dimension names and values is required.'
	);

	if ( isEmpty( filters ) ) {
		return {};
	}

	const dataFilters = Object.entries( filters ).map(
		( [ dimensionName, dimensionValue ] ) => ( {
			type: 1,
			fieldName: dimensionName,
			evaluationType: 1,
			expressionList: [ dimensionValue ],
			complement: false,
			isCaseSensitive: true,
			expression: '',
		} )
	);

	return {
		[ REPORT_ARGS_DATA_FILTERS_KEY ]: JSON.stringify( dataFilters ),
	};
}

/**
 * Returns report args for a sample report.
 *
 * @since 1.107.0
 * @since n.e.x.t Moved from the main analytics-4 datastore file to utils.
 *
 * @param {Function} select The select function of the registry.
 * @return {Object} Report args.
 */
export const getSampleReportArgs = ( select ) => {
	const { startDate, endDate } = select( CORE_USER ).getDateRangeDates( {
		offsetDays: DATE_RANGE_OFFSET,
	} );

	const args = {
		dimensions: [ 'date' ],
		metrics: [ { name: 'totalUsers' } ],
		startDate,
		endDate,
	};

	const url = select( CORE_SITE ).getCurrentEntityURL();
	if ( url ) {
		args.url = url;
	}

	return args;
};
