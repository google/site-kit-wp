/**
 * TopAuthorsGoalDriver component.
 *
 * Site Kit by Google, Copyright 2026 Google LLC
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
import { FC } from 'react';

/**
 * WordPress dependencies
 */
import { useCallback, useEffect, useMemo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { Select, useDispatch, useSelect } from 'googlesitekit-data';
import { CORE_FORMS } from '@/js/googlesitekit/datastore/forms/constants';
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import TableTile from '@/js/modules/analytics-4/components/site-goals/components/TableTile';
import {
	GOAL_DRIVER_IDS,
	GOAL_DRIVER_ROW_LIMIT_COLLAPSED,
	GOAL_DRIVER_ROW_LIMIT_EXPANDED,
	GOAL_TYPES,
	TOP_AUTHORS_REQUIRED_CUSTOM_DIMENSIONS,
} from '@/js/modules/analytics-4/components/site-goals/goal-drivers/constants';
import {
	GoalDriverComponentProps,
	GoalDriverRow,
} from '@/js/modules/analytics-4/components/site-goals/goal-drivers/types';
import {
	getDimensionFiltersForEvents,
	normalizePrimaryEvents,
} from '@/js/modules/analytics-4/components/site-goals/goal-drivers/utils';
import {
	DATE_RANGE_OFFSET,
	EDIT_SCOPE,
	FORM_CUSTOM_DIMENSIONS_CREATE,
	MODULES_ANALYTICS_4,
} from '@/js/modules/analytics-4/datastore/constants';
import useCustomDimensionsData from '@/js/modules/analytics-4/hooks/useCustomDimensionsData';
import { numFmt } from '@/js/util';
import { ERROR_CODE_MISSING_REQUIRED_SCOPE } from '@/js/util/errors';

interface ReportRow {
	dimensionValues?: Array< { value?: string } >;
	metricValues?: Array< { value?: string } >;
}

interface TopAuthorsZeroStateProps {
	hasMissingCustomDimensions: boolean;
	isGatheringData: boolean | null | undefined;
	customDimensionsLoading: boolean;
	onCreateCustomDimensions: () => void;
}

const TopAuthorsZeroState: FC< TopAuthorsZeroStateProps > = ( {
	hasMissingCustomDimensions,
	isGatheringData,
	customDimensionsLoading,
	onCreateCustomDimensions,
} ) => {
	if ( hasMissingCustomDimensions ) {
		return (
			<div className="googlesitekit-table-tile__custom-dimensions-missing">
				<p className="googlesitekit-table-tile__custom-dimensions-missing-title">
					{ __( 'No data to show', 'google-site-kit' ) }
				</p>
				<p className="googlesitekit-table-tile__custom-dimensions-missing-description">
					{ __(
						'Update Analytics to track metric',
						'google-site-kit'
					) }
				</p>
				<div className="googlesitekit-table-tile__custom-dimensions-missing-actions">
					<button
						type="button"
						className="googlesitekit-table-tile__custom-dimensions-missing-button"
						onClick={ onCreateCustomDimensions }
						disabled={ customDimensionsLoading }
					>
						{ __( 'Update', 'google-site-kit' ) }
					</button>
				</div>
			</div>
		);
	}

	if ( isGatheringData ) {
		return (
			<span>
				{ __(
					'Setup successful: Analytics is gathering data for this metric',
					'google-site-kit'
				) }
			</span>
		);
	}

	return null;
};

const TopAuthorsGoalDriver: FC< GoalDriverComponentProps > = ( {
	title: providedTitle,
	goalType,
	limit,
	rows: providedRows,
	loading: providedLoading,
	error: providedError,
	primaryEvent,
	onExpandableRowsChange,
} ) => {
	const defaultTitles = {
		[ GOAL_TYPES.ECOMMERCE ]: __(
			'Top authors driving sales',
			'google-site-kit'
		),
		[ GOAL_TYPES.LEAD ]: __(
			'Top authors driving leads',
			'google-site-kit'
		),
	};
	const title =
		providedTitle ?? defaultTitles[ goalType ] ?? defaultTitles.lead;
	const dates = useSelect(
		( select: Select ) =>
			select( CORE_USER ).getDateRangeDates( {
				offsetDays: DATE_RANGE_OFFSET,
			} ),
		[]
	);
	const eventNames = useMemo(
		() => normalizePrimaryEvents( primaryEvent ),
		[ primaryEvent ]
	);
	const dimensionFilters = useMemo(
		() => getDimensionFiltersForEvents( eventNames ),
		[ eventNames ]
	);
	const candidateReportOptions = useMemo( () => {
		if ( ! dates || ! eventNames.length ) {
			return undefined;
		}

		return {
			...dates,
			dimensions: [
				'customEvent:googlesitekit_post_author',
				'eventName',
			],
			dimensionFilters: {
				...( dimensionFilters || {} ),
				'customEvent:googlesitekit_post_author': {
					filterType: 'emptyFilter',
					notExpression: true,
				},
			},
			metrics: [ { name: 'eventCount' } ],
			orderby: [
				{
					metric: { metricName: 'eventCount' },
					desc: true,
				},
			],
			limit: GOAL_DRIVER_ROW_LIMIT_EXPANDED,
			keepEmptyRows: false,
			reportID: `analytics-4_site-goals_top-authors_${ goalType }`,
		};
	}, [ dates, dimensionFilters, eventNames, goalType ] );
	const totalReportOptions = useMemo( () => {
		if ( ! dates || ! eventNames.length ) {
			return undefined;
		}

		return {
			...dates,
			dimensionFilters,
			metrics: [ { name: 'eventCount' } ],
			reportID: `analytics-4_site-goals_top-authors-total_${ goalType }`,
		};
	}, [ dates, dimensionFilters, eventNames, goalType ] );
	const {
		hasCustomDimensions,
		customDimensionsCreationErrors,
		hasAnalyticsEditScope,
		isSyncingAvailableCustomDimensions,
		loading: customDimensionsLoading,
		isGatheringData,
		hasInvalidCustomDimensionError,
		invalidCustomDimensionReportOptions,
		redirectURL,
	} = useCustomDimensionsData( {
		dimensions: TOP_AUTHORS_REQUIRED_CUSTOM_DIMENSIONS,
		reportOptions: candidateReportOptions,
	} );
	const canLoadReports =
		hasCustomDimensions === true && isGatheringData !== true;
	const reportOptions = canLoadReports ? candidateReportOptions : undefined;
	const enabledTotalReportOptions = canLoadReports
		? totalReportOptions
		: undefined;
	const report = useSelect(
		( select: Select ) =>
			reportOptions
				? select( MODULES_ANALYTICS_4 ).getReport( reportOptions )
				: undefined,
		[ reportOptions ]
	);
	const totalReport = useSelect(
		( select: Select ) =>
			enabledTotalReportOptions
				? select( MODULES_ANALYTICS_4 ).getReport(
						enabledTotalReportOptions
				  )
				: undefined,
		[ enabledTotalReportOptions ]
	);
	const reportError = useSelect(
		( select: Select ) => {
			if ( ! reportOptions || ! enabledTotalReportOptions ) {
				return undefined;
			}

			const authorsReportError = select(
				MODULES_ANALYTICS_4
			).getErrorForSelector( 'getReport', [ reportOptions ] );
			const totalReportError = select(
				MODULES_ANALYTICS_4
			).getErrorForSelector( 'getReport', [ enabledTotalReportOptions ] );

			return authorsReportError || totalReportError || undefined;
		},
		[ enabledTotalReportOptions, reportOptions ]
	);
	const reportLoading = useSelect(
		( select: Select ) => {
			if ( ! reportOptions || ! enabledTotalReportOptions ) {
				return false;
			}

			return (
				! select( MODULES_ANALYTICS_4 ).hasFinishedResolution(
					'getReport',
					[ reportOptions ]
				) ||
				! select( MODULES_ANALYTICS_4 ).hasFinishedResolution(
					'getReport',
					[ enabledTotalReportOptions ]
				)
			);
		},
		[ enabledTotalReportOptions, reportOptions ]
	);
	const {
		clearSelectorError,
		createCustomDimensions,
		scheduleSyncAvailableCustomDimensions,
	} = useDispatch( MODULES_ANALYTICS_4 );
	const { setValues } = useDispatch( CORE_FORMS );
	const { setPermissionScopeError } = useDispatch( CORE_USER );

	const handleCreateCustomDimensions = useCallback( () => {
		if ( customDimensionsLoading ) {
			return;
		}

		if ( ! hasAnalyticsEditScope ) {
			setValues( FORM_CUSTOM_DIMENSIONS_CREATE, {
				autoSubmit: true,
				customDimensions: TOP_AUTHORS_REQUIRED_CUSTOM_DIMENSIONS,
			} );

			setPermissionScopeError( {
				code: ERROR_CODE_MISSING_REQUIRED_SCOPE,
				message: __(
					'Additional permissions are required to create new Analytics custom dimensions',
					'google-site-kit'
				),
				data: {
					status: 403,
					scopes: [ EDIT_SCOPE ],
					skipModal: true,
					redirectURL,
				},
			} );

			return;
		}

		setValues( FORM_CUSTOM_DIMENSIONS_CREATE, {
			customDimensions: TOP_AUTHORS_REQUIRED_CUSTOM_DIMENSIONS,
		} );

		createCustomDimensions( TOP_AUTHORS_REQUIRED_CUSTOM_DIMENSIONS );
	}, [
		createCustomDimensions,
		customDimensionsLoading,
		hasAnalyticsEditScope,
		redirectURL,
		setPermissionScopeError,
		setValues,
	] );

	useEffect( () => {
		if (
			! hasInvalidCustomDimensionError ||
			isSyncingAvailableCustomDimensions
		) {
			return;
		}

		( async () => {
			await Promise.all(
				invalidCustomDimensionReportOptions.map( ( options ) =>
					clearSelectorError( 'getReport', [ options ] )
				)
			);

			scheduleSyncAvailableCustomDimensions();
		} )();
	}, [
		clearSelectorError,
		hasInvalidCustomDimensionError,
		invalidCustomDimensionReportOptions,
		isSyncingAvailableCustomDimensions,
		scheduleSyncAvailableCustomDimensions,
	] );

	const sourceRows: ReportRow[] = report?.rows || [];
	const totalCount = parseFloat(
		String( totalReport?.rows?.[ 0 ]?.metricValues?.[ 0 ]?.value ?? 0 )
	);
	const mappedRows: GoalDriverRow[] = sourceRows
		.slice( 0, GOAL_DRIVER_ROW_LIMIT_EXPANDED )
		.map( ( row ) => {
			const author = row.dimensionValues?.[ 0 ]?.value || '';
			const eventCount = parseFloat(
				String( row.metricValues?.[ 0 ]?.value ?? 0 )
			);

			return {
				label: author || __( '(not set)', 'google-site-kit' ),
				value: numFmt( totalCount > 0 ? eventCount / totalCount : 0, {
					style: 'percent',
					signDisplay: 'never',
					maximumFractionDigits: 1,
				} ),
			};
		} );
	const hasMissingCustomDimensions = hasCustomDimensions === false;
	const customDimensionsCreationError =
		customDimensionsCreationErrors?.[ 0 ] ?? undefined;
	const rows = providedRows ?? mappedRows;
	const loading =
		providedLoading ??
		[
			customDimensionsLoading,
			reportLoading,
			isGatheringData === undefined,
		].some( Boolean );
	const error = providedError ?? customDimensionsCreationError ?? reportError;

	useEffect( () => {
		onExpandableRowsChange?.(
			GOAL_DRIVER_IDS.TOP_AUTHORS,
			rows.length > GOAL_DRIVER_ROW_LIMIT_COLLAPSED
		);
	}, [ onExpandableRowsChange, rows.length ] );

	const noDataMetricLabel =
		goalType === GOAL_TYPES.ECOMMERCE ? 'sales' : 'leads';
	const hasCustomDimensionsZeroState = [
		hasMissingCustomDimensions,
		isGatheringData,
	].some( Boolean );
	const zeroState = hasCustomDimensionsZeroState ? (
		<TopAuthorsZeroState
			hasMissingCustomDimensions={ hasMissingCustomDimensions }
			isGatheringData={ isGatheringData }
			customDimensionsLoading={ customDimensionsLoading }
			onCreateCustomDimensions={ handleCreateCustomDimensions }
		/>
	) : undefined;

	return (
		<TableTile
			title={ title }
			rows={ rows }
			loading={ loading }
			error={ error }
			limit={ limit }
			noDataMetricLabel={ noDataMetricLabel }
			zeroState={ zeroState }
		/>
	);
};

export default TopAuthorsGoalDriver;
