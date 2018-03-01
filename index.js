/**
 * Copyright (c) 2018. Anup Kumar. All rights reserved.
 */

'use strict';

/**
 * Parse the models from config file and create mongoose models
 * Save and validates the saved data
 * 
 * @author anup
 * @version 1.0.0
 */

const _ = require('lodash');
const config = require('./config');
const uuid = require('uuid');

// the instantiated mongoose object
const mongoose = require('./datasource').getMongoose();

// assuming mongo server is running on localhost
// update if required
const db = require('./datasource').getDb('mongodb://localhost:27017/xseed', 10);

// a map of mongoose model name to mongoose model objects
const models = { };

/*
*  Validate email Id
**/

const validateEmail = (email) => {  
    var re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(email);
}

/**
 * Find the type
 */
const findType = (config, splitcolon) => {
  const splitspace = splitcolon[1].trim().split(' ');
  // if `!` is present replace that otherwise don't do anything
  const name = splitspace[0].trim().replace('!', '').replace('[', '').replace(']', '');
  if (_.has(config, name)) {
    const schema = parseSchema(config[name], name, config);
    return schema;
  }
  switch (name) {
    case 'String':
      return mongoose.Schema.Types.String;
    case 'Int':
    case 'Number':
    case 'Double':
    case 'Float':
      return mongoose.Schema.Types.Number;
    case 'Date':
      return mongoose.Schema.Types.Date;
    case 'Boolean':
    case 'Bool':
      return mongoose.Schema.Types.Boolean;
    default:
      throw new Error(`invalid name ${name}`);
  }
  return name;
}

const  parseSchema = (value, key, config) => {
  // split the value by newline character
  // it is mandatory to have new line character to define models
  const split = value.split('\n');

  // define the schema
  const schema = { };
  let modelName;
  _.each(split, (line, index) => {
    line = line.trim();
    if (line.includes('@model')) {
      // this is a model
      modelName = line.split(' ')[1].trim();
    } else if (!line.includes('type')) {
      const splitcolon = line.split(':');
      // check if this is array type
      const isArray = splitcolon[1].trim().includes('[')&& splitcolon[1].trim().includes(']')
      const splitspace = splitcolon[1].trim().split(' ');
      schema[splitcolon[0].trim()] = {
        type: isArray === true ? [findType(config, splitcolon)] : findType(config, splitcolon),
        required: splitcolon[0].includes('!'),
        unique: splitspace.length > 1 && splitspace[1].includes('@unique'),
      };
    }
  });
  const mongooseSchema = new mongoose.Schema(schema);

  if (_.isString(modelName)) {
    // register the model
    models[modelName] = db.model(modelName, mongooseSchema);
  }

  // return the schema
  return mongooseSchema;
}

const keys = _.keys(config);

keys.forEach((key, index) => {
  parseSchema(config[key], key, config);
})
const createUser = (data) => {
  if(validateEmail(data.email)){
    models.User.create(data, function (err, saved) {
      if (err) {
        console.error('failed to save data into mongo db', err);
        throw new Error(err);
      } else {
        console.log('*********\n mongo db data saved successfully, validating the saved data \n*********');
        models.User.find({ id: `${uid}_anup` }, function (nerr, doc) {
          if (nerr) {
            console.error('failed to retrieve document from mongodb', nerr);
          } else {
            console.log('*********\n document retrieved successfully \n*********');
            console.log(JSON.stringify(doc));
          }
        });
      }
    });
  }else{
    console.log('*********\n Invalid email ID \n*************')
  }  
};

// insert some sample data into the database

const uid = uuid();
const data = {
  id: `${uid}_anup`,
  email: `anup-${uid}@gmail.com`,
  name: 'Anup Kumar',
  age: "26",
  addresses: [{ city: 'Gurgaon', state: 'Haryana' }],
  dateOfBirth: Date.now(),
};

createUser(data);

/*
*     Test Case 
 */

const testData =[  
  /*
  *  Test Case 1 : invalid email ID
  */
  {
    id: `${uuid()}_anup`,
    email: `anupgmail.com`,
    name: 'Anup Kumar',
    age: "26",
    addresses: [{ city: 'Gurgaon', state: 'Haryana' }],
    dateOfBirth: Date.now(),
  },
  /*
  *  Test Case 2 : All correct Data
  */
  {
    id: `${uuid()}_anup`,
    email: `anup-${uuid()}@gmail.com`,
    name: 'Anup Kumar',
    age: "26",
    addresses: [{ city: 'Gurgaon', state: 'Haryana' }],
    dateOfBirth: Date.now(),
  },
  /*
  *  Test Case 3 : same email and id - unique insert test
  */
  {
    id: `xyz_anup`,
    email: `anup@gmail.com`,
    name: 'Anup Kumar',
    age: "26",
    addresses: [{ city: 'Gurgaon', state: 'Haryana' }],
    dateOfBirth: Date.now(),
  },{
    id: `xyz_anup`,
    email: `anup@gmail.com`,
    name: 'Anup Kumar',
    age: "26",
    addresses: [{ city: 'Gurgaon', state: 'Haryana' }],
    dateOfBirth: Date.now(),
  }
]

testData.forEach((test, index) => {
  createUser(test);
});


