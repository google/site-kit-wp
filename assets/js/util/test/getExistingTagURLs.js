/**
 * Internal dependencies
 */
import { getExistingTagURLs } from '../tag';

/**
 * Internal dependencies
 */
import API from 'googlesitekit-api';
import {
	createTestRegistry,
	unsubscribeFromAll,
} from '../../../../tests/js/utils';
import { STORE_NAME as CORE_SITE } from '../../googlesitekit/datastore/site/constants';
import fetchMock from 'fetch-mock';

describe( 'modules/tagmanager existing-tag', () => {
	let registry;

	beforeAll( () => {
		API.setUsingCache( false );
	} );

	beforeEach( () => {
		registry = createTestRegistry();
	} );

	afterEach( () => {
		unsubscribeFromAll( registry );
	} );

	afterAll( () => {
		API.setUsingCache( true );
	} );

	describe( 'getExistingTagURLs', () => {
		it( 'gets the home URL if AMP mode is not secondary', async () => {
			const expectedURLs = [
				'http://example.com/',
			];

			registry.dispatch( CORE_SITE ).receiveSiteInfo( { homeURL: 'http://example.com/' } );
			const coreRegistry = registry.select( CORE_SITE );

			expect( await getExistingTagURLs( coreRegistry ) ).toEqual( expectedURLs );
		} );

		it( 'gets the home URL and the first amp post if AMP mode is secondary', async () => {
			const expectedURLs = [
				'http://example.com/',
				'http://example.com/amp/?amp=1',
			];

			fetchMock.getOnce(
				/^\/wp\/v2\/posts/,
				{
					body: [
						{ link: 'http://example.com/amp/' },
						{ link: 'http://example.com/ignore-me' },
					],
					status: 200,
				}
			);

			registry.dispatch( CORE_SITE ).receiveSiteInfo( { homeURL: 'http://example.com/', ampMode: 'secondary' } );
			const coreRegistry = registry.select( CORE_SITE );

			const existingTagURLs = await getExistingTagURLs( coreRegistry );

			expect( fetchMock ).toHaveFetchedTimes( 1 );
			expect( existingTagURLs ).toEqual( expectedURLs );
		} );
	} );
} );
