/**
 * Copyright (c) 2018. Anup Kumar. All rights reserved.
 */

'use strict';

/**
 * Define mongoose models config file
 *
 * @author      anup
 * @version     1.0.0
 */

const Address = `type Address {
  city: String
  state: String }`;


const User = `type User @model {
  id: String! @unique
  email: String! @unique
  name: String!
  age: Int
  addresses: [Address]
  dateOfBirth: Date }`;


module.exports = { User, Address };