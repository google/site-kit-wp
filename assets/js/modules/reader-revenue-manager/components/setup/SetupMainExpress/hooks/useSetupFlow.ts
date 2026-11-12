/**
 * Reader Revenue Manager express setup `useSetupFlow` hook.
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
import { useCallback, useEffect, useState } from 'react';

/**
 * Internal dependencies
 */
import { Registry, Select, useRegistry, useSelect } from 'googlesitekit-data';
import { existingCTAStep } from '@/js/modules/reader-revenue-manager/components/setup/SetupMainExpress/common-steps/StepExistingCTA';
import { SetupStep } from '@/js/modules/reader-revenue-manager/components/setup/SetupMainExpress/types';
import {
	EXPRESS_SETUP_CTAS,
	MODULES_READER_REVENUE_MANAGER,
} from '@/js/modules/reader-revenue-manager/datastore/constants';
import { Publication } from '@/js/modules/reader-revenue-manager/datastore/publications';
import useHasExistingCTAs from './useHasExistingCTAs';
import useStep from './useStep';

/**
 * Finds the first step at or after the given index that is not yet complete.
 *
 * A step without completion criteria is never complete, so it is always a
 * valid target.
 *
 * @since 1.190.0
 *
 * @param {Array.<Object>} steps       Ordered step definitions.
 * @param {Function}       select      Registry select function.
 * @param {number}         [fromIndex] Optional. Index to start from. Default 0.
 * @return {(Object|undefined)} The step definition, or `undefined` if every step from the index is complete.
 */
export function resolveStep(
	steps: SetupStep[],
	select: Select,
	fromIndex = 0
): SetupStep | undefined {
	return steps
		.slice( fromIndex )
		.find( ( step ) => ! step.isComplete?.( select ) );
}

/**
 * Finds the first step that declares completion criteria which are unmet.
 *
 * Steps without completion criteria are ignored, so they never hold the flow
 * back.
 *
 * @since 1.190.0
 *
 * @param {Array.<Object>} steps  Ordered step definitions.
 * @param {Function}       select Registry select function.
 * @return {(Object|undefined)} The step definition, or `undefined` if nothing is holding the flow back.
 */
export function findBlockingStep(
	steps: SetupStep[],
	select: Select
): SetupStep | undefined {
	return steps.find(
		( step ) => !! step.isComplete && ! step.isComplete( select )
	);
}

/**
 * Navigates between the steps of an express setup flow.
 *
 * On entry, the flow opens its first step that is not yet complete. A
 * requested step is honoured, even when it is already complete, unless a step
 * earlier in the flow has unmet completion criteria, in which case the flow
 * redirects back to it.
 *
 * The current step stays `undefined` until the initial step resolves.
 *
 * When a `ctaType` is given, the flow also checks, once per publication,
 * whether the publication already has a CTA of that type. If it does, the
 * flow opens the existing CTA step in place of any step between the first and
 * the last, as only one CTA of each type can be created.
 *
 * @since 1.190.0
 * @since 1.191.0 Returns no current step until the initial step resolves.
 * @since 1.192.0 Added the `ctaType` parameter and the existing CTA step.
 *
 * @param {Array.<Object>} steps     Ordered step definitions. Must be referentially stable.
 * @param {string}         [ctaType] Optional. The express setup CTA type, one of `EXPRESS_SETUP_CTAS`.
 * @return {Object} The current step definition, and a callback that advances to the next step that is not yet complete.
 */
export default function useSetupFlow(
	steps: SetupStep[],
	ctaType?: typeof EXPRESS_SETUP_CTAS[ keyof typeof EXPRESS_SETUP_CTAS ]
): {
	currentStep: SetupStep | undefined;
	advance: () => void;
} {
	// `@wordpress/data` types `useRegistry()` as returning `Function`.
	const registry = useRegistry() as unknown as Registry;
	const [ slug, setStep ] = useStep();

	// Never reset, so refetching the publication doesn't hide the step again.
	const [ hasResolvedStep, setHasResolvedStep ] = useState( false );

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

	const resolvedSlug: string | undefined = useSelect(
		( select: Select ) => resolveStep( steps, select )?.slug,
		[ steps ]
	);

	const blockingSlug: string | undefined = useSelect(
		( select: Select ) => findBlockingStep( steps, select )?.slug,
		[ steps ]
	);

	const currentIndex = steps.findIndex( ( step ) => step.slug === slug );

	// Only a CTA flow has an existing CTA step to show. Other flows don't
	// provide its copy, so the step is treated as unrecognised there.
	const isExistingCTAsStep = !! ctaType && slug === existingCTAStep.slug;

	// The publication setup step runs before a publication is connected and
	// the setup complete step follows the CTA being created, so neither is
	// checked.
	const checkExistingCTAs = ! (
		currentIndex === 0 ||
		currentIndex === steps.length - 1 ||
		isExistingCTAsStep
	);

	// The CTAs are only requested where they are checked. On the publication
	// setup step the publication ID is set before its settings are saved, so
	// requesting them then fails for the missing organization ID.
	const hasExistingCTAs = useHasExistingCTAs(
		checkExistingCTAs ? publicationID : undefined,
		ctaType
	);

	useEffect( () => {
		if ( isExistingCTAsStep ) {
			return;
		}

		// Bail while the settings are still resolving, and while a connected
		// publication is still being looked up or cannot be found. An empty
		// publication ID is a resolved "nothing connected" and falls through.
		if ( publicationID === undefined ) {
			return;
		}

		if ( publicationID && publication === undefined ) {
			return;
		}

		// Wait for the existing CTA check, then show the existing CTA step in
		// place of any step that would create a second CTA.
		if ( checkExistingCTAs ) {
			if ( hasExistingCTAs === undefined ) {
				return;
			}

			if ( hasExistingCTAs ) {
				setStep( existingCTAStep.slug );

				return;
			}
		}

		// Entering the flow, or on a step that is not part of it, such as a
		// stale bookmark: open the first step that is not yet complete.
		if ( currentIndex === -1 ) {
			if ( resolvedSlug ) {
				setStep( resolvedSlug );
			}

			return;
		}

		// Resuming the flow: only redirect back to an earlier step whose
		// completion criteria are unmet, so a publisher is never pulled out
		// of a step they have reached legitimately.
		const blockingIndex = steps.findIndex(
			( step ) => step.slug === blockingSlug
		);

		if ( blockingSlug && blockingIndex < currentIndex ) {
			setStep( blockingSlug );

			return;
		}

		setHasResolvedStep( true );
	}, [
		blockingSlug,
		checkExistingCTAs,
		currentIndex,
		hasExistingCTAs,
		isExistingCTAsStep,
		publication,
		publicationID,
		resolvedSlug,
		setStep,
		steps,
	] );

	// Reads the registry when called rather than a value captured at render,
	// as steps call `onComplete` straight after saving their changes.
	const advance = useCallback( () => {
		if ( isExistingCTAsStep ) {
			return;
		}

		const nextStep = resolveStep(
			steps,
			registry.select as Select,
			currentIndex + 1
		);

		if ( nextStep ) {
			// A stored error clears only when the same request runs again, so drop
			// any errors the completed step left, or the next step shows them.
			const { clearActionErrors, clearSelectorErrors } =
				registry.dispatch( MODULES_READER_REVENUE_MANAGER );

			clearActionErrors();
			clearSelectorErrors();

			setStep( nextStep.slug );
		}
	}, [ currentIndex, isExistingCTAsStep, registry, setStep, steps ] );

	let currentStep: SetupStep | undefined;

	// A step that opens with an existing CTA already found shows the existing
	// CTA step straight away, before the effect sets it as the current step.
	if (
		isExistingCTAsStep ||
		( checkExistingCTAs && hasExistingCTAs && publication !== undefined )
	) {
		currentStep = existingCTAStep;
	} else if ( checkExistingCTAs && hasExistingCTAs === undefined ) {
		currentStep = undefined;
	} else if ( hasResolvedStep ) {
		currentStep = steps[ currentIndex ];
	}

	return { currentStep, advance };
}
