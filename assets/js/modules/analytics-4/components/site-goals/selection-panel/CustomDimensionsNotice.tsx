/**
 * Site Goals Selection Panel custom dimensions notice.
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
import { useCallback, useEffect, useMemo, useRef } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import {
	Select,
	useDispatch,
	useRegistry,
	useSelect,
} from 'googlesitekit-data';
import { NOTICE_TYPES } from '@/js/components/Notice/constants';
import SelectionPanelNotice from '@/js/components/SelectionPanel/SelectionPanelNotice';
import { snapshotAllStores } from '@/js/googlesitekit/data/create-snapshot-store';
import { CORE_FORMS } from '@/js/googlesitekit/datastore/forms/constants';
import { CORE_LOCATION } from '@/js/googlesitekit/datastore/location/constants';
import { CORE_SITE } from '@/js/googlesitekit/datastore/site/constants';
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import useFormValue from '@/js/hooks/useFormValue';
import {
	SITE_GOALS_SELECTED_DRIVERS,
	SITE_GOALS_SELECTION_FORM,
} from '@/js/modules/analytics-4/components/site-goals/constants';
import {
	GOAL_TYPES,
	getGoalDriverOptions,
	resolveGoalDriverSelectionState,
} from '@/js/modules/analytics-4/components/site-goals/goal-drivers';
import {
	GoalDriverSelectionState,
	GoalType,
} from '@/js/modules/analytics-4/components/site-goals/goal-drivers/types';
import {
	EDIT_SCOPE,
	FORM_CUSTOM_DIMENSIONS_CREATE,
	MODULES_ANALYTICS_4,
} from '@/js/modules/analytics-4/datastore/constants';
import { ERROR_CODE_MISSING_REQUIRED_SCOPE } from '@/js/util/errors';

function getSelectedOptionsWithCustomDimensions(
	selectedDrivers: GoalDriverSelectionState | undefined
) {
	return [ GOAL_TYPES.ECOMMERCE, GOAL_TYPES.LEAD ].flatMap(
		( goalType: GoalType ) => {
			const selectedIDs = selectedDrivers?.[ goalType ] || [];
			const selectedSet = new Set( selectedIDs );

			return getGoalDriverOptions( goalType ).filter(
				( option ) =>
					selectedSet.has( option.id ) &&
					!! option.requiredCustomDimensions?.length
			);
		}
	);
}

const CustomDimensionsNotice: FC = () => {
	const registry = useRegistry();
	const syncedCustomDimensionsKeyRef = useRef< string | null >( null );
	const [ selectedDrivers ] = useFormValue(
		SITE_GOALS_SELECTION_FORM,
		SITE_GOALS_SELECTED_DRIVERS
	);
	const selectedDriverState =
		resolveGoalDriverSelectionState( selectedDrivers );
	const selectedOptionsWithCustomDimensions = useMemo(
		() => getSelectedOptionsWithCustomDimensions( selectedDriverState ),
		[ selectedDriverState ]
	);
	const requiredCustomDimensions = useMemo(
		() =>
			Array.from(
				new Set(
					selectedOptionsWithCustomDimensions.flatMap(
						( option ) => option.requiredCustomDimensions || []
					)
				)
			),
		[ selectedOptionsWithCustomDimensions ]
	);

	// Trigger the resolver so hasCustomDimensions checks against synced data.
	useSelect(
		( select: Select ) =>
			requiredCustomDimensions.length
				? select( MODULES_ANALYTICS_4 ).getAvailableCustomDimensions()
				: undefined,
		[ requiredCustomDimensions ]
	);

	const hasCustomDimensions = useSelect(
		( select: Select ) => {
			if ( ! requiredCustomDimensions.length ) {
				return true;
			}

			return select( MODULES_ANALYTICS_4 ).hasCustomDimensions(
				requiredCustomDimensions
			);
		},
		[ requiredCustomDimensions ]
	);
	const hasMissingCustomDimensions = hasCustomDimensions === false;
	const hasAnalytics4EditScope = useSelect(
		( select: Select ) => select( CORE_USER ).hasScope( EDIT_SCOPE ),
		[]
	);
	const redirectURL = useSelect(
		( select: Select ) =>
			select( CORE_SITE ).getAdminURL( 'googlesitekit-dashboard', {
				notification: 'custom_dimensions',
			} ),
		[]
	);
	const isNavigatingToOAuthURL = useSelect(
		( select: Select ) => {
			const OAuthURL = select( CORE_USER ).getConnectURL( {
				additionalScopes: [ EDIT_SCOPE ],
				redirectURL,
			} );

			if ( ! OAuthURL ) {
				return false;
			}

			return select( CORE_LOCATION ).isNavigatingTo( OAuthURL );
		},
		[ redirectURL ]
	);
	const isSettingUpCustomDimensions = useSelect(
		( select: Select ) => {
			if ( ! requiredCustomDimensions.length ) {
				return false;
			}

			return (
				select(
					MODULES_ANALYTICS_4
				).isSyncingAvailableCustomDimensions() ||
				requiredCustomDimensions.some( ( customDimension ) =>
					select( MODULES_ANALYTICS_4 ).isCreatingCustomDimension(
						customDimension
					)
				)
			);
		},
		[ requiredCustomDimensions ]
	);
	const { setValues } = useDispatch( CORE_FORMS );
	const { setPermissionScopeError } = useDispatch( CORE_USER );
	const { createCustomDimensions, fetchSyncAvailableCustomDimensions } =
		useDispatch( MODULES_ANALYTICS_4 );
	const hasRequiredCustomDimensions = requiredCustomDimensions.length > 0;
	const requiredCustomDimensionsKey = requiredCustomDimensions.join( ',' );

	useEffect( () => {
		if ( ! hasRequiredCustomDimensions ) {
			syncedCustomDimensionsKeyRef.current = null;
			return;
		}

		if ( ! hasAnalytics4EditScope ) {
			return;
		}

		if (
			hasCustomDimensions === true &&
			syncedCustomDimensionsKeyRef.current !== requiredCustomDimensionsKey
		) {
			syncedCustomDimensionsKeyRef.current = requiredCustomDimensionsKey;
			fetchSyncAvailableCustomDimensions();
		}
	}, [
		fetchSyncAvailableCustomDimensions,
		hasAnalytics4EditScope,
		hasCustomDimensions,
		hasRequiredCustomDimensions,
		requiredCustomDimensionsKey,
	] );

	const onSetupClick = useCallback( async () => {
		if ( ! hasAnalytics4EditScope ) {
			setValues( FORM_CUSTOM_DIMENSIONS_CREATE, {
				autoSubmit: true,
				customDimensions: requiredCustomDimensions,
			} );

			await snapshotAllStores( registry );

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
			customDimensions: requiredCustomDimensions,
		} );

		syncedCustomDimensionsKeyRef.current = requiredCustomDimensionsKey;
		createCustomDimensions( requiredCustomDimensions );
	}, [
		createCustomDimensions,
		hasAnalytics4EditScope,
		redirectURL,
		registry,
		requiredCustomDimensions,
		requiredCustomDimensionsKey,
		setPermissionScopeError,
		setValues,
	] );

	if ( ! hasMissingCustomDimensions ) {
		return null;
	}

	const metricTitle =
		selectedOptionsWithCustomDimensions[ 0 ]?.title ||
		__( 'selected', 'google-site-kit' );
	const description = sprintf(
		/* translators: %s: Metric title. */
		__(
			'The "%s" metric you\'ve selected requires more data tracking. To enable it, you will be directed to update your Analytics property. Complete the setup and save your selection.',
			'google-site-kit'
		),
		metricTitle
	);

	return (
		<SelectionPanelNotice
			// @ts-expect-error - The `SelectionPanelNotice` component is not yet typed.
			className="googlesitekit-notice--square googlesitekit-notice--side-panel googlesitekit-site-goals-selection-panel__custom-dimensions-notice"
			type={ NOTICE_TYPES.WARNING }
			description={ description }
			ctaButton={ {
				label: __( 'Set up', 'google-site-kit' ),
				onClick: onSetupClick,
				inProgress: isSettingUpCustomDimensions,
				disabled: isNavigatingToOAuthURL,
			} }
			hideIcon
		/>
	);
};

export default CustomDimensionsNotice;
