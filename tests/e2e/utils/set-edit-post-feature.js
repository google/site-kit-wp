/**
 * Internal dependencies
 */
import { evalWithWPData } from './eval-with-wp-data';

/**
 * Sets feature activation for a core/edit-post feature.
 *
 * @since 1.7.0
 *
 * @param {string}  feature       Feature ID/name.
 * @param {boolean} setActivation Activation to set.
 * @return {Promise} Promise from `evalWithWPData()` call.
 */
export async function setEditPostFeature( feature, setActivation ) {
	return await evalWithWPData(
		( featureName, activation ) => {
			const isActive = wp.data
				.select( 'core/edit-post' )
				.isFeatureActive( featureName );
			if (
				( isActive && ! activation ) ||
				( ! isActive && activation )
			) {
				return wp.data
					.dispatch( 'core/edit-post' )
					.toggleFeature( featureName );
			}
		},
		feature,
		setActivation
	);
}
