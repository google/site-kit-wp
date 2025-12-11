/**
 * Audience Segmentation CustomDimensionErrorModal component.
 *
 * Site Kit by Google, Copyright 2025 Google LLC
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

import { useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { useDispatch, useSelect } from '@/js/googlesitekit-data';
import AudienceErrorModal from './AudienceErrorModal';
import {
	AUDIENCE_TILE_CUSTOM_DIMENSION_CREATE,
	CUSTOM_DIMENSION_DEFINITIONS,
	MODULES_ANALYTICS_4,
} from '@/js/modules/analytics-4/datastore/constants';
import { CORE_SITE } from '@/js/googlesitekit/datastore/site/constants';
import { CORE_FORMS } from '@/js/googlesitekit/datastore/forms/constants';
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import useFormValue from '@/js/hooks/useFormValue';
import useViewContext from '@/js/hooks/useViewContext';
import useCreateCustomDimension from '@/js/modules/analytics-4/components/audience-segmentation/dashboard/AudienceTilesWidget/hooks/useCreateCustomDimension';

export default function CustomDimensionErrorModal( {} ) {
	const viewContext = useViewContext();

	const postTypeDimension =
		CUSTOM_DIMENSION_DEFINITIONS.googlesitekit_post_type.parameterName;

	const customDimensionError = useSelect( ( select ) =>
		select( MODULES_ANALYTICS_4 ).getCreateCustomDimensionError(
			postTypeDimension
		)
	);

	const autoSubmit = useFormValue(
		AUDIENCE_TILE_CUSTOM_DIMENSION_CREATE,
		'autoSubmit'
	);

	const setupErrorCode = useSelect( ( select ) =>
		select( CORE_SITE ).getSetupErrorCode()
	);

	const hasOAuthError = autoSubmit && setupErrorCode === 'access_denied';

	const { setSetupErrorCode } = useDispatch( CORE_SITE );
	const { clearPermissionScopeError } = useDispatch( CORE_USER );
	const { clearError } = useDispatch( MODULES_ANALYTICS_4 );
	const propertyID = useSelect( ( select ) =>
		select( MODULES_ANALYTICS_4 ).getPropertyID()
	);
	const { setValues } = useDispatch( CORE_FORMS );

	const { onCreateCustomDimension, isSaving, setShowErrorModal } =
		useCreateCustomDimension();

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

	return (
		<AudienceErrorModal
			apiErrors={ [ customDimensionError ] }
			title={ __( 'Failed to enable metric', 'google-site-kit' ) }
			description={ __(
				'Oops! Something went wrong. Retry enabling the metric.',
				'google-site-kit'
			) }
			onRetry={ () => onCreateCustomDimension( { isRetrying: true } ) }
			onCancel={ onCancel }
			inProgress={ isSaving }
			hasOAuthError={ hasOAuthError }
			trackEventCategory={ `${ viewContext }_audiences-top-content-cta` }
		/>
	);
}
