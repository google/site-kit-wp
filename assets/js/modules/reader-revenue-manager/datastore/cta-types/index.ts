/**
 * Reader Revenue Manager CTA type handler registry.
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
import invariant from 'invariant';

/**
 * Internal dependencies
 */
import newsletterSignupCTATypeHandler, {
	type NewsletterConfig,
	type NewsletterSignupCTA,
} from './newsletter-signup';
import {
	CTA_TYPES,
	type CallToActionType,
	type CallToActionTypeHandler,
} from './types';

export {
	CTA_TYPES,
	type CallToActionType,
	type CallToActionTypeHandler,
} from './types';

export {
	type NewsletterConfig,
	type NewsletterSignupCTA,
} from './newsletter-signup';

interface CallToActionConfigByType {
	[ CTA_TYPES.NEWSLETTER_SIGNUP ]: NewsletterConfig;
}

interface CallToActionByType {
	[ CTA_TYPES.NEWSLETTER_SIGNUP ]: NewsletterSignupCTA;
}

export type CallToActionConfig<
	Type extends CallToActionType = CallToActionType
> = CallToActionConfigByType[ Type ];

export type CreateCTAData = {
	[ Type in CallToActionType ]: {
		type: Type;
		config: CallToActionConfig< Type >;
		displayName?: string;
	};
}[ CallToActionType ];

export type CTA = CallToActionByType[ CallToActionType ];

const CTA_TYPE_HANDLERS: Record< CallToActionType, CallToActionTypeHandler > = {
	[ CTA_TYPES.NEWSLETTER_SIGNUP ]: newsletterSignupCTATypeHandler,
	// Register additional CTA type handlers here as they are added.
};

/**
 * Checks whether a value is a supported CTA type.
 *
 * @since 1.187.0
 *
 * @param  type Value to check.
 * @return {boolean} Whether the value is a supported CTA type.
 */
export function isCTAType( type: unknown ): type is CallToActionType {
	return (
		typeof type === 'string' &&
		Object.values( CTA_TYPES ).includes( type as CallToActionType )
	);
}

/**
 * Gets the handler registered for a CTA type.
 *
 * @since 1.187.0
 *
 * @param  type CTA type.
 * @return {CallToActionTypeHandler} CTA type handler.
 */
export function getCTATypeHandler( type: unknown ): CallToActionTypeHandler {
	invariant( isCTAType( type ), 'type is not supported.' );

	return CTA_TYPE_HANDLERS[ type ];
}
