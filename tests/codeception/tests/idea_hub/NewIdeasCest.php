<?php

class NewIdeasCest {

	public function _before( Idea_HubTester $I ) { // phpcs:ignore PSR2.Methods.MethodDeclaration.Underscore
		$I->loginAsAdmin();
		$I->enableIdeaHubMocks();
		$I->connectSiteKit();
		$I->setupIdeaHub();
	}

	public function _after( Idea_HubTester $I ) { // phpcs:ignore PSR2.Methods.MethodDeclaration.Underscore
		$I->disableIdeaHubMocks();
		$I->disconnectSiteKit();
	}

	public function checkNewIdeas( Idea_HubTester $I ) {
		$I->amOnDashboardPage();
	}

}
