<?php
/**
 * Class Google\Site_Kit\Core\Util\Scopes
 *
 * @package   Google\Site_Kit\Core\Util
 * @copyright 2020 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Util;

/**
 * Utility class for handling generic OAuth scope functions.
 *
 * @since n.e.x.t
 * @access private
 * @ignore
 */
class Scopes {

	/**
	 * Mapping of requested scope to satisfying scopes.
	 *
	 * @since n.e.x.t
	 *
	 * @var array
	 */
	protected static $map = array(
		'https://www.googleapis.com/auth/adsense.readonly' => array(
			'https://www.googleapis.com/auth/adsense',
		),
		'https://www.googleapis.com/auth/analytics.readonly' => array(
			'requires_all' => true,
			'https://www.googleapis.com/auth/analytics',
			'https://www.googleapis.com/auth/analytics.edit',
		),
		'https://www.googleapis.com/auth/tagmanager.readonly' => array(
			'https://www.googleapis.com/auth/tagmanager.edit.containers',
		),
		'https://www.googleapis.com/auth/webmasters.readonly' => array(
			'https://www.googleapis.com/auth/webmasters',
		),
	);

	/**
	 * Tests if the given scope is satisfied by the given list of available scopes.
	 *
	 * @param string   $scope            OAuth scope to test for.
	 * @param string[] $available_scopes Available OAuth scopes to test the individual scope against.
	 * @return bool True if the given scope is satisfied, otherwise false.
	 */
	public static function is_satisfied_by( $scope, array $available_scopes ) {
		if ( in_array( $scope, $available_scopes, true ) ) {
			return true;
		}

		if ( empty( self::$map[ $scope ] ) ) {
			return false;
		}

		$satisfying_scopes = array_filter( self::$map[ $scope ], 'is_string' );

		if ( ! empty( self::$map[ $scope ]['requires_all'] ) ) {
			// Return true if all satisfying scopes are present, otherwise false.
			return ! array_diff( $satisfying_scopes, $available_scopes );
		}

		// Return true if any of the scopes are present, otherwise false.
		return (bool) array_intersect( $satisfying_scopes, $available_scopes );
	}

	/**
	 * Tests if all the given scopes are satisfied by the list of available scopes.
	 *
	 * @param string[] $scopes           OAuth scopes to test.
	 * @param string[] $available_scopes OAuth scopes to test $scopes against.
	 * @return bool True if all given scopes are satisfied, otherwise false.
	 */
	public static function are_satisfied_by( array $scopes, array $available_scopes ) {
		foreach ( $scopes as $scope ) {
			if ( ! self::is_satisfied_by( $scope, $available_scopes ) ) {
				return false;
			}
		}

		return true;
	}
}
