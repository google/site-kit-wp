/**
 * BannerNotification layout component.
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
import WarningDesktopSVG from '@/svg/graphics/banner-warning.svg?url';
import ErrorDesktopSVG from '@/svg/graphics/banner-error.svg?url';

export const TYPES = {
	INFO: 'info',
	ERROR: 'error',
	WARNING: 'warning',
};

export default function BannerNotification( {
	notificationID,
	type = TYPES.INFO,
	learnMoreLink,
	dismissButton,
	ctaButton,
	gaTrackingEventArgs,
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

	let SVGData = props?.svg;

	if ( ! SVGData && type !== TYPES.INFO ) {
		SVGData = {
			desktop: undefined,
			mobile: undefined,
			verticalPosition: 'center',
		};

		if ( type === TYPES.WARNING ) {
			SVGData.desktop = WarningDesktopSVG;
		}

		if ( type === TYPES.ERROR ) {
			SVGData.desktop = ErrorDesktopSVG;
		}
	}

	return (
		<div
			className={ classnames(
				'googlesitekit-banner-notification',
				`googlesitekit-banner-notification--${ type }`
			) }
		>
			<Grid className="googlesitekit-page-content">
				<Row>
					<Cell size={ 12 }>
						<Banner
							learnMoreLink={
								learnMoreLink && {
									...learnMoreLink,
									onClick: handleLearnMoreClickWithTrackEvent,
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
							svg={ SVGData }
							{ ...props }
						/>
					</Cell>
				</Row>
			</Grid>
		</div>
	);
}

BannerNotification.propTypes = {
	notificationID: PropTypes.string.isRequired,
	type: PropTypes.oneOf( Object.values( TYPES ) ),
	title: PropTypes.string,
	description: PropTypes.oneOfType( [ PropTypes.string, PropTypes.node ] ),
	learnMoreLink: PropTypes.shape( LearnMoreLink.propTypes ),
	dismissButton: PropTypes.shape( DismissButton.propTypes ),
	ctaButton: PropTypes.shape( CTAButton.propTypes ),
	gaTrackingEventArgs: PropTypes.shape( {
		category: PropTypes.string,
		label: PropTypes.string,
		value: PropTypes.number,
	} ),
};
