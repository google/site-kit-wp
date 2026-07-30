/**
 * RRM ExpressSetupBannerWidget component.
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
import { useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { Select, useDispatch, useSelect } from 'googlesitekit-data';
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import { CORE_MODULES } from '@/js/googlesitekit/modules/datastore/constants';
import type { WidgetComponentProps } from '@/js/googlesitekit/widgets/util/get-widget-component-props';
import useActivateModuleCallback from '@/js/hooks/useActivateModuleCallback';
import ExpressSetupBanner from '@/js/modules/reader-revenue-manager/components/dashboard/ExpressSetupBannerWidget/ExpressSetupBanner';
import {
	MODULE_SLUG_READER_REVENUE_MANAGER,
	RRM_EXPRESS_SETUP_TRAFFIC_CTA_DISMISSED_KEY,
} from '@/js/modules/reader-revenue-manager/constants';

export default function ExpressSetupBannerWidget( {
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

	const isDismissingItem = useSelect(
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
		isDismissingItem || isFetchingSetModuleActivation || isInProgress;

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
			<ExpressSetupBanner
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
			/>
		</Widget>
	);
}
