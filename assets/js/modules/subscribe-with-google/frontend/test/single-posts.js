import '../single-posts';
import { CACHE_KEY } from '../unlock';

const SUBSCRIBERS = self.SWG[ 0 ];

describe( 'single posts', () => {
	let articleEl;
	let contributeButtonEl;
	let contributeLinkEl;
	let configEl;
	let lockedContentEl;
	let subscribeButtonEl;
	let subscribeLinkEl;
	let subscribeButtonElWithoutPlayOffersDefined;
	let subscriptions;

	beforeEach( () => {
		delete global.location;
		global.location = {
			reload: jest.fn(),
			hash: '',
		};

		global.fetch = jest.fn( () => Promise.resolve( {
			json: () => ( {
				entitlements: [ {
					products: [ 'premium' ],
				} ],
			} ),
		} ) );
		delete global.localStorage[ CACHE_KEY ];

		subscriptions = {
			setOnPaymentResponse: ( callback ) => {
				const response = {
					complete: () => Promise.resolve(),
				};
				callback( Promise.resolve( response ) );
			},
			getEntitlements: jest.fn( () => Promise.resolve( {
				entitlements: [
					{
						products: [ 'basic', 'premium' ],
					},
				],
			} ) ),
			showContributionOptions: jest.fn(),
			showOffers: jest.fn(),
		};

		configEl = document.createElement( 'script' );
		configEl.setAttribute( 'type', 'application/ld+json' );
		configEl.innerText = `
    {
			"@context": "http://schema.org",
			"@type": "NewsArticle",
			"isAccessibleForFree": false,
			"isPartOf": {
				"@type": ["CreativeWork", "Product"],
				"productID": "premium"
			}
    }
    `;
		document.head.appendChild( configEl );

		articleEl = document.createElement( 'article' );
		document.body.appendChild( articleEl );

		lockedContentEl = document.createElement( 'p' );
		lockedContentEl.classList.add( 'swg--locked-content' );
		articleEl.appendChild( lockedContentEl );

		contributeButtonEl = document.createElement( 'div' );
		contributeButtonEl.classList.add( 'swg-contribute-button' );
		contributeButtonEl.dataset.playOffers = 'basic, premium';
		document.body.appendChild( contributeButtonEl );

		contributeLinkEl = document.createElement( 'a' );
		contributeLinkEl.href = '#swg-contribute';
		contributeLinkEl.dataset.playOffers = 'basic, premium';
		document.body.appendChild( contributeLinkEl );

		subscribeButtonEl = document.createElement( 'div' );
		subscribeButtonEl.classList.add( 'swg-subscribe-button' );
		subscribeButtonEl.dataset.playOffers = 'basic, premium';
		document.body.appendChild( subscribeButtonEl );

		subscribeLinkEl = document.createElement( 'a' );
		subscribeLinkEl.href = '#swg-subscribe';
		subscribeLinkEl.dataset.playOffers = 'basic, premium';
		document.body.appendChild( subscribeLinkEl );

		subscribeButtonElWithoutPlayOffersDefined = document.createElement( 'div' );
		subscribeButtonElWithoutPlayOffersDefined.classList.add( 'swg-subscribe-button' );
		document.body.appendChild( subscribeButtonElWithoutPlayOffersDefined );
	} );

	afterEach( () => {
		configEl.remove();
		articleEl.remove();
	} );

	it( 'fetches entitlements', async () => {
		await SUBSCRIBERS( subscriptions );
		expect( subscriptions.getEntitlements ).toHaveBeenCalled();
	} );

	it( 'fetches entitlements if cache does not have the right product', async () => {
		global.localStorage[ CACHE_KEY ] = JSON.stringify( {
			expiration: Date.now() * 2,
			products: [],
		} );
		await SUBSCRIBERS( subscriptions );
		expect( subscriptions.getEntitlements ).toHaveBeenCalled();
	} );

	it( 'fetches entitlements if cache is expired', async () => {
		global.localStorage[ CACHE_KEY ] = JSON.stringify( {
			expiration: Date.now() / 2,
			products: [ 'premium' ],
		} );
		await SUBSCRIBERS( subscriptions );
		expect( subscriptions.getEntitlements ).toHaveBeenCalled();
	} );

	it( 'does not fetch entitlements if cache entitles user', async () => {
		global.localStorage[ CACHE_KEY ] = JSON.stringify( {
			expiration: Date.now() * 2,
			products: [ 'premium' ],
		} );
		await SUBSCRIBERS( subscriptions );
		expect( fetch ).not.toHaveBeenCalled();
	} );

	it( 'marks article as unlocked when a product matches', async () => {
		await SUBSCRIBERS( subscriptions );
		expect( articleEl.classList.contains( 'swg--page-is-unlocked' ) ).toBeTruthy();
	} );

	it( 'marks article as locked when no products match', async () => {
		global.fetch = jest.fn( () => Promise.resolve( {
			json: () => ( {
				entitlements: [ {
					products: [],
				} ],
			} ),
		} ) );
		subscriptions.getEntitlements = () => Promise.resolve( {
			entitlements: [
				{
					products: [],
				},
			],
		} );
		await SUBSCRIBERS( subscriptions );
		expect( articleEl.classList.contains( 'swg--page-is-locked' ) ).toBeTruthy();
	} );

	it( 'marks article as locked when requests fail', async () => {
		global.fetch = jest.fn( () => Promise.reject() );
		subscriptions.getEntitlements = () => Promise.reject();
		await SUBSCRIBERS( subscriptions );
		expect( articleEl.classList.contains( 'swg--page-is-locked' ) ).toBeTruthy();
	} );

	it( 'handles missing meta element', async () => {
		configEl.remove();

		await SUBSCRIBERS( subscriptions );
		expect( articleEl.classList.contains( 'swg--page-is-unlocked' ) ).toBeFalsy();
	} );

	it( 'handles mismatched product in meta element', async () => {
		configEl.innerText = configEl.innerText.replace( 'premium', 'exclusive' );

		await SUBSCRIBERS( subscriptions );
		expect( articleEl.classList.contains( 'swg--page-is-unlocked' ) ).toBeFalsy();
	} );

	it( 'handles missing article element', async () => {
		articleEl.remove();

		await SUBSCRIBERS( subscriptions );
		expect( articleEl.classList.contains( 'swg--page-is-unlocked' ) ).toBeFalsy();
	} );

	it( 'handles subscribe button clicks', async () => {
		await SUBSCRIBERS( subscriptions );

		subscribeButtonEl.click();

		expect( subscriptions.showOffers.mock.calls ).toEqual( [ [ {
			isClosable: true,
			skus: [ 'basic', 'premium' ],
		} ] ] );
	} );

	it( 'handles subscribe link clicks', async () => {
		await SUBSCRIBERS( subscriptions );

		subscribeLinkEl.click();

		expect( subscriptions.showOffers.mock.calls ).toEqual( [ [ {
			isClosable: true,
			skus: [ 'basic', 'premium' ],
		} ] ] );
	} );

	it( 'handles subscribe button clicks when play offers are not defined', async () => {
		await SUBSCRIBERS( subscriptions );

		subscribeButtonElWithoutPlayOffersDefined.click();

		expect( subscriptions.showOffers.mock.calls ).toEqual( [ [ {
			isClosable: true,
			skus: [],
		} ] ] );
	} );

	it( 'handles contribute button clicks', async () => {
		await SUBSCRIBERS( subscriptions );

		contributeButtonEl.click();

		expect( subscriptions.showContributionOptions.mock.calls ).toEqual( [ [ {
			isClosable: true,
			skus: [ 'basic', 'premium' ],
		} ] ] );
	} );

	it( 'handles contribute link clicks', async () => {
		await SUBSCRIBERS( subscriptions );

		contributeLinkEl.click();

		expect( subscriptions.showContributionOptions.mock.calls ).toEqual( [ [ {
			isClosable: true,
			skus: [ 'basic', 'premium' ],
		} ] ] );
	} );
} );
