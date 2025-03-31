/**
 * Site Kit by Google, Copyright 2025 Google LLC
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
import { useSelect } from 'googlesitekit-data';
import { MODULES_ANALYTICS_4 } from '../../datastore/constants';

/**
 * Higher-Order Component to render wrapped components when changed conversion events are detected.
 *
 * @since n.e.x.t
 *
 * @return {Function} Enhancing function.
 */
export default function whenHasChangedConversionEvents() {
	return ( WrappedComponent ) => {
		function WhenHasChangedConversionEvents( props ) {
			const hasChangedConversionEvents = useSelect( ( select ) => {
				const {
					hasNewConversionReportingEvents,
					hasLostConversionReportingEvents,
				} = select( MODULES_ANALYTICS_4 );

				return (
					hasNewConversionReportingEvents() ||
					hasLostConversionReportingEvents()
				);
			}, [] );

			if ( hasChangedConversionEvents ) {
				return <WrappedComponent { ...props } />;
			}

			const { WidgetNull = null } = props;
			return WidgetNull && <WidgetNull />;
		}

		return WhenHasChangedConversionEvents;
	};
}
