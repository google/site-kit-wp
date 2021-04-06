<?php
/**
 * Class Google\Site_Kit\Tests\Core\Util\ScopesTest
 *
 * @package   Google\Site_Kit\Tests\Core\Util
 * @copyright 2021 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Core\Util;

use Google\Site_Kit\Core\Util\Scopes;
use Google\Site_Kit\Tests\TestCase;

class ScopesTest extends TestCase {

	/**
	 * @dataProvider is_satisfied_by_provider
	 * @param string $scope
	 * @param array $scopes
	 * @param bool $expected_result
	 */
	public function test_is_satisfied_by( $scope, $scopes, $expected_result ) {
		if ( $expected_result ) {
			$this->assertTrue( Scopes::is_satisfied_by( $scope, $scopes ) );
		} else {
			$this->assertFalse( Scopes::is_satisfied_by( $scope, $scopes ) );
		}
	}

	public function is_satisfied_by_provider() {
		return array(
			// adsense.readonly satisfies itself
			array(
				'https://www.googleapis.com/auth/adsense.readonly',
				array( 'https://www.googleapis.com/auth/adsense.readonly' ),
				true,
			),
			// adsense scope satisfies adsense.readonly
			array(
				'https://www.googleapis.com/auth/adsense.readonly',
				array( 'https://www.googleapis.com/auth/adsense' ),
				true,
			),
			// adsense.readonly does not satisfy adsense
			array(
				'https://www.googleapis.com/auth/adsense',
				array( 'https://www.googleapis.com/auth/adsense.readonly' ),
				false,
			),
			// analytics.readonly only satisfied by analytics and analytics.edit
			array(
				'https://www.googleapis.com/auth/analytics.readonly',
				array(
					'https://www.googleapis.com/auth/analytics',
					'https://www.googleapis.com/auth/analytics.edit',
				),
				true,
			),
			array(
				'https://www.googleapis.com/auth/analytics.readonly',
				array(
					'https://www.googleapis.com/auth/analytics.edit',
				),
				false,
			),
			array(
				'https://www.googleapis.com/auth/analytics.readonly',
				array(
					'https://www.googleapis.com/auth/analytics',
				),
				false,
			),
			// tagmanager.readonly is satisfied by tagmanager.edit.containers
			array(
				'https://www.googleapis.com/auth/tagmanager.readonly',
				array(
					'https://www.googleapis.com/auth/tagmanager.edit.containers',
				),
				true,
			),
			// tagmanager.edit.containers is not satisfied by tagmanager.readonly
			array(
				'https://www.googleapis.com/auth/tagmanager.edit.containers',
				array(
					'https://www.googleapis.com/auth/tagmanager.readonly',
				),
				false,
			),
			// webmasters.readonly is satisfied by webmasters
			array(
				'https://www.googleapis.com/auth/webmasters.readonly',
				array(
					'https://www.googleapis.com/auth/webmasters',
				),
				true,
			),
			// webmasters is not satisfied by webmasters.readonly
			array(
				'https://www.googleapis.com/auth/webmasters',
				array(
					'https://www.googleapis.com/auth/webmasters.readonly',
				),
				false,
			),
		);
	}

	/**
	 * @dataProvider are_satisfied_by_provider
	 * @param $scopes
	 * @param $granted_scopes
	 * @param $expected_result
	 */
	public function test_are_satisfied_by( array $scopes, array $granted_scopes, $expected_result ) {
		if ( $expected_result ) {
			$this->assertTrue( Scopes::are_satisfied_by( $scopes, $granted_scopes ) );
		} else {
			$this->assertFalse( Scopes::are_satisfied_by( $scopes, $granted_scopes ) );
		}
	}

	public function are_satisfied_by_provider() {
		return array(
			// multiple readonly scopes are satisfied by their satisfying write scopes.
			array(
				array(
					'https://www.googleapis.com/auth/webmasters.readonly',
					'https://www.googleapis.com/auth/adsense.readonly',
				),
				array(
					'https://www.googleapis.com/auth/webmasters',
					'https://www.googleapis.com/auth/adsense',
				),
				true,
			),
			// Multiple scopes are satisfied, including those that require_all.
			array(
				array(
					'https://www.googleapis.com/auth/webmasters.readonly',
					'https://www.googleapis.com/auth/analytics.readonly',
				),
				array(
					'https://www.googleapis.com/auth/webmasters',
					'https://www.googleapis.com/auth/analytics',
					'https://www.googleapis.com/auth/analytics.edit',
				),
				true,
			),
			// Returns false if any of the scopes are not fulfilled.
			array(
				array(
					'https://www.googleapis.com/auth/webmasters.readonly',
					'https://www.googleapis.com/auth/analytics.readonly',
				),
				array(
					'https://www.googleapis.com/auth/webmasters',
					'https://www.googleapis.com/auth/analytics',
				),
				false, // missing analytics.edit
			),
		);
	}
}
