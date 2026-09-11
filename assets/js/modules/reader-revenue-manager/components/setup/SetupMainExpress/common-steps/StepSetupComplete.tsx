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
import { Select, useDispatch, useSelect } from 'googlesitekit-data';
import Typography from '@/js/components/Typography';
import { CORE_LOCATION } from '@/js/googlesitekit/datastore/location/constants';
import { CORE_SITE } from '@/js/googlesitekit/datastore/site/constants';
import useQueryArg from '@/js/hooks/useQueryArg';
import { ExpressSetupStepHeadline } from '@/js/modules/reader-revenue-manager/components/common';
import SuccessIcon from '@/svg/graphics/rrm-express-setup-success.svg';

interface StepSetupCompleteProps {
	title?: string;
	children?: ReactNode;
	secondaryCTA?: ReactNode;
}

const StepSetupComplete: FC< StepSetupCompleteProps > = ( {
	title = __( 'Reader Revenue Manager is set up', 'google-site-kit' ),
	children,
	secondaryCTA,
} ) => {
	const [ cta ] = useQueryArg( 'cta' );

	const dashboardURL = useSelect(
		( select: Select ) =>
			select( CORE_SITE ).getAdminURL( 'googlesitekit-dashboard' ),
		[]
	);

	const { navigateTo } = useDispatch( CORE_LOCATION );

	const onReturnToDashboardClick = useCallback( () => {
		if ( dashboardURL ) {
			navigateTo( dashboardURL );
		}
	}, [ dashboardURL, navigateTo ] );

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

export default StepSetupComplete;
