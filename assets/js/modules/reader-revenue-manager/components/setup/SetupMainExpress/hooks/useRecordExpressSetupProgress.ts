/**
 * Reader Revenue Manager express setup `useRecordExpressSetupProgress` hook.
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
import { useEffect, useRef } from 'react';

/**
 * Internal dependencies
 */
import { useDispatch } from 'googlesitekit-data';
import useQueryArg from '@/js/hooks/useQueryArg';
import {
	EXPRESS_SETUP_CTAS,
	EXPRESS_SETUP_STEPS,
	MODULES_READER_REVENUE_MANAGER,
} from '@/js/modules/reader-revenue-manager/datastore/constants';
import useCTAID from './useCTAID';

/**
 * Records the user's progress through an express setup in their
 * `lastActionedExpressSetups` user setting.
 *
 * Saves the current time against the setup's entry each time a step begins,
 * and removes the entry once the setup complete step begins. When the setup
 * has a `ctaID`, the same save records it in `completedExpressSetups`. The save
 * is not awaited, so the step works the same whether it succeeds or fails.
 *
 * @since n.e.x.t
 *
 * @param {string}                          ctaType  The CTA type being set up.
 * @param {EXPRESS_SETUP_STEPS | undefined} stepSlug The current step's slug, or `undefined` while it is resolving.
 * @return {void}
 */
export default function useRecordExpressSetupProgress(
	ctaType: string,
	stepSlug: EXPRESS_SETUP_STEPS | undefined
): void {
	const { clearActionErrors, saveUserSettings } = useDispatch(
		MODULES_READER_REVENUE_MANAGER
	);

	const [ cta ] = useQueryArg< string >( 'cta' );
	const [ ctaID ] = useCTAID();

	// Read through a ref so a `ctaID` set mid-setup doesn't count as a step
	// beginning.
	const ctaIDRef = useRef( ctaID );
	ctaIDRef.current = ctaID;

	const isSupportedCTA =
		cta === ctaType &&
		( Object.values( EXPRESS_SETUP_CTAS ) as string[] ).includes( cta );

	useEffect( () => {
		if ( stepSlug === undefined ) {
			return;
		}

		const key = `${ ctaType }:new`;

		// The reference date only holds the date, while this records the
		// actual time the user was last active in the setup.
		const now = Math.floor( Date.now() / 1000 ); // eslint-disable-line sitekit/no-direct-date
		const isComplete = stepSlug === EXPRESS_SETUP_STEPS.SETUP_COMPLETE;
		const completedKey = ctaIDRef.current
			? `${ ctaType }:${ ctaIDRef.current }`
			: undefined;

		async function storeProgress() {
			const { error } = await saveUserSettings( {
				lastActionedExpressSetups: { [ key ]: isComplete ? null : now },
				...( isComplete &&
					isSupportedCTA &&
					completedKey && {
						completedExpressSetups: { [ completedKey ]: now },
					} ),
			} );

			if ( error ) {
				// If an error occurs, don't expose it to the user.
				clearActionErrors( 'saveUserSettings' );
			}
		}

		storeProgress();
	}, [
		ctaType,
		stepSlug,
		isSupportedCTA,
		saveUserSettings,
		clearActionErrors,
	] );
}
