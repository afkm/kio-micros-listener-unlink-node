#!/usr/bin/env node

'use strict';

const Path = require('path');
const _ = require('lodash');

var neo4j = require('neo4j-driver').v1;
var driver = neo4j.driver("bolt://localhost", neo4j.auth.basic("neo4j", "lalala"));

driver.onCompleted = function() {
  console.log('Successfully connected to Neo4J');
};

driver.onError = function(error) {
  console.log('Neo4J Driver instantiation failed', error);
};

var session = driver.session();


require('seneca')()
  .use('seneca-amqp-transport')
  .add('cmd:unlinkNode,cuid:*,unlinkFrom:*', function(message, done) {
    var queryString = "MATCH (a { cuid:'" + message.cuid + "'}) -[r]- (b { cuid:'" + message.unlinkFrom + "'}) DELETE r";
    console.log(queryString);
    session
      .run(queryString)
      .then(function(result) {
        session.close();
        var status = "Successfully unlinked Node " + message.cuid + ", from Node " + message.unlinkFrom;
        return done(null, {
          status
        });
      })
      .catch(function(error) {
        console.log(error);
      });
  })
  .listen({
    type: 'amqp',
    pin: 'cmd:unlinkNode,cuid:*,unlinkFrom:*',
    url: process.env.AMQP_URL
  });
