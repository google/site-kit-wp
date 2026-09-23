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
import { useCallback, useEffect } from 'react';

/**
 * Internal dependencies
 */
import {
	type Registry,
	Select,
	useRegistry,
	useSelect,
} from 'googlesitekit-data';
import { type SetupStep } from '@/js/modules/reader-revenue-manager/components/setup/SetupMainExpress/types';
import { MODULES_READER_REVENUE_MANAGER } from '@/js/modules/reader-revenue-manager/datastore/constants';
import { type Publication } from '@/js/modules/reader-revenue-manager/datastore/publications';
import useStep from './useStep';

/**
 * Finds the first step at or after the given index that is not yet complete.
 *
 * A step without completion criteria is never complete, so it is always a
 * valid target.
 *
 * @since n.e.x.t
 *
 * @param {Array}    steps       Ordered step definitions.
 * @param {Function} select      Registry select function.
 * @param {number}   [fromIndex] Optional. Index to start from. Default 0.
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
 * @since n.e.x.t
 *
 * @param {Array}    steps  Ordered step definitions.
 * @param {Function} select Registry select function.
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
 * @since n.e.x.t
 *
 * @param {Array} steps Ordered step definitions. Must be referentially stable.
 * @return {Object} The current step definition, and a callback that advances to the next step that is not yet complete.
 */
export default function useSetupFlow( steps: SetupStep[] ): {
	currentStep: SetupStep | undefined;
	advance: () => void;
} {
	// `@wordpress/data` types `useRegistry()` as returning `Function`.
	const registry = useRegistry() as unknown as Registry;
	const [ slug, setStep ] = useStep();

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
		}
	}, [
		blockingSlug,
		currentIndex,
		publication,
		publicationID,
		resolvedSlug,
		setStep,
		steps,
	] );

	// Reads the registry when called rather than a value captured at render,
	// as steps call `onComplete` straight after saving their changes.
	const advance = useCallback( () => {
		const nextStep = resolveStep(
			steps,
			registry.select as Select,
			currentIndex + 1
		);

		if ( nextStep ) {
			setStep( nextStep.slug );
		}
	}, [ currentIndex, registry, setStep, steps ] );

	return {
		currentStep: steps[ currentIndex ],
		advance,
	};
}
