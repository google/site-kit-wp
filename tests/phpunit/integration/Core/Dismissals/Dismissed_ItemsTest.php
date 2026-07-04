<?php
/**
 * Dismissed_ItemsTest
 *
 * @package   Google\Site_Kit\Tests\Core\Dismissals
 * @copyright 2021 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */
namespace Google\Site_Kit\Tests\Core\Dismissals;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Dismissals\Dismissed_Items;
use Google\Site_Kit\Core\Storage\User_Options;
use Google\Site_Kit\Tests\TestCase;

class Dismissed_ItemsTest extends TestCase {

	/**
	 * @var User_Options
	 */
	private $user_options;

	/**
	 * @var Dismissed_Items
	 */
	private $dismissed_items;

	public function set_up() {
		parent::set_up();

		$user_id = $this->factory()->user->create();
		$context = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );

		$this->user_options    = new User_Options( $context, $user_id );
		$this->dismissed_items = new Dismissed_Items( $this->user_options );
		$this->dismissed_items->register();
	}

	public function test_add() {
		$this->assertEmpty( $this->user_options->get( Dismissed_Items::OPTION ), 'Dismissed items option should be empty initially.' );

		$this->dismissed_items->add( 'foo' );
		$this->assertEquals(
			array(
				'foo' => 0,
			),
			$this->user_options->get( Dismissed_Items::OPTION ),
			'Dismissed items should contain item without expiration.'
		);

		$this->dismissed_items->add( 'bar', 100 );
		$user_options = $this->user_options->get( Dismissed_Items::OPTION );
		$this->assertArrayHasKey( 'foo', $user_options, 'Dismissed items should contain non-expiring item.' );
		$this->assertEquals( 0, $user_options['foo'], 'Non-expiring dismissal should store zero.' );
		$this->assertArrayHasKey( 'bar', $user_options, 'Dismissed items should contain expiring item.' );
		$this->assertEqualsWithDelta( time() + 100, $user_options['bar'], 2, 'Expiring dismissal should store future timestamp.' );
	}

	public function test_remove() {
		$this->user_options->set(
			Dismissed_Items::OPTION,
			array(
				'foo' => 0,
				'bar' => time() + 100,
				'baz' => time() + 200,
			)
		);

		$user_options = $this->user_options->get( Dismissed_Items::OPTION );
		$this->assertArrayHasKey( 'foo', $user_options, 'Dismissed items should contain foo before removal.' );
		$this->assertArrayHasKey( 'bar', $user_options, 'Dismissed items should contain bar before removal.' );
		$this->assertArrayHasKey( 'baz', $user_options, 'Dismissed items should contain baz before removal.' );
		$this->assertEquals( 0, $user_options['foo'], 'Foo dismissal should store zero before removal.' );
		$this->assertEqualsWithDelta( time() + 100, $user_options['bar'], 2, 'Bar dismissal should store future timestamp.' );
		$this->assertEqualsWithDelta( time() + 200, $user_options['baz'], 2, 'Baz dismissal should store future timestamp.' );

		$this->dismissed_items->remove( 'bar' );

		$this->assertEquals(
			array(
				'foo' => 0,
				'baz' => time() + 200,

			),
			$this->user_options->get( Dismissed_Items::OPTION ),
			'Dismissed items should omit removed item.'
		);

		// If the item is not in dismissed items, there should be no change.
		$this->dismissed_items->remove( 'bar' );

		$this->assertEquals(
			array(
				'foo' => 0,
				'baz' => time() + 200,

			),
			$this->user_options->get( Dismissed_Items::OPTION ),
			'Dismissed items should remain unchanged after removing missing item.'
		);
	}

	public function test_get_dismissed_items() {
		$this->user_options->set(
			Dismissed_Items::OPTION,
			array(
				'foo' => 0,
				'bar' => time() + 100,
				'baz' => time() - 100,
			)
		);

		$this->assertEquals(
			array(
				'foo',
				'bar',
			),
			$this->dismissed_items->get_dismissed_items(),
			'Dismissed items should omit expired items.'
		);
	}

	public function test_is_dismissed() {
		$this->user_options->set(
			Dismissed_Items::OPTION,
			array(
				'foo' => 0,
				'bar' => time() + 100,
				'baz' => time() - 100,
			)
		);

		$this->assertTrue( $this->dismissed_items->is_dismissed( 'foo' ), 'Non-expiring item should be dismissed.' );
		$this->assertTrue( $this->dismissed_items->is_dismissed( 'bar' ), 'Future-expiring item should be dismissed.' );
		$this->assertFalse( $this->dismissed_items->is_dismissed( 'baz' ), 'Expired item should not be dismissed.' );
	}
}
