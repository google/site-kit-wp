/**
 * Intents API.
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
import { Intent } from '@/js/googlesitekit/datastore/intents/intents';

/**
 * Props passed to the component registered for an intent.
 *
 * @since 1.189.0
 */
export interface IntentComponentProps {
	/** Slug the intent is registered under, e.g. `ads-conversion-tracking`. */
	slug: string;
	/** Code the Site Kit Service created for the intent. */
	intentCode: string;
	/** Payload the Site Kit Service returns for the intent, with different fields for each type of intent. */
	payload: Intent[ 'payload' ];
}

/**
 * Intent registration type.
 *
 * @since 1.189.0
 */
export interface IntentRegistration {
	/**
	 * Component rendered after the Site Kit Service returns the intent.
	 *
	 * @since 1.189.0
	 */
	Component: ComponentType< IntentComponentProps >;
}

/**
 * Intents API instance type.
 *
 * @since 1.189.0
 */
export interface IntentsAPI {
	/**
	 * Registers an intent.
	 *
	 * @since 1.189.0
	 *
	 * @param {string}             slug     Intent's slug.
	 * @param {IntentRegistration} settings Intent's settings.
	 * @return {void}
	 */
	registerIntent( slug: string, settings: IntentRegistration ): void;

	/**
	 * Gets the registration for an intent.
	 *
	 * @since 1.189.0
	 *
	 * @param {string} slug Intent's slug.
	 * @return {IntentRegistration|undefined} The registration, or `undefined` when the slug is not registered.
	 */
	getRegisteredIntent( slug: string ): IntentRegistration | undefined;
}

/**
 * Creates the intents registry.
 *
 * @since 1.189.0
 *
 * @return {IntentsAPI} Intents registry.
 */
export function createIntents(): IntentsAPI {
	const registeredIntents: Record< string, IntentRegistration > =
		Object.create( null );

	const Intents = {
		registerIntent( slug: string, settings: IntentRegistration ): void {
			if ( registeredIntents[ slug ] !== undefined ) {
				global.console.warn(
					`Could not register intent with slug "${ slug }". Intent "${ slug }" is already registered.`
				);

				return;
			}

			registeredIntents[ slug ] = settings;
		},

		getRegisteredIntent( slug: string ): IntentRegistration | undefined {
			return registeredIntents[ slug ];
		},
	};

	return Intents;
}
