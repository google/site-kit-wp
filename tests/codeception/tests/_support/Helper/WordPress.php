<?php

namespace Helper;

// here you can define custom actions
// all public methods declared in helper class will be available in $I

class WordPress extends \Codeception\Module {

	/**
	 * Logs in with the provided credentials.
	 *
	 * @since n.e.x.t
	 *
	 * @param string $login User login.
	 * @param string $password User password.
	 */
	public function login( $login, $password ) {
		$I = $this->getModule( 'WebDriver' );
		$I->amOnPage( '/wp-login.php' );
		$I->submitForm(
			'#loginform',
			array(
				'log' => $login,
				'pwd' => $password,
			)
		);
		$I->see( $login, '.display-name' );
	}

	/**
	 * Logs in as admin.
	 *
	 * @since n.e.x.t
	 */
	public function loginAsAdmin() {
		$this->login( 'admin', 'password' );
	}

	/**
	 * Activates provided plugins.
	 *
	 * @since n.e.x.t
	 *
	 * @param string[] ...$plugins Plugins list to activate.
	 */
	public function activatePlugins( ...$plugins ) {
		$I = $this->getModule( 'WebDriver' );
		$I->amOnPage( '/wp-admin/plugins.php' );
		$I->submitForm(
			'#bulk-action-form',
			array(
				'action'  => 'activate-selected',
				'checked' => $plugins,
			)
		);
	}

	/**
	 * Deactivates provided plugins.
	 *
	 * @since n.e.x.t
	 *
	 * @param string[] ...$plugins Plugins list to deactivate.
	 */
	public function deactivatePlugins( ...$plugins ) {
		$I = $this->getModule( 'WebDriver' );
		$I->amOnPage( '/wp-admin/plugins.php' );
		$I->submitForm(
			'#bulk-action-form',
			array(
				'action'  => 'deactivate-selected',
				'checked' => $plugins,
			)
		);
	}

}
