<?php
/**
 * Class Google\Site_Kit\Tests\Modules\Analytics_4\Tracking_ExclusionsTest
 *
 * @package   Google\Site_Kit\Tests\Modules\Analytics_4
 * @copyright 2026 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Modules\Analytics_4;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Storage\Options;
use Google\Site_Kit\Modules\Analytics_4\Settings;
use Google\Site_Kit\Modules\Analytics_4\Tracking_Exclusions;
use Google\Site_Kit\Tests\TestCase;

/**
 * @group Modules
 * @group Analytics_4
 */
class Tracking_ExclusionsTest extends TestCase {

	/**
	 * Analytics 4 settings instance.
	 *
	 * @var Settings
	 */
	private $settings;

	/**
	 * Tracking_Exclusions instance under test.
	 *
	 * @var Tracking_Exclusions
	 */
	private $tracking_exclusions;

	public function set_up() {
		parent::set_up();

		$this->settings            = new Settings( new Options( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) ) );
		$this->tracking_exclusions = new Tracking_Exclusions( $this->settings );
	}

	public function test_is_disabled__logged_out_visitor() {
		$this->settings->merge( array( 'trackingDisabled' => array( 'loggedinUsers' ) ) );

		$this->assertFalse( $this->tracking_exclusions->is_disabled(), 'Tracking should stay on for a logged-out visitor.' );
	}

	/**
	 * @dataProvider data_logged_in_users
	 *
	 * @param array  $tracking_disabled Value of the `trackingDisabled` setting.
	 * @param string $role              Role of the logged-in user.
	 * @param bool   $expected          Whether tracking should be off.
	 */
	public function test_is_disabled__logged_in_user( $tracking_disabled, $role, $expected ) {
		$this->settings->merge( array( 'trackingDisabled' => $tracking_disabled ) );
		wp_set_current_user( $this->factory()->user->create( array( 'role' => $role ) ) );

		$this->assertSame( $expected, $this->tracking_exclusions->is_disabled(), 'Tracking should be off only for the users the `trackingDisabled` setting names.' );
	}

	public function data_logged_in_users() {
		return array(
			'a subscriber with `loggedinUsers`'   => array( array( 'loggedinUsers' ), 'subscriber', true ),
			'an editor with `contentCreators`'    => array( array( 'contentCreators' ), 'editor', true ),
			'a subscriber with `contentCreators`' => array( array( 'contentCreators' ), 'subscriber', false ),
		);
	}

	public function test_is_disabled__use_snippet_off() {
		$this->settings->merge(
			array(
				'useSnippet'       => false,
				'trackingDisabled' => array( 'loggedinUsers' ),
			)
		);
		wp_set_current_user( $this->factory()->user->create( array( 'role' => 'subscriber' ) ) );

		$this->assertFalse( $this->tracking_exclusions->is_disabled(), 'Tracking should stay on when Site Kit places no Analytics code.' );
	}

	public function test_is_disabled__allow_tracking_disabled_filter_returns_false() {
		$this->settings->merge( array( 'trackingDisabled' => array( 'loggedinUsers' ) ) );
		wp_set_current_user( $this->factory()->user->create( array( 'role' => 'subscriber' ) ) );
		add_filter( 'googlesitekit_allow_tracking_disabled', '__return_false' );

		$this->assertFalse( $this->tracking_exclusions->is_disabled(), 'Tracking should stay on when the `googlesitekit_allow_tracking_disabled` filter returns `false`.' );
	}

	public function test_is_disabled__returns_the_tracking_disabled_filter() {
		$this->settings->merge( array( 'trackingDisabled' => array( 'loggedinUsers' ) ) );
		$filtered_values = array();
		add_filter(
			'googlesitekit_analytics_tracking_disabled',
			function ( $disabled ) use ( &$filtered_values ) {
				$filtered_values[] = $disabled;

				return ! $disabled;
			}
		);

		$this->assertTrue( $this->tracking_exclusions->is_disabled(), 'The result should be what the `googlesitekit_analytics_tracking_disabled` filter returns.' );
		$this->assertSame( array( false ), $filtered_values, 'The filter should get `false` for a logged-out visitor.' );
	}
}
