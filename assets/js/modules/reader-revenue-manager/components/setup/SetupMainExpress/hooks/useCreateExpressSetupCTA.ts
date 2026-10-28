/**
 * Reader Revenue Manager express setup `useCreateExpressSetupCTA` hook.
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

/**
 * Internal dependencies
 */
import { useDispatch } from 'googlesitekit-data';
import { MODULES_READER_REVENUE_MANAGER } from '@/js/modules/reader-revenue-manager/datastore/constants';
import type { CreateCTAParams } from '@/js/modules/reader-revenue-manager/datastore/ctas';
import useCTAID from './useCTAID';

interface CreateExpressSetupCTAResult {
	response?: unknown;
	error?: unknown;
}

type CreateExpressSetupCTACallback = (
	params: CreateCTAParams
) => Promise< CreateExpressSetupCTAResult >;

/**
 * Gets a callback that creates a CTA during express setup, then refreshes the
 * publication and CTAs and saves the resulting settings.
 *
 * Creating the CTA may make the publication live, so the onboarding state
 * saved earlier in the flow can be out of date, and the new CTA is missing
 * from the saved `configuredCTAs`.
 *
 * Once the CTA is created, its identifier is set as the `ctaID` query arg.
 *
 * @since n.e.x.t
 *
 * @return {Function} Callback that takes the `createCTA()` params and resolves
 *                    to the `createCTA()` result.
 */
export default function useCreateExpressSetupCTA(): CreateExpressSetupCTACallback {
	const {
		createCTA,
		fetchGetPublication,
		fetchGetCTAs,
		setPublicationOnboardingStateChanged,
		saveSettings,
	} = useDispatch( MODULES_READER_REVENUE_MANAGER );

	const [ , setCTAID ] = useCTAID();

	return useCallback(
		async ( params: CreateCTAParams ) => {
			const result = await createCTA( params );

			if ( result.error ) {
				return result;
			}

			// The CTA's resource name ends with its identifier.
			const name = ( result.response as { name?: unknown } | undefined )
				?.name;
			const ctaID =
				typeof name === 'string' ? name.split( '/' ).pop() : undefined;

			if ( ctaID ) {
				setCTAID( ctaID );
			}

			// Dispatch the fetch actions rather than reading the selectors:
			// the `getPublication` and `getCTAs` resolvers do nothing when the
			// store already has data, so selecting would not refresh it.
			await Promise.all( [ fetchGetPublication(), fetchGetCTAs() ] );

			// Save only after both fetches finish, as `saveSettings()` sends
			// the whole settings object from the store.
			setPublicationOnboardingStateChanged( false );
			await saveSettings();

			return result;
		},
		[
			createCTA,
			fetchGetCTAs,
			fetchGetPublication,
			saveSettings,
			setCTAID,
			setPublicationOnboardingStateChanged,
		]
	);
}
