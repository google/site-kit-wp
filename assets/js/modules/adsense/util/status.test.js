/**
 * Status utility tests.
 *
 * Site Kit by Google, Copyright 2021 Google LLC
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
	name: 'accounts/pub-2833782679114991',
	displayName: 'Test Account A',
	timeZone: {
		id: 'Europe/Berlin',
	},
	createTime: '2013-10-17T15:51:03.000Z',
	_id: 'pub-2833782679114991',
};

const accountB = {
	name: 'accounts/pub-2833782711924655',
	displayName: 'Test Account B',
	timeZone: {
		id: 'Europe/Berlin',
	},
	createTime: '2013-10-17T15:51:03.000Z',
	_id: 'pub-2833782711924655',
};

const afcClientA = {
	name: 'accounts/pub-2833782679114991/adclients/ca-pub-2833782679114991',
	reportingDimensionId: 'ca-pub-2833782679114991', // eslint-disable-line sitekit/acronym-case
	productCode: 'AFC',
	_id: 'ca-pub-2833782679114991',
	_accountID: 'pub-2833782679114991',
};

const afsClientA = {
	name: 'accounts/pub-2833782679114991/adclients/ca-pub-2833782679114991',
	reportingDimensionId: 'ca-pub-2833782679114991', // eslint-disable-line sitekit/acronym-case
	productCode: 'AFS',
	_id: 'ca-pub-2833782679114991',
	_accountID: 'pub-2833782679114991',
};

const afcClientB = {
	name: 'accounts/pub-2833782711924655/adclients/ca-pub-2833782711924655',
	reportingDimensionId: 'ca-pub-2833782711924655', // eslint-disable-line sitekit/acronym-case
	productCode: 'AFC',
	_id: 'ca-pub-2833782711924655',
	_accountID: 'pub-2833782711924655',
};

const graylistedAlert = {
	name: 'accounts/pub-2833782679114991/alerts/ef158442-c283-3866-a3af-5f9cf7e190f3',
	severity: 'SEVERE',
	message:
		'Your account has been graylisted. Please fix the issues in your AdSense panel.',
	type: 'graylisted-publisher',
};

const otherAlert = {
	name: 'accounts/pub-2833782679114991/alerts/e38f3957-be27-31cc-8d33-ba4b1f6e84c2',
	severity: 'SEVERE',
	message:
		'Please fix the problems with the ads.txt file to avoid negative impact on revenue.',
	type: 'ads-txt-issues',
};

const exampleURLChannelA = {
	name: 'accounts/pub-2833782679114991/adclients/ca-pub-2833782679114991/urlchannels/example.com',
	reportingDimensionId: 'ca-pub-2833782679114991:example.com', // eslint-disable-line sitekit/acronym-case
	uriPattern: 'example.com',
};

const otherURLChannelA = {
	name: 'accounts/pub-2833782679114991/adclients/ca-pub-2833782679114991/urlchannels/other-website.org',
	reportingDimensionId: 'ca-pub-2833782679114991:other-website.org', // eslint-disable-line sitekit/acronym-case
	uriPattern: 'other-website.org',
};

const otherURLChannelB = {
	name: 'accounts/pub-2833782679114991/adclients/ca-pub-2833782679114991/urlchannels/Camel-Case-weBSite.org',
	reportingDimensionId: 'ca-pub-2833782679114991:Camel-Case-weBSite.org', // eslint-disable-line sitekit/acronym-case
	uriPattern: 'Camel-Case-weBSite.org',
};

describe( 'determineAccountStatus', () => {
	test.each( [
		[
			'none for noAdSenseAccount error',
			ACCOUNT_STATUS_NONE,
			{
				accounts: undefined,
				previousAccountID: '',
				accountsError: {
					code: '403',
					message: 'This is an AdSense API error message.',
					data: {
						status: 403,
						reason: 'noAdSenseAccount',
					},
				},
			},
		],
		[
			'none for no accounts',
			ACCOUNT_STATUS_NONE,
			{
				accounts: [],
				previousAccountID: '',
			},
		],
		[
			'disapproved for disapprovedAccount error',
			ACCOUNT_STATUS_DISAPPROVED,
			{
				accounts: undefined,
				previousAccountID: '',
				accountsError: {
					code: '403',
					message: 'This is an AdSense API error message.',
					data: {
						status: 403,
						reason: 'disapprovedAccount',
					},
				},
			},
		],
		[
			'multiple for multiple accounts without account ID provided',
			ACCOUNT_STATUS_MULTIPLE,
			{
				accounts: [ accountA, accountB ],
				previousAccountID: '',
			},
		],
		[
			'graylisted when there is a graylisted-publisher alert',
			ACCOUNT_STATUS_GRAYLISTED,
			{
				accounts: [ accountA ],
				alerts: [ graylistedAlert, otherAlert ],
				clients: [],
				previousAccountID: '',
				previousClientID: '',
			},
		],
		[
			'pending for accountPendingReview error',
			ACCOUNT_STATUS_PENDING,
			{
				accounts: [ accountA ],
				clients: [ afcClientA ],
				alerts: undefined,
				previousAccountID: '',
				previousClientID: '',
				alertsError: {
					code: '403',
					message: 'This is an AdSense API error message.',
					data: {
						status: 403,
						reason: 'accountPendingReview',
					},
				},
			},
		],
		[
			'no-client for no clients',
			ACCOUNT_STATUS_NO_CLIENT,
			{
				accounts: [ accountA ],
				alerts: [ otherAlert ],
				clients: [],
				previousAccountID: '',
				previousClientID: '',
			},
		],
		[
			'no-client for AFS clients only',
			ACCOUNT_STATUS_NO_CLIENT,
			{
				accounts: [ accountA ],
				alerts: [ otherAlert ],
				clients: [ afsClientA ],
				previousAccountID: '',
				previousClientID: '',
			},
		],
		[
			'pending for "Ad client not found" URL channels error',
			ACCOUNT_STATUS_PENDING,
			{
				accounts: [ accountA ],
				alerts: [ otherAlert ],
				clients: [ afcClientA, afsClientA ],
				urlChannels: undefined,
				previousAccountID: '',
				previousClientID: '',
				urlChannelsError: {
					code: '404',
					message: 'Ad client not found.',
				},
			},
		],
		[
			'approved for single account, no alerts, AFC client, and URL channels',
			ACCOUNT_STATUS_APPROVED,
			{
				accounts: [ accountA ],
				alerts: [ otherAlert ],
				clients: [ afcClientA, afsClientA ],
				urlChannels: [],
				previousAccountID: '',
				previousClientID: '',
			},
		],
	] )( 'should return %s', ( _, expected, params ) => {
		expect( determineAccountStatus( params ) ).toBe( expected );
	} );

	it( 'does not return multiple for multiple accounts with account ID provided', () => {
		// There are multiple accounts here, but by passing previousAccountID
		// we indicate the user already selected it.
		const params = {
			accounts: [ accountA, accountB ],
			previousAccountID: accountB._id,
		};
		expect( determineAccountStatus( params ) ).not.toEqual(
			ACCOUNT_STATUS_MULTIPLE
		);
	} );

	it( 'does not return pending for accountPendingReview error if no clients loaded', () => {
		const params = {
			accounts: [ accountA ],
			clients: undefined,
			alerts: undefined,
			previousAccountID: '',
			previousClientID: '',
			alertsError: {
				code: '403',
				message: 'This is an AdSense API error message.',
				data: {
					status: 403,
					reason: 'accountPendingReview',
				},
			},
		};
		expect( determineAccountStatus( params ) ).toEqual( undefined );
	} );

	it.each( [
		[ {} ],
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
		[
			{
				accounts: [ accountA ],
				alerts: undefined,
				// Even though it's technically possible to conclude the
				// pending status without them, clients must be loaded so
				// that the snippet can be placed. This test ensures that.
				clients: undefined,
				previousAccountID: '',
				previousClientID: '',
				alertsError: {
					code: '403',
					message: 'This is an AdSense API error message.',
					data: {
						status: 403,
						reason: 'accountPendingReview',
					},
				},
			},
		],
		[
			{
				accounts: [ accountA ],
				alerts: [ graylistedAlert, otherAlert ],
				// Even though it's technically possible to conclude the
				// graylisted status without them, clients must be loaded
				// so that the snippet can be placed. This test ensures
				// that.
				clients: undefined,
				previousAccountID: '',
				previousClientID: '',
			},
		],
	] )( 'returns undefined for undefined key parameters', ( params ) => {
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

	it.each( [
		[ {} ],
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
	] )( 'returns undefined for undefined key parameters', ( params ) => {
		expect( determineSiteStatus( params ) ).toEqual( undefined );
	} );

	it( 'does not return undefined for all key parameters defined', () => {
		const params = {
			urlChannels: [],
			siteURL: 'https://example.com',
		};
		expect( determineSiteStatus( params ) ).not.toEqual( undefined );
	} );

	it( 'returns added for camel case URLs', () => {
		const params = {
			urlChannels: [ otherURLChannelB ],
			siteURL: 'https://caMel-caSe-wEbsite.org',
		};
		expect( determineSiteStatus( params ) ).toEqual( SITE_STATUS_ADDED );
	} );
} );

describe( 'determineAccountID', () => {
	it( 'returns first/only account ID', () => {
		const params = {
			accounts: [ accountA ],
		};
		expect( determineAccountID( params ) ).toEqual( accountA._id );
	} );

	it( 'returns undefined for undefined accounts', () => {
		const params = {
			accounts: undefined,
		};
		expect( determineAccountID( params ) ).toEqual( undefined );
	} );

	it( 'returns undefined for empty accounts', () => {
		const params = {
			accounts: [],
		};
		expect( determineAccountID( params ) ).toEqual( undefined );
	} );

	it( 'returns undefined for multiple accounts', () => {
		const params = {
			accounts: [ accountA, accountB ],
		};
		expect( determineAccountID( params ) ).toEqual( undefined );
	} );

	it( 'looks up correct account through ID parameter', () => {
		const params = {
			accounts: [ accountA, accountB ],
			previousAccountID: accountB._id,
		};
		expect( determineAccountID( params ) ).toEqual( accountB._id );
	} );

	it( 'fails for multiple accounts and ID parameter without access', () => {
		const params = {
			accounts: [ accountA, accountB ],
			previousAccountID: 'pub-1234567890',
		};
		expect( determineAccountID( params ) ).toEqual( undefined );
	} );
} );

describe( 'determineClientID', () => {
	it( 'returns first/only client ID', () => {
		const params = {
			clients: [ afcClientA ],
		};
		expect( determineClientID( params ) ).toEqual( afcClientA._id );
	} );

	it( 'returns first AFC client ID', () => {
		const params = {
			clients: [ afsClientA, afcClientA ],
		};
		expect( determineClientID( params ) ).toEqual( afcClientA._id );
	} );

	it( 'returns undefined for undefined clients', () => {
		const params = {
			clients: undefined,
		};
		expect( determineClientID( params ) ).toEqual( undefined );
	} );

	it( 'returns undefined for empty clients', () => {
		const params = {
			clients: [],
		};
		expect( determineClientID( params ) ).toEqual( undefined );
	} );

	it( 'returns undefined for no AFC clients', () => {
		const params = {
			clients: [ afsClientA ],
		};
		expect( determineClientID( params ) ).toEqual( undefined );
	} );

	it( 'returns first client ID for multiple clients', () => {
		const params = {
			clients: [ afcClientA, afcClientB ],
		};
		expect( determineClientID( params ) ).toEqual( afcClientA._id );
	} );

	it( 'looks up correct client through ID parameter', () => {
		const params = {
			clients: [ afcClientA, afcClientB ],
			previousClientID: afcClientB._id,
		};
		expect( determineClientID( params ) ).toEqual( afcClientB._id );
	} );

	it( 'falls back to first client for multiple accounts and ID parameter without access', () => {
		const params = {
			clients: [ afcClientA, accountB ],
			previousClientID: 'ca-pub-1234567890',
		};
		expect( determineClientID( params ) ).toEqual( afcClientA._id );
	} );
} );
