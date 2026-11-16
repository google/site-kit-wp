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
import { EXPRESS_SETUP_CTA_TO_CTA_TYPE } from '@/js/modules/reader-revenue-manager/components/setup/SetupMainExpress/constants';
import {
	EXPRESS_SETUP_CTAS,
	MODULES_READER_REVENUE_MANAGER,
} from '@/js/modules/reader-revenue-manager/datastore/constants';
import { CTA } from '@/js/modules/reader-revenue-manager/datastore/cta-types';

type ExpressSetupCTAType =
	typeof EXPRESS_SETUP_CTAS[ keyof typeof EXPRESS_SETUP_CTAS ];

/**
 * Determines whether a publication already has a CTA of the type an express
 * setup creates, in any state.
 *
 * The result is available as soon as the CTAs are loaded, and is then recorded
 * once per publication and CTA type, as creating a CTA in the setup reloads the
 * CTAs, which would otherwise make the publication look as if it had an
 * existing CTA that the setup itself just created.
 *
 * @since 1.192.0
 *
 * @param {string} publicationID The publication ID.
 * @param {string} ctaType       The express setup CTA type, one of `EXPRESS_SETUP_CTAS`.
 * @return {(boolean|undefined)} `true` when the publication has a CTA of the type, `false` when it
 *                               doesn't, or when `publicationID` is missing or `ctaType` can't be
 *                               checked, `undefined` until the CTAs load or if they fail to load.
 */
export default function useHasExistingCTAs(
	publicationID?: string,
	ctaType?: ExpressSetupCTAType
): boolean | undefined {
	const [ record, setRecord ] = useState< Record< string, boolean > >( {} );

	const type = ctaType ? EXPRESS_SETUP_CTA_TO_CTA_TYPE[ ctaType ] : undefined;

	const ctas: CTA[] | undefined = useSelect(
		( select: Select ) =>
			publicationID && type
				? select( MODULES_READER_REVENUE_MANAGER ).getCTAs( {
						publicationID,
				  } )
				: undefined,
		[ publicationID, type ]
	);

	const key = `${ publicationID }:${ ctaType }`;

	const hasExistingCTA = ctas?.some( ( cta ) => cta.type === type );

	useEffect( () => {
		if ( ! publicationID || ! type || hasExistingCTA === undefined ) {
			return;
		}

		setRecord( ( current ) =>
			key in current ? current : { ...current, [ key ]: hasExistingCTA }
		);
	}, [ hasExistingCTA, key, publicationID, type ] );

	if ( ! publicationID || ! type ) {
		return false;
	}

	// Until the effect records the result, return it for the CTAs as loaded, so
	// a step that opens with the CTAs already loaded shows straight away.
	return key in record ? record[ key ] : hasExistingCTA;
}
