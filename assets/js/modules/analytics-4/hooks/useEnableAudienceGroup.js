/**
 * Analytics useEnableAudienceGroup custom hook.
 *
 * Site Kit by Google, Copyright 2024 Google LLC
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
import { useMountedState } from 'react-use';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useCallback, useEffect, useState } from '@wordpress/element';
import { addQueryArgs } from '@wordpress/url';

/**
 * Internal dependencies
 */
import { useDispatch, useSelect } from 'googlesitekit-data';
import { CORE_FORMS } from '../../../googlesitekit/datastore/forms/constants';
import { CORE_USER } from '../../../googlesitekit/datastore/user/constants';
import { ERROR_CODE_MISSING_REQUIRED_SCOPE } from '../../../util/errors';
import {
	AUDIENCE_SEGMENTATION_SETUP_FORM,
	EDIT_SCOPE,
	MODULES_ANALYTICS_4,
} from '../datastore/constants';

export default function useEnableAudienceGroup( {
	redirectURL,
	onSuccess,
	onError,
} = {} ) {
	const isMounted = useMountedState();

	const [ apiErrors, setApiErrors ] = useState( [] );
	const [ failedAudiences, setFailedAudiences ] = useState( [] );
	const [ isSaving, setIsSaving ] = useState( false );

	const hasAnalytics4EditScope = useSelect( ( select ) =>
		select( CORE_USER ).hasScope( EDIT_SCOPE )
	);
	const autoSubmit = useSelect( ( select ) =>
		select( CORE_FORMS ).getValue(
			AUDIENCE_SEGMENTATION_SETUP_FORM,
			'autoSubmit'
		)
	);

	const { setValues } = useDispatch( CORE_FORMS );
	const { setPermissionScopeError } = useDispatch( CORE_USER );
	const {
		enableAudienceGroup,
		fetchSyncAvailableCustomDimensions,
		determineNeedForAnalytics4EditScope,
		syncAvailableAudiences,
	} = useDispatch( MODULES_ANALYTICS_4 );

	if ( ! redirectURL ) {
		redirectURL = addQueryArgs( global.location.href, {
			notification: 'audience_segmentation',
		} );
	}

	const maybeEnableAudienceGroup = useCallback( async () => {
		const { error: syncAudiencesError } = await syncAvailableAudiences();

		if ( syncAudiencesError ) {
			return { error: syncAudiencesError };
		}

		const { error: syncDimensionsError } =
			await fetchSyncAvailableCustomDimensions();

		if ( syncDimensionsError ) {
			return { error: syncDimensionsError };
		}

		if ( ! hasAnalytics4EditScope ) {
			const { error, needsScope } =
				await determineNeedForAnalytics4EditScope();

			if ( error ) {
				return { error };
			} else if ( needsScope ) {
				return { needsScope: true };
			}
		}

		setValues( AUDIENCE_SEGMENTATION_SETUP_FORM, {
			autoSubmit: false,
		} );

		const { error, failedSiteKitAudienceSlugs } =
			( await enableAudienceGroup( failedAudiences ) ) || {};

		return { error, failedSiteKitAudienceSlugs };
	}, [
		enableAudienceGroup,
		failedAudiences,
		fetchSyncAvailableCustomDimensions,
		hasAnalytics4EditScope,
		determineNeedForAnalytics4EditScope,
		setValues,
		syncAvailableAudiences,
	] );

	const onEnableGroups = useCallback( async () => {
		setIsSaving( true );

		const { error, needsScope, failedSiteKitAudienceSlugs } =
			await maybeEnableAudienceGroup();

		if ( needsScope ) {
			setValues( AUDIENCE_SEGMENTATION_SETUP_FORM, {
				autoSubmit: true,
			} );

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
					errorRedirectURL: global.location.href,
				},
			} );

			// Note that we don't set isSaving to false here, this is to ensure that, when the page begins to navigate to the OAuth flow:
			// - The in-progress state for the Audience Segmentation Setup CTA is retained.
			// - The OAuth error modal doesn't disappear when it's shown and the user clicks the "Retry" button.
			return;
		}

		if ( !! error || !! failedSiteKitAudienceSlugs ) {
			onError?.();
		} else {
			onSuccess?.();
		}

		if ( isMounted() ) {
			function newArrayIfNotEmpty( currentArray ) {
				return currentArray.length ? [] : currentArray;
			}

			if ( error ) {
				setApiErrors( [ error ] );
				setFailedAudiences( newArrayIfNotEmpty );
			} else if ( Array.isArray( failedSiteKitAudienceSlugs ) ) {
				setFailedAudiences( failedSiteKitAudienceSlugs );
				setApiErrors( newArrayIfNotEmpty );
			} else {
				setApiErrors( newArrayIfNotEmpty );
				setFailedAudiences( newArrayIfNotEmpty );
			}

			setIsSaving( false );
		}
	}, [
		maybeEnableAudienceGroup,
		isMounted,
		setValues,
		setPermissionScopeError,
		redirectURL,
		onError,
		onSuccess,
	] );

	// If the user returns to the component using this hook with the required
	// scope granted, and already submitted the form, trigger the submit again.
	useEffect( () => {
		if ( hasAnalytics4EditScope && autoSubmit ) {
			onEnableGroups();
		}
	}, [ hasAnalytics4EditScope, autoSubmit, onEnableGroups ] );

	return {
		apiErrors,
		failedAudiences,
		isSaving,
		onEnableGroups,
	};
}
