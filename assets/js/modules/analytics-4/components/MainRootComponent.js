/**
 * MainRootComponent component.
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
 * WordPress dependencies
 */
import { useCallback, useEffect } from '@wordpress/element';
// import { useMount } from 'react-use';

/**
 * Internal dependencies
 */
import { useSelect, useDispatch } from 'googlesitekit-data';
import { CORE_FORMS } from '../../../googlesitekit/datastore/forms/constants';
import { CORE_SITE } from '../../../googlesitekit/datastore/site/constants';
import { CORE_USER } from '../../../googlesitekit/datastore/user/constants';
import { CORE_MODULES } from '../../../googlesitekit/modules/datastore/constants';
import {
	EDIT_SCOPE,
	FORM_CUSTOM_DIMENSIONS_CREATE,
	MODULES_ANALYTICS_4,
} from '../datastore/constants';

export default function MainRootComponent() {
	// const ga4Actions = useDispatch( MODULES_ANALYTICS_4 );

	const isKeyMetricsSetupCompleted = useSelect( ( select ) =>
		select( CORE_SITE ).isKeyMetricsSetupCompleted()
	);

	const isGA4Connected = useSelect( ( select ) =>
		select( CORE_MODULES ).isModuleConnected( 'analytics-4' )
	);

	const hasAnalyticsEditScope = useSelect( ( select ) =>
		select( CORE_USER ).hasScope( EDIT_SCOPE )
	);

	const autoSubmit = useSelect( ( select ) =>
		select( CORE_FORMS ).getValue(
			FORM_CUSTOM_DIMENSIONS_CREATE,
			'autoSubmit'
		)
	);
	const { setValues } = useDispatch( CORE_FORMS );

	const { createCustomDimensions } = useDispatch( MODULES_ANALYTICS_4 );

	const createDimensionsAndUpdateForm = useCallback( async () => {
		await createCustomDimensions();
		setValues( FORM_CUSTOM_DIMENSIONS_CREATE, {
			isAutoCreatingCustomDimensions: false,
		} );
	}, [ createCustomDimensions, setValues ] );

	// useMount( () => {
	// 	ga4Actions?.syncGoogleTagSettings();
	// } );

	useEffect( () => {
		if (
			isKeyMetricsSetupCompleted &&
			isGA4Connected &&
			hasAnalyticsEditScope &&
			autoSubmit
		) {
			setValues( FORM_CUSTOM_DIMENSIONS_CREATE, {
				autoSubmit: false,
				isAutoCreatingCustomDimensions: true,
			} );
			createDimensionsAndUpdateForm();
		}
	}, [
		autoSubmit,
		createCustomDimensions,
		hasAnalyticsEditScope,
		isKeyMetricsSetupCompleted,
		isGA4Connected,
		setValues,
		createDimensionsAndUpdateForm,
	] );

	return null;
}
