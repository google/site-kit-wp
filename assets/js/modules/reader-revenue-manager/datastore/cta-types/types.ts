/**
 * Reader Revenue Manager CTA type definitions.
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

export const CTA_TYPES = {
	NEWSLETTER_SIGNUP: 'NEWSLETTER_SIGNUP',
} as const;

export type CallToActionType = typeof CTA_TYPES[ keyof typeof CTA_TYPES ];

export interface CallToActionBase {
	name?: string;
	displayName?: string;
	state?: string;
	type: CallToActionType;
}

export interface CallToActionTypeHandler<
	Type extends CallToActionType = CallToActionType
> {
	type: Type;
	validateConfig: ( config: unknown ) => void;
}
