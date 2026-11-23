/**
 * SetupCTA layout component.
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
 * External dependencies
 */
import classnames from 'classnames';
import { ComponentProps, FC, MouseEvent } from 'react';

/**
 * WordPress dependencies
 */
import { Fragment } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { ProgressBar } from 'googlesitekit-components';
import { useDispatch } from 'googlesitekit-data';
import Banner, { BannerProps } from '@/js/components/Banner';
import { CTAButtonProps } from '@/js/components/Banner/CTAButton';
import { DismissButtonProps } from '@/js/components/Banner/DismissButton';
import { CORE_NOTIFICATIONS } from '@/js/googlesitekit/notifications/datastore/constants';
import useNotificationEvents from '@/js/googlesitekit/notifications/hooks/useNotificationEvents';
import { Cell, Grid, Row } from '@/js/material-components';
import { GATrackingEventArgs } from '@/js/types/GATrackingEventArgs';

type ButtonEvent = MouseEvent< HTMLAnchorElement | HTMLButtonElement >;

interface SetupCTADismissOptions {
	expiresInSeconds?: number;
	skipHidingFromQueue?: boolean;
}

type SetupCTABannerProps = Omit< BannerProps, 'ctaButton' | 'dismissButton' >;

type SetupCTAButtonProps = CTAButtonProps & {
	dismissOnClick?: boolean;
	dismissOptions?: SetupCTADismissOptions;
};

type SetupCTADismissButtonProps = DismissButtonProps & {
	dismissOptions?: SetupCTADismissOptions;
};

type SetupCTAProgressBarProps = Omit<
	ComponentProps< typeof ProgressBar >,
	'className'
>;

interface SetupCTAOwnProps {
	ctaButton?: SetupCTAButtonProps;
	dismissButton?: SetupCTADismissButtonProps;
	gaTrackingEventArgs?: GATrackingEventArgs;
	notificationID: string;
	waitingProgress?: SetupCTAProgressBarProps;
}

type SetupCTAProps = SetupCTAOwnProps & SetupCTABannerProps;

const SetupCTA: FC< SetupCTAProps > = ( {
	notificationID,
	title,
	description,
	errorText,
	helpText,
	learnMoreLink,
	dismissButton,
	ctaButton,
	svg,
	footer,
	gaTrackingEventArgs,
	waitingProgress,
	...props
} ) => {
	const trackEvents = useNotificationEvents(
		notificationID,
		gaTrackingEventArgs?.category
	);

	const { dismissNotification } = useDispatch( CORE_NOTIFICATIONS );

	async function handleDismissWithTrackEvent( event: ButtonEvent ) {
		await dismissButton?.onClick?.( event );

		trackEvents.dismiss(
			gaTrackingEventArgs?.label,
			gaTrackingEventArgs?.value
		);
		dismissNotification( notificationID, {
			...dismissButton?.dismissOptions,
		} );
	}

	async function handleCTAClickWithTrackEvent( event: ButtonEvent ) {
		trackEvents.confirm(
			gaTrackingEventArgs?.label,
			gaTrackingEventArgs?.value
		);

		await ctaButton?.onClick?.( event );

		if ( ctaButton?.dismissOnClick ) {
			dismissNotification( notificationID, {
				...ctaButton?.dismissOptions,
			} );
		}
	}

	async function handleLearnMoreClickWithTrackEvent() {
		trackEvents.clickLearnMore(
			gaTrackingEventArgs?.label,
			gaTrackingEventArgs?.value
		);

		await learnMoreLink?.onClick?.();
	}

	return (
		<Fragment>
			{ !! waitingProgress && (
				<ProgressBar
					className="googlesitekit-banner__progress-bar"
					{ ...waitingProgress }
				/>
			) }
			<div
				className={ classnames( 'googlesitekit-widget-context', {
					'googlesitekit-widget-context--with-progress-bar':
						!! waitingProgress,
				} ) }
			>
				<Grid>
					<Row>
						<Cell size={ 12 }>
							<Banner
								className="googlesitekit-banner--setup-cta"
								title={ title }
								description={ description }
								errorText={ errorText }
								helpText={ helpText }
								learnMoreLink={
									learnMoreLink && {
										...learnMoreLink,
										onClick:
											handleLearnMoreClickWithTrackEvent,
									}
								}
								dismissButton={
									dismissButton && {
										...dismissButton,
										onClick: handleDismissWithTrackEvent,
									}
								}
								ctaButton={
									ctaButton && {
										...ctaButton,
										onClick: handleCTAClickWithTrackEvent,
									}
								}
								svg={ svg }
								footer={ footer }
								{ ...props }
							/>
						</Cell>
					</Row>
				</Grid>
			</div>
		</Fragment>
	);
};

export default SetupCTA;
