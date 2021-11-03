/**
 * Error component
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
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import { MODULES_IDEA_HUB } from '../../../datastore/constants';
import ErrorText from '../../../../../components/ErrorText';
const { useSelect } = Data;

export default function Error() {
	const [ error ] = useSelect( ( select ) =>
		select( MODULES_IDEA_HUB ).getErrors()
	);

	if ( ! error?.message ) {
		return null;
	}

	return <ErrorText message={ error.message } />;
}
