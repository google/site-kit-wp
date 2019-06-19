import { storiesOf } from '@storybook/react';
import { GoogleSitekitAdminbar } from 'SiteKitCore/googlesitekit-adminbar';
import { googlesitekit as wpAdminBarData } from '../.storybook/data/blog---googlesitekit';
import AnalyticsAdminbarWidget from 'GoogleModules/analytics/adminbar/adminbar-widget';
import GoogleSitekitSearchConsoleAdminbarWidget from 'GoogleModules/search-console/adminbar/adminbar-widget';
import { createAddToFilter } from 'GoogleUtil/helpers';

storiesOf( 'Global', module )
	.add( 'Admin Bar', () => {
		window.googlesitekit = wpAdminBarData;
		const addGoogleSitekitSearchConsoleAdminbarWidget  = createAddToFilter( <GoogleSitekitSearchConsoleAdminbarWidget /> );
		const addAnalyticsAdminbarWidget = createAddToFilter( <AnalyticsAdminbarWidget /> );


		wp.hooks.removeAllFilters( 'googlesitekit.AdminbarModules' );
		wp.hooks.addFilter( 'googlesitekit.AdminbarModules',
			'googlesitekit.Analytics',
			addAnalyticsAdminbarWidget, 11 );

		wp.hooks.addFilter( 'googlesitekit.AdminbarModules',
			'googlesitekit.SearchConsole',
			addGoogleSitekitSearchConsoleAdminbarWidget );

		// Load the datacache with data.
		setTimeout( () => {
			wp.hooks.doAction(
				'googlesitekit.moduleLoaded',
				'Adminbar'
			);
		}, 1250 );

		return (
			<div id="wpadminbar">
				<div className="googlesitekit-plugin">
					<div id="js-googlesitekit-adminbar" className="ab-sub-wrapper googlesitekit-adminbar" style={ { display: 'block' } }>
						<section id="js-googlesitekit-adminbar-modules" className="googlesitekit-adminbar-modules">
							<GoogleSitekitAdminbar/>
						</section>
					</div>
				</div>
			</div>
		);
	}, {
		options: {
			readySelector: '.googlesitekit-data-block',
		}
	} );
