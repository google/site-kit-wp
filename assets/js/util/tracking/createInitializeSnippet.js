/**
 * Internal dependencies
 */
import createDataLayerPush from './createDataLayerPush';
import { SCRIPT_IDENTIFIER, DATA_LAYER } from './constants';
import { enabledFeatures } from '../../features/index';

/**
 * Returns a function which, when invoked injects the gtag script if necessary.
 *
 * @since 1.44.0
 *
 * @param {Object} config          Tracking configuration.
 * @param {Object} dataLayerTarget Data layer parent object.
 * @return {Function} Function that injects gtag script if it isn't yet present.
 */
export default function createInitializeSnippet( config, dataLayerTarget ) {
	const dataLayerPush = createDataLayerPush( dataLayerTarget );

	let hasInsertedTag;

	const {
		activeModules,
		referenceSiteURL,
		userIDHash,
		userRoles = [],
		isAuthenticated,
		pluginVersion,
	} = config;

	/**
	 * Injects the necessary script tag if not present.
	 *
	 * @since 1.118.0
	 *
	 * @return {boolean|Object} Tag src as scriptTagSrc property.
	 */
	return function initializeSnippet() {
		const { document } = global;
		if ( undefined === hasInsertedTag ) {
			hasInsertedTag = !! document.querySelector(
				`script[${ SCRIPT_IDENTIFIER }]`
			);
		}
		if ( hasInsertedTag ) {
			return;
		}

		hasInsertedTag = true;

		// Sometimes the user roles returned by Site Kit/WordPress is not an
		// array, as expected, so we guard against it here.
		//
		// See: https://github.com/google/site-kit-wp/issues/8266
		const userRolesAsString = userRoles?.length
			? userRoles.join( ',' )
			: '';

		// We should use the real time, and not the reference date, when
		// measuring when we initialized tracking.
		dataLayerPush( 'js', new Date() ); // eslint-disable-line sitekit/no-direct-date
		dataLayerPush( 'config', config.trackingID, {
			groups: 'site_kit',
			send_page_view: config.isSiteKitScreen,
			dimension1: referenceSiteURL,
			dimension2: userRolesAsString,
			dimension3: userIDHash,
			dimension4: pluginVersion || '',
			dimension5: Array.from( enabledFeatures ).join( ',' ),
			dimension6: activeModules.join( ',' ),
			dimension7: isAuthenticated ? '1' : '0',
		} );
		dataLayerPush( 'config', config.trackingID_GA4, {
			groups: 'site_kit',
			send_page_view: config.isSiteKitScreen,
			domain: referenceSiteURL,
			plugin_version: pluginVersion || '',
			enabled_features: Array.from( enabledFeatures ).join( ',' ),
			active_modules: activeModules.join( ',' ),
			authenticated: isAuthenticated ? '1' : '0',
			user_properties: {
				user_roles: userRolesAsString,
				user_identifier: userIDHash,
			},
		} );

		// If not present, inject it and initialize dataLayer.
		const scriptTag = document.createElement( 'script' );
		scriptTag.setAttribute( SCRIPT_IDENTIFIER, '' );
		scriptTag.async = true;
		scriptTag.src = `https://www.googletagmanager.com/gtag/js?id=${ config.trackingID_GA4 }&l=${ DATA_LAYER }`;
		document.head.appendChild( scriptTag );

		return {
			scriptTagSrc: `https://www.googletagmanager.com/gtag/js?id=${ config.trackingID_GA4 }&l=${ DATA_LAYER }`,
		};
	};
}
