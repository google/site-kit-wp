<?php
/**
 * Class Google\Site_Kit\Tests\Core\Golinks\Settings_Golink_HandlerTest
 *
 * @package   Google\Site_Kit\Tests\Core\Golinks
 * @copyright 2026 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Core\Golinks;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Golinks\Settings_Golink_Handler;
use Google\Site_Kit\Tests\MutableInput;
use Google\Site_Kit\Tests\TestCase;

/**
 * @group Golinks
 */
class Settings_Golink_HandlerTest extends TestCase {

	/**
	 * @var Context
	 */
	private $context;

	/**
	 * @var Settings_Golink_Handler
	 */
	private $handler;

	public function set_up() {
		parent::set_up();

		$this->context = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE, new MutableInput() );
		$this->handler = new Settings_Golink_Handler();
	}

	public function test_handle__returns_settings_url_without_module_param() {
		$url = $this->handler->handle( $this->context );

		$this->assertSame(
			$this->context->admin_url( 'settings' ),
			$url,
			'Expected base settings URL when no module parameter is provided.'
		);
	}

	public function test_handle__returns_settings_url_with_search_console_fragment() {
		$_GET['module'] = 'search-console';

		$url = $this->handler->handle( $this->context );

		$expected = $this->context->admin_url( 'settings' ) . '#connected-services/search-console';
		$this->assertSame( $expected, $url, 'Expected settings URL with Search Console fragment.' );
	}

	public function test_handle__returns_settings_url_with_analytics_fragment() {
		$_GET['module'] = 'analytics-4';

		$url = $this->handler->handle( $this->context );

		$expected = $this->context->admin_url( 'settings' ) . '#connected-services/analytics-4';
		$this->assertSame( $expected, $url, 'Expected settings URL with Analytics fragment.' );
	}

	public function test_handle__sanitizes_module_param() {
		$_GET['module'] = 'SEARCH-Console';

		$url = $this->handler->handle( $this->context );

		// sanitize_key() lowercases and removes special characters.
		$expected = $this->context->admin_url( 'settings' ) . '#connected-services/search-console';
		$this->assertSame( $expected, $url, 'Expected module parameter to be sanitized via sanitize_key().' );
	}

	public function test_handle__ignores_empty_module_param() {
		$_GET['module'] = '';

		$url = $this->handler->handle( $this->context );

		$this->assertSame(
			$this->context->admin_url( 'settings' ),
			$url,
			'Expected base settings URL when module parameter is empty.'
		);
	}
}
