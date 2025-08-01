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
import PropTypes from 'prop-types';

/**
 * WordPress dependencies
 */
import { Fragment } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { useDispatch } from 'googlesitekit-data';
import { CORE_NOTIFICATIONS } from '../../datastore/constants';
import useNotificationEvents from '../../hooks/useNotificationEvents';
import Banner from '../../../../components/Banner';
import LearnMoreLink from '../../../../components/Banner/LearnMoreLink';
import CTAButton from '../../../../components/Banner/CTAButton';
import DismissButton from '../../../../components/Banner/DismissButton';
import { Cell, Grid, Row } from '../../../../material-components';
import { ProgressBar } from 'googlesitekit-components';

export default function SetupCTA( {
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
} ) {
	const trackEvents = useNotificationEvents(
		notificationID,
		gaTrackingEventArgs?.category
	);

	const { dismissNotification } = useDispatch( CORE_NOTIFICATIONS );

	const handleDismissWithTrackEvent = async ( event ) => {
		await dismissButton?.onClick?.( event );
		trackEvents.dismiss(
			gaTrackingEventArgs?.label,
			gaTrackingEventArgs?.value
		);
		dismissNotification( notificationID, {
			...dismissButton?.dismissOptions,
		} );
	};

	const handleCTAClickWithTrackEvent = async ( event ) => {
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
	};

	const handleLearnMoreClickWithTrackEvent = async ( event ) => {
		trackEvents.clickLearnMore(
			gaTrackingEventArgs?.label,
			gaTrackingEventArgs?.value
		);
		await learnMoreLink?.onClick?.( event );
	};

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
}

SetupCTA.propTypes = {
	notificationID: PropTypes.string,
	title: PropTypes.string,
	description: PropTypes.oneOfType( [ PropTypes.string, PropTypes.node ] ),
	errorText: PropTypes.string,
	helpText: PropTypes.string,
	learnMoreLink: PropTypes.shape( LearnMoreLink.propTypes ),
	dismissButton: PropTypes.shape( DismissButton.propTypes ),
	ctaButton: PropTypes.shape( CTAButton.propTypes ),
	svg: PropTypes.shape( {
		desktop: PropTypes.elementType,
		mobile: PropTypes.elementType,
		verticalPosition: PropTypes.oneOf( [ 'top', 'center', 'bottom' ] ),
	} ),
	footer: PropTypes.node,
	gaTrackingEventArgs: PropTypes.shape( {
		category: PropTypes.string,
		label: PropTypes.string,
		value: PropTypes.number,
	} ),
	waitingProgress: PropTypes.shape( ProgressBar.propTypes ),
};
