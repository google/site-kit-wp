/**
 * External dependencies
 */
import { storiesOf } from '@storybook/react';

/**
 * WordPress dependencies
 */
import { addFilter, doAction, removeAllFilters } from '@wordpress/hooks';

/**
 * Internal dependencies
 */
import { GoogleSitekitAdminbar } from '../assets/js/googlesitekit-adminbar';
import { googlesitekit as wpAdminBarData } from '../.storybook/data/blog---googlesitekit';
import AnalyticsAdminbarWidget from '../assets/js/modules/analytics/components/adminbar/AnalyticsAdminbarWidget';
import GoogleSitekitSearchConsoleAdminbarWidget from '../assets/js/modules/search-console/components/adminbar/GoogleSitekitSearchConsoleAdminbarWidget';
import { createAddToFilter } from '../assets/js/util/helpers';
import { STORE_NAME as CORE_SITE } from '../assets/js/googlesitekit/datastore/site/constants';
import { STORE_NAME as CORE_USER } from '../assets/js/googlesitekit/datastore/user/constants';
import { WithTestRegistry } from '../tests/js/utils';

storiesOf( 'Global', module )
	.add( 'Admin Bar', () => {
		global._googlesitekitLegacyData = wpAdminBarData;

		const setupRegistry = ( { dispatch } ) => {
			dispatch( CORE_SITE ).receiveSiteInfo( {
				usingProxy: true,
				referenceSiteURL: 'https://example.com',
				adminURL: 'https://example.com/wp-admin/',
				siteName: 'My Site Name',
				currentEntityURL: 'https://www.sitekitbygoogle.com/blog/',
				currentEntityTitle: 'Blog test post for Google Site Kit',
				currentEntityType: 'blog',
				currentEntityID: 2,
			} );
			dispatch( CORE_USER ).receiveGetAuthentication( {
				authenticated: true,
				requiredScopes: [],
				grantedScopes: [],
			} );
		};

		const addGoogleSitekitSearchConsoleAdminbarWidget = createAddToFilter( <GoogleSitekitSearchConsoleAdminbarWidget /> );
		const addAnalyticsAdminbarWidget = createAddToFilter( <AnalyticsAdminbarWidget /> );

		removeAllFilters( 'googlesitekit.AdminbarModules' );
		addFilter( 'googlesitekit.AdminbarModules',
			'googlesitekit.Analytics',
			addAnalyticsAdminbarWidget, 11 );

		addFilter( 'googlesitekit.AdminbarModules',
			'googlesitekit.SearchConsole',
			addGoogleSitekitSearchConsoleAdminbarWidget );

		// Load the datacache with data.
		setTimeout( () => {
			doAction(
				'googlesitekit.moduleLoaded',
				'Adminbar'
			);
		}, 1250 );

		return (
			<div id="wpadminbar">
				<div className="googlesitekit-plugin">
					<div id="js-googlesitekit-adminbar" className="ab-sub-wrapper googlesitekit-adminbar" style={ { display: 'block' } }>
						<section id="js-googlesitekit-adminbar-modules" className="googlesitekit-adminbar-modules">
							<WithTestRegistry callback={ setupRegistry }>
								<GoogleSitekitAdminbar />
							</WithTestRegistry>
						</section>
					</div>
				</div>
			</div>
		);
	}, {
		options: {
			readySelector: '.googlesitekit-data-block',
		},
	} );
