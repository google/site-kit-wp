/**
 * Analytics-4 module entrypoint.
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
import Modules from 'googlesitekit-modules';
import Widgets from 'googlesitekit-widgets';
import Notifications from 'googlesitekit-notifications';
import {
	registerStore,
	registerModule,
	registerWidgets,
	registerNotifications,
} from './modules/analytics-4';

registerStore( Data );
registerModule( Modules );
registerWidgets( Widgets );
registerNotifications( Notifications );
