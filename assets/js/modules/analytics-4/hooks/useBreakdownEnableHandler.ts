/**
 * Site Goals breakdown "Enable" handler hook.
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
 * WordPress dependencies
 */
import { useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import {
	Select,
	useDispatch,
	useRegistry,
	useSelect,
} from 'googlesitekit-data';
import { snapshotAllStores } from '@/js/googlesitekit/data/create-snapshot-store';
import { CORE_FORMS } from '@/js/googlesitekit/datastore/forms/constants';
import { CORE_LOCATION } from '@/js/googlesitekit/datastore/location/constants';
import { CORE_SITE } from '@/js/googlesitekit/datastore/site/constants';
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import { AREA_MAIN_DASHBOARD_SITE_GOALS_PRIMARY } from '@/js/googlesitekit/widgets/default-areas';
import {
	BREAKDOWN_DISMISSED_FORM_KEY,
	BREAKDOWN_ORIGIN_FORM_KEY,
	BREAKDOWN_SCOPE_FORM_KEY,
	SITE_GOALS_BREAKDOWN_NOTIFICATION,
} from '@/js/modules/analytics-4/components/site-goals/constants';
import { BreakdownScope } from '@/js/modules/analytics-4/components/site-goals/goal-drivers/types';
import {
	CUSTOM_DIMENSION_DEFINITIONS,
	EDIT_SCOPE,
	FORM_CUSTOM_DIMENSIONS_CREATE,
	MODULES_ANALYTICS_4,
} from '@/js/modules/analytics-4/datastore/constants';
import { ERROR_CODE_MISSING_REQUIRED_SCOPE } from '@/js/util/errors';

// Every Site Kit custom dimension is created, not just the Site Goals-specific
// ones, so a single "Enable" sets up all advanced data breakdowns at once.
export const ALL_CUSTOM_DIMENSIONS = Object.keys(
	CUSTOM_DIMENSION_DEFINITIONS
);

export interface BreakdownEnableHandler {
	onEnable: () => Promise< void >;
	inProgress: boolean;
	disabled: boolean;
}

export function useBreakdownEnableHandler(
	origin: string,
	scope: BreakdownScope
): BreakdownEnableHandler {
	const registry = useRegistry();

	const hasAnalytics4EditScope = useSelect(
		( select: Select ) => select( CORE_USER ).hasScope( EDIT_SCOPE ),
		[]
	);
	const redirectURL = useSelect(
		( select: Select ) =>
			select( CORE_SITE ).getAdminURL( 'googlesitekit-dashboard', {
				notification: SITE_GOALS_BREAKDOWN_NOTIFICATION,
				// Scroll back to the Site Goals widget section on OAuth return.
				widgetArea: AREA_MAIN_DASHBOARD_SITE_GOALS_PRIMARY,
			} ),
		[]
	);
	const isNavigatingToOAuthURL = useSelect(
		( select: Select ) => {
			const OAuthURL = select( CORE_USER ).getConnectURL( {
				additionalScopes: [ EDIT_SCOPE ],
				redirectURL,
			} );

			return OAuthURL
				? select( CORE_LOCATION ).isNavigatingTo( OAuthURL )
				: false;
		},
		[ redirectURL ]
	);

	const inProgress = useSelect(
		( select: Select ) =>
			ALL_CUSTOM_DIMENSIONS.some( ( customDimension ) =>
				select( MODULES_ANALYTICS_4 ).isCreatingCustomDimension(
					customDimension
				)
			),
		[]
	);

	const { setValues } = useDispatch( CORE_FORMS );
	const { setPermissionScopeError } = useDispatch( CORE_USER );
	const { createCustomDimensions } = useDispatch( MODULES_ANALYTICS_4 );

	const onEnable = useCallback( async () => {
		// Record where creation was triggered and the enabled scope, so the
		// notices know where to render and which result copy to show. A fresh
		// attempt (including retry) clears any prior dismissal so the new result
		// can surface.
		const breakdownValues = {
			customDimensions: ALL_CUSTOM_DIMENSIONS,
			[ BREAKDOWN_ORIGIN_FORM_KEY ]: origin,
			[ BREAKDOWN_SCOPE_FORM_KEY ]: scope,
			[ BREAKDOWN_DISMISSED_FORM_KEY ]: false,
		};

		if ( ! hasAnalytics4EditScope ) {
			setValues( FORM_CUSTOM_DIMENSIONS_CREATE, {
				...breakdownValues,
				autoSubmit: true,
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

		setValues( FORM_CUSTOM_DIMENSIONS_CREATE, breakdownValues );

		createCustomDimensions( ALL_CUSTOM_DIMENSIONS );
	}, [
		createCustomDimensions,
		scope,
		hasAnalytics4EditScope,
		origin,
		redirectURL,
		registry,
		setPermissionScopeError,
		setValues,
	] );

	return {
		onEnable,
		inProgress,
		disabled: isNavigatingToOAuthURL,
	};
}
