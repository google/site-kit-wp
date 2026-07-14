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
import { Fragment, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { addQueryArgs } from '@wordpress/url';

/**
 * Internal dependencies
 */
import { Select, useDispatch, useSelect } from 'googlesitekit-data';
import Banner from '@/js/components/Banner';
import Link from '@/js/components/Link';
import { SIZE_MEDIUM } from '@/js/components/Typography/constants';
import P from '@/js/components/Typography/P';
import { setItem } from '@/js/googlesitekit/api/cache';
import { CORE_LOCATION } from '@/js/googlesitekit/datastore/location/constants';
import { CORE_SITE } from '@/js/googlesitekit/datastore/site/constants';
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import { CORE_MODULES } from '@/js/googlesitekit/modules/datastore/constants';
import type { WidgetComponentProps } from '@/js/googlesitekit/widgets/util/get-widget-component-props';
import useViewOnly from '@/js/hooks/useViewOnly';
import { PoweredByReaderRevenueManager } from '@/js/modules/reader-revenue-manager/components/common';
import {
	MODULE_SLUG_READER_REVENUE_MANAGER,
	RRM_EXPRESS_SETUP_TRAFFIC_CTA_DISMISSED_KEY,
} from '@/js/modules/reader-revenue-manager/constants';
import BannerSVGMobile from '@/svg/graphics/banner-rrm-setup-cta-widget-mobile.svg?url';
import BannerSVGDesktop from '@/svg/graphics/banner-rrm-setup-cta-widget.svg?url';

export default function ReaderRevenueManagerSetupCTABannerWidget( {
	Widget,
	WidgetNull,
}: WidgetComponentProps ) {
	const [ isInProgress, setIsInProgress ] = useState( false );

	const { activateModule } = useDispatch( CORE_MODULES );
	const { navigateTo } = useDispatch( CORE_LOCATION );
	const { dismissPrompt } = useDispatch( CORE_USER );
	const { setInternalServerError } = useDispatch( CORE_SITE );

	const documentationLinkURL = useSelect(
		( select: Select ) =>
			select( CORE_SITE ).getDocumentationLinkURL( 'rrm-newsletter' ),
		[]
	);

	const isDismissingPrompt = useSelect(
		( select: Select ) =>
			select( CORE_USER ).isDismissingPrompt(
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

	const isModuleConnected = useSelect(
		( select: Select ) =>
			select( CORE_MODULES ).isModuleConnected(
				MODULE_SLUG_READER_REVENUE_MANAGER
			),
		[]
	);

	const isPromptDismissed = useSelect(
		( select: Select ) =>
			select( CORE_USER ).isPromptDismissed(
				RRM_EXPRESS_SETUP_TRAFFIC_CTA_DISMISSED_KEY
			),
		[]
	);

	const viewOnlyDashboard = useViewOnly();

	const isBusy =
		isDismissingPrompt || isFetchingSetModuleActivation || isInProgress;

	const shouldShowWidget =
		isModuleConnected === false &&
		isPromptDismissed === false &&
		viewOnlyDashboard === false;

	async function handleCTAClick() {
		setIsInProgress( true );

		const { error, response } = await activateModule(
			MODULE_SLUG_READER_REVENUE_MANAGER
		);

		if ( error ) {
			setIsInProgress( false );

			setInternalServerError( {
				id: `${ MODULE_SLUG_READER_REVENUE_MANAGER }-setup-error`,
				description: error.message,
			} );

			return null;
		}

		await setItem( 'module_setup', MODULE_SLUG_READER_REVENUE_MANAGER, {
			ttl: 300,
		} );

		navigateTo(
			addQueryArgs( response.moduleReauthURL, {
				cta: 'newsletter',
				expressSetup: 'true',
			} )
		);

		return null;
	}

	async function handleDismissClick() {
		await dismissPrompt( RRM_EXPRESS_SETUP_TRAFFIC_CTA_DISMISSED_KEY );
	}

	if ( ! shouldShowWidget ) {
		return <WidgetNull />;
	}

	return (
		<Widget noPadding>
			<Banner
				className="googlesitekit-banner--rrm-setup"
				title={ __(
					'Collect reader emails with a sign-up form',
					'google-site-kit'
				) }
				description={
					<Fragment>
						<P size={ SIZE_MEDIUM }>
							{ __(
								'Create a newsletter sign-up form to help turn visitors into loyal readers.',
								'google-site-kit'
							) }{ ' ' }
							<Link
								href={ documentationLinkURL }
								external
								hideExternalIndicator
							>
								{ __( 'Learn more', 'google-site-kit' ) }
							</Link>
						</P>
						<PoweredByReaderRevenueManager />
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
