/**
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
 * WordPress dependencies
 */
import { useEffect } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { useSelect, useDispatch } from 'googlesitekit-data';
import { CORE_FORMS } from '../../../googlesitekit/datastore/forms/constants';
import { CORE_USER } from '../../../googlesitekit/datastore/user/constants';
import { CORE_MODULES } from '../../../googlesitekit/modules/datastore/constants';
import {
	EDIT_SCOPE,
	AUDIENCE_TILE_CUSTOM_DIMENSIONS_CREATE,
	MODULES_ANALYTICS_4,
	CUSTOM_DIMENSION_DEFINITIONS,
} from '../datastore/constants';

export default function useCreateCustomDimensionForAudienceEffect() {
	const isGA4Connected = useSelect( ( select ) =>
		select( CORE_MODULES ).isModuleConnected( 'analytics-4' )
	);

	const propertyID = useSelect( ( select ) =>
		select( MODULES_ANALYTICS_4 ).getPropertyID()
	);

	const hasAnalyticsEditScope = useSelect( ( select ) =>
		select( CORE_USER ).hasScope( EDIT_SCOPE )
	);

	const autoSubmit = useSelect( ( select ) =>
		select( CORE_FORMS ).getValue(
			AUDIENCE_TILE_CUSTOM_DIMENSIONS_CREATE,
			'autoSubmit'
		)
	);

	const { setValues } = useDispatch( CORE_FORMS );

	const {
		fetchCreateCustomDimension,
		receiveIsCustomDimensionGatheringData,
		fetchSyncAvailableCustomDimensions,
	} = useDispatch( MODULES_ANALYTICS_4 );
	useEffect( () => {
		async function createDimensionsAndUpdateForm() {
			await fetchCreateCustomDimension(
				propertyID,
				CUSTOM_DIMENSION_DEFINITIONS.googlesitekit_post_type
			);

			// If the custom dimension was created successfully, mark it as gathering
			// data immediately so that it doesn't cause unnecessary report requests.
			receiveIsCustomDimensionGatheringData(
				'googlesitekit_post_type',
				true
			);

			// Resync available custom dimensions to ensure the newly created custom dimension is available.
			await fetchSyncAvailableCustomDimensions();

			setValues( AUDIENCE_TILE_CUSTOM_DIMENSIONS_CREATE, {
				isAutoCreatingCustomDimensionsForAudience: false,
			} );
		}
		if ( isGA4Connected && hasAnalyticsEditScope && autoSubmit ) {
			setValues( AUDIENCE_TILE_CUSTOM_DIMENSIONS_CREATE, {
				autoSubmit: false,
				isAutoCreatingCustomDimensionsForAudience: true,
			} );
			createDimensionsAndUpdateForm();
		}
	}, [
		autoSubmit,
		fetchCreateCustomDimension,
		fetchSyncAvailableCustomDimensions,
		hasAnalyticsEditScope,
		isGA4Connected,
		propertyID,
		receiveIsCustomDimensionGatheringData,
		setValues,
	] );

	return null;
}
