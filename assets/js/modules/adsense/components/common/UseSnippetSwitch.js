/**
 * AdSense Use Snippet Switch component.
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
 * External dependencies
 */
import PropTypes from 'prop-types';
import { useUpdateEffect } from 'react-use';

/**
 * WordPress dependencies
 */
import { useCallback, Fragment } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import { Switch } from 'googlesitekit-components';
import SettingsNotice from '../../../../components/SettingsNotice';
import { trackEvent } from '../../../../util';
import { MODULES_ADSENSE } from '../../datastore/constants';
import useViewContext from '../../../../hooks/useViewContext';
import Badge from '../../../../components/Badge';
const { useSelect, useDispatch } = Data;

export default function UseSnippetSwitch( props ) {
	const {
		label = __(
			'Let Site Kit place AdSense code on your site',
			'google-site-kit'
		),
		checkedMessage,
		uncheckedMessage,
		saveOnChange,
	} = props;

	const viewContext = useViewContext();
	const eventCategory = `${ viewContext }_adsense`;

	const useSnippet = useSelect( ( select ) =>
		select( MODULES_ADSENSE ).getUseSnippet()
	);
	const isDoingSaveUseSnippet = useSelect( ( select ) =>
		select( MODULES_ADSENSE ).isDoingSubmitChanges()
	);

	const { setUseSnippet, saveSettings } = useDispatch( MODULES_ADSENSE );
	const onChange = useCallback( async () => {
		setUseSnippet( ! useSnippet );
		if ( saveOnChange ) {
			await saveSettings();
		}
	}, [ useSnippet, saveOnChange, setUseSnippet, saveSettings ] );

	useUpdateEffect( () => {
		trackEvent( eventCategory, useSnippet ? 'enable_tag' : 'disable_tag' );
	}, [ eventCategory, useSnippet ] );

	if ( undefined === useSnippet ) {
		return null;
	}

	return (
		<Fragment>
			<div className="googlesitekit-setup-module__switch">
				<Switch
					label={ label }
					onClick={ onChange }
					checked={ useSnippet }
					disabled={ isDoingSaveUseSnippet }
					hideLabel={ false }
				/>{ ' ' }
				<Badge
					className="googlesitekit-badge--primary"
					label={ __( 'Recommended', 'google-site-kit' ) }
				/>
			</div>
			{ useSnippet && checkedMessage && (
				<SettingsNotice notice={ checkedMessage } />
			) }
			{ ! useSnippet && uncheckedMessage && (
				<SettingsNotice notice={ uncheckedMessage } />
			) }
		</Fragment>
	);
}

UseSnippetSwitch.propTypes = {
	label: PropTypes.string,
	checkedMessage: PropTypes.string,
	uncheckedMessage: PropTypes.string,
	saveOnChange: PropTypes.bool,
};

UseSnippetSwitch.defaultProps = {
	saveOnChange: false,
};
