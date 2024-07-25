<?php
/*
 * Copyright 2014 Google Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not
 * use this file except in compliance with the License. You may obtain a copy of
 * the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations under
 * the License.
 */

namespace Google\Service\SubscribewithGoogle\Resource;

use Google\Service\SubscribewithGoogle\ListUserEntitlementsPlansResponse;
use Google\Service\SubscribewithGoogle\UserEntitlementsPlan;

/**
 * The "entitlementsplans" collection of methods.
 * Typical usage is:
 *  <code>
 *   $subscribewithgoogleService = new Google\Service\SubscribewithGoogle(...);
 *   $entitlementsplans = $subscribewithgoogleService->publications_readers_entitlementsplans;
 *  </code>
 */
class PublicationsReadersEntitlementsplans extends \Google\Service\Resource
{
  /**
   * Gets the entitlements plan identitfied by plan id for a given user under the
   * given publication. (entitlementsplans.get)
   *
   * @param string $name Required. The resource name of the UserEntitlementsPlan.
   * Format: publications/{publication}/readers/{reader}/entitlementsplans/{plan}
   * @param array $optParams Optional parameters.
   * @return UserEntitlementsPlan
   * @throws \Google\Service\Exception
   */
  public function get($name, $optParams = [])
  {
    $params = ['name' => $name];
    $params = array_merge($params, $optParams);
    return $this->call('get', [$params], UserEntitlementsPlan::class);
  }
  /**
   * Lists all the entitlements plans for a given user under a given publication.
   * (entitlementsplans.listPublicationsReadersEntitlementsplans)
   *
   * @param string $parent Required. The parent, which owns this collection of
   * UserEntitlementsPlans. Format: publications/{publication}/readers/{reader}
   * @param array $optParams Optional parameters.
   *
   * @opt_param int pageSize The maximum number of UserEntitlementsPlans to
   * return. The service may return fewer than this value. If unspecified, at most
   * 100 UserEntitlementsPlans will be returned. The maximum value is 1000; values
   * above 1000 will be coerced to 1000.
   * @opt_param string pageToken A token identifying a page of results the server
   * should return. Typically, this is the value of
   * ListUserEntitlementsPlansResponse.next_page_token returned from the previous
   * call to `ListUserEntitlementsPlans` method.
   * @return ListUserEntitlementsPlansResponse
   * @throws \Google\Service\Exception
   */
  public function listPublicationsReadersEntitlementsplans($parent, $optParams = [])
  {
    $params = ['parent' => $parent];
    $params = array_merge($params, $optParams);
    return $this->call('list', [$params], ListUserEntitlementsPlansResponse::class);
  }
}

// Adding a class alias for backwards compatibility with the previous class name.
class_alias(PublicationsReadersEntitlementsplans::class, 'Google_Service_SubscribewithGoogle_Resource_PublicationsReadersEntitlementsplans');
