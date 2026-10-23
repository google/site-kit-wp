/**
 * Reader Revenue Manager express setup completion step.
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
import { FC, ReactNode } from 'react';

/**
 * WordPress dependencies
 */
import { useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { Button } from 'googlesitekit-components';
import {
	Registry,
	Select,
	useDispatch,
	useRegistry,
	useSelect,
} from 'googlesitekit-data';
import Typography from '@/js/components/Typography';
import { CORE_LOCATION } from '@/js/googlesitekit/datastore/location/constants';
import { CORE_SITE } from '@/js/googlesitekit/datastore/site/constants';
import { getPendingSetupReturnURL } from '@/js/googlesitekit/feature-discovery/pending-setup';
import useQueryArg from '@/js/hooks/useQueryArg';
import { ExpressSetupStepHeadline } from '@/js/modules/reader-revenue-manager/components/common';
import {
	SetupStep,
	SetupStepProps,
} from '@/js/modules/reader-revenue-manager/components/setup/SetupMainExpress/types';
import {
	EXPRESS_SETUP_CTAS,
	EXPRESS_SETUP_STEPS,
} from '@/js/modules/reader-revenue-manager/datastore/constants';
import SuccessIcon from '@/svg/graphics/rrm-express-setup-success.svg';

// The Feature Discovery catalog's slug for the newsletter sign-up feature.
// This is the feature slug, not the CTA slug, even though the values match.
const FEATURE_SLUG_NEWSLETTER_SIGNUP = 'newsletter-signup';

interface StepSetupCompleteProps extends SetupStepProps {
	title?: string;
	children?: ReactNode;
	secondaryCTA?: ReactNode;
}

const StepSetupComplete: FC< StepSetupCompleteProps > = ( {
	title = __( 'Reader Revenue Manager is set up', 'google-site-kit' ),
	children,
	secondaryCTA,
	onComplete,
} ) => {
	const [ cta ] = useQueryArg( 'cta' );

	const dashboardURL = useSelect(
		( select: Select ) =>
			select( CORE_SITE ).getAdminURL( 'googlesitekit-dashboard' ),
		[]
	);

	const { navigateTo } = useDispatch( CORE_LOCATION );
	// `@wordpress/data` types `useRegistry()` as returning `Function`.
	const registry = useRegistry() as unknown as Registry;

	// "Return to Dashboard" completes this last step, so the flow can track it
	// before the page is left.
	const onReturnToDashboardClick = useCallback( async () => {
		await onComplete();

		// Where the newsletter sign-up form was set up from the hub, return
		// the user there rather than to the dashboard.
		if ( cta === EXPRESS_SETUP_CTAS.NEWSLETTER_SIGNUP ) {
			const hubURL = await getPendingSetupReturnURL(
				registry.select as Select,
				FEATURE_SLUG_NEWSLETTER_SIGNUP
			);

			if ( hubURL ) {
				navigateTo( hubURL );
				return;
			}
		}

		if ( dashboardURL ) {
			navigateTo( dashboardURL );
		}
	}, [ cta, dashboardURL, navigateTo, onComplete, registry ] );

	// The CTA details only make sense within a CTA-specific setup flow, which
	// is identified by the `cta` query argument.
	const showCTADetails = !! cta && !! children;

	return (
		<div className="googlesitekit-rrm-express-setup-complete">
			<div className="googlesitekit-rrm-express-setup-complete__content">
				<div className="googlesitekit-rrm-express-setup-complete__header">
					<SuccessIcon
						className="googlesitekit-rrm-express-setup-complete__icon"
						width={ 36 }
						height={ 36 }
					/>
					<ExpressSetupStepHeadline className="googlesitekit-rrm-express-setup-step__headline">
						{ title }
					</ExpressSetupStepHeadline>
				</div>
				{ showCTADetails && (
					<div className="googlesitekit-rrm-express-setup-complete__details">
						<Typography
							as="h2"
							type="label"
							size="large"
							className="googlesitekit-rrm-express-setup-complete__details-title"
						>
							{ __(
								'What to know about your new CTA:',
								'google-site-kit'
							) }
						</Typography>
						<div className="googlesitekit-rrm-express-setup-complete__detail-list">
							{ children }
						</div>
					</div>
				) }
			</div>
			<div className="googlesitekit-rrm-express-setup-complete__actions">
				{ /* @ts-expect-error `Button` component is not yet typed. */ }
				<Button onClick={ onReturnToDashboardClick }>
					{ __( 'Return to Dashboard', 'google-site-kit' ) }
				</Button>
				{ secondaryCTA }
			</div>
		</div>
	);
};

export const setupCompleteStep: SetupStep = {
	slug: EXPRESS_SETUP_STEPS.SETUP_COMPLETE,
	label: __( 'Setup complete', 'google-site-kit' ),
	Component: StepSetupComplete,
};

export default StepSetupComplete;
