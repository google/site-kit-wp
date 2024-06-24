/**
 * Validation utilities.
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
import invariant from 'invariant';
import { isPlainObject, isArray } from 'lodash';

/**
 * Internal dependencies
 */
import {
	ACCOUNT_CREATE,
	PROPERTY_CREATE,
	WEBDATASTREAM_CREATE,
} from '../datastore/constants';
import { isValidNumericID } from '../../../util';
import { isValidDateRange } from '../../../util/report-validation';
import { normalizeReportOptions } from './report-normalization';
import {
	isValidDimensionFilters,
	isValidDimensions,
	isValidMetricFilters,
	isValidMetrics,
	isValidOrders,
} from './report-validation';
import { isValidPivotsObject } from './report-pivots-validation';

/**
 * Checks if the given value is a valid selection for an Account.
 *
 * @since 1.119.0
 *
 * @param {?string} value Selected value.
 * @return {boolean} True if valid, otherwise false.
 */
export function isValidAccountSelection( value ) {
	if ( value === ACCOUNT_CREATE ) {
		return true;
	}

	return isValidNumericID( value );
}

/**
 * Checks if the given account ID appears to be a valid Analytics account.
 *
 * @since 1.8.0
 * @since 1.121.0 Migrated from analytics to analytics-4.
 *
 * @param {(string|number)} accountID Account ID to test.
 * @return {boolean} Whether or not the given account ID is valid.
 */
export { isValidNumericID as isValidAccountID };

/**
 * Checks whether the given property ID appears to be valid.
 *
 * @since 1.31.0
 *
 * @param {*} propertyID Property ID to check.
 * @return {boolean} Whether or not the given property ID is valid.
 */
export function isValidPropertyID( propertyID ) {
	return typeof propertyID === 'string' && /^\d+$/.test( propertyID );
}

/**
 * Checks if the given value is a valid selection for a Property.
 *
 * @since 1.31.0
 *
 * @param {?string} value Selected value.
 * @return {boolean} True if valid, otherwise false.
 */
export function isValidPropertySelection( value ) {
	if ( value === PROPERTY_CREATE ) {
		return true;
	}

	return isValidPropertyID( value );
}

/**
 * Checks whether the given web data stream ID appears to be valid.
 *
 * @since 1.33.0
 *
 * @param {*} webDataStreamID Web data stream ID to check.
 * @return {boolean} TRUE if the web data stream ID is valid, otherwise FALSE.
 */
export function isValidWebDataStreamID( webDataStreamID ) {
	return (
		typeof webDataStreamID === 'string' && /^\d+$/.test( webDataStreamID )
	);
}

/**
 * Checks whether the given web data stream is a valid selection.
 *
 * @since 1.35.0
 *
 * @param {?string} webDataStreamID Web data stream to check.
 * @return {boolean} TRUE if the web data stream selection is valid, otherwise FALSE.
 */
export function isValidWebDataStreamSelection( webDataStreamID ) {
	if ( webDataStreamID === WEBDATASTREAM_CREATE ) {
		return true;
	}

	return isValidWebDataStreamID( webDataStreamID );
}

/**
 * Checks if the given web data stream name appears to be valid.
 *
 * @since 1.124.0
 *
 * @param {string} value Web data stream name to test.
 * @return {boolean} True if valid, otherwise false.
 */
export function isValidWebDataStreamName( value ) {
	return typeof value === 'string' && value.trim().length > 0;
}

/**
 * Checks whether the given measurementID appears to be valid.
 *
 * @since 1.35.0
 *
 * @param {*} measurementID Web data stream measurementID to check.
 * @return {boolean} TRUE if the measurementID is valid, otherwise FALSE.
 */
export function isValidMeasurementID( measurementID ) {
	return (
		typeof measurementID === 'string' &&
		/^G-[a-zA-Z0-9]+$/.test( measurementID )
	);
}

/**
 * Checks whether the given googleTagId appears to be valid.
 *
 * @since 1.90.0
 *
 * @param {*} googleTagID Google Tag ID to check.
 * @return {boolean} TRUE if the googleTagID is valid, otherwise FALSE.
 */
export function isValidGoogleTagID( googleTagID ) {
	return (
		typeof googleTagID === 'string' &&
		/^(G|GT|AW)-[a-zA-Z0-9]+$/.test( googleTagID )
	);
}

/**
 * Checks whether the given googleTagAccountID appears to be valid.
 *
 * @since 1.90.0
 *
 * @param {*} googleTagAccountID Google Tag ID to check.
 * @return {boolean} TRUE if the googleTagAccountID is valid, otherwise FALSE.
 */
export function isValidGoogleTagAccountID( googleTagAccountID ) {
	return isValidNumericID( googleTagAccountID );
}

/**
 * Checks whether the given googleTagContainerID appears to be valid.
 *
 * @since 1.90.0
 *
 * @param {*} googleTagContainerID Google Tag ID to check.
 * @return {boolean} TRUE if the googleTagContainerID is valid, otherwise FALSE.
 */
export function isValidGoogleTagContainerID( googleTagContainerID ) {
	return isValidNumericID( googleTagContainerID );
}

/**
 * Checks whether a given report options object is valid.
 *
 * @since n.e.x.t
 *
 * @param {Object} options The options for the report.
 */
export function validateReport( options ) {
	invariant(
		isPlainObject( options ),
		'options for Analytics 4 report must be an object.'
	);
	invariant(
		isValidDateRange( options ),
		'Either date range or start/end dates must be provided for Analytics 4 report.'
	);

	const { metrics, dimensions, dimensionFilters, metricFilters, orderby } =
		normalizeReportOptions( options );

	invariant(
		metrics.length,
		'Requests must specify at least one metric for an Analytics 4 report.'
	);
	invariant(
		isValidMetrics( metrics ),
		'metrics for an Analytics 4 report must be either a string, an array of strings, an object, an array of objects, or a mix of strings and objects. Objects must have a "name" property. Metric names must match the expression ^[a-zA-Z0-9_]+$.'
	);

	if ( dimensions ) {
		invariant(
			isValidDimensions( dimensions ),
			'dimensions for an Analytics 4 report must be either a string, an array of strings, an object, an array of objects, or a mix of strings and objects. Objects must have a "name" property.'
		);
	}

	if ( dimensionFilters ) {
		invariant(
			isValidDimensionFilters( dimensionFilters ),
			'dimensionFilters for an Analytics 4 report must be a map of dimension names as keys and dimension values as values.'
		);
	}

	if ( metricFilters ) {
		invariant(
			isValidMetricFilters( metricFilters ),
			'metricFilters for an Analytics 4 report must be a map of metric names as keys and filter value(s) as numeric fields, depending on the filterType.'
		);
	}

	if ( orderby ) {
		invariant(
			isValidOrders( orderby ),
			'orderby for an Analytics 4 report must be an array of OrderBy objects where each object should have either a "metric" or "dimension" property, and an optional "desc" property.'
		);
	}
}

/**
 * Checks whether a given pivot report options object is valid.
 *
 * @since n.e.x.t
 *
 * @param {Object} options The options for the pivot report.
 */
export function validatePivotReport( options ) {
	invariant(
		isPlainObject( options ),
		'options for Analytics 4 pivot report must be an object.'
	);
	invariant(
		isValidDateRange( options ),
		'Start/end dates must be provided for Analytics 4 pivot report.'
	);

	const {
		metrics,
		dimensions,
		dimensionFilters,
		metricFilters,
		pivots,
		orderby,
		limit,
	} = normalizeReportOptions( options );

	invariant(
		metrics.length,
		'Requests must specify at least one metric for an Analytics 4 pivot report.'
	);
	invariant(
		isValidMetrics( metrics ),
		'metrics for an Analytics 4 pivot report must be either a string, an array of strings, an object, an array of objects, or a mix of strings and objects. Objects must have a "name" property. Metric names must match the expression ^[a-zA-Z0-9_]+$.'
	);
	invariant(
		isValidPivotsObject( pivots ),
		'pivots for an Analytics 4 pivot report must be an array of objects. Each object must have a "fieldNames" property and a "limit".'
	);

	if ( orderby ) {
		invariant(
			Array.isArray( orderby ),
			'orderby for an Analytics 4 pivot report must be passed within a pivot.'
		);
	}
	if ( limit ) {
		invariant(
			typeof limit === 'number',
			'limit for an Analytics 4 pivot report must be passed within a pivot.'
		);
	}

	if ( dimensions ) {
		invariant(
			isValidDimensions( dimensions ),
			'dimensions for an Analytics 4 pivot report must be either a string, an array of strings, an object, an array of objects, or a mix of strings and objects. Objects must have a "name" property.'
		);
	}

	if ( dimensionFilters ) {
		invariant(
			isValidDimensionFilters( dimensionFilters ),
			'dimensionFilters for an Analytics 4 pivot report must be a map of dimension names as keys and dimension values as values.'
		);
	}

	if ( metricFilters ) {
		invariant(
			isValidMetricFilters( metricFilters ),
			'metricFilters for an Analytics 4 pivot report must be a map of metric names as keys and filter value(s) as numeric fields, depending on the filterType.'
		);
	}
}

/**
 * Checks whether the passed audience object is valid.
 *
 * @since 1.120.0
 *
 * @param {Object} audience Audience object to check.
 */
export function validateAudience( audience ) {
	const audienceFields = [
		'displayName',
		'description',
		'membershipDurationDays',
		'eventTrigger',
		'exclusionDurationMode',
		'filterClauses',
	];

	const audienceRequiredFields = [
		'displayName',
		'description',
		'membershipDurationDays',
		'filterClauses',
	];

	invariant( isPlainObject( audience ), 'Audience must be an object.' );

	Object.keys( audience ).forEach( ( key ) => {
		invariant(
			audienceFields.includes( key ),
			`Audience object must contain only valid keys. Invalid key: "${ key }"`
		);
	} );

	audienceRequiredFields.forEach( ( key ) => {
		invariant(
			audience[ key ],
			`Audience object must contain required keys. Missing key: "${ key }"`
		);
	} );

	invariant(
		isArray( audience.filterClauses ),
		'filterClauses must be an array with AudienceFilterClause objects.'
	);
}
