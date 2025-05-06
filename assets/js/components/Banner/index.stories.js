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
import DesktopSVG from './../../../svg/graphics/key-metrics-setup-cta-small-desktop.svg';
import MobileSVG from './../../../svg/graphics/key-metrics-setup-cta-mobile.svg';
import Link from '../Link';

const svgAlignments = [ 'start', 'center', 'end' ];

function Template() {
	return (
		<Grid className="googlesitekit-widget-area googlesitekit-widget-area--boxes">
			<Row className="googlesitekit-widget-area-widgets">
				<Cell size={ 12 }>
					<h3>Setup CTA Banners</h3>

					<Banner
						title="Setup CTA Banner"
						description="Setup CTA Banner with minimal required properties."
						ctaButton={ {
							label: 'Setup up now',
							onClick: () => {},
						} }
						dismissButton={ {
							label: 'Dismiss',
							onClick: () => {},
						} }
						svg={ {
							mobile: MobileSVG,
							desktop: DesktopSVG,
						} }
					/>
					<br />
					<Banner
						title="Setup CTA Banner with Multiple Paragraphs"
						description={
							<Fragment>
								<p>
									Setup CTA banner with multiple paragraphs
									passed to description.
								</p>
								<p>
									Setup CTA banner with multiple paragraphs
									passed to description.
								</p>
							</Fragment>
						}
						ctaButton={ {
							label: 'Setup up now',
							onClick: () => {},
						} }
						dismissButton={ {
							label: 'Dismiss',
							onClick: () => {},
						} }
						svg={ {
							mobile: MobileSVG,
							desktop: DesktopSVG,
						} }
					/>
					<br />
					<Banner
						title="Setup CTA Banner with Learn More Link"
						description="Setup CTA Banner with Learn More Link."
						svg={ {
							mobile: MobileSVG,
							desktop: DesktopSVG,
						} }
						ctaButton={ {
							label: 'Setup up now',
							onClick: () => {},
						} }
						dismissButton={ {
							label: 'Dismiss',
							onClick: () => {},
						} }
						learnMoreLink={ {
							label: 'More information',
							href: '#',
						} }
					/>
					<br />
					<Banner
						title="Setup CTA Banner with Help Text"
						description="Setup CTA Banner with Help Text."
						svg={ {
							mobile: MobileSVG,
							desktop: DesktopSVG,
						} }
						ctaButton={ {
							label: 'Setup up now',
							onClick: () => {},
						} }
						dismissButton={ {
							label: 'Dismiss',
							onClick: () => {},
						} }
						helpText="This is a help text."
					/>
					<br />
					{ svgAlignments.map( ( alignment ) => (
						<Fragment key={ alignment }>
							<Banner
								title={ `Setup CTA Banner with ${ alignment.toUpperCase() } SVG Alignment` }
								description={ `Setup CTA Banner with  ${ alignment.toUpperCase() } SVG Alignment. A longer description to allow the alignment of the included SVGs to be clearly visible. The SVGs will align to the top, middle or bottom based on the passed value.  A longer description to allow the alignment of the included SVGs to be clearly visible. The SVGs will align to the top, middle or bottom based on the passed value. ` }
								svg={ {
									mobile: MobileSVG,
									desktop: DesktopSVG,
									alignItems: alignment,
								} }
								ctaButton={ {
									label: 'Setup up now',
									onClick: () => {},
								} }
								dismissButton={ {
									label: 'Dismiss',
									onClick: () => {},
								} }
							/>
							<br />
						</Fragment>
					) ) }

					<Banner
						title="Setup CTA Banner with Footer"
						description="Setup CTA Banner with Footer."
						svg={ {
							mobile: MobileSVG,
							desktop: DesktopSVG,
						} }
						ctaButton={ {
							label: 'Setup up now',
							onClick: () => {},
						} }
						dismissButton={ {
							label: 'Dismiss',
							onClick: () => {},
						} }
						footer={
							<div>
								<span>Extra banner footer.</span>{ ' ' }
								<Link>Footer link</Link>
							</div>
						}
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
