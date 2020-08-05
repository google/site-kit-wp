/**
 * Legacy DataAPI loading component.
 *
 * Site Kit by Google, Copyright 2020 Google LLC
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
import { useEffect } from '@wordpress/element';
import { doAction } from '@wordpress/hooks';

/**
 * Internal dependencies
 */
import './index'; // Ensure dataAPI is loaded.
import Data from 'googlesitekit-data';
import { STORE_NAME as CORE_USER } from '../../googlesitekit/datastore/user/constants';
const { useSelect } = Data;

export default function CollectModuleData( { context, args } ) {
	const dateRange = useSelect( ( select ) => select( CORE_USER ).getDateRange() );

	// Reset module data when the date range changes, but not on mount.
	useEffect( () => {
		return () => doAction( 'googlesitekit.moduleDataReset' );
	}, [ dateRange ] );

	// Load data whenever the context, args, or dateRange changes.
	useEffect( () => {
		doAction( 'googlesitekit.moduleLoaded', context, args );
	}, [ context, args, dateRange ] );

	return null;
}
