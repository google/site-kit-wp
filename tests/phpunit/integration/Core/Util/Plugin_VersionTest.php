<?php
/**
 * Plugin_VersionTest
 *
 * @package   Google\Site_Kit\Tests\Core\Util
 * @copyright 2026 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Core\Util;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Storage\Options;
use Google\Site_Kit\Core\Util\Plugin_Version;
use Google\Site_Kit\Tests\TestCase;

/**
 * @group Util
 */
class Plugin_VersionTest extends TestCase {

	/**
	 * Options instance.
	 *
	 * @var Options
	 */
	private $options;

	/**
	 * Versions the plugin update action reported, as `array( $old, $new )` pairs.
	 *
	 * @var array[]
	 */
	private $updates;

	public function set_up() {
		parent::set_up();

		$context       = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );
		$this->options = new Options( $context );
		$this->updates = array();

		$this->options->delete( Plugin_Version::OPTION );

		// The plugin registered its own instance at bootstrap, which would write the option before
		// the test reaches it.
		remove_all_actions( 'admin_init' );
		remove_all_actions( 'googlesitekit_plugin_updated' );

		add_action(
			'googlesitekit_plugin_updated',
			function ( $old_version, $new_version ) {
				$this->updates[] = array( $old_version, $new_version );
			},
			10,
			2
		);

		$plugin_version = new Plugin_Version( $this->options );
		$plugin_version->register();
	}

	public function test_admin_init__stores_the_version_on_a_site_that_has_none() {
		do_action( 'admin_init' );

		$this->assertEquals( GOOGLESITEKIT_VERSION, $this->options->get( Plugin_Version::OPTION ), 'The running version should be stored.' );
		$this->assertEmpty( $this->updates, 'A site storing the version for the first time has not updated the plugin.' );
	}

	public function test_admin_init__reports_an_update_over_an_older_version() {
		$this->options->set( Plugin_Version::OPTION, '1.0.0' );

		do_action( 'admin_init' );

		$this->assertEquals( GOOGLESITEKIT_VERSION, $this->options->get( Plugin_Version::OPTION ), 'The stored version should be replaced by the running one.' );
		$this->assertEquals( array( array( '1.0.0', GOOGLESITEKIT_VERSION ) ), $this->updates, 'The update should be reported once, with the version it replaced.' );
	}

	public function test_admin_init__leaves_a_matching_version_alone() {
		$this->options->set( Plugin_Version::OPTION, GOOGLESITEKIT_VERSION );

		$written = 0;
		add_action(
			'update_option_' . Plugin_Version::OPTION,
			function () use ( &$written ) {
				$written++;
			}
		);

		do_action( 'admin_init' );

		$this->assertEquals( 0, $written, 'A version that already matches should not be written again.' );
		$this->assertEmpty( $this->updates, 'A version that already matches is not an update.' );
	}
}
