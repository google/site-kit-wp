/**
 * Reader Revenue Manager express setup `useCTAID` hook.
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
 * Internal dependencies
 */
import { Select, useDispatch, useSelect } from 'googlesitekit-data';
import { CORE_UI } from '@/js/googlesitekit/datastore/ui/constants';
import useQueryArg from '@/js/hooks/useQueryArg';
import { EXPRESS_SETUP_CTA_ID_UI_KEY } from '@/js/modules/reader-revenue-manager/components/setup/SetupMainExpress/constants';
import { EXPRESS_SETUP_CTAS } from '@/js/modules/reader-revenue-manager/datastore/constants';

/**
 * Returns the identifier of the CTA being set up and a setter.
 *
 * Like `useStep()`, this syncs the `ctaID` query arg with the UI datastore, as
 * setting the query arg alone does not trigger a re-render. The setter does
 * nothing unless the express setup was opened with a supported `cta` query arg.
 *
 * @since n.e.x.t
 *
 * @return {Array} Value and setter tuple.
 */
export default function useCTAID(): [
	string | undefined,
	( newValue: string ) => void
] {
	const { setValue } = useDispatch( CORE_UI );
	const [ cta ] = useQueryArg< string >( 'cta' );
	const [ queryArg, setQueryArg ] = useQueryArg< string >( 'ctaID' );

	const ctaID: string | undefined = useSelect(
		( select: Select ) =>
			select( CORE_UI ).getValue( EXPRESS_SETUP_CTA_ID_UI_KEY ) ||
			queryArg,
		[ queryArg ]
	);

	const isValidCTA = (
		Object.values( EXPRESS_SETUP_CTAS ) as string[]
	 ).includes( cta ?? '' );

	const setCTAID = useCallback(
		( newValue: string ) => {
			if ( ! isValidCTA ) {
				return;
			}

			setValue( EXPRESS_SETUP_CTA_ID_UI_KEY, newValue );
			setQueryArg( newValue );
		},
		[ isValidCTA, setQueryArg, setValue ]
	);

	return [ ctaID, setCTAID ];
}
