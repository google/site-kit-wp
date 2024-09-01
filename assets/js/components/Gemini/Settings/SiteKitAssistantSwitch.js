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
import { useState, Fragment } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { Switch } from 'googlesitekit-components';
import { useSelect, useDispatch } from 'googlesitekit-data';
import { CORE_SITE } from '../../../googlesitekit/datastore/site/constants';
import ErrorText from '../../ErrorText';
import LoadingWrapper from '../../LoadingWrapper';

export default function SiteKitAssistantSwitch( { loading } ) {
	const [ saveError, setSaveError ] = useState( null );

	const hasAPIKey =
		useSelect( ( select ) => select( CORE_SITE ).getGeminiAPIKey() ) !== '';

	const isSiteKitAssistantEnabled = useSelect( ( select ) =>
		select( CORE_SITE ).isSiteKitAssistantEnabled()
	);

	const isSaving = useSelect( ( select ) =>
		select( CORE_SITE ).isFetchingSaveGeminiSettings()
	);

	const { setSiteKitAssistantEnabled, saveGeminiSettings } =
		useDispatch( CORE_SITE );

	async function saveSettings() {
		setSaveError( null );

		const promises = [ saveGeminiSettings() ];

		const [ { error } ] = await Promise.all( promises );

		if ( error ) {
			setSaveError( error );
		}
	}

	return (
		<Fragment>
			<div className="googlesitekit-settings-module__fields-group">
				<h4 className="googlesitekit-settings-module__fields-group-title">
					{ __( 'Site Kit Assistant', 'google-site-kit' ) }
				</h4>

				<p className="googlesitekit-settings-module__fields-group-helper-text">
					Site Kit Assistant helps you explore the capabilities of
					Site Kit and learn how to reach the goals of your site
				</p>

				<LoadingWrapper
					loading={ loading }
					width="180px"
					height="21.3px"
				>
					<Switch
						label={ __(
							'Enable Site Kit Assistant',
							'google-site-kit'
						) }
						checked={ isSiteKitAssistantEnabled }
						disabled={ loading || isSaving || ! hasAPIKey }
						onClick={ () => {
							if ( isSiteKitAssistantEnabled ) {
								setSiteKitAssistantEnabled( false );
							} else {
								setSiteKitAssistantEnabled( true );
							}
							saveSettings();
						} }
						hideLabel={ false }
					/>
				</LoadingWrapper>
				{ saveError && <ErrorText message={ saveError.message } /> }
			</div>
		</Fragment>
	);
}
