/**
 * External dependencies
 */
import { storiesOf } from '@storybook/react';
/**
 * Internal dependencies
 */
import DateRangeSelector from '../assets/js/components/DateRangeSelector';
import Header from '../assets/js/components/Header';
import { STORE_NAME as CORE_SITE } from '../assets/js/googlesitekit/datastore/site/constants';
import { STORE_NAME as CORE_USER } from '../assets/js/googlesitekit/datastore/user/constants';
import { WithTestRegistry } from '../tests/js/utils';

storiesOf( 'Global', module )
	.add( 'Plugin Header with Date Selector', () => {
		const setupRegistry = ( { dispatch } ) => {
			dispatch( CORE_SITE ).receiveSiteInfo( {
				usingProxy: true,
				proxySetupURL: 'https://sitekit.withgoogle.com/site-management/setup/',
				proxyPermissionsURL: 'https://sitekit.withgoogle.com/site-management/permissions/',
				referenceSiteURL: 'http://example.com',
				siteName: 'My Site Name',
			} );
			dispatch( CORE_USER ).receiveGetAuthentication( {
				authenticated: true,
				requiredScopes: [],
				grantedScopes: [],
			} );
		};

		return (
			<WithTestRegistry callback={ setupRegistry }>
				<Header>
					<DateRangeSelector />
				</Header>
			</WithTestRegistry>
		);
	}, {
		options: {
			delay: 3000, // Wait for image to load.
		},
	} );
