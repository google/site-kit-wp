/**
 * Status utility tests.
 *
 * Site Kit by Google, Copyright 2020 Google LLC
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
 * Internal dependencies
 */
import {
	determineAccountStatus,
	determineSiteStatus,
	determineAccountID,
	determineClientID,
	ACCOUNT_STATUS_NONE,
	ACCOUNT_STATUS_DISAPPROVED,
	ACCOUNT_STATUS_GRAYLISTED,
	ACCOUNT_STATUS_MULTIPLE,
	ACCOUNT_STATUS_NO_CLIENT,
	ACCOUNT_STATUS_PENDING,
	ACCOUNT_STATUS_APPROVED,
	SITE_STATUS_NONE,
	SITE_STATUS_ADDED,
} from './status';

const accountA = {
	creationTime: '1382025063000',
	id: 'pub-2833782679114991',
	kind: 'adsense#account',
	name: 'Test Account A',
	premium: false,
	timezone: 'Europe/Berlin',
};

const accountB = {
	creationTime: '1382025063000',
	id: 'pub-2833782711924655',
	kind: 'adsense#account',
	name: 'Test Account B',
	premium: false,
	timezone: 'Europe/Berlin',
};

const afcClientA = {
	arcOptIn: false,
	id: 'ca-pub-2833782679114991',
	kind: 'adsense#adClient',
	productCode: 'AFC',
	supportsReporting: true,
};

const afsClientA = {
	arcOptIn: false,
	id: 'ca-pub-2833782679114991',
	kind: 'adsense#adClient',
	productCode: 'AFS',
	supportsReporting: true,
};

const afcClientB = {
	arcOptIn: false,
	id: 'ca-pub-2833782711924655',
	kind: 'adsense#adClient',
	productCode: 'AFC',
	supportsReporting: true,
};

const graylistedAlert = {
	id: 'GRAYLISTED_PUBLISHER',
	isDismissible: false,
	kind: 'adsense#alert',
	message: 'Your account has been graylisted. Please fix the issues in your AdSense panel.',
	severity: 'SEVERE',
	type: 'GRAYLISTED_PUBLISHER',
};

const otherAlert = {
	id: 'ADS_TXT_ISSUES',
	isDismissible: false,
	kind: 'adsense#alert',
	message: 'Please fix the problems with the ads.txt file to avoid negative impact on revenue.',
	severity: 'SEVERE',
	type: 'ADS_TXT_ISSUES',
};

const exampleURLChannelA = {
	id: 'ca-pub-2833782679114991:example.com',
	kind: 'adsense#urlChannel',
	urlPattern: 'example.com',
};

const otherURLChannelA = {
	id: 'ca-pub-2833782679114991:other-website.org',
	kind: 'adsense#urlChannel',
	urlPattern: 'other-website.org',
};

describe( 'determineAccountStatus', () => {
	it( 'returns none for no accounts', () => {
		const params = {
			accounts: [],
			previousAccountID: '',
		};
		expect( determineAccountStatus( params ) ).toEqual( ACCOUNT_STATUS_NONE );
	} );

	it( 'returns multiple for multiple accounts without account ID provided', () => {
		const params = {
			accounts: [ accountA, accountB ],
			previousAccountID: '',
		};
		expect( determineAccountStatus( params ) ).toEqual( ACCOUNT_STATUS_MULTIPLE );
	} );

	it( 'does not return multiple for multiple accounts with account ID provided', () => {
		// There are multiple accounts here, but by passing previousAccountID
		// we indicate the user already selected it.
		const params = {
			accounts: [ accountA, accountB ],
			previousAccountID: accountB.id,
		};
		expect( determineAccountStatus( params ) ).not.toEqual( ACCOUNT_STATUS_MULTIPLE );
	} );

	it( 'returns graylisted when there is a GRAYLISTED_PUBLISHER alert', () => {
		const params = {
			accounts: [ accountA ],
			alerts: [ graylistedAlert, otherAlert ],
			clients: [],
			previousAccountID: '',
			previousClientID: '',
		};
		expect( determineAccountStatus( params ) ).toEqual( ACCOUNT_STATUS_GRAYLISTED );
	} );

	it( 'returns no-client for no clients', () => {
		const params = {
			accounts: [ accountA ],
			alerts: [ otherAlert ],
			clients: [],
			previousAccountID: '',
			previousClientID: '',
		};
		expect( determineAccountStatus( params ) ).toEqual( ACCOUNT_STATUS_NO_CLIENT );
	} );

	it( 'returns no-client for AFS clients only', () => {
		const params = {
			accounts: [ accountA ],
			alerts: [ otherAlert ],
			clients: [ afsClientA ],
			previousAccountID: '',
			previousClientID: '',
		};
		expect( determineAccountStatus( params ) ).toEqual( ACCOUNT_STATUS_NO_CLIENT );
	} );

	it( 'returns approved for single account, no alerts, and AFC client', () => {
		const params = {
			accounts: [ accountA ],
			alerts: [ otherAlert ],
			clients: [ afcClientA, afsClientA ],
			previousAccountID: '',
			previousClientID: '',
		};
		expect( determineAccountStatus( params ) ).toEqual( ACCOUNT_STATUS_APPROVED );
	} );

	it.each(
		[
			[
				ACCOUNT_STATUS_NONE,
				'noAdSenseAccount',
			],
			[
				ACCOUNT_STATUS_DISAPPROVED,
				'disapprovedAccount',
			],
			[
				ACCOUNT_STATUS_PENDING,
				'accountPendingReview',
			],
		]
	)( 'returns %s for missing key parameter and error reason %s', ( expectedStatus, errorReason ) => {
		const params = {
			accounts: undefined,
			clients: undefined,
			alerts: undefined,
			error: {
				code: '403',
				message: 'This is an AdSense API error message.',
				data: {
					status: 403,
					reason: errorReason,
				},
			},
		};
		expect( determineAccountStatus( params ) ).toEqual( expectedStatus );
	} );

	it.each(
		[
			[
				{},
			],
			[
				{
					accounts: [ accountA ],
					alerts: undefined,
					clients: undefined,
				},
			],
			[
				{
					accounts: [ accountA ],
					alerts: [],
					clients: undefined,
				},
			],
			[
				{
					accounts: [ accountA ],
					alerts: [],
					clients: [],
					previousAccountID: '',
					previousClientID: undefined,
				},
			],
		]
	)( 'returns undefined for undefined key parameters', ( params ) => {
		expect( determineAccountStatus( params ) ).toEqual( undefined );
	} );

	it( 'does not return undefined for all key parameters defined', () => {
		const params = {
			accounts: [],
			alerts: [],
			clients: [],
			previousAccountID: '',
			previousClientID: '',
		};
		expect( determineAccountStatus( params ) ).not.toEqual( undefined );
	} );
} );

describe( 'determineSiteStatus', () => {
	it( 'returns none for no URL channels', () => {
		const params = {
			urlChannels: [],
			siteURL: 'https://example.com',
		};
		expect( determineSiteStatus( params ) ).toEqual( SITE_STATUS_NONE );
	} );

	it( 'returns none for URL channels without the site URL', () => {
		const params = {
			urlChannels: [ otherURLChannelA ],
			siteURL: 'https://example.com',
		};
		expect( determineSiteStatus( params ) ).toEqual( SITE_STATUS_NONE );
	} );

	it( 'returns added for URL channels including the site URL', () => {
		const params = {
			urlChannels: [ otherURLChannelA, exampleURLChannelA ],
			siteURL: 'https://example.com',
		};
		expect( determineSiteStatus( params ) ).toEqual( SITE_STATUS_ADDED );
	} );

	it.each(
		[
			[
				{},
			],
			[
				{
					urlChannels: [],
					siteURL: undefined,
				},
			],
			[
				{
					urlChannels: undefined,
					siteURL: 'https://example.com',
				},
			],
		]
	)( 'returns undefined for undefined key parameters', ( params ) => {
		expect( determineSiteStatus( params ) ).toEqual( undefined );
	} );

	it( 'does not return undefined for all key parameters defined', () => {
		const params = {
			urlChannels: [],
			siteURL: 'https://example.com',
		};
		expect( determineSiteStatus( params ) ).not.toEqual( undefined );
	} );
} );

describe( 'determineAccountID', () => {
	it( 'returns first/only account ID', () => {
		const params = {
			accounts: [ accountA ],
		};
		expect( determineAccountID( params ) ).toEqual( accountA.id );
	} );

	it( 'returns undefined for undefined accounts', () => {
		const params = {
			accounts: undefined,
		};
		expect( determineAccountID( params ) ).toEqual( undefined );
	} );

	it( 'returns empty string for empty accounts', () => {
		const params = {
			accounts: [],
		};
		expect( determineAccountID( params ) ).toEqual( '' );
	} );

	it( 'returns empty string for multiple accounts', () => {
		const params = {
			accounts: [ accountA, accountB ],
		};
		expect( determineAccountID( params ) ).toEqual( '' );
	} );

	it( 'looks up correct account through ID parameter', () => {
		const params = {
			accounts: [ accountA, accountB ],
			previousAccountID: accountB.id,
		};
		expect( determineAccountID( params ) ).toEqual( accountB.id );
	} );

	it( 'fails for multiple accounts and ID parameter without access', () => {
		const params = {
			accounts: [ accountA, accountB ],
			previousAccountID: 'pub-1234567890',
		};
		expect( determineAccountID( params ) ).toEqual( '' );
	} );
} );

describe( 'determineClientID', () => {
	it( 'returns first/only client ID', () => {
		const params = {
			clients: [ afcClientA ],
		};
		expect( determineClientID( params ) ).toEqual( afcClientA.id );
	} );

	it( 'returns first AFC client ID', () => {
		const params = {
			clients: [ afsClientA, afcClientA ],
		};
		expect( determineClientID( params ) ).toEqual( afcClientA.id );
	} );

	it( 'returns undefined for undefined clients', () => {
		const params = {
			clients: undefined,
		};
		expect( determineClientID( params ) ).toEqual( undefined );
	} );

	it( 'returns empty string for empty clients', () => {
		const params = {
			clients: [],
		};
		expect( determineClientID( params ) ).toEqual( '' );
	} );

	it( 'returns empty string for no AFC clients', () => {
		const params = {
			clients: [ afsClientA ],
		};
		expect( determineClientID( params ) ).toEqual( '' );
	} );

	it( 'returns first client ID for multiple clients', () => {
		const params = {
			clients: [ afcClientA, afcClientB ],
		};
		expect( determineClientID( params ) ).toEqual( afcClientA.id );
	} );

	it( 'looks up correct client through ID parameter', () => {
		const params = {
			clients: [ afcClientA, afcClientB ],
			previousClientID: afcClientB.id,
		};
		expect( determineClientID( params ) ).toEqual( afcClientB.id );
	} );

	it( 'falls back to first client for multiple accounts and ID parameter without access', () => {
		const params = {
			clients: [ afcClientA, accountB ],
			previousClientID: 'ca-pub-1234567890',
		};
		expect( determineClientID( params ) ).toEqual( afcClientA.id );
	} );
} );
