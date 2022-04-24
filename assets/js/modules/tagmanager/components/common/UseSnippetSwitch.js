/**
 * Tag Manager Use Snippet Switch component.
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
import { useCallback, useContext } from '@wordpress/element';
import React from 'react';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import { MODULES_TAGMANAGER } from '../../datastore/constants';
import Switch from '../../../../components/Switch';
import ViewContextContext from '../../../../components/Root/ViewContextContext';
import { trackEvent } from '../../../../util';

const { useSelect, useDispatch } = Data;

export default function UseSnippetSwitch() {
	const useSnippet = useSelect( ( select ) =>
		select( MODULES_TAGMANAGER ).getUseSnippet()
	);

	const viewContext = useContext( ViewContextContext );

	const { setUseSnippet } = useDispatch( MODULES_TAGMANAGER );
	const onChange = useCallback( () => {
		const newUseSnippet = ! useSnippet;
		setUseSnippet( newUseSnippet );
		trackEvent(
			`${ viewContext }_tagmanager`,
			newUseSnippet ? 'enable_tag' : 'disable_tag'
		);
	}, [ setUseSnippet, useSnippet, viewContext ] );

	if ( useSnippet === undefined ) {
		return null;
	}

	return (
		<div className="googlesitekit-tagmanager-usesnippet">
			<Switch
				label={ __(
					'Let Site Kit place code on your site',
					'google-site-kit'
				) }
				checked={ useSnippet }
				onClick={ onChange }
				hideLabel={ false }
			/>
			<p>
				{ useSnippet
					? __(
							'Site Kit will add the code automatically.',
							'google-site-kit'
					  )
					: __(
							'Site Kit will not add the code to your site.',
							'google-site-kit'
					  ) }
			</p>
		</div>
	);
}
