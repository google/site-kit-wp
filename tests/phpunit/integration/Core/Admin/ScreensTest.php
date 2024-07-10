<?php
/**
 * Class Google\Site_Kit\Tests\Core\Admin\ScreensTest
 *
 * @package   Google\Site_Kit
 * @copyright 2021 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Core\Admin;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Admin\Screens;
use Google\Site_Kit\Core\Assets\Assets;
use Google\Site_Kit\Tests\TestCase;

/**
 * ScreensTest
 *
 * @group Admin
 */
class ScreensTest extends TestCase {

	/**
	 * Screens object
	 *
	 * @var Screens
	 */
	private $screens;

	public function set_up() {
		parent::set_up();

		$context = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );
		$assets  = new Assets( $context );

		$this->screens = new Screens( $context, $assets );
	}

	public function data_removal_of_admin_notices() {
		return array(
			'regular' => array( 'admin_notices' ),
			'network' => array( 'network_admin_notices' ),
			'all'     => array( 'all_admin_notices' ),
		);
	}

	/**
	 * @dataProvider data_removal_of_admin_notices
	 */
	public function test_removal_of_admin_notices( $hookname ) {
		// Set current hook suffix to fake Site Kit admin page.
		$GLOBALS['hook_suffix'] = 'fake_sitekit_admin_page';
		$reflection_property    = new \ReflectionProperty( 'Google\Site_Kit\Core\Admin\Screens', 'screens' );
		$reflection_property->setAccessible( true );
		$reflection_property->setValue(
			$this->screens,
			array(
				$GLOBALS['hook_suffix'] => true,
			)
		);

		$output_notice = function () {
			echo '<div class="notice notice-error">Error!</div>';
		};

		add_action( $hookname, $output_notice, 10 );
		add_action( $hookname, $output_notice, -100 );

		$this->screens->register();

		add_action( $hookname, $output_notice, 11 );
		add_action( $hookname, $output_notice, -99 );

		ob_start();
		do_action( $hookname );
		$this->assertEmpty( ob_get_clean() );
	}

	/**
	 * @dataProvider data_removal_of_admin_notices
	 */
	public function test_removal_of_admin_notices_outside_sitekit( $hookname ) {
		$output_notice = function () {
			echo '<div class="notice notice-error">Error!</div>';
		};

		add_action( $hookname, $output_notice, 10 );
		add_action( $hookname, $output_notice, -100 );

		$this->screens->register();

		add_action( $hookname, $output_notice, 11 );
		add_action( $hookname, $output_notice, -99 );

		ob_start();
		do_action( $hookname );
		$this->assertNotEmpty( ob_get_clean() );
	}


	public function data_menu_order() {
		return array(
			'typical plugin scenario'             => array(
				array(
					'index.php',
					'third-party-plugin',
					'edit.php',
					'options-general.php',
					'googlesitekit-dashboard',
				),
				array(
					'index.php',
					'googlesitekit-dashboard',
					'third-party-plugin',
					'edit.php',
					'options-general.php',
				),
			),
			'different plugin slug'               => array(
				array(
					'index.php',
					'third-party-plugin',
					'edit.php',
					'options-general.php',
					'googlesitekit-dashboard-splash',
				),
				array(
					'index.php',
					'googlesitekit-dashboard-splash',
					'third-party-plugin',
					'edit.php',
					'options-general.php',
				),
			),
			'custom menu item before Dashboard'   => array(
				array(
					'third-party-host',
					'index.php',
					'third-party-plugin',
					'edit.php',
					'options-general.php',
					'googlesitekit-dashboard',
				),
				array(
					'third-party-host',
					'index.php',
					'googlesitekit-dashboard',
					'third-party-plugin',
					'edit.php',
					'options-general.php',
				),
			),
			'edge case: dashboard after Site Kit' => array(
				array(
					'googlesitekit-dashboard',
					'third-party-plugin',
					'index.php',
					'edit.php',
					'options-general.php',
				),
				array(
					'third-party-plugin',
					'index.php',
					'googlesitekit-dashboard',
					'edit.php',
					'options-general.php',
				),
			),
		);
	}

	/**
	 * @dataProvider data_menu_order
	 */
	public function test_menu_order( $given_menu_order, $expected_order ) {
		$this->screens->register();

		// Imitate WordPress core running these filters.
		if ( apply_filters( 'custom_menu_order', false ) ) {
			$menu_order = apply_filters( 'menu_order', $given_menu_order );
		}

		$this->assertEquals( $expected_order, $menu_order );
	}
}
