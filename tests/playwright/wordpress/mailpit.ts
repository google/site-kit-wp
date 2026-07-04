/**
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
 * Summary fields for a Mailpit message.
 *
 * @since 1.175.0
 */
export type MailpitMessage = {
	ID: string;
	From: { Name: string; Address: string };
	To: { Name: string; Address: string }[];
	Subject: string;
	Created: string;
};

/**
 * Full message detail including body content.
 *
 * @since 1.175.0
 */
export type MailpitMessageDetail = MailpitMessage & {
	Text: string;
	HTML: string;
	Attachments: { FileName: string; ContentType: string; Size: number }[];
};

/**
 * Options for waiting for a message.
 *
 * @since 1.175.0
 */
type WaitForMessageOptions = {
	query?: string;
	timeout?: number;
	interval?: number;
};

/**
 * Client for the Mailpit API, scoped to a per-test from address.
 *
 * @since 1.175.0
 */
export class Mailpit {
	/**
	 * The base URL of the Mailpit API.
	 *
	 * @since 1.175.0
	 */
	private readonly baseURL: string;

	/**
	 * The from address used to scope messages to the current test.
	 *
	 * @since 1.175.0
	 */
	private readonly fromAddress: string;

	/**
	 * Whether the Mailpit instance has interacted with the API.
	 *
	 * @since 1.175.0
	 */
	private interacted: boolean = false;

	/**
	 * Creates a new Mailpit instance.
	 *
	 * @since 1.175.0
	 *
	 * @param baseURL     The base URL of the Mailpit HTTP API.
	 * @param fromAddress The from address for scoping messages to the current test.
	 */
	constructor( baseURL: string, fromAddress: string ) {
		this.baseURL = baseURL;
		this.fromAddress = fromAddress;
	}

	/**
	 * Gets messages matching the given query, scoped to the current test.
	 *
	 * @since 1.175.0
	 *
	 * @param  query Optional additional search query.
	 * @return {Promise<MailpitMessage[]>} A promise that resolves with matching messages.
	 */
	async getMessages( query?: string ): Promise< MailpitMessage[] > {
		this.interacted = true;

		const searchQuery = query
			? `from:${ this.fromAddress } ${ query }`
			: `from:${ this.fromAddress }`;

		const url = `${
			this.baseURL
		}/api/v1/search?query=${ encodeURIComponent( searchQuery ) }`;

		const response = await fetch( url );
		const data = await response.json();

		return data.messages ?? [];
	}

	/**
	 * Gets full message detail by ID.
	 *
	 * @since 1.175.0
	 *
	 * @param  id The message ID.
	 * @return {Promise<MailpitMessageDetail>} A promise that resolves with the message detail.
	 */
	async getMessage( id: string ): Promise< MailpitMessageDetail > {
		this.interacted = true;

		const url = `${ this.baseURL }/api/v1/message/${ id }`;
		const response = await fetch( url );
		return response.json();
	}

	/**
	 * Deletes all messages scoped to the current test.
	 *
	 * @since 1.175.0
	 *
	 * @return {Promise<void>} A promise that resolves when messages are deleted.
	 */
	async deleteMessages(): Promise< void > {
		this.interacted = true;

		const messages = await this.getMessages();
		if ( messages.length === 0 ) {
			return;
		}

		const ids = messages.map( ( m ) => m.ID );

		await fetch( `${ this.baseURL }/api/v1/messages`, {
			method: 'DELETE',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify( { IDs: ids } ),
		} );
	}

	/**
	 * Polls for a message matching the given query until one is found or the timeout expires.
	 *
	 * @since 1.175.0
	 *
	 * @param  options Options for waiting.
	 * @return {Promise<MailpitMessage>} A promise that resolves with the first matching message.
	 */
	async waitForMessage(
		options?: WaitForMessageOptions
	): Promise< MailpitMessage > {
		this.interacted = true;

		const { query, timeout = 2_500, interval = 250 } = options ?? {};
		const deadline = Date.now() + timeout; // eslint-disable-line sitekit/no-direct-date

		// eslint-disable-next-line sitekit/no-direct-date
		while ( Date.now() < deadline ) {
			const messages = await this.getMessages( query );
			if ( messages.length > 0 ) {
				return messages[ 0 ];
			}

			await new Promise( ( resolve ) => setTimeout( resolve, interval ) );
		}

		let err = 'Timed out waiting for message';
		if ( query ) {
			err += ` matching "${ query }"`;
		}
		err += ` after ${ timeout }ms`;

		throw new Error( err );
	}

	/**
	 * Checks whether any messages match the given query.
	 *
	 * @since 1.175.0
	 *
	 * @param  query Optional additional search query.
	 * @return {Promise<boolean>} A promise that resolves with whether any messages match.
	 */
	async hasMessage( query?: string ): Promise< boolean > {
		this.interacted = true;

		const messages = await this.getMessages( query );
		return messages.length > 0;
	}

	/**
	 * Checks whether the Mailpit instance has interacted with the API.
	 *
	 * @since 1.175.0
	 *
	 * @return {boolean} Whether the Mailpit instance has interacted with the API.
	 */
	hasInteracted(): boolean {
		return this.interacted;
	}
}
