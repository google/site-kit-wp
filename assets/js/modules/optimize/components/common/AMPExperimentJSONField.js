/**
 * AmpExperimentJSONField component.
 *
 * Site Kit by Google, Copyright 2021 Google LLC
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
import { Fragment, useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import { TextField } from 'googlesitekit-components';
import classnames from 'classnames';
import { MODULES_OPTIMIZE } from '../../datastore/constants';
import { CORE_SITE } from '../../../../googlesitekit/datastore/site/constants';
import { MODULES_ANALYTICS } from '../../../analytics/datastore/constants';
import { isValidAMPExperimentJSON } from '../../util';
import Link from '../../../../components/Link';
import ErrorText from '../../../../components/ErrorText';

const { useSelect, useDispatch } = Data;

export default function AMPExperimentJSONField() {
	const ampExperimentJSON = useSelect( ( select ) =>
		select( MODULES_OPTIMIZE ).getAMPExperimentJSON()
	);
	const ampMode = useSelect( ( select ) => select( CORE_SITE ).getAMPMode() );
	const useSnippet = useSelect( ( select ) =>
		select( MODULES_ANALYTICS ).getUseSnippet()
	);

	const { setAMPExperimentJSON } = useDispatch( MODULES_OPTIMIZE );
	const onChange = useCallback(
		( event ) => {
			setAMPExperimentJSON( event.target.value );
		},
		[ setAMPExperimentJSON ]
	);

	if ( ! useSnippet || ! ampMode ) {
		return null;
	}

	return (
		<Fragment>
			<p>
				{ __(
					'Please input your AMP experiment settings in JSON format below.',
					'google-site-kit'
				) }{ ' ' }
				<Link
					href="https://developers.google.com/optimize/devguides/amp-experiments"
					external
				>
					{ __( 'Learn more', 'google-site-kit' ) }
				</Link>
			</p>
			<TextField
				className={ classnames( 'mdc-text-field', {
					'mdc-text-field--error':
						! isValidAMPExperimentJSON( ampExperimentJSON ),
				} ) }
				name="amp-experiment"
				onChange={ onChange }
				textarea
				inputType="textarea"
				value={ ampExperimentJSON }
			/>
			{ ! isValidAMPExperimentJSON( ampExperimentJSON ) && (
				<ErrorText
					message={ __(
						'AMP experiment settings are not in a valid JSON format.',
						'google-site-kit'
					) }
				/>
			) }
		</Fragment>
	);
}
