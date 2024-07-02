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

use Google\Service\SubscribewithGoogle\Order;

/**
 * The "orders" collection of methods.
 * Typical usage is:
 *  <code>
 *   $subscribewithgoogleService = new Google\Service\SubscribewithGoogle(...);
 *   $orders = $subscribewithgoogleService->publications_readers_orders;
 *  </code>
 */
class PublicationsReadersOrders extends \Google\Service\Resource
{
  /**
   * Gets order's information. (orders.get)
   *
   * @param string $name Required. The resource name of the Order. Format:
   * publications/{publication}/readers/{reader}/orders/{order}
   * @param array $optParams Optional parameters.
   * @return Order
   * @throws \Google\Service\Exception
   */
  public function get($name, $optParams = [])
  {
    $params = ['name' => $name];
    $params = array_merge($params, $optParams);
    return $this->call('get', [$params], Order::class);
  }
}

// Adding a class alias for backwards compatibility with the previous class name.
class_alias(PublicationsReadersOrders::class, 'Google_Service_SubscribewithGoogle_Resource_PublicationsReadersOrders');
