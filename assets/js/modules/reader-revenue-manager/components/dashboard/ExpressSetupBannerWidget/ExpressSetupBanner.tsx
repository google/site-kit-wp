/**
 * RRMExpressSetupCTABannerWidget component.
 *
 * Site Kit by Google, Copyright 2026 Google LLC
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
 * WordPress dependencies
 */
import { Fragment, createInterpolateElement } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { Select, useSelect } from 'googlesitekit-data';
import Banner, { BannerProps } from '@/js/components/Banner';
import Link from '@/js/components/Link';
import PoweredByModule from '@/js/components/PoweredByModule';
import { SIZE_MEDIUM } from '@/js/components/Typography/constants';
import P from '@/js/components/Typography/P';
import { CORE_SITE } from '@/js/googlesitekit/datastore/site/constants';
import { MODULE_SLUG_READER_REVENUE_MANAGER } from '@/js/modules/reader-revenue-manager/constants';
import BannerSVGMobile from '@/svg/graphics/banner-rrm-setup-cta-widget-mobile.svg?url';
import BannerSVGDesktop from '@/svg/graphics/banner-rrm-setup-cta-widget.svg?url';

export default function ExpressSetupBanner( props: BannerProps ) {
	const documentationLinkURL = useSelect(
		( select: Select ) =>
			select( CORE_SITE ).getDocumentationLinkURL( 'rrm-newsletter' ),
		[]
	);

	return (
		<Banner
			className="googlesitekit-rrm-express-setup-banner"
			title={ __(
				'Collect reader emails directly on your site',
				'google-site-kit'
			) }
			description={
				<Fragment>
					<P size={ SIZE_MEDIUM }>
						{ createInterpolateElement(
							__(
								'Add a simple sign-up form to your site so readers can share their email addresses with you. It’s an easy, privacy-safe way to start building a list of your most interested visitors. <a>Learn more</a>',
								'google-site-kit'
							),
							{
								a: (
									<Link
										href={ documentationLinkURL }
										external
										hideExternalIndicator
									/>
								),
							}
						) }
					</P>
					<PoweredByModule
						slug={ MODULE_SLUG_READER_REVENUE_MANAGER }
					/>
				</Fragment>
			}
			svg={ {
				desktop: BannerSVGDesktop as unknown as string,
				mobile: BannerSVGMobile as unknown as string,
				verticalPosition: 'center',
			} }
			{ ...props }
		/>
	);
}
