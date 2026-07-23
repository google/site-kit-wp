<?php
/**
 * Class Google\Site_Kit\Core\Authentication\Connected_Proxy_URLTest
 *
 * @package   Google\Site_Kit\Tests\Core\Authentication
 * @copyright 2021 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Core\Authentication;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Authentication\Connected_Proxy_URL;
use Google\Site_Kit\Core\Storage\Options;
use Google\Site_Kit\Tests\Modules\SettingsTestCase;

/**
 * Connected_Proxy_URLTest.
 *
 * @group Authentication
 */
class Connected_Proxy_URLTest extends SettingsTestCase {

	/**
	 * Options object.
	 *
	 * @var Options
	 */
	private $options;

	public function set_up() {
		parent::set_up();
		$this->options = new Options( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );
	}

	public function test_matches_url() {
		$connected_proxy_url = new Connected_Proxy_URL( $this->options );
		$connected_proxy_url->register();

		$connected_proxy_url->set( 'https://example.com' );
		$this->assertTrue( $connected_proxy_url->matches_url( 'https://example.com/' ), 'URL should match when trailing slash is added.' );

		$connected_proxy_url->set( 'https://example.com/subdirectory' );
		$this->assertTrue( $connected_proxy_url->matches_url( 'https://example.com/subdirectory/' ), 'URL should match when trailing slash is added to subdirectory.' );

		$connected_proxy_url->set( 'https://example.com/' );
		$this->assertTrue( $connected_proxy_url->matches_url( 'https://example.com/' ), 'URL should match when both have trailing slashes.' );
	}

	public function test_matches_url__after_a_database_search_and_replace() {
		$connected_proxy_url = new Connected_Proxy_URL( $this->options );
		$connected_proxy_url->register();

		$connected_proxy_url->set( 'https://old-site.example.com' );

		// Simulate a database search and replace of the site domain.
		$stored_url    = $this->options->get( Connected_Proxy_URL::OPTION );
		$rewritten_url = str_replace( 'old-site.example.com', 'new-site.example.com', $stored_url );

		$this->assertSame( $stored_url, $rewritten_url, 'A search and replace should find no domain to rewrite inside the stored value.' );
		$this->assertTrue( $connected_proxy_url->matches_url( 'https://old-site.example.com' ), 'The stored URL should still match the connected URL after a search and replace.' );
	}

	public function test_set__stores_an_encoded_url() {
		$connected_proxy_url = new Connected_Proxy_URL( $this->options );
		$connected_proxy_url->register();

		$connected_proxy_url->set( 'https://example.com' );

		$this->assertEquals(
			base64_encode( 'https://example.com/' ),
			$this->options->get( Connected_Proxy_URL::OPTION ),
			'The `set()` method should store the URL as a base64-encoded string, with a trailing slash.'
		);
	}

	public function test_get__decodes_the_stored_url() {
		$connected_proxy_url = new Connected_Proxy_URL( $this->options );
		$connected_proxy_url->register();

		$connected_proxy_url->set( 'https://example.com' );

		$this->assertEquals( 'https://example.com/', $connected_proxy_url->get(), 'The `get()` method should return the URL in plain text.' );
	}

	public function test_get__returns_false_when_not_set() {
		$connected_proxy_url = new Connected_Proxy_URL( $this->options );
		$connected_proxy_url->register();

		$this->assertFalse( $connected_proxy_url->get(), 'The `get()` method should return FALSE when no value exists.' );
	}

	public function test_get__returns_false_for_a_value_that_fails_to_decode() {
		$connected_proxy_url = new Connected_Proxy_URL( $this->options );
		$connected_proxy_url->register();

		$this->options->set( Connected_Proxy_URL::OPTION, 'not*a*valid*value' );

		$this->assertFalse( $connected_proxy_url->get(), 'The `get()` method should return FALSE for a stored value that fails to decode.' );
	}

	/**
	 * @inheritDoc
	 */
	protected function get_option_name() {
		return Connected_Proxy_URL::OPTION;
	}
}
