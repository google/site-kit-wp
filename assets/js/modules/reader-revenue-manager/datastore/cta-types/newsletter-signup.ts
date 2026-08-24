/**
 * Newsletter sign-up CTA type handler.
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
import { isPlainObject } from 'lodash';

/**
 * Internal dependencies
 */
import {
	CTA_TYPES,
	type CallToActionBase,
	type CallToActionTypeHandler,
} from './types';

export interface NewsletterConfig {
	title?: string;
	customMessage?: string;
	nameRequired?: boolean;
	customConsentText?: string;
}

export interface NewsletterSignupCTA extends CallToActionBase {
	type: typeof CTA_TYPES.NEWSLETTER_SIGNUP;
	newsletterConfig?: NewsletterConfig;
}

const STRING_FIELDS = [
	'title',
	'customMessage',
	'customConsentText',
] as const;

const BOOLEAN_FIELDS = [ 'nameRequired' ] as const;

const SUPPORTED_FIELDS: string[] = [ ...STRING_FIELDS, ...BOOLEAN_FIELDS ];

/**
 * Validates newsletter sign-up CTA configuration.
 *
 * @since n.e.x.t
 *
 * @param  config CTA configuration.
 * @return {void}
 */
function validateNewsletterConfig( config: unknown ): void {
	invariant(
		isPlainObject( config ),
		'config is required and must be an object.'
	);

	const newsletterConfig = config as Record< string, unknown >;

	invariant(
		Object.keys( newsletterConfig ).length > 0,
		'config is required and must be an object.'
	);

	invariant(
		Object.keys( newsletterConfig ).every( ( field ) =>
			SUPPORTED_FIELDS.includes( field )
		),
		'config contains unsupported fields.'
	);

	STRING_FIELDS.forEach( ( field ) => {
		invariant(
			newsletterConfig[ field ] === undefined ||
				typeof newsletterConfig[ field ] === 'string',
			`config.${ field } must be a string.`
		);
	} );

	BOOLEAN_FIELDS.forEach( ( field ) => {
		invariant(
			newsletterConfig[ field ] === undefined ||
				typeof newsletterConfig[ field ] === 'boolean',
			`config.${ field } must be a boolean.`
		);
	} );
}

export default {
	type: CTA_TYPES.NEWSLETTER_SIGNUP,
	validateConfig: validateNewsletterConfig,
} as CallToActionTypeHandler< typeof CTA_TYPES.NEWSLETTER_SIGNUP >;
