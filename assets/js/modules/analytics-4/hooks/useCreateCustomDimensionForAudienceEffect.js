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
import { useDispatch, useSelect } from 'googlesitekit-data';
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import { CORE_MODULES } from '@/js/googlesitekit/modules/datastore/constants';
import useFormValue from '@/js/hooks/useFormValue';
import { MODULE_SLUG_ANALYTICS_4 } from '@/js/modules/analytics-4/constants';
import {
	AUDIENCE_TILE_CUSTOM_DIMENSION_CREATE,
	EDIT_SCOPE,
	MODULES_ANALYTICS_4,
} from '@/js/modules/analytics-4/datastore/constants';

export default function useCreateCustomDimensionForAudienceEffect() {
	const isGA4Connected = useSelect( ( select ) =>
		select( CORE_MODULES ).isModuleConnected( MODULE_SLUG_ANALYTICS_4 )
	);

	const hasAnalyticsEditScope = useSelect( ( select ) =>
		select( CORE_USER ).hasScope( EDIT_SCOPE )
	);

	const [ autoSubmit, setAutoSubmit ] = useFormValue(
		AUDIENCE_TILE_CUSTOM_DIMENSION_CREATE,
		'autoSubmit'
	);
	const [ , setIsAutoCreatingCustomDimensionsForAudience ] = useFormValue(
		AUDIENCE_TILE_CUSTOM_DIMENSION_CREATE,
		'isAutoCreatingCustomDimensionsForAudience'
	);
	const [ , setIsRetrying ] = useFormValue(
		AUDIENCE_TILE_CUSTOM_DIMENSION_CREATE,
		'isRetrying'
	);

	const { createCustomDimensions } = useDispatch( MODULES_ANALYTICS_4 );

	useEffect( () => {
		async function createDimensionsAndUpdateForm() {
			// Create every Site Kit custom dimension, not just the one this tile
			// needs, so the other custom dimension notices are cleared too.
			await createCustomDimensions();

			setIsAutoCreatingCustomDimensionsForAudience( false );
			setIsRetrying( false );
		}
		if ( isGA4Connected && hasAnalyticsEditScope && autoSubmit ) {
			setAutoSubmit( false );
			setIsAutoCreatingCustomDimensionsForAudience( true );
			createDimensionsAndUpdateForm();
		}
	}, [
		autoSubmit,
		createCustomDimensions,
		hasAnalyticsEditScope,
		isGA4Connected,
		setAutoSubmit,
		setIsAutoCreatingCustomDimensionsForAudience,
		setIsRetrying,
	] );

	return null;
}
