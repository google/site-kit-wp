/**
 * Audience Segmentation useCreateCustomDimension hook.
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
import { addQueryArgs } from '@wordpress/url';

/**
 * Internal dependencies
 */
import { useDispatch, useSelect, type Select } from 'googlesitekit-data';
import useFormValue from '@/js/hooks/useFormValue';
import {
	AUDIENCE_TILE_CUSTOM_DIMENSION_CREATE,
	CUSTOM_DIMENSION_DEFINITIONS,
	EDIT_SCOPE,
	MODULES_ANALYTICS_4,
} from '@/js/modules/analytics-4/datastore/constants';
import { CORE_FORMS } from '@/js/googlesitekit/datastore/forms/constants';
import { CORE_SITE } from '@/js/googlesitekit/datastore/site/constants';
import { CORE_UI } from '@/js/googlesitekit/datastore/ui/constants';
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import { ERROR_CODE_MISSING_REQUIRED_SCOPE } from '@/js/util/errors';
import { AREA_MAIN_DASHBOARD_TRAFFIC_AUDIENCE_SEGMENTATION } from '@/js/googlesitekit/widgets/default-areas';

const SHOW_ERROR_MODAL_KEY = 'audience-tiles-show-error-modal';

interface UseCreateCustomDimensionReturn {
	onCreateCustomDimension: ( options?: { isRetrying?: boolean } ) => void;
	onCancel: () => void;
	isSaving: boolean;
	showErrorModal: boolean;
	setShowErrorModal: ( value: boolean ) => void;
}

export default function useCreateCustomDimension(): UseCreateCustomDimensionReturn {
	const showErrorModal = useSelect(
		( select: Select ) =>
			select( CORE_UI ).getValue( SHOW_ERROR_MODAL_KEY ) || false,
		[]
	);
	const { setValue } = useDispatch( CORE_UI );
	const setShowErrorModal = useCallback(
		( value: boolean ) => setValue( SHOW_ERROR_MODAL_KEY, value ),
		[ setValue ]
	);

	const { setValues } = useDispatch( CORE_FORMS );
	const hasAnalyticsEditScope = useSelect(
		( select: Select ) => select( CORE_USER ).hasScope( EDIT_SCOPE ),
		[]
	);
	const { setPermissionScopeError, clearPermissionScopeError } =
		useDispatch( CORE_USER );
	const { clearError } = useDispatch( MODULES_ANALYTICS_4 );
	const { setSetupErrorCode } = useDispatch( CORE_SITE );
	const propertyID = useSelect(
		( select: Select ) => select( MODULES_ANALYTICS_4 ).getPropertyID(),
		[]
	);

	const redirectURL = addQueryArgs( global.location.href, {
		notification: 'audience_segmentation',
		widgetArea: AREA_MAIN_DASHBOARD_TRAFFIC_AUDIENCE_SEGMENTATION,
	} );
	const errorRedirectURL = addQueryArgs( global.location.href, {
		widgetArea: AREA_MAIN_DASHBOARD_TRAFFIC_AUDIENCE_SEGMENTATION,
	} );

	const onCreateCustomDimension = useCallback(
		( { isRetrying }: { isRetrying?: boolean } = {} ) => {
			setValues( AUDIENCE_TILE_CUSTOM_DIMENSION_CREATE, {
				autoSubmit: true,
				isRetrying,
			} );

			if ( ! hasAnalyticsEditScope ) {
				setPermissionScopeError( {
					code: ERROR_CODE_MISSING_REQUIRED_SCOPE,
					message: __(
						'Additional permissions are required to create new audiences in Analytics.',
						'google-site-kit'
					),
					data: {
						status: 403,
						scopes: [ EDIT_SCOPE ],
						skipModal: true,
						skipDefaultErrorNotifications: true,
						redirectURL,
						errorRedirectURL,
					},
				} );
			}
		},
		[
			hasAnalyticsEditScope,
			redirectURL,
			errorRedirectURL,
			setPermissionScopeError,
			setValues,
		]
	);

	const onCancel = useCallback( () => {
		setValues( AUDIENCE_TILE_CUSTOM_DIMENSION_CREATE, {
			autoSubmit: false,
			isRetrying: false,
		} );
		setSetupErrorCode( null );
		clearPermissionScopeError();
		clearError( 'createCustomDimension', [
			propertyID,
			CUSTOM_DIMENSION_DEFINITIONS.googlesitekit_post_type,
		] );
		setShowErrorModal( false );
	}, [
		clearError,
		clearPermissionScopeError,
		propertyID,
		setSetupErrorCode,
		setShowErrorModal,
		setValues,
	] );

	const isAutoCreatingCustomDimensionsForAudience = useFormValue(
		AUDIENCE_TILE_CUSTOM_DIMENSION_CREATE,
		'isAutoCreatingCustomDimensionsForAudience'
	);

	const postTypeDimension =
		CUSTOM_DIMENSION_DEFINITIONS.googlesitekit_post_type.parameterName;

	const isCreatingCustomDimension = useSelect(
		( select: Select ) =>
			select( MODULES_ANALYTICS_4 ).isCreatingCustomDimension(
				postTypeDimension
			),
		[ postTypeDimension ]
	);

	const isSyncingAvailableCustomDimensions = useSelect(
		( select: Select ) =>
			select(
				MODULES_ANALYTICS_4
			).isFetchingSyncAvailableCustomDimensions(),
		[]
	);

	const isSaving =
		isAutoCreatingCustomDimensionsForAudience ||
		isCreatingCustomDimension ||
		isSyncingAvailableCustomDimensions;

	return {
		onCreateCustomDimension,
		onCancel,
		isSaving,
		showErrorModal,
		setShowErrorModal,
	};
}
