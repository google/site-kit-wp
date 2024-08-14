/**
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
 * WordPress dependencies
 */
import {
	createInterpolateElement,
	Fragment,
	useState,
} from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { useDispatch, useSelect } from 'googlesitekit-data';
import { Button, TextField } from 'googlesitekit-components';
import { CORE_SITE } from '../../../googlesitekit/datastore/site/constants';
import Link from '../../Link';
import ErrorText from '../../ErrorText';

export default function GeminiAPIKey() {
	const [ saveError, setSaveError ] = useState( null );
	const [ APIKeyEdited, setAPIKeyEdited ] = useState( false );

	const APIKey = useSelect( ( select ) =>
		select( CORE_SITE ).getGeminiAPIKey()
	);
	// The encrypted API Key gets shown if you update other settings before saving your API key,
	// for now I fix this using the length of the key to determine if it's shown or not.
	// However, the user could type > 100 chars and it would be shown as saved but not be.
	const showAPIKeyInput =
		APIKey === '' || ( APIKeyEdited && APIKey?.length < 100 );

	const { setGeminiAPIKey, saveGeminiSettings } = useDispatch( CORE_SITE );

	async function saveSettings() {
		setSaveError( null );

		const promises = [ saveGeminiSettings() ];

		const [ { error } ] = await Promise.all( promises );

		if ( error ) {
			setSaveError( error );
		}

		setAPIKeyEdited( false );
	}

	return (
		<div className="googlesitekit-settings-module__fields-group">
			<h4 className="googlesitekit-settings-module__fields-group-title">
				{ __( 'API Key', 'google-site-kit' ) }
			</h4>

			{ ! showAPIKeyInput && (
				<Fragment>
					<p className="googlesitekit-settings-module__fields-group-helper-text">
						{ __(
							'Your API key has been stored securely',
							'google-site-kit'
						) }
					</p>
					<p className="googlesitekit-settings-module__fields-group-helper-text">
						<Button
							className="googlesitekit-settings-module__fields-group-inline-submit-button"
							variant="outlined"
							danger
							onClick={ () => {
								setGeminiAPIKey( '' );
								saveSettings();
							} }
						>
							{ __( 'Change API Key', 'google-site-kit' ) }
						</Button>
					</p>
				</Fragment>
			) }

			{ showAPIKeyInput && (
				<Fragment>
					<p className="googlesitekit-settings-module__fields-group-helper-text">
						{ createInterpolateElement(
							__(
								'Create an API key in your Google Cloud console. <a>Learn more</a>',
								'google-site-kit'
							),
							{
								a: (
									<Link
										href="https://ai.google/dev/gemini-api/docs/get-started/tutorial?lang=go#set-up-project"
										external
										aria-label={ __(
											'Learn more about creating your Gemini API key',
											'google-site-kit'
										) }
									/>
								),
							}
						) }
					</p>

					<TextField
						label={ __( 'API Key', 'google-site-kit' ) }
						outlined
						inputType="password"
						value={ APIKey }
						onChange={ ( e ) => {
							setAPIKeyEdited( true );
							setGeminiAPIKey( e.target.value );
						} }
						maxLength={ 50 }
					/>

					<p className="googlesitekit-settings-module__fields-group-inline-submit">
						<Button
							className="googlesitekit-settings-module__fields-group-inline-submit-button"
							variant="outlined"
							onClick={ saveSettings }
						>
							{ __( 'Save', 'google-site-kit' ) }
						</Button>
					</p>
					{ saveError && <ErrorText message={ saveError.message } /> }
				</Fragment>
			) }
		</div>
	);
}
