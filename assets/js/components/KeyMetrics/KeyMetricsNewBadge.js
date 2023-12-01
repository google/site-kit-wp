/**
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

import Data from 'googlesitekit-data';
import { CORE_SITE } from '../../googlesitekit/datastore/site/constants';
import NewBadge from '../NewBadge';
const { useSelect } = Data;

export default function KeyMetricsNewBadge() {
	// This is necessary to conditionally render the badge
	// as this component is used in a context where `select` is not in scope.
	const isNew = useSelect( CORE_SITE ).getKeyMetricsSetupNew();

	return isNew && <NewBadge />;
}
