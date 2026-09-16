/**
 * Reader Revenue Manager newsletter signup CTA constants.
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

export const NEWSLETTER_SIGNUP_FORM = {
	DISPLAY_NAME: 'displayName',
	CTA_TITLE: 'ctaTitle',
	CTA_BODY: 'ctaBody',
	NAME_REQUIRED: 'nameRequired',
	CONSENT_ENABLED: 'consentEnabled',
	CONSENT_TEXT: 'consentText',
} as const;

export const NEWSLETTER_SIGNUP_LIMITS = {
	DISPLAY_NAME: 40,
	CTA_TITLE: 90,
	CTA_BODY: 140,
	CONSENT_TEXT: 90,
} as const;
