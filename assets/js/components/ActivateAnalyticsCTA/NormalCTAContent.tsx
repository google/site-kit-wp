/**
 * ActivateAnalyticsCTA normal state content.
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
import { createInterpolateElement, forwardRef } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { Button, SpinnerButton } from 'googlesitekit-components';
import Link from '@/js/components/Link';
import { SIZE_MEDIUM } from '@/js/components/Typography/constants';
import P from '@/js/components/Typography/P';
import AnalyticsIcon from '@/svg/graphics/analytics.svg';

type TrackEvents = {
	clickLearnMore: ( analyticsEventLabel?: string ) => void;
	confirm: ( analyticsEventLabel?: string ) => void;
};

type NormalCTAContentProps = {
	documentationURL?: string | null;
	analyticsEventLabel?: string;
	handleDismiss: () => void;
	inProgress: boolean;
	onClickCallback: () => void;
	analyticsModuleActive: boolean;
	trackEvents: TrackEvents;
};

const NormalCTAContent = forwardRef< HTMLDivElement, NormalCTAContentProps >(
	(
		{
			documentationURL,
			analyticsEventLabel,
			handleDismiss,
			inProgress,
			onClickCallback,
			analyticsModuleActive,
			trackEvents,
		},
		ref
	) => (
		<div ref={ ref } className="googlesitekit-activate-analytics-cta">
			<div className="googlesitekit-activate-analytics-cta__top">
				<div className="googlesitekit-activate-analytics-cta__icon">
					<AnalyticsIcon width={ 28 } height={ 31 } />
				</div>
				<P
					className="googlesitekit-activate-analytics-cta__description"
					size={ SIZE_MEDIUM }
				>
					{ createInterpolateElement(
						__(
							'See how many people visit your site from Search and track how you’re achieving your goals. <a>Learn more</a>',
							'google-site-kit'
						),
						{
							a: (
								<Link
									href={ documentationURL ?? undefined }
									onClick={ () => {
										trackEvents.clickLearnMore(
											analyticsEventLabel
										);
									} }
									external
								/>
							),
						}
					) }
				</P>
			</div>
			<div className="googlesitekit-activate-analytics-cta__actions">
				{ /* @ts-expect-error `Button` component is not yet typed. */ }
				<Button
					className="googlesitekit-activate-analytics-cta__button--secondary"
					onClick={ handleDismiss }
					tertiary
				>
					{ __( 'Maybe later', 'google-site-kit' ) }
				</Button>
				{ /* @ts-expect-error `SpinnerButton` component type does not include children yet. */ }
				<SpinnerButton
					className="googlesitekit-activate-analytics-cta__button--primary"
					onClick={ () => {
						onClickCallback();
						trackEvents.confirm( analyticsEventLabel );
					} }
					isSaving={ inProgress }
					disabled={ inProgress }
				>
					{ analyticsModuleActive
						? __( 'Complete setup', 'google-site-kit' )
						: __( 'Set up Analytics', 'google-site-kit' ) }
				</SpinnerButton>
			</div>
		</div>
	)
);

NormalCTAContent.displayName = 'NormalCTAContent';

export default NormalCTAContent;
