/**
 * WithRegistrySetup component.
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
import { useMount } from 'react-use';
import invariant from 'invariant';

/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { useRegistry } from 'googlesitekit-data';

function WithRegistrySetup( { func, children } ) {
	const registry = useRegistry();
	const [ ready, setReady ] = useState( false );

	invariant( typeof func === 'function', 'func must be a function.' );

	useMount( async () => {
		await func( registry );
		setReady( true );
	} );

	if ( ready ) {
		return children;
	}

	return null;
}

export default WithRegistrySetup;
