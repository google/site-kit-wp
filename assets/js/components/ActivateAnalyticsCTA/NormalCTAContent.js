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
 * External dependencies
 */
import PropTypes from 'prop-types';

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
import AnalyticsIcon from '@/svg/graphics/analytics.svg';

const NormalCTAContent = forwardRef(
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
				<p className="googlesitekit-activate-analytics-cta__description">
					{ createInterpolateElement(
						__(
							'See how many people visit your site from Search and track how you’re achieving your goals. <a>Learn more</a>',
							'google-site-kit'
						),
						{
							a: (
								<Link
									href={ documentationURL }
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
				</p>
			</div>
			<div className="googlesitekit-activate-analytics-cta__actions">
				<Button
					className="googlesitekit-activate-analytics-cta__button--secondary"
					onClick={ handleDismiss }
					tertiary
				>
					{ __( 'Maybe later', 'google-site-kit' ) }
				</Button>
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

NormalCTAContent.propTypes = {
	documentationURL: PropTypes.string,
	analyticsEventLabel: PropTypes.string,
	handleDismiss: PropTypes.func.isRequired,
	inProgress: PropTypes.bool.isRequired,
	onClickCallback: PropTypes.func.isRequired,
	analyticsModuleActive: PropTypes.bool.isRequired,
	trackEvents: PropTypes.shape( {
		clickLearnMore: PropTypes.func.isRequired,
		confirm: PropTypes.func.isRequired,
	} ).isRequired,
};

export default NormalCTAContent;
