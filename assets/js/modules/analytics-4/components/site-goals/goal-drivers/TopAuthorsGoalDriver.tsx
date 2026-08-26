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
	GOAL_DRIVER_REPORT_OPTIONS_BUILDERS,
	GOAL_DRIVER_ROW_MAPPERS,
} from '@/js/modules/analytics-4/components/site-goals/goal-drivers/reports';
import { GoalDriverComponentProps } from '@/js/modules/analytics-4/components/site-goals/goal-drivers/types';
import {
	EDIT_SCOPE,
	FORM_CUSTOM_DIMENSIONS_CREATE,
	MODULES_ANALYTICS_4,
} from '@/js/modules/analytics-4/datastore/constants';
import useCustomDimensionsData from '@/js/modules/analytics-4/hooks/useCustomDimensionsData';
import { ERROR_CODE_MISSING_REQUIRED_SCOPE } from '@/js/util/errors';
import TopAuthorsZeroState from './TopAuthorsZeroState';

const TopAuthorsGoalDriver: FC< GoalDriverComponentProps > = ( {
	title = '',
	goalType,
	limit,
	primaryEvent,
	breakdownFilter,
	onExpandableRowsChange,
} ) => {
	const dates = useSelect(
		( select: Select ) => select( CORE_USER ).getDateRangeDates(),
		[]
	);
	const candidateReportOptions = useMemo(
		() =>
			GOAL_DRIVER_REPORT_OPTIONS_BUILDERS[ GOAL_DRIVER_IDS.TOP_AUTHORS ](
				{
					dates,
					primaryEvent,
					breakdownFilter,
					limit: GOAL_DRIVER_ROW_LIMIT_EXPANDED,
				}
			),
		[ dates, primaryEvent, breakdownFilter ]
	);
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
	const report = useSelect(
		( select: Select ) =>
			reportOptions
				? select( MODULES_ANALYTICS_4 ).getReport( reportOptions )
				: undefined,
		[ reportOptions ]
	);
	const reportError = useSelect(
		( select: Select ) =>
			reportOptions
				? select( MODULES_ANALYTICS_4 ).getErrorForSelector(
						'getReport',
						[ reportOptions ]
				  )
				: undefined,
		[ reportOptions ]
	);
	const reportLoading = useSelect(
		( select: Select ) => {
			if ( ! reportOptions ) {
				return false;
			}

			return ! select( MODULES_ANALYTICS_4 ).hasFinishedResolution(
				'getReport',
				[ reportOptions ]
			);
		},
		[ reportOptions ]
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

	const sourceRows = report?.rows || [];
	const mappedRows =
		GOAL_DRIVER_ROW_MAPPERS[ GOAL_DRIVER_IDS.TOP_AUTHORS ]( sourceRows );
	const hasMissingCustomDimensions = hasCustomDimensions === false;
	const rows = mappedRows;
	const loading =
		customDimensionsLoading ||
		reportLoading ||
		isGatheringData === undefined;
	const error = customDimensionsCreationErrors?.[ 0 ] ?? reportError;

	useEffect( () => {
		onExpandableRowsChange?.(
			GOAL_DRIVER_IDS.TOP_AUTHORS,
			rows.length > GOAL_DRIVER_ROW_LIMIT_COLLAPSED
		);
	}, [ onExpandableRowsChange, rows.length ] );

	const noDataMetricLabel =
		goalType === GOAL_TYPES.ECOMMERCE ? 'sales' : 'leads';
	const zeroState =
		hasMissingCustomDimensions || isGatheringData ? (
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
