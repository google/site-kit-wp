/**
 * EnhancedMeasurementSetupEffect component.
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
import type { FC } from 'react';

/**
 * WordPress dependencies
 */
import { useEffect } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { Select, useDispatch, useSelect } from 'googlesitekit-data';
import { CORE_FEATURE_DISCOVERY } from '@/js/googlesitekit/datastore/feature-discovery/constants';
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import useFormValue from '@/js/hooks/useFormValue';
import {
	EDIT_SCOPE,
	FORM_SETUP,
} from '@/js/modules/analytics-4/datastore/constants';

const EnhancedMeasurementSetupEffect: FC = () => {
	const [ autoSubmit, setAutoSubmit ] = useFormValue< boolean >(
		FORM_SETUP,
		'autoSubmit'
	);

	const hasEditScope = useSelect(
		( select: Select ) => select( CORE_USER ).hasScope( EDIT_SCOPE ),
		[]
	);

	const { setupFeature } = useDispatch( CORE_FEATURE_DISCOVERY );

	useEffect( () => {
		if ( ! autoSubmit || ! hasEditScope ) {
			return;
		}

		// Cleared first, so the save is only resumed once.
		setAutoSubmit( false );

		setupFeature( 'enhanced-measurement' );
	}, [ autoSubmit, hasEditScope, setAutoSubmit, setupFeature ] );

	return null;
};

export default EnhancedMeasurementSetupEffect;
