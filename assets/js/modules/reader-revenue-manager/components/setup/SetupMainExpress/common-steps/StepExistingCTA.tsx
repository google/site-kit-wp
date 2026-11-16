/**
 * Reader Revenue Manager express setup existing CTA step.
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
import { createInterpolateElement, useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { Button } from 'googlesitekit-components';
import { Select, useDispatch, useSelect } from 'googlesitekit-data';
import Typography from '@/js/components/Typography';
import { CORE_LOCATION } from '@/js/googlesitekit/datastore/location/constants';
import { CORE_SITE } from '@/js/googlesitekit/datastore/site/constants';
import { ExpressSetupStepHeadline } from '@/js/modules/reader-revenue-manager/components/common';
import ModuleSettingsLink from '@/js/modules/reader-revenue-manager/components/setup/SetupMainExpress/ModuleSettingsLink';
import StepSetupCompleteDetail from '@/js/modules/reader-revenue-manager/components/setup/SetupMainExpress/StepSetupCompleteDetail';
import {
	SetupStep,
	SetupStepProps,
} from '@/js/modules/reader-revenue-manager/components/setup/SetupMainExpress/types';
import { EXPRESS_SETUP_STEPS } from '@/js/modules/reader-revenue-manager/datastore/constants';

interface StepExistingCTAProps extends SetupStepProps {
	/**
	 * The heading, naming the type of CTA the publication already has.
	 */
	title?: string;

	/**
	 * The text below the heading.
	 */
	description?: ReactNode;

	/**
	 * The text of the "Targeting" row.
	 */
	targetingDescription?: ReactNode;
}

const StepExistingCTA: FC< StepExistingCTAProps > = ( {
	title,
	description,
	targetingDescription,
	onComplete,
} ) => {
	const { navigateTo } = useDispatch( CORE_LOCATION );

	const dashboardURL = useSelect(
		( select: Select ) =>
			select( CORE_SITE ).getAdminURL( 'googlesitekit-dashboard' ),
		[]
	);

	// The button completes this last step, so the flow can track it before the
	// page is left.
	const onReturnClick = useCallback( async () => {
		await onComplete();

		if ( dashboardURL ) {
			navigateTo( dashboardURL );
		}
	}, [ dashboardURL, navigateTo, onComplete ] );

	return (
		<div className="googlesitekit-rrm-express-setup-complete googlesitekit-rrm-express-setup-existing-cta">
			<div className="googlesitekit-rrm-express-setup-complete__content">
				<div className="googlesitekit-rrm-express-setup-complete__header">
					<ExpressSetupStepHeadline className="googlesitekit-rrm-express-setup-step__headline">
						{ title }
					</ExpressSetupStepHeadline>
				</div>
				<Typography
					as="p"
					type="body"
					size="large"
					className="googlesitekit-rrm-express-setup-existing-cta__description"
				>
					{ description }
				</Typography>
				<div className="googlesitekit-rrm-express-setup-complete__detail-list">
					<StepSetupCompleteDetail
						title={ __( 'Placement', 'google-site-kit' ) }
					>
						{ createInterpolateElement(
							__(
								'To change where Reader Revenue Manager CTAs appear on your site, go to <a>Site Kit settings</a>.',
								'google-site-kit'
							),
							{
								a: (
									<ModuleSettingsLink eventName="click_change_placement_settings_link" />
								),
							}
						) }
					</StepSetupCompleteDetail>
					<StepSetupCompleteDetail
						title={ __( 'Targeting', 'google-site-kit' ) }
					>
						{ targetingDescription }
					</StepSetupCompleteDetail>
				</div>
			</div>
			<div className="googlesitekit-rrm-express-setup-complete__actions">
				{ /* @ts-expect-error `Button` component is not yet typed. */ }
				<Button onClick={ onReturnClick }>
					{ __( 'Return to Dashboard', 'google-site-kit' ) }
				</Button>
			</div>
		</div>
	);
};

export const existingCTAStep: SetupStep = {
	slug: EXPRESS_SETUP_STEPS.EXISTING_CTA,
	// Not currently shown, as this step is displayed without the stepper.
	label: __( 'CTA already exists', 'google-site-kit' ),
	Component: StepExistingCTA,
};

export default StepExistingCTA;
