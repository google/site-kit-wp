<?php
/**
 * Expirable_ItemsTest
 *
 * @package   Google\Site_Kit\Tests\Core\Expirables
 * @copyright 2024 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Core\Expirables;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Expirables\Expirable_Items;
use Google\Site_Kit\Core\Storage\User_Options;
use Google\Site_Kit\Tests\TestCase;

class Expirable_ItemsTest extends TestCase {

	/**
	 * @var User_Options
	 */
	private $user_options;

	/**
	 * @var Expirable_Items
	 */
	private $expirable_items;

	public function set_up() {
		parent::set_up();

		$user_id = $this->factory()->user->create();
		$context = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );

		$this->user_options    = new User_Options( $context, $user_id );
		$this->expirable_items = new Expirable_Items( $this->user_options );
		$this->expirable_items->register();
	}

	public function test_add() {
		$this->assertEmpty( $this->user_options->get( Expirable_Items::OPTION ) );

		$current_time      = time();
		$expected_time_foo = $current_time + 1000;
		$this->expirable_items->add( 'foo', 1000 );

		$this->expirable_items->add( 'bar', 100 );
		$user_options          = $this->user_options->get( Expirable_Items::OPTION );
		$expected_time_foo_bar = $current_time + 100;

		$this->assertArrayHasKey( 'foo', $user_options );
		$this->assertEqualsWithDelta( $expected_time_foo, $user_options['foo'], 2 );
		$this->assertArrayHasKey( 'bar', $user_options );
		$this->assertEqualsWithDelta( $expected_time_foo_bar, $user_options['bar'], 2 );
	}

	public function test_remove() {
		$this->user_options->set(
			Expirable_Items::OPTION,
			array(
				'foo' => time() + 50,
				'bar' => time() + 100,
				'baz' => time() + 500,
			)
		);

		$user_options = $this->user_options->get( Expirable_Items::OPTION );

		$this->assertEqualsWithDelta( time() + 50, $user_options['foo'], 2 );
		$this->assertEqualsWithDelta( time() + 100, $user_options['bar'], 2 );
		$this->assertEqualsWithDelta( time() + 500, $user_options['baz'], 2 );

		$this->expirable_items->remove( 'bar' );

		$user_options_updated = $this->user_options->get( Expirable_Items::OPTION );

		$this->assertEqualsWithDelta( time() + 50, $user_options_updated['foo'], 2 );
		$this->assertEqualsWithDelta( time() + 500, $user_options_updated['baz'], 2 );
	}
}
