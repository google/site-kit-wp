<?php
/**
 * UninstallationTest
 *
 * @package   Google\Site_Kit\Tests\Core\Util
 * @copyright 2020 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Core\Util;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Storage\Options;
use Google\Site_Kit\Core\Util\Uninstallation;
use Google\Site_Kit\Core\Authentication\Google_Proxy;
use Google\Site_Kit\Tests\TestCase;
use Google\Site_Kit\Tests\Fake_Site_Connection_Trait;
use WP_Error;

/**
 * @group Util
 */
class UninstallationTest extends TestCase {
	use Fake_Site_Connection_Trait;

	private $last_request_url;

	public function setUp() {
		parent::setUp();
		$this->last_request_url = null;
	}

	public function test_register() {
		$uninstallation = new Uninstallation( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );

		remove_all_actions( 'googlesitekit_uninstallation' );
		$uninstallation->register();
		$this->assertTrue( has_action( 'googlesitekit_uninstallation' ) );
	}

	public function test_uninstall_using_proxy() {
		$context        = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );
		$uninstallation = new Uninstallation( $context );
		remove_all_actions( 'googlesitekit_uninstallation' );
		$uninstallation->register();

		$this->fake_proxy_site_connection();
		add_filter( 'pre_http_request', array( $this, 'record_request_url_and_cause_error' ), 10, 3 );
		do_action( 'googlesitekit_uninstallation' );

		// Assert HTTP request to proxy was made.
		$this->assertEquals(
			( new Google_Proxy( $context ) )->url( Google_Proxy::OAUTH2_DELETE_SITE_URI ),
			$this->last_request_url
		);
	}

	public function test_uninstall_not_using_proxy() {
		$context        = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );
		$uninstallation = new Uninstallation( $context );
		remove_all_actions( 'googlesitekit_uninstallation' );
		$uninstallation->register();

		$this->fake_site_connection();
		add_filter( 'pre_http_request', array( $this, 'record_request_url_and_cause_error' ), 10, 3 );
		do_action( 'googlesitekit_uninstallation' );

		// Assert no HTTP request was made.
		$this->assertNull( $this->last_request_url );
	}

	public function record_request_url_and_cause_error( $preempt, $args, $url ) {
		$this->last_request_url = $url;
		return new WP_Error( 'outgoing_request_blocked', 'Outgoing request blocked for testing.' );
	}
}
