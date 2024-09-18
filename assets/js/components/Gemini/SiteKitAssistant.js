/**
 * ChangeBadge component.
 *
 * Site Kit by Google, Copyright 2024 Google LLC
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

/**
 * WordPress dependencies
 */
import { Fragment, useMemo, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { Button, SpinnerButton, TextField } from 'googlesitekit-components';
import GeminiIcon from '../../../svg/graphics/gemini.svg';
import { CORE_SITE } from '../../googlesitekit/datastore/site/constants';
import { CORE_USER } from '../../googlesitekit/datastore/user/constants';
import { useDispatch, useSelect } from 'googlesitekit-data';
import { WidgetRenderer } from '../../googlesitekit/widgets/components';
import API from 'googlesitekit-api';

export default function SiteKitAssistant() {
	const [ loading, setLoading ] = useState( false );
	const [ currentPrompt, setCurrentPrompt ] = useState( '' );
	const [ chatOpen, setChatOpen ] = useState( false );

	const { setReferenceDate } = useDispatch( CORE_USER );

	const [ parts, setParts ] = useState( [
		{
			role: 'model',
			parts: [
				{
					text: "Hey, I'm Site Kit Assistant",
				},
			],
		},
		{
			role: 'model',
			parts: [
				{
					text: 'Trying asking about your site key metrics, or how to use the plugin',
				},
			],
		},
	] );

	// Reverse the parts to support the chat box that uses CSS flex column-reverse.
	const reversedParts = useMemo( () => parts.slice().reverse(), [ parts ] );

	const isSiteKitAssistantEnabled = useSelect( ( select ) =>
		select( CORE_SITE ).isSiteKitAssistantEnabled()
	);

	if ( ! isSiteKitAssistantEnabled ) {
		return null;
	}

	const chatTurn = async ( event ) => {
		event.preventDefault();

		setLoading( true );

		const prompt = currentPrompt;
		setCurrentPrompt( '' );

		const updatedParts = [
			...parts,
			{
				role: 'user',
				parts: [
					{
						text: currentPrompt,
					},
				],
			},
		];

		setParts( updatedParts );

		const response = await API.set(
			'core',
			'site',
			'site-kit-assistant-chat-turns',
			{
				settings: {
					prompt,
					chatTurns: updatedParts,
				},
			}
		);

		// TODO: error handling/check for invalid response structure.
		if ( response.chatTurns ) {
			setParts( response.chatTurns );
		}

		// Find the most recent start date to shift the reference date for the widget to show.
		const findStartDate = response.chatTurns
			.slice()
			.reverse()
			.find(
				( { parts: responseParts } ) =>
					responseParts[ 0 ]?.startDate || false
			);
		// TODO: this will set the entire site to this date offset and all previous widgets
		// in the chat will be updated as well. To do this correcly we would need to be able
		// to pass individual reference dates to widgets.

		if ( findStartDate ) {
			// If there was a startDate, set the reference date to adjust the date of the metric shown:
			const startDate = new Date(
				findStartDate.parts?.[ 0 ]?.startDate * 1000
			);
			setReferenceDate( startDate.toISOString().split( 'T' )[ 0 ] );
			// TODO: this does not set the date range currently so all data will be over 30 days, this
			// is also because with the current backend prompts I use Gemini does not reliably return
			// a range. Instead I should try allowing the model to return the date range string.
		}

		setLoading( false );
	};

	return (
		<Fragment>
			<div className="googlesitekit-gemini-assistant-button">
				<Button
					className={ classnames(
						'googlesitekit-border-radius-round--phone',
						'googlesitekit-button-icon--phone'
					) }
					text
					onClick={ () => setChatOpen( ! chatOpen ) }
					icon={ <GeminiIcon width="20" height="20" /> }
					aria-haspopup="menu"
					aria-expanded={ chatOpen }
					aria-controls="site-kit-assistant-chat-window"
					title={ __( 'Site Kit Assistant', 'google-site-kit' ) }
				/>
			</div>
			{ chatOpen && (
				<div
					id="site-kit-assistant-chat-window"
					className="googlesitekit-gemini-assistant-window"
				>
					<div className="googlesitekit-gemini-assistant-window__chat">
						{ reversedParts.map(
							( { role, parts: chatPart }, index ) => (
								<div
									key={ index }
									className="googlesitekit-gemini-assistant-window__chat-message"
								>
									{ role === 'user' ? (
										<img
											className="googlesitekit-gemini-assistant-window__chat-message-icon"
											alt="User Profile"
											src="http://1.gravatar.com/avatar/747c5b3a9e784ce9c49cecf79a8481e5?s=26&d=mm&r=g" // TODO: get the actual users profile image.
										/>
									) : (
										<GeminiIcon className="googlesitekit-gemini-assistant-window__chat-message-icon" />
									) }
									<span>
										{ chatPart && chatPart[ 0 ]?.text }
										{ chatPart &&
											chatPart[ 0 ]?.keyMetricSlug && (
												<WidgetRenderer
													slug={
														chatPart[ 0 ]
															?.keyMetricSlug
													}
												/>
											) }
									</span>
								</div>
							)
						) }
					</div>

					<form
						className="googlesitekit-gemini-assistant-window__form"
						onSubmit={ chatTurn }
					>
						<TextField
							label={ __(
								'What do you want to know about your site?',
								'google-site-kit'
							) }
							name="currentPrompt"
							outlined
							value={ currentPrompt }
							onChange={ ( event ) =>
								setCurrentPrompt( event.target.value )
							}
							disabled={ loading }
						/>

						<SpinnerButton
							onClick={ chatTurn }
							disabled={ loading || ! currentPrompt }
							isSaving={ loading }
						>
							Ask
						</SpinnerButton>
					</form>
				</div>
			) }
		</Fragment>
	);
}
