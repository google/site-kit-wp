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
import {
	Fragment,
	createInterpolateElement,
	useState,
} from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { Select, useDispatch, useSelect } from 'googlesitekit-data';
import Banner from '@/js/components/Banner';
import Link from '@/js/components/Link';
import PoweredByModule from '@/js/components/PoweredByModule';
import { SIZE_MEDIUM } from '@/js/components/Typography/constants';
import P from '@/js/components/Typography/P';
import { CORE_SITE } from '@/js/googlesitekit/datastore/site/constants';
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import { CORE_MODULES } from '@/js/googlesitekit/modules/datastore/constants';
import type { WidgetComponentProps } from '@/js/googlesitekit/widgets/util/get-widget-component-props';
import useActivateModuleCallback from '@/js/hooks/useActivateModuleCallback';
import {
	MODULE_SLUG_READER_REVENUE_MANAGER,
	RRM_EXPRESS_SETUP_TRAFFIC_CTA_DISMISSED_KEY,
} from '@/js/modules/reader-revenue-manager/constants';
import BannerSVGMobile from '@/svg/graphics/banner-rrm-setup-cta-widget-mobile.svg?url';
import BannerSVGDesktop from '@/svg/graphics/banner-rrm-setup-cta-widget.svg?url';

export default function ReaderRevenueManagerSetupCTABannerWidget( {
	Widget,
}: WidgetComponentProps ) {
	const activateReaderRevenueManager = useActivateModuleCallback(
		MODULE_SLUG_READER_REVENUE_MANAGER,
		{
			redirectQueryArgs: {
				expressSetup: 'true',
				cta: 'newsletter-signup',
			},
		}
	);

	const [ isInProgress, setIsInProgress ] = useState( false );

	const { dismissItem } = useDispatch( CORE_USER );

	const documentationLinkURL = useSelect(
		( select: Select ) =>
			select( CORE_SITE ).getDocumentationLinkURL( 'rrm-newsletter' ),
		[]
	);

	const isDismissingWidget = useSelect(
		( select: Select ) =>
			select( CORE_USER ).isDismissingItem(
				RRM_EXPRESS_SETUP_TRAFFIC_CTA_DISMISSED_KEY
			),
		[]
	);

	const isFetchingSetModuleActivation = useSelect( ( select: Select ) => {
		return select( CORE_MODULES ).isFetchingSetModuleActivation(
			MODULE_SLUG_READER_REVENUE_MANAGER,
			true
		);
	}, [] );

	const isBusy =
		isDismissingPrompt || isFetchingSetModuleActivation || isInProgress;

	function handleCTAClick() {
		if ( ! activateReaderRevenueManager ) {
			return;
		}

		setIsInProgress( true );
		activateReaderRevenueManager();
	}

	async function handleDismissClick() {
		await dismissItem( RRM_EXPRESS_SETUP_TRAFFIC_CTA_DISMISSED_KEY );
	}

	return (
		<Widget noPadding>
			<Banner
				className="googlesitekit-rrm-setup-cta-banner-widget"
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
				ctaButton={ {
					label: __( 'Set up a sign-up form', 'google-site-kit' ),
					onClick: handleCTAClick,
					disabled: isBusy,
					inProgress: isInProgress,
				} }
				dismissButton={ {
					label: __( 'No thanks', 'google-site-kit' ),
					onClick: handleDismissClick,
					disabled: isBusy,
				} }
				svg={ {
					desktop: BannerSVGDesktop as unknown as string,
					mobile: BannerSVGMobile as unknown as string,
					verticalPosition: 'center',
				} }
			/>
		</Widget>
	);
}
