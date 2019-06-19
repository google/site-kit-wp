/**
 * DashboardSplashMain component.
 *
 * Site Kit by Google, Copyright 2019 Google LLC
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

import DashboardSplashIntro from './dashboard-splash-intro';
import DashboardSplashService from './dashboard-splash-service';
import DashboardSplashOutro from './dashboard-splash-outro';
import DashboardSplashModule from './dashboard-splash-module';

const { Component } = wp.element;
const { __ } = wp.i18n;

class DashboardSplashMain extends Component {

	constructor( props ) {
		super( props );

		this.handleButtonClick = this.handleButtonClick.bind( this );
	}

	handleButtonClick( event ) {
		event.preventDefault();
		this.props.onButtonClick();
	}

	render() {
		const {
			introDescription,
			outroDescription,
			buttonLabel,
		} = this.props;

		const splashModules = {
			searchConsole: {
				icon: 'search-console',
				title: __( 'Search Console', 'google-site-kit' ),
				content: __( 'Keep track of how people find you in Search, and how many of them visit your site.', 'google-site-kit' ),
			},
			analytics: {
				icon: 'analytics',
				title: __( 'Analytics', 'google-site-kit' ),
				content: __( 'Understand your customers better: track how they navigate across your site and evaluate the performance of your products or posts.', 'google-site-kit' ),
			},
			adsense: {
				icon: 'adsense',
				title: __( 'AdSense', 'google-site-kit' ),
				content: __( 'Make your content work for you -- earning money by placing ads on your site.', 'google-site-kit' ),
			},
			pagespeed: {
				icon: 'pagespeed',
				title: __( 'PageSpeed', 'google-site-kit' ),
				content: __( 'Analyze your site’s performance and get actionable tips to improve its speed across all devices.', 'google-site-kit' ),
			},
		};

		const splashServices = {
			searchConsole: {
				image: 'analytics',
				title: __( 'Get to know your customers.', 'google-site-kit' ),
				content: __( 'Google Analytics gives you the free tools you need to analyze data for your business in one place.', 'google-site-kit' ),
				link: 'https://marketingplatform.google.com/about/analytics/',
				linkText: __( 'Learn More', 'google-site-kit' ),
			},
			analytics: {
				image: 'search_console',
				title: __( 'You want to be found on the web. We want to help.', 'google-site-kit' ),
				content: __( 'Track your site’s search performance with Google Search Console and browse around for more webmaster resources.', 'google-site-kit' ),
				link: 'https://search.google.com/search-console/about',
				linkText: __( 'Search Console', 'google-site-kit' ),
				opposite: true,
			},
		};

		return (
			<div className="googlesitekit-splash">
				<DashboardSplashIntro description={ introDescription } buttonLabel={ buttonLabel } onButtonClick={ this.handleButtonClick }/>
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
							{ Object.keys( splashModules ).map( module => {
								return (
									<div key={ splashModules[module].title } className="
											mdc-layout-grid__cell
											mdc-layout-grid__cell--span-2-phone
											mdc-layout-grid__cell--span-2-tablet
											mdc-layout-grid__cell--span-3-desktop
										">
										<DashboardSplashModule
											icon={ splashModules[module].icon }
											title={ splashModules[module].title }
											content={ splashModules[module].content }
										/>
									</div>
								);
							} ) }
						</div>
					</div>
					<section className="mdc-layout-grid">
						<div className="mdc-layout-grid__inner">
							{ Object.keys( splashServices ).map( service => {
								return (
									<div key={ splashServices[service].title } className="
										mdc-layout-grid__cell
										mdc-layout-grid__cell--span-12
									">
										<DashboardSplashService
											image={ splashServices[service].image }
											title={ splashServices[service].title }
											content={ splashServices[service].content }
											link={ splashServices[service].link }
											linkText={ splashServices[service].linkText }
											opposite={ splashServices[service].opposite }/>
									</div>
								);
							} ) }
						</div>
					</section>
				</section>
				<DashboardSplashOutro description={ outroDescription } buttonLabel={ buttonLabel } onButtonClick={ this.handleButtonClick }/>
			</div>
		);
	}
}

export default DashboardSplashMain;
