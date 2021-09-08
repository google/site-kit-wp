<?php

namespace Helper;

// here you can define custom actions
// all public methods declared in helper class will be available in $I

class Idea_Hub extends \Codeception\Module {

	public function enableIdeaHubMocks() {
		$I = $this->getModule( '\Helper\WordPress' );
		$I->activatePlugins(
			'codeception-plugins/idea-hub-mocks.php'
		);
	}

	public function disableIdeaHubMocks() {
		$I = $this->getModule( '\Helper\WordPress' );
		$I->deactivatePlugins(
			'codeception-plugins/idea-hub-mocks.php'
		);
	}

	public function setupIdeaHub() {
		$I = $this->getModule( '\Helper\SiteKit' );
		$I->activateModule( 'Idea Hub' );

		// TODO: Bypass scope steps

		$I = $this->getModule( 'WebDriver' );
		$I->waitForText( 'Connect Service', 5, '.googlesitekit-setup__intro-title' );
	}

}
