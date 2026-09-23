/**
 * Reader Revenue Manager express setup types.
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
import { ComponentType } from 'react';

/**
 * Internal dependencies
 */
import { Select } from 'googlesitekit-data';

/**
 * Props passed by a setup flow to the component of its current step.
 */
export interface SetupStepProps {
	// Called once the step has been completed, to advance the flow.
	onComplete: () => void;
}

/**
 * An express setup step definition.
 *
 * Setup flows assemble these into their required order, which determines both
 * the stepper and the navigation between steps.
 */
export interface SetupStep {
	// Unique across every flow, and used as the `step` query argument value.
	slug: string;
	// The stepper label, or a function returning it for labels that depend on state.
	label: string | ( ( select: Select ) => string );
	Component: ComponentType<
		// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Each step's props extend `SetupStepProps` with its own overrides.
		SetupStepProps & Record< string, any >
	>;
	// A definition without `isComplete` is never complete, so the flow can
	// always resolve to it, and it never holds back the steps after it. This is
	// what makes the CTA and setup complete steps valid resolution targets.
	isComplete?: ( select: Select ) => boolean;
}
