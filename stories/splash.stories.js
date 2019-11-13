/**
 * External dependencies
 */
import { storiesOf } from '@storybook/react';
/**
 * WordPress dependencies
 */
import { __, _x } from '@wordpress/i18n';
import DashboardSplashIntro from 'GoogleComponents/dashboard-splash/dashboard-splash-intro';
import DashboardSplashModule from 'GoogleComponents/dashboard-splash/dashboard-splash-module';
import DashboardSplashService from 'GoogleComponents/dashboard-splash/dashboard-splash-service';
import DashboardSplashOutro from 'GoogleComponents/dashboard-splash/dashboard-splash-outro';

storiesOf( 'Splash', module )
	.add( 'Splash Page', () => (
		<div className="googlesitekit-splash">
			<DashboardSplashIntro description={ __( 'You’re one step closer to connecting Google services to your WordPress site.', 'google-site-kit' ) } buttonLabel={ __( 'Set Up Site Kit', 'google-site-kit' ) } onButtonClick={ () => {} } />
			<section className="googlesitekit-splash__wrapper">
				<div className="mdc-layout-grid">
					<div className="mdc-layout-grid__inner">
						<div className="
								mdc-layout-grid__cell
								mdc-layout-grid__cell--span-12
							">
							<h2 className="
									googlesitekit-splash__title
									googlesitekit-subheading-2
								">
								{ __( 'Powerful tools integrated into your WordPress dashboard.', 'google-site-kit' ) }
							</h2>
						</div>
						<div className="
							mdc-layout-grid__cell
							mdc-layout-grid__cell--span-2-phone
							mdc-layout-grid__cell--span-2-tablet
							mdc-layout-grid__cell--span-3-desktop
						">
							<DashboardSplashModule
								icon="search-console"
								title={ _x( 'Search Console', 'Service name', 'google-site-kit' ) }
								content={ __( 'Keep track of how people find you in Search, and how many of them visit your site.', 'google-site-kit' ) }
							/>
						</div>
						<div className="
							mdc-layout-grid__cell
							mdc-layout-grid__cell--span-2-phone
							mdc-layout-grid__cell--span-2-tablet
							mdc-layout-grid__cell--span-3-desktop
						">
							<DashboardSplashModule
								icon="analytics"
								title={ _x( 'Analytics', 'Service name', 'google-site-kit' ) }
								content={ __( 'Understand your customers better: track how they navigate across your site and evaluate the performance of your products or posts.', 'google-site-kit' ) }
							/>
						</div>
						<div className="
							mdc-layout-grid__cell
							mdc-layout-grid__cell--span-2-phone
							mdc-layout-grid__cell--span-2-tablet
							mdc-layout-grid__cell--span-3-desktop
						">
							<DashboardSplashModule
								icon="adsense"
								title={ _x( 'AdSense', 'Service name', 'google-site-kit' ) }
								content={ __( 'Make your content work for you -- earning money by placing ads on your site.', 'google-site-kit' ) }
							/>
						</div>
						<div className="
							mdc-layout-grid__cell
							mdc-layout-grid__cell--span-2-phone
							mdc-layout-grid__cell--span-2-tablet
							mdc-layout-grid__cell--span-3-desktop
						">
							<DashboardSplashModule
								icon="pagespeed"
								title={ _x( 'PageSpeed', 'Service name', 'google-site-kit' ) }
								content={ __( 'Analyze your site’s performance and get actionable tips to improve its speed across all devices.', 'google-site-kit' ) }
							/>
						</div>
					</div>
				</div>
				<section className="mdc-layout-grid">
					<div className="mdc-layout-grid__inner">
						<div className="
							mdc-layout-grid__cell
							mdc-layout-grid__cell--span-12
						">
							<DashboardSplashService
								image="analytics"
								title={ __( 'Get to know your customers.', 'google-site-kit' ) }
								content={ __( 'Google Analytics gives you the free tools you need to analyze data for your business in one place.', 'google-site-kit' ) }
								link="https://marketingplatform.google.com/about/analytics/"
								linkText={ __( 'Learn More', 'google-site-kit' ) }
							/>
						</div>
						<div className="
							mdc-layout-grid__cell
							mdc-layout-grid__cell--span-12
						">
							<DashboardSplashService
								image="search_console"
								title={ __( 'You want to be found on the web. We want to help.', 'google-site-kit' ) }
								content={ __( 'Track your site’s search performance with Google Search Console and browse around for more webmaster resources.', 'google-site-kit' ) }
								link="https://search.google.com/search-console/about"
								linkText={ _x( 'Search Console', 'Service name', 'google-site-kit' ) }
								opposite={ true }
							/>
						</div>
					</div>
				</section>
			</section>
			<DashboardSplashOutro buttonLabel={ __( 'Set Up Site Kit', 'google-site-kit' ) } onButtonClick={ () => {} } />
		</div>
	) );
