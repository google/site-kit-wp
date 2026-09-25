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
 * Intent registration type.
 *
 * @since n.e.x.t
 */
export interface IntentRegistration {
	/**
	 * Component rendered for the intent, given the intent's payload.
	 *
	 * @since n.e.x.t
	 */
	Component: ComponentType< { payload: unknown } >;
}

/**
 * Intents API instance type.
 *
 * @since n.e.x.t
 */
export interface IntentsAPI {
	/**
	 * Registers an intent.
	 *
	 * @since n.e.x.t
	 *
	 * @param {string}             slug     Intent's slug.
	 * @param {IntentRegistration} settings Intent's settings.
	 * @return {void}
	 */
	registerIntent( slug: string, settings: IntentRegistration ): void;

	/**
	 * Gets the registration for an intent.
	 *
	 * @since n.e.x.t
	 *
	 * @param {string} slug Intent's slug.
	 * @return {IntentRegistration|undefined} The registration, or `undefined` when the slug is not registered.
	 */
	getRegisteredIntent( slug: string ): IntentRegistration | undefined;
}

/**
 * Creates the intents registry.
 *
 * @since n.e.x.t
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
