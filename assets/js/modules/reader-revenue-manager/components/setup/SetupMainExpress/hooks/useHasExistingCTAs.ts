/**
 * Reader Revenue Manager express setup `useHasExistingCTAs` hook.
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
import { useEffect, useState } from 'react';

/**
 * Internal dependencies
 */
import { Select, useSelect } from 'googlesitekit-data';
import {
	EXPRESS_SETUP_CTAS,
	MODULES_READER_REVENUE_MANAGER,
} from '@/js/modules/reader-revenue-manager/datastore/constants';
import {
	CTA,
	CTA_TYPES,
	CallToActionType,
} from '@/js/modules/reader-revenue-manager/datastore/cta-types';

type ExpressSetupCTAType =
	typeof EXPRESS_SETUP_CTAS[ keyof typeof EXPRESS_SETUP_CTAS ];

// The CTA type each express setup creates. A setup without an entry creates
// a CTA of a type that can't be checked for yet.
const EXPRESS_SETUP_CTA_TO_CTA_TYPE: Partial<
	Record< ExpressSetupCTAType, CallToActionType >
> = {
	[ EXPRESS_SETUP_CTAS.NEWSLETTER_SIGNUP ]: CTA_TYPES.NEWSLETTER_SIGNUP,
};

/**
 * Determines whether a publication already has a CTA of the type an express
 * setup creates, in any state.
 *
 * The result is recorded once per publication and CTA type, as creating a CTA
 * in the setup reloads the CTAs, which would otherwise make the publication
 * look as if it had an existing CTA that the setup itself just created.
 *
 * @since n.e.x.t
 *
 * @param {string} publicationID The publication ID.
 * @param {string} ctaType       The express setup CTA type, one of `EXPRESS_SETUP_CTAS`.
 * @return {(boolean|undefined)} `true` when the publication has a CTA of the type, `false` when it
 *                               doesn't or `publicationID` or `ctaType` is missing, `undefined`
 *                               while the CTAs are loading.
 */
export default function useHasExistingCTAs(
	publicationID?: string,
	ctaType?: ExpressSetupCTAType
): boolean | undefined {
	const [ record, setRecord ] = useState< Record< string, boolean > >( {} );

	const ctas: CTA[] | undefined = useSelect(
		( select: Select ) =>
			publicationID && ctaType
				? select( MODULES_READER_REVENUE_MANAGER ).getCTAs( {
						publicationID,
				  } )
				: undefined,
		[ ctaType, publicationID ]
	);

	const key = `${ publicationID }:${ ctaType }`;

	useEffect( () => {
		if ( ! publicationID || ! ctaType || ctas === undefined ) {
			return;
		}

		const type = EXPRESS_SETUP_CTA_TO_CTA_TYPE[ ctaType ];
		const hasExistingCTA = ctas.some( ( cta ) => cta.type === type );

		setRecord( ( current ) =>
			key in current ? current : { ...current, [ key ]: hasExistingCTA }
		);
	}, [ ctas, ctaType, key, publicationID ] );

	if ( ! publicationID || ! ctaType ) {
		return false;
	}

	return record[ key ];
}
