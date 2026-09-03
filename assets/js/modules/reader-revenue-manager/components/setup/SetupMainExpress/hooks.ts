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
import { useCallback, useEffect } from 'react';

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
import {
	EXPRESS_SETUP_CTAS,
	EXPRESS_SETUP_STEPS,
	MODULES_READER_REVENUE_MANAGER,
} from '@/js/modules/reader-revenue-manager/datastore/constants';
import { type Publication } from '@/js/modules/reader-revenue-manager/datastore/publications';

type Step = typeof EXPRESS_SETUP_STEPS[ keyof typeof EXPRESS_SETUP_STEPS ];

// The steps whose completion is derived from the connected publication, in the
// order they must be completed. `SETUP_CTA` is deliberately absent: the express
// setup allows setting up multiple CTAs of the same type, so it never counts as
// complete and can only ever be resolved to as a fallback.
const PREREQUISITE_STEPS: Step[] = [
	EXPRESS_SETUP_STEPS.CONNECT_PUBLICATION,
	EXPRESS_SETUP_STEPS.TERMS_OF_SERVICE,
	EXPRESS_SETUP_STEPS.PUBLICATION_POLICIES,
];

/**
 * Returns the current express setup step and a setter.
 *
 * Setting the query arg alone is not enough to trigger a re-render so this
 * hook provides a utility for using the UI datastore to manage the current
 * step while syncing it with the query arg.
 *
 * On mount, the step is resolved against the connected publication so that the
 * flow starts at, and cannot be advanced past, the first incomplete step. The
 * resolution lives here rather than in a separate hook so that it applies
 * wherever the current step is read, and is idempotent so that calling this
 * hook from more than one component is harmless.
 *
 * @since n.e.x.t
 *
 * @return {Array} Value and setter tuple.
 */
export function useStep(): [ Step | undefined, ( newValue: Step ) => void ] {
	const { setValue } = useDispatch( CORE_UI );
	const [ queryArg, setQueryArg ] = useQueryArg< Step >( 'step' );
	const [ cta ] = useQueryArg< string >( 'cta' );

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

	const publicationID: string | undefined = useSelect(
		( select: Select ) =>
			select( MODULES_READER_REVENUE_MANAGER ).getPublicationID(),
		[]
	);

	const publication: Publication | undefined = useSelect(
		( select: Select ) =>
			publicationID
				? select( MODULES_READER_REVENUE_MANAGER ).getPublication()
				: undefined,
		[ publicationID ]
	);

	useEffect( () => {
		// Bail while the settings are still resolving, and while a connected
		// publication is still being looked up or cannot be found. An empty
		// publication ID is a resolved "nothing connected" and falls through.
		if ( publicationID === undefined ) {
			return;
		}

		if ( publicationID && publication === undefined ) {
			return;
		}

		const isComplete: Record< Step, boolean > = {
			[ EXPRESS_SETUP_STEPS.CONNECT_PUBLICATION ]: !! publicationID,
			[ EXPRESS_SETUP_STEPS.TERMS_OF_SERVICE ]:
				!! publication?.rrmProduct?.tosAcceptance?.userAccepted,
			[ EXPRESS_SETUP_STEPS.PUBLICATION_POLICIES ]:
				/* eslint-disable-next-line sitekit/acronym-case -- `Url` is the identifier used by the API. */
				!! publication?.publicationTosUrl &&
				/* eslint-disable-next-line sitekit/acronym-case -- `Url` is the identifier used by the API. */
				!! publication?.publicationPrivacyPolicyUrl,
			// Not tracked here: `SETUP_CTA` never counts as complete (see the
			// comment on `PREREQUISITE_STEPS`), and `SETUP_COMPLETE` is the end
			// of the flow, not a step with its own completion state.
			[ EXPRESS_SETUP_STEPS.SETUP_CTA ]: false,
			[ EXPRESS_SETUP_STEPS.SETUP_COMPLETE ]: false,
		};

		const firstIncompleteStep = PREREQUISITE_STEPS.find(
			( prerequisiteStep ) => ! isComplete[ prerequisiteStep ]
		);

		// Entering the flow: start at the first incomplete step, falling back
		// to the CTA setup when a recognised one was requested, otherwise to
		// the end.
		if ( ! step ) {
			const isValidCTA = (
				Object.values( EXPRESS_SETUP_CTAS ) as string[]
			 ).includes( cta ?? '' );

			setStep(
				firstIncompleteStep ??
					( isValidCTA
						? EXPRESS_SETUP_STEPS.SETUP_CTA
						: EXPRESS_SETUP_STEPS.SETUP_COMPLETE )
			);

			return;
		}

		// Resuming the flow: only redirect back to an earlier step that is
		// genuinely incomplete, so a resolved fallback never pulls the user
		// backwards out of a step they have reached legitimately.
		if ( ! firstIncompleteStep ) {
			return;
		}

		// Any step that is not a prerequisite sits after all of them, so an
		// incomplete prerequisite always wins. This also covers step values
		// that are not part of the flow at all, such as a stale bookmark or a
		// custom step supplied through `extraSteps`.
		if (
			! PREREQUISITE_STEPS.includes( step ) ||
			PREREQUISITE_STEPS.indexOf( firstIncompleteStep ) <
				PREREQUISITE_STEPS.indexOf( step )
		) {
			setStep( firstIncompleteStep );
		}
	}, [ cta, publication, publicationID, setStep, step ] );

	return [ step, setStep ];
}
