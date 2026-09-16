/**
 * Enhanced Conversions forms page object.
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
import { type Page } from '@playwright/test';

type FormField = {
	label: string;
	value: string;
};

export type GTagEventPayload = Record< string, unknown >;

/**
 * Page object for completing and submitting frontend forms by their accessible
 * field labels. The model intentionally contains no plugin-specific selectors.
 */
export class FormsPage {
	private readonly page: Page;

	/**
	 * Constructor.
	 *
	 * @since 1.186.0
	 *
	 * @param page The page.
	 */
	constructor( page: Page ) {
		this.page = page;
	}

	/**
	 * Fills a form field with its raw sample value.
	 *
	 * @since 1.186.0
	 *
	 * @param field The sample field data.
	 * @return A promise that resolves when the field is filled.
	 */
	private async fillField( field: FormField ): Promise< void > {
		await this.page.getByLabel( field.label ).fill( field.value );
	}

	/**
	 * Fills the supplied fields and submits the form.
	 *
	 * @since 1.186.0
	 *
	 * @param fields The fields to fill before submitting.
	 * @return A promise that resolves when the submission request succeeds.
	 */
	async fillAndSubmit( fields: FormField[] ): Promise< void > {
		for ( const field of fields ) {
			await this.fillField( field );
		}

		const submissionResponse = this.page.waitForResponse(
			( response ) =>
				response.request().method() === 'POST' && response.ok()
		);

		await this.page
			.getByRole( 'button', { name: 'Submit', exact: true } )
			.click();
		await submissionResponse;
	}

	/**
	 * Returns the payload for a named gtag event in the data layer.
	 *
	 * @since 1.186.0
	 *
	 * @param eventName The gtag event name.
	 * @return The event payload, or null when the event has not fired.
	 */
	async getGTagEvent(
		eventName: string
	): Promise< GTagEventPayload | null > {
		return await this.page.evaluate( ( name ) => {
			const dataLayer =
				( window as Window & { dataLayer?: unknown[] } ).dataLayer ||
				[];

			for ( const entry of dataLayer ) {
				const record = entry as Record< number, unknown >;

				if ( record[ 0 ] !== 'event' || record[ 1 ] !== name ) {
					continue;
				}

				const payload = record[ 2 ];

				return payload && typeof payload === 'object'
					? ( payload as GTagEventPayload )
					: null;
			}

			return null;
		}, eventName );
	}
}
