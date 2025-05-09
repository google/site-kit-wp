/**
 * Banner stories.
 *
 * Site Kit by Google, Copyright 2025 Google LLC
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
import { Fragment } from 'react';
import Banner from '.';
import { Cell, Grid, Row } from '../../material-components';
// TODO: This rule should be updated to allow query parameters in import paths.
/* eslint-disable import/no-unresolved */
import AdSenseDesktopSVG from './../../../svg/graphics/banner-adsense-setup-cta.svg?url';
import AdSenseMobileSVG from './../../../svg/graphics/banner-adsense-setup-cta-mobile.svg?url';
import AdBlockingRecoveryDesktopSVG from './../../../svg/graphics/banner-ad-blocking-recovery-setup-cta.svg?url';
import AdBlockingRecoveryMobileSVG from './../../../svg/graphics/banner-ad-blocking-recovery-setup-cta-mobile.svg?url';
import ConversionsDesktopSVG from './../../../svg/graphics/banner-conversions-setup-cta.svg?url';
import ConversionsMobileSVG from './../../../svg/graphics/banner-conversions-setup-cta-mobile.svg?url';
import EnhancedMeasurementDesktopSVG from './../../../svg/graphics/banner-enhanced-measurement-setup-cta.svg?url';
import EnhancedMeasurementMobileSVG from './../../../svg/graphics/banner-enhanced-measurement-setup-cta-mobile.svg?url';
import SignInWithGoogleDesktopSVG from './../../../svg/graphics/banner-sign-in-with-google-setup-cta.svg?url';
import SignInWithGoogleMobileSVG from './../../../svg/graphics/banner-sign-in-with-google-setup-cta-mobile.svg?url';
/* eslint-enable import/no-unresolved */
import Link from '../Link';

function Template() {
	return (
		<Grid className="googlesitekit-widget-area googlesitekit-widget-area--boxes">
			<Row className="googlesitekit-widget-area-widgets">
				<Cell size={ 12 }>
					<h3>Setup CTA Banners</h3>

					<em>Simple Banner</em>
					<Banner
						title="Unlock your site’s earning potential"
						description={
							<Fragment>
								Sites just like yours are earning up to $2000
								per year with AdSense.
								<br />
								Connect AdSense today.
							</Fragment>
						}
						ctaButton={ {
							label: 'Get started',
							onClick: () => {},
						} }
						dismissButton={ {
							label: 'Maybe later',
							onClick: () => {},
						} }
						svg={ {
							mobile: AdSenseMobileSVG,
							desktop: AdSenseDesktopSVG,
							verticalPosition: 'top',
						} }
					/>
					<br />
					<em>
						Banner with Top Aligned SVG, Multiple Paragraphs and
						Help Text
					</em>
					<Banner
						title="Recover revenue lost to ad blockers"
						description={
							<Fragment>
								<p>
									Display a message to give site visitors with
									an ad blocker the option to allow ads on
									your site. Site Kit will place an ad
									blocking recovery tag on your site.{ ' ' }
									<Link>Learn more</Link>
								</p>
								<p>
									Publishers see up to 1 in 5 users choose to
									allow ads once they encounter an ad blocking
									recovery message*
								</p>
							</Fragment>
						}
						ctaButton={ {
							label: 'Setup up now',
							onClick: () => {},
						} }
						dismissButton={ {
							onClick: () => {},
						} }
						svg={ {
							mobile: AdBlockingRecoveryMobileSVG,
							desktop: AdBlockingRecoveryDesktopSVG,
							verticalPosition: 'top',
						} }
						helpText="* Average for publishers showing non-dismissible ad blocking recovery messages placed at the center of the page on desktop"
					/>
					<br />
					<em>Banner with Footer</em>
					<Banner
						title="Get personalized suggestions for user interaction metrics based on your goals"
						description="Answer 3 questions and we’ll suggest relevant metrics for your dashboard. These metrics will help you track how users interact with your site."
						svg={ {
							mobile: ConversionsMobileSVG,
							desktop: ConversionsDesktopSVG,
							verticalPosition: 'top',
						} }
						ctaButton={ {
							label: 'Get tailored metrics',
							onClick: () => {},
						} }
						dismissButton={ {
							onClick: () => {},
						} }
						footer={
							<div>
								<span>Interested in specific metrics?</span>{ ' ' }
								<Link>Select your own metrics</Link>
							</div>
						}
					/>
					<br />
					<em>Banner with Center Aligned SVG and Learn More Link</em>
					<Banner
						title="Understand how visitors interact with your content"
						description="Enable enhanced measurement in Analytics to automatically track metrics like file downloads, video plays, form interactions, etc. No extra code required - you'll be redirected to give permission for Site Kit to enable it on your behalf."
						learnMoreLink={ {
							href: 'https://example.com',
						} }
						ctaButton={ {
							label: 'Enable now',
							onClick: () => {},
						} }
						dismissButton={ {
							onClick: () => {},
						} }
						svg={ {
							mobile: EnhancedMeasurementMobileSVG,
							desktop: EnhancedMeasurementDesktopSVG,
							verticalPosition: 'center',
						} }
						helpText="You can always add/edit this in the Site Kit Settings."
					/>
					<br />
					<em>Banner with Bottom Aligned SVG</em>
					<Banner
						title="Boost onboarding, security, and trust on your site using Sign in with Google"
						description="Provide your site visitors with a simple, secure, and personalized experience by adding a Sign in with Google button to your login page."
						learnMoreLink={ {
							href: 'https://example.com',
						} }
						ctaButton={ {
							label: 'Setup up Sign in with Google',
							onClick: () => {},
						} }
						dismissButton={ {
							onClick: () => {},
						} }
						svg={ {
							mobile: SignInWithGoogleMobileSVG,
							desktop: SignInWithGoogleDesktopSVG,
							verticalPosition: 'bottom',
						} }
					/>
				</Cell>
			</Row>
		</Grid>
	);
}

export const AllBannerComponents = Template.bind( {} );
AllBannerComponents.storyName = 'All Banners';
AllBannerComponents.scenario = {};

export default {
	title: 'Components/Banner',
	decorators: [
		( Story ) => {
			return (
				<div>
					<Story />
				</div>
			);
		},
	],
};
