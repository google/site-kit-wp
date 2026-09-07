/**
 * AccountChooser stories.
 *
 * Site Kit by Google, Copyright 2023 Google LLC
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
import { ChangeEvent, FC } from 'react';

/**
 * WordPress dependencies
 */
import { WPDataRegistry } from '@wordpress/data/build-types/registry';
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { Button, TextField } from 'googlesitekit-components';
import { useRegistry, useSelect } from 'googlesitekit-data';
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import { provideUserInfo } from '@tests/js/utils';

export const AccountChooser: FC = () => {
	const [ destURL, setDestURL ] = useState(
		'https://accounts.google.com/ManageAccount'
	);
	// `@wordpress/data` types `useRegistry()` as returning `Function`, which
	// does not match the `WPDataRegistry` type expected by `provideUserInfo`.
	const registry = useRegistry() as unknown as WPDataRegistry;
	const email = useSelect(
		// @ts-expect-error Data store is not yet typed.
		( select ) => select( CORE_USER ).getEmail(),
		[]
	);
	function onEmailChange( { target }: ChangeEvent< HTMLInputElement > ) {
		provideUserInfo( registry, { email: target.value } );
	}

	const accountChooserURL = useSelect(
		( select ) =>
			// @ts-expect-error Data store is not yet typed.
			select( CORE_USER ).getAccountChooserURL( destURL ),
		[ destURL ]
	);

	return (
		<div>
			<h1>Account Chooser</h1>
			<p>
				This is a utility component for using the account chooser
				service.
			</p>
			<TextField
				label="Google Account Email"
				onChange={ onEmailChange }
				value={ email }
				outlined
			/>

			<TextField
				label="Destination URL"
				onChange={ ( { target }: ChangeEvent< HTMLInputElement > ) =>
					setDestURL( target.value )
				}
				value={ destURL }
				outlined
			/>

			<pre>{ accountChooserURL }</pre>
			{ /* @ts-expect-error `Button` component is not yet typed. */ }
			<Button href={ accountChooserURL } target="_blank">
				Open URL in a new tab
			</Button>
		</div>
	);
};

export default {
	title: 'AccountChooser',
	component: AccountChooser,
};
