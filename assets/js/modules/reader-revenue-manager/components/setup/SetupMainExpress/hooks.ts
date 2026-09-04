/**
 * Reader Revenue Manager express setup hooks.
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
import { useCallback } from 'react';

/**
 * WordPress dependencies
 */
import { useDispatch, useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { Select } from '@/js/googlesitekit-data';
import { CORE_UI } from '@/js/googlesitekit/datastore/ui/constants';
import useQueryArg from '@/js/hooks/useQueryArg';
import { EXPRESS_SETUP_STEP_UI_KEY } from '@/js/modules/reader-revenue-manager/components/setup/SetupMainExpress/constants';
import type { EXPRESS_SETUP_STEPS as Step } from '@/js/modules/reader-revenue-manager/datastore/constants';

/**
 * Returns the current express setup step and a setter.
 *
 * Setting the query arg alone is not enough to trigger a re-render so this
 * hook provides a utility for using the UI datastore to manage the current
 * step while syncing it with the query arg.
 *
 * @since 1.187.0
 *
 * @return {Array} Value and setter tuple.
 */
export function useStep(): [ Step | undefined, ( newValue: Step ) => void ] {
	const { setValue } = useDispatch( CORE_UI );
	const [ queryArg, setQueryArg ] = useQueryArg< Step >( 'step' );

	const step: Step | undefined = useSelect(
		( select: Select ) =>
			select( CORE_UI ).getValue( EXPRESS_SETUP_STEP_UI_KEY ) || queryArg,
		[ queryArg ]
	);

	const setStep = useCallback(
		( newValue: Step ) => {
			setValue( EXPRESS_SETUP_STEP_UI_KEY, newValue );
			setQueryArg( newValue );
		},
		[ setQueryArg, setValue ]
	);

	return [ step, setStep ];
}
