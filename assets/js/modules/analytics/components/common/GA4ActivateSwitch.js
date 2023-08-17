/**
 * GA4 Activate Switch component.
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

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { createInterpolateElement, useCallback } from '@wordpress/element';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import { Switch } from 'googlesitekit-components';
import { CORE_FORMS } from '../../../../googlesitekit/datastore/forms/constants';
import { FORM_SETUP } from '../../datastore/constants';
import { trackEvent } from '../../../../util';
import Link from '../../../../components/Link';
import useViewContext from '../../../../hooks/useViewContext';
import { CORE_SITE } from '../../../../googlesitekit/datastore/site/constants';
const { useSelect, useDispatch } = Data;

export default function GA4ActivateSwitch( props ) {
	const { onActivate, disabled } = props;

	const viewContext = useViewContext();
	const enableGA4 = useSelect( ( select ) =>
		select( CORE_FORMS ).getValue( FORM_SETUP, 'enableGA4' )
	);

	const documentationURL = useSelect( ( select ) => {
		return select( CORE_SITE ).getDocumentationLinkURL( 'ga4' );
	} );

	const { setValues } = useDispatch( CORE_FORMS );
	const onChange = useCallback( () => {
		setValues( FORM_SETUP, { enableGA4: true } );
		trackEvent( `${ viewContext }_analytics`, 'activate_ga4' );

		if ( typeof onActivate === 'function' ) {
			onActivate();
		}
	}, [ setValues, onActivate, viewContext ] );

	return (
		<div className="googlesitekit-settings-module__meta-item">
			<Switch
				label={ createInterpolateElement(
					__(
						'Activate Google Analytics 4 and place code on your site. <a>Learn more</a>',
						'google-site-kit'
					),
					{
						a: <Link href={ documentationURL } external />,
					}
				) }
				checked={ enableGA4 }
				disabled={ disabled }
				onClick={ onChange }
				hideLabel={ false }
			/>
		</div>
	);
}

// eslint-disable-next-line sitekit/acronym-case
GA4ActivateSwitch.propTypes = {
	onActivate: PropTypes.func,
	disabled: PropTypes.bool,
};
