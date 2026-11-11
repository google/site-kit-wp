/**
 * `useSurveyCustomDimensions` hook.
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
import { useMountedState } from 'react-use';

/**
 * WordPress dependencies
 */
import { useEffect, useRef, useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { Select, useDispatch, useSelect } from 'googlesitekit-data';
import { MODULES_ANALYTICS_4 } from '@/js/modules/analytics-4/datastore/constants';
import { isValidPropertyID } from '@/js/modules/analytics-4/utils/validation';
import {
	SURVEY_CUSTOM_DIMENSIONS,
	SURVEY_CUSTOM_DIMENSION_DEFINITIONS,
} from '@/js/modules/reader-revenue-manager/datastore/constants';
import type { ErrorObject } from '@/js/util/errors';

export type SurveyCustomDimensionsState =
	| { status: 'pending' }
	| { status: 'ready' }
	| { status: 'failed'; error: ErrorObject };

const PENDING_STATE: SurveyCustomDimensionsState = { status: 'pending' };
const READY_STATE: SurveyCustomDimensionsState = { status: 'ready' };

/* eslint-disable-next-line sitekit/jsdoc-no-unnamed-boolean-params */
/**
 * Creates the survey custom dimensions that are missing on the selected
 * Analytics property.
 *
 * @since n.e.x.t
 *
 * @param {boolean} canCreate Whether the dimensions can be checked and created.
 * @return {Object} The state of the survey custom dimensions: `pending` while
 *                  they are checked or created, `ready` once all of them
 *                  exist, or `failed` with the error.
 */
export default function useSurveyCustomDimensions(
	canCreate: boolean
): SurveyCustomDimensionsState {
	const isMounted = useMountedState();
	const hasStarted = useRef( false );
	const [ result, setResult ] = useState< SurveyCustomDimensionsState >();

	const { fetchCreateCustomDimension } = useDispatch( MODULES_ANALYTICS_4 );

	const propertyID = useSelect(
		( select: Select ): string | undefined =>
			select( MODULES_ANALYTICS_4 ).getPropertyID(),
		[]
	);

	const shouldCheck = canCreate && isValidPropertyID( propertyID );

	const customDimensions = useSelect(
		( select: Select ): string[] | undefined =>
			shouldCheck
				? select( MODULES_ANALYTICS_4 ).getCustomDimensions(
						propertyID
				  )
				: undefined,
		[ propertyID, shouldCheck ]
	);

	const loadError = useSelect(
		( select: Select ): ErrorObject | undefined =>
			shouldCheck
				? select( MODULES_ANALYTICS_4 ).getCustomDimensionsError(
						propertyID
				  )
				: undefined,
		[ propertyID, shouldCheck ]
	);

	useEffect( () => {
		if (
			! shouldCheck ||
			! Array.isArray( customDimensions ) ||
			hasStarted.current
		) {
			return;
		}

		hasStarted.current = true;

		const missingDimensions = SURVEY_CUSTOM_DIMENSIONS.filter(
			( dimension ) => ! customDimensions.includes( dimension )
		);

		async function createMissingDimensions() {
			// Create the dimensions one at a time, and stop at the first error.
			for ( const dimension of missingDimensions ) {
				const { error } = await fetchCreateCustomDimension(
					propertyID,
					SURVEY_CUSTOM_DIMENSION_DEFINITIONS[ dimension ]
				);

				if ( error ) {
					if ( isMounted() ) {
						setResult( { status: 'failed', error } );
					}

					return;
				}
			}

			if ( isMounted() ) {
				setResult( READY_STATE );
			}
		}

		createMissingDimensions();
	}, [
		customDimensions,
		fetchCreateCustomDimension,
		isMounted,
		propertyID,
		shouldCheck,
	] );

	if ( ! shouldCheck ) {
		return PENDING_STATE;
	}

	if ( loadError ) {
		return { status: 'failed', error: loadError };
	}

	return result ?? PENDING_STATE;
}
