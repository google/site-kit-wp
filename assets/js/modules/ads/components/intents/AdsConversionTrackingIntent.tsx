/**
 * AdsConversionTrackingIntent component.
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
import { FC } from 'react';

/**
 * WordPress dependencies
 */
import { useCallback, useState } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { Button, SpinnerButton } from 'googlesitekit-components';
import { Select, useDispatch, useSelect } from 'googlesitekit-data';
import ErrorNotice from '@/js/components/ErrorNotice';
import Typography from '@/js/components/Typography';
import {
	SIZE_LARGE,
	SIZE_MEDIUM,
	SIZE_SMALL,
	TYPE_BODY,
	TYPE_HEADLINE,
	TYPE_LABEL,
} from '@/js/components/Typography/constants';
import { CORE_LOCATION } from '@/js/googlesitekit/datastore/location/constants';
import { IntentComponentProps } from '@/js/googlesitekit/intents';
import { MODULES_ADS } from '@/js/modules/ads/datastore/constants';
import { formatDate } from '@/js/util';
import { ErrorObject } from '@/js/util/errors';
import AdsConversionTrackingIntentGraphic from '@/svg/graphics/ads-conversion-tracking-intent.svg';
import AdsIcon from '@/svg/graphics/ads.svg';
import CheckFillIcon from '@/svg/icons/check-fill.svg';
import AdsConversionTrackingIntentStep from './AdsConversionTrackingIntentStep';

/* eslint-disable camelcase -- The Site Kit Service names the payload fields in snake case. */
interface AdsConversionTrackingIntentPayload {
	/** Google tag ID the Google Ads console suggests, e.g. `AW-123456789`. */
	tag_id: string;
	/** Name of the Google Ads account the tag belongs to. */
	customer_name?: string;
	/** Date the user gave Site Kit access to their Google Ads data, in `YYYY-MM-DD`. */
	consent_date?: string;
}
/* eslint-enable camelcase */

const AdsConversionTrackingIntent: FC< IntentComponentProps > = ( {
	intentCode,
	payload,
} ) => {
	const {
		tag_id: tagID,
		customer_name: customerName,
		consent_date: consentDate,
	} = payload as unknown as AdsConversionTrackingIntentPayload;

	const isTagConfirmed = useSelect(
		( select: Select ) =>
			select( MODULES_ADS ).isConversionTrackingIntentTagConfirmed(),
		[]
	);
	const [ isPlacingTag, setIsPlacingTag ] = useState( false );
	const [ error, setError ] = useState< ErrorObject >();

	const {
		completeConversionTrackingIntent,
		confirmConversionTrackingIntentTag,
	} = useDispatch( MODULES_ADS );
	const { navigateTo } = useDispatch( CORE_LOCATION );

	const onConfirmTag = useCallback( () => {
		confirmConversionTrackingIntentTag();
	}, [ confirmConversionTrackingIntentTag ] );

	const onPlaceTag = useCallback( async () => {
		setError( undefined );
		setIsPlacingTag( true );

		try {
			const { returnURL, error: placeTagError } =
				await completeConversionTrackingIntent( intentCode, tagID );

			// A returned error is shown the same way as a thrown one.
			if ( placeTagError ) {
				throw placeTagError;
			}

			// The spinner keeps running while the browser leaves for Google Ads.
			navigateTo( returnURL );
		} catch ( err ) {
			// Every step can be tried again, so a failure leaves the button usable.
			setError( err as ErrorObject );
		} finally {
			setIsPlacingTag( false );
		}
	}, [ completeConversionTrackingIntent, intentCode, navigateTo, tagID ] );

	const formattedConsentDate = formatDate( consentDate, { month: 'long' } );

	return (
		<div className="googlesitekit-ads-conversion-tracking-intent">
			<div className="googlesitekit-ads-conversion-tracking-intent__content">
				<div className="googlesitekit-ads-conversion-tracking-intent__header">
					<Typography
						as="h1"
						className="googlesitekit-ads-conversion-tracking-intent__title"
						size={ SIZE_MEDIUM }
						type={ TYPE_HEADLINE }
					>
						{ __(
							'Start measuring your ad results',
							'google-site-kit'
						) }
					</Typography>
					<Typography
						as="p"
						className="googlesitekit-ads-conversion-tracking-intent__description"
						size={ SIZE_LARGE }
						type={ TYPE_BODY }
					>
						{ __(
							'Site Kit is already installed on your site, so there’s just one thing to add. Site Kit will place a Google tag, a small piece of code, on every page so Google Ads can measure what happens after someone clicks your ad.',
							'google-site-kit'
						) }
					</Typography>
				</div>

				{ error && (
					<ErrorNotice
						className="googlesitekit-ads-conversion-tracking-intent__error"
						error={ error }
					/>
				) }

				<ol className="googlesitekit-ads-conversion-tracking-intent__steps">
					<AdsConversionTrackingIntentStep
						title={ __(
							'Confirm the tag it found for your Google Ads account',
							'google-site-kit'
						) }
						isActive
					>
						<div className="googlesitekit-ads-conversion-tracking-intent__tag">
							<span className="googlesitekit-ads-conversion-tracking-intent__tag-logo">
								<AdsIcon
									aria-hidden="true"
									height={ 24 }
									width={ 24 }
								/>
							</span>
							<div className="googlesitekit-ads-conversion-tracking-intent__tag-details">
								<Typography
									as="p"
									className="googlesitekit-ads-conversion-tracking-intent__tag-name"
									size={ SIZE_MEDIUM }
									type={ TYPE_LABEL }
								>
									{ __( 'Google Ads', 'google-site-kit' ) }
								</Typography>
								<Typography
									as="p"
									className="googlesitekit-ads-conversion-tracking-intent__tag-id"
									size={ SIZE_SMALL }
									type={ TYPE_BODY }
								>
									{ customerName
										? sprintf(
												/* translators: 1: Google tag ID, e.g. "AW-123456789". 2: Name of the Google Ads account the tag belongs to. */
												__(
													'%1$s • %2$s',
													'google-site-kit'
												),
												tagID,
												customerName
										  )
										: tagID }
								</Typography>
							</div>
						</div>

						<div className="googlesitekit-ads-conversion-tracking-intent__notes">
							<Typography
								as="p"
								className="googlesitekit-ads-conversion-tracking-intent__note"
								size={ SIZE_SMALL }
								type={ TYPE_BODY }
							>
								{ __(
									'You can change this later in the Site Kit settings.',
									'google-site-kit'
								) }
							</Typography>
							{ formattedConsentDate && (
								<Typography
									as="p"
									className="googlesitekit-ads-conversion-tracking-intent__note"
									size={ SIZE_SMALL }
									type={ TYPE_BODY }
								>
									{ sprintf(
										/* translators: %s: Date the user gave Site Kit access to their Google Ads data, e.g. "July 28, 2026". */
										__(
											'This account is shown because you gave Site Kit access to your Google Ads data on %s.',
											'google-site-kit'
										),
										formattedConsentDate
									) }
								</Typography>
							) }
						</div>

						{ /* @ts-expect-error `Button` component is not yet typed. */ }
						<Button
							className={ classnames(
								'googlesitekit-ads-conversion-tracking-intent__confirm-tag',
								{
									'googlesitekit-ads-conversion-tracking-intent__confirm-tag--confirmed':
										isTagConfirmed,
								}
							) }
							onClick={ onConfirmTag }
							trailingIcon={
								isTagConfirmed ? (
									<CheckFillIcon
										aria-hidden="true"
										className="googlesitekit-ads-conversion-tracking-intent__confirm-tag-icon"
										height={ 24 }
										width={ 24 }
									/>
								) : undefined
							}
							disabled={ isTagConfirmed }
						>
							{ isTagConfirmed
								? __( 'Tag confirmed', 'google-site-kit' )
								: __( 'Confirm tag', 'google-site-kit' ) }
						</Button>
					</AdsConversionTrackingIntentStep>

					<AdsConversionTrackingIntentStep
						title={ __(
							'Finish setup in Google Ads',
							'google-site-kit'
						) }
						isActive={ isTagConfirmed }
					>
						<Typography
							as="p"
							className="googlesitekit-ads-conversion-tracking-intent__step-description"
							size={ SIZE_MEDIUM }
							type={ TYPE_BODY }
						>
							{ __(
								'Once we’ll place the tag on your site, you’ll be directed back to Google Ads. You’ll choose a conversion action, which is the visitor activity you want to measure, like a purchase or a form submission. Your tag starts recording results once that’s done.',
								'google-site-kit'
							) }
						</Typography>

						{ /* @ts-expect-error `SpinnerButton` component is not yet typed. */ }
						<SpinnerButton
							className="googlesitekit-ads-conversion-tracking-intent__place-tag"
							onClick={ onPlaceTag }
							disabled={ ! isTagConfirmed || isPlacingTag }
							isSaving={ isPlacingTag }
						>
							{ __(
								'Place tag and return to Google Ads',
								'google-site-kit'
							) }
						</SpinnerButton>
					</AdsConversionTrackingIntentStep>
				</ol>
			</div>

			<div className="googlesitekit-ads-conversion-tracking-intent__graphic">
				<AdsConversionTrackingIntentGraphic
					aria-hidden="true"
					height={ 270 }
					width={ 495 }
				/>
			</div>
		</div>
	);
};

export default AdsConversionTrackingIntent;
