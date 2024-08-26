/**
 * Site Kit by Google, Copyright 2024 Google LLC
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
import memize from 'memize';

/**
 * Internal dependencies
 */
import Notification from '../components/Notification';

/**
 * Gets the props to pass to a Notification's component.
 *
 * @since 1.134.0
 *
 * @param {string} id The Notification's ID.
 * @return {Object} Props to pass to the Notification component.
 */
export const getNotificationComponentProps = memize( ( id ) => {
	return {
		Notification: withNotificationID( id )( Notification ),
	};
} );

function withNotificationID( id ) {
	return ( WrappedComponent ) => {
		function WithNotificationID( props ) {
			return <WrappedComponent { ...props } id={ id } />;
		}
		WithNotificationID.displayName = 'WithNotificationID';
		if ( WrappedComponent.displayName || WrappedComponent.name ) {
			WithNotificationID.displayName += `(${
				WrappedComponent.displayName || WrappedComponent.name
			})`;
		}
		return WithNotificationID;
	};
}

/**
 * Gets the props and passes them to the notification's component through a HOC.
 *
 * @since 1.134.0
 *
 * @param {string} id The id of the notification.
 * @return {Function} Enhancing function that adds the getNotificationComponentProps to the passed component.
 */
export const withNotificationComponentProps = ( id ) => {
	const notificationComponentProps = getNotificationComponentProps( id );
	return ( WrappedComponent ) => {
		function DecoratedComponent( props ) {
			return (
				<WrappedComponent
					{ ...props }
					{ ...notificationComponentProps }
				/>
			);
		}
		DecoratedComponent.displayName = 'WithWidgetComponentProps';
		if ( WrappedComponent.displayName || WrappedComponent.name ) {
			DecoratedComponent.displayName += `(${
				WrappedComponent.displayName || WrappedComponent.name
			})`;
		}
		return DecoratedComponent;
	};
};
