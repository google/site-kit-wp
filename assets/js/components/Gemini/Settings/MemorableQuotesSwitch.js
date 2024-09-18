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

export default function MemorableQuotesSwitch( { loading } ) {
	const [ saveError, setSaveError ] = useState( null );

	const hasAPIKey =
		useSelect( ( select ) => select( CORE_SITE ).getGeminiAPIKey() ) !== '';

	const isMemorableQuotesEnabled = useSelect( ( select ) =>
		select( CORE_SITE ).isMemorableQuotesEnabled()
	);

	const isSaving = useSelect( ( select ) =>
		select( CORE_SITE ).isFetchingSaveGeminiSettings()
	);

	const { setMemorableQuotesEnabled, saveGeminiSettings } =
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
					{ __( 'Memorable Quotes', 'google-site-kit' ) }
				</h4>

				<p className="googlesitekit-settings-module__fields-group-helper-text">
					Memorable Quotes helps your readers discover and explore
					your content by generating quotes to display on your site
				</p>

				<LoadingWrapper
					loading={ loading }
					width="180px"
					height="21.3px"
				>
					<Switch
						label={ __(
							'Enable Memorable Quotes',
							'google-site-kit'
						) }
						checked={ isMemorableQuotesEnabled }
						disabled={ loading || isSaving || ! hasAPIKey }
						onClick={ () => {
							if ( isMemorableQuotesEnabled ) {
								setMemorableQuotesEnabled( false );
							} else {
								setMemorableQuotesEnabled( true );
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
