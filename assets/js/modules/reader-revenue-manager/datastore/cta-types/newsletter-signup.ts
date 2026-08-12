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
import { CTA_TYPES, CallToActionBase, CallToActionTypeHandler } from './types';

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

const NEWSLETTER_CONFIG_FIELDS = [
	'title',
	'customMessage',
	'nameRequired',
	'customConsentText',
] as const;

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

	const unsupportedFields = Object.keys( newsletterConfig ).filter(
		( field ) =>
			! NEWSLETTER_CONFIG_FIELDS.includes(
				field as typeof NEWSLETTER_CONFIG_FIELDS[ number ]
			)
	);

	invariant(
		unsupportedFields.length === 0,
		'config contains unsupported fields.'
	);

	const { title, customMessage, nameRequired, customConsentText } =
		newsletterConfig;

	invariant(
		title === undefined || typeof title === 'string',
		'config.title must be a string.'
	);
	invariant(
		customMessage === undefined || typeof customMessage === 'string',
		'config.customMessage must be a string.'
	);
	invariant(
		nameRequired === undefined || typeof nameRequired === 'boolean',
		'config.nameRequired must be a boolean.'
	);
	invariant(
		customConsentText === undefined ||
			typeof customConsentText === 'string',
		'config.customConsentText must be a string.'
	);
}

export default {
	type: CTA_TYPES.NEWSLETTER_SIGNUP,
	validateConfig: validateNewsletterConfig,
} as CallToActionTypeHandler< typeof CTA_TYPES.NEWSLETTER_SIGNUP >;
