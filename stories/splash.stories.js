/**
 * External dependencies
 */
import { storiesOf } from '@storybook/react';
/**
 * WordPress dependencies
 */
import { __, _x } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import AdSenseIcon from '../assets/svg/adsense.svg';
import AnalyticsIcon from '../assets/svg/analytics.svg';
import PageSpeedInsightsIcon from '../assets/svg/pagespeed-insights.svg';
import SearchConsoleIcon from '../assets/svg/search-console.svg';
import LegacyDashboardSplashIntro from '../assets/js/components/dashboard-splash/LegacyDashboardSplashIntro';
import LegacyDashboardSplashModule from '../assets/js/components/dashboard-splash/LegacyDashboardSplashModule';
import LegacyDashboardSplashService from '../assets/js/components/dashboard-splash/LegacyDashboardSplashService';
import LegacyDashboardSplashOutro from '../assets/js/components/dashboard-splash/LegacyDashboardSplashOutro';
import { Cell, Grid, Row } from '../assets/js/material-components';

storiesOf( 'Splash', module )
	.add( 'Splash Page', () => (
		<div className="googlesitekit-splash">
			<LegacyDashboardSplashIntro
				description={ __( 'You’re one step closer to connecting Google services to your WordPress site.', 'google-site-kit' ) }
				buttonLabel={ __( 'Set Up Site Kit', 'google-site-kit' ) }
				onButtonClick={ () => {} }
			/>

			<section className="googlesitekit-splash__wrapper">
				<Grid>
					<Row>
						<Cell size={ 12 }>
							<h2 className="googlesitekit-splash__title googlesitekit-subheading-2">
								{ __( 'Powerful tools integrated into your WordPress dashboard.', 'google-site-kit' ) }
							</h2>
						</Cell>

						<Cell lgSize={ 3 } mdSize={ 2 } smSize={ 2 }>
							<LegacyDashboardSplashModule
								icon={ <SearchConsoleIcon width="33" height="33" /> }
								title={ _x( 'Search Console', 'Service name', 'google-site-kit' ) }
								content={ __( 'Keep track of how people find you in Search, and how many of them visit your site.', 'google-site-kit' ) }
							/>
						</Cell>

						<Cell lgSize={ 3 } mdSize={ 2 } smSize={ 2 }>
							<LegacyDashboardSplashModule
								icon={ <AnalyticsIcon width="33" height="33" /> }
								title={ _x( 'Analytics', 'Service name', 'google-site-kit' ) }
								content={ __( 'Understand your customers better: track how they navigate across your site and evaluate the performance of your products or posts.', 'google-site-kit' ) }
							/>
						</Cell>

						<Cell lgSize={ 3 } mdSize={ 2 } smSize={ 2 }>
							<LegacyDashboardSplashModule
								icon={ <AdSenseIcon width="33" height="33" /> }
								title={ _x( 'AdSense', 'Service name', 'google-site-kit' ) }
								content={ __( 'Make your content work for you -- earning money by placing ads on your site.', 'google-site-kit' ) }
							/>
						</Cell>

						<Cell lgSize={ 3 } mdSize={ 2 } smSize={ 2 }>
							<LegacyDashboardSplashModule
								icon={ <PageSpeedInsightsIcon width="33" height="33" /> }
								title={ _x( 'PageSpeed', 'Service name', 'google-site-kit' ) }
								content={ __( 'Analyze your site’s performance and get actionable tips to improve its speed across all devices.', 'google-site-kit' ) }
							/>
						</Cell>
					</Row>
				</Grid>

				<Grid>
					<Row>
						<Cell size={ 12 }>
							<LegacyDashboardSplashService
								image="analytics"
								title={ __( 'Get to know your customers.', 'google-site-kit' ) }
								content={ __( 'Google Analytics gives you the free tools you need to analyze data for your business in one place.', 'google-site-kit' ) }
								link="https://marketingplatform.google.com/about/analytics/"
								linkText={ __( 'Learn More', 'google-site-kit' ) }
							/>
						</Cell>

						<Cell size={ 12 }>
							<LegacyDashboardSplashService
								image="search_console"
								title={ __( 'You want to be found on the web. We want to help.', 'google-site-kit' ) }
								content={ __( 'Track your site’s search performance with Google Search Console and browse around for more webmaster resources.', 'google-site-kit' ) }
								link="https://search.google.com/search-console/about"
								linkText={ _x( 'Search Console', 'Service name', 'google-site-kit' ) }
								opposite={ true }
							/>
						</Cell>
					</Row>
				</Grid>
			</section>

			<LegacyDashboardSplashOutro
				buttonLabel={ __( 'Set Up Site Kit', 'google-site-kit' ) }
				onButtonClick={ () => {} }
			/>
		</div>
	) );
