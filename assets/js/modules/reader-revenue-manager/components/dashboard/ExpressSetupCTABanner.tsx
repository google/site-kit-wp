/**
 * Reader Revenue Manager Express Setup CTA Banner component.
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
 * External dependencies
 */
import classnames from 'classnames';
import { ComponentProps } from 'react';

/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { Select, useSelect } from 'googlesitekit-data';
import PoweredByModule from '@/js/components/PoweredByModule';
import { CORE_SITE } from '@/js/googlesitekit/datastore/site/constants';
import SetupCTA from '@/js/googlesitekit/notifications/components/layout/SetupCTA';
import useActivateModuleCallback from '@/js/hooks/useActivateModuleCallback';
import { EXPRESS_SETUP_SCOPES } from '@/js/modules/reader-revenue-manager/components/setup/SetupMainExpress/constants';
import { MODULE_SLUG_READER_REVENUE_MANAGER } from '@/js/modules/reader-revenue-manager/constants';
import {
	EXPRESS_SETUP_CTAS,
	ExpressSetupCTAType,
} from '@/js/modules/reader-revenue-manager/datastore/constants';

type ExpressSetupCTABannerSetupCTAProps = Omit<
	ComponentProps< typeof SetupCTA >,
	| 'additionalDescription'
	| 'className'
	| 'ctaButton'
	| 'dismissButton'
	| 'learnMoreLink'
>;

interface ExpressSetupCTABannerOwnProps {
	additionalScopes?: string[];
	ctaButtonLabel: string;
	ctaType: ExpressSetupCTAType;
}

type ExpressSetupCTABannerProps = ExpressSetupCTABannerOwnProps &
	ExpressSetupCTABannerSetupCTAProps;

const DOC_SLUGS = {
	[ EXPRESS_SETUP_CTAS.NEWSLETTER_SIGNUP ]: 'rrm-newsletter',
	[ EXPRESS_SETUP_CTAS.SURVEY ]: 'rrm-survey',
};

export default function ExpressSetupCTABanner( {
	additionalScopes = [],
	ctaButtonLabel,
	ctaType,
	...props
}: ExpressSetupCTABannerProps ) {
	const [ isActivating, setIsActivating ] = useState( false );

	const documentationLinkURL = useSelect(
		( select: Select ) =>
			select( CORE_SITE ).getDocumentationLinkURL( DOC_SLUGS[ ctaType ] ),
		[ ctaType ]
	);

	const activateReaderRevenueManager = useActivateModuleCallback(
		MODULE_SLUG_READER_REVENUE_MANAGER,
		{
			redirectQueryArgs: {
				expressSetup: 'true',
				cta: ctaType,
			},
			additionalScopes: [ ...EXPRESS_SETUP_SCOPES, ...additionalScopes ],
		}
	);

	function onClick() {
		if ( ! activateReaderRevenueManager ) {
			return;
		}

		setIsActivating( true );
		activateReaderRevenueManager();
	}

	return (
		<SetupCTA
			{ ...props }
			additionalDescription={
				<PoweredByModule slug={ MODULE_SLUG_READER_REVENUE_MANAGER } />
			}
			className={ classnames(
				'googlesitekit-banner--express-setup-cta',
				`googlesitekit-banner--express-setup-${ ctaType }`
			) }
			ctaButton={ {
				disabled: isActivating,
				dismissOnClick: true,
				dismissOptions: { skipHidingFromQueue: true },
				inProgress: isActivating,
				label: ctaButtonLabel,
				onClick,
			} }
			dismissButton={ {
				disabled: isActivating,
				label: __( 'No thanks', 'google-site-kit' ),
			} }
			learnMoreLink={ {
				href: documentationLinkURL,
				hideExternalIndicator: true,
			} }
		/>
	);
}
