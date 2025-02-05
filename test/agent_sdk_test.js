'use strict';
const expect = require('chai').expect;
const mockery = require('mockery');
const sinon = require('sinon');
const Events = require('events');

describe('Agent SDK Tests', () => {

    let tranportSendStub;
    let externalServices;
    let requestCSDSStub;
    let Agent;
    const csdsResponse = {
        baseURIs: [{service: 'agentVep', baseURI: 'some-domain'}, {
            service: 'asyncMessaging',
            baseURI: 'another-domain'
        }]
    };

    before(() => {
        mockery.enable({
            warnOnReplace: false,
            warnOnUnregistered: false,
            useCleanCache: true
        });

        tranportSendStub = sinon.stub();

        class Transport extends Events {
            constructor(conf) {
                super();
                this.send = tranportSendStub;

                setImmediate(() => {
                    this.emit('open', conf);
                });
            }

            close() {

            }
        }

        externalServices = {getDomains: sinon.stub(), login: sinon.stub(), getAgentId: sinon.stub()};
        requestCSDSStub = sinon.stub();
        mockery.registerMock('./Transport', Transport);
        mockery.registerMock('./ExternalServices', externalServices);
        mockery.registerMock('request', requestCSDSStub);
        Agent = require('./../lib/AgentSDK');
    });

    after(() => {
        mockery.disable();
    });

    it('should create an instance and publish connected event', done => {
        requestCSDSStub.yieldsAsync(null, {}, csdsResponse);
        externalServices.login.yieldsAsync(null, {bearer: 'im encrypted', config: {userId: 'imauser'}});
        externalServices.getAgentId.yieldsAsync(null, {pid: 'someId'});
        const agent = new Agent({
            accountId: 'account',
            username: 'me',
            password: 'password'
        });
        agent.on('connected', msg => {
            expect(agent.getClock).to.be.a.function;
            // expect(agent.agentId).to.equal('account.imauser');
            expect(agent.connected).to.be.true;
            done();
        });
    });

    it('should fail to create an instance when csds is not available', done => {
        requestCSDSStub.yieldsAsync(new Error('cannot connect to csds'));

        const agent = new Agent({
            accountId: 'account',
            username: 'me',
            password: 'password'
        });
        agent.on('error', err => {
            expect(err).to.be.instanceof(Error);
            expect(err.message).to.contain('csds');
            done();
        });
    });

    // it('should fail to create an instance when cannot get agent id', done => {
    //     requestCSDSStub.yieldsAsync(null, {}, csdsResponse);
    //     externalServices.getAgentId.yieldsAsync(new Error('cannot get agent id'));
    //
    //     const agent = new Agent({
    //         accountId: 'account',
    //         username: 'me',
    //         password: 'password'
    //     });
    //     agent.on('error', err => {
    //         expect(err).to.be.instanceof(Error);
    //         expect(err.message).to.contain('agent');
    //         done();
    //     });
    // });

    it('should fail to create an instance when login service is not available', done => {
        requestCSDSStub.yieldsAsync(null, {}, csdsResponse);
        externalServices.login.yieldsAsync(new Error('cannot login'));
        externalServices.getAgentId.yieldsAsync(null, {pid: 'someId'});
        const agent = new Agent({
            accountId: 'account',
            username: 'me',
            password: 'password'
        });
        agent.on('error', err => {
            expect(err).to.be.instanceof(Error);
            expect(err.message).to.contain('login');
            done();
        });
    });

    it('should receive all notifications', done => {
        requestCSDSStub.yieldsAsync(null, {}, csdsResponse);
        externalServices.login.yieldsAsync(null, {bearer: 'im encrypted', config: {userId: 'imauser'}});
        externalServices.getAgentId.yieldsAsync(null, {pid: 'someId'});

        const agent = new Agent({
            accountId: 'account',
            username: 'me',
            password: 'password'
        });
        agent.on('connected', msg => {
            agent.transport.emit('message', {kind: 'notification', type: 'myType', body: {x: 'x'}});
        });

        agent.on('notification', msg => {
            expect(msg).to.be.defined;
            expect(msg.body.x).to.equal('x');
            done();
        });
    });

    it('should receive all notifications using assertion', done => {
        requestCSDSStub.yieldsAsync(null, {}, csdsResponse);
        externalServices.login.yieldsAsync(null, {bearer: 'im encrypted', config: {userId: 'imauser'}});
        externalServices.getAgentId.yieldsAsync(null, {pid: 'someId'});

        const agent = new Agent({
            accountId: 'account',
            assertion: 'some SAML assertion',
        });
        agent.on('connected', msg => {
            agent.transport.emit('message', {kind: 'notification', type: 'myType', body: {x: 'x'}});
        });

        agent.on('notification', msg => {
            expect(msg).to.be.defined;
            expect(msg.body.x).to.equal('x');
            done();
        });
    });

    it('should receive all notifications using oauth1', done => {
        requestCSDSStub.yieldsAsync(null, {}, csdsResponse);
        externalServices.login.yieldsAsync(null, {bearer: 'im encrypted', config: {userId: 'imauser'}});
        externalServices.getAgentId.yieldsAsync(null, {pid: 'someId'});

        const agent = new Agent({
            accountId: 'account',
            username: 'reem1',
            appKey: 'ad377dbbb8204f1c8dbd57a3409a1b14',
            secret: '19e5dbabfd09a5ac',
            accessToken: '00f49175a1eb4f9088e3c4ea822d9dbd',
            accessTokenSecret: '4dac3a709ff23e7b',
        });
        agent.on('connected', msg => {
            agent.transport.emit('message', {kind: 'notification', type: 'myType', body: {x: 'x'}});
        });

        agent.on('notification', msg => {
            expect(msg).to.be.defined;
            expect(msg.body.x).to.equal('x');
            done();
        });
    });

    it('should receive all notifications using token', done => {
        requestCSDSStub.yieldsAsync(null, {}, csdsResponse);
        externalServices.login.yieldsAsync(null, {bearer: 'im encrypted', config: {userId: 'imauser'}});
        externalServices.getAgentId.yieldsAsync(null, {pid: 'someId'});

        const agent = new Agent({
            accountId: 'account',
            token: 'my token',
            userId: 'myId'
        });
        agent.on('connected', msg => {
            agent.transport.emit('message', {kind: 'notification', type: 'myType', body: {x: 'x'}});
        });

        agent.on('notification', msg => {
            expect(msg).to.be.defined;
            expect(msg.body.x).to.equal('x');
            done();
        });
    });

    it('should receive specific notifications', done => {
        requestCSDSStub.yieldsAsync(null, {}, csdsResponse);
        externalServices.login.yieldsAsync(null, {bearer: 'im encrypted', config: {userId: 'imauser'}});
        externalServices.getAgentId.yieldsAsync(null, {pid: 'someId'});

        const agent = new Agent({
            accountId: 'account',
            username: 'me',
            password: 'password'
        });
        agent.on('connected', msg => {
            agent.transport.emit('message', {kind: 'notification', type: 'myType', body: {x: 'x'}});
        });

        agent.on('myType', body => {
            expect(body).to.be.defined;
            expect(body.x).to.equal('x');
            done();
        });
    });

    it('should call the request callback on response', done => {
        requestCSDSStub.yieldsAsync(null, {}, csdsResponse);
        externalServices.login.yieldsAsync(null, {bearer: 'im encrypted', config: {userId: 'imauser'}});
        externalServices.getAgentId.yieldsAsync(null, {pid: 'someId'});

        const agent = new Agent({
            accountId: 'account',
            username: 'me',
            password: 'password'
        });

        agent.on('connected', msg => {
            agent.getClock({some: 'data'}, (err, response) => {
                expect(err).to.be.null;
                expect(response).to.be.defined;
                expect(response.x).to.equal('x');
                done();
            });

            setImmediate(() => {
                agent.transport.emit('message', {
                    kind: 'resp',
                    reqId: tranportSendStub.getCall(0).args[0].id,
                    type: 'myRespType',
                    body: {x: 'x'}
                });
            });
        });

    });

    it('should emit specific response event', done => {
        requestCSDSStub.yieldsAsync(null, {}, csdsResponse);
        externalServices.login.yieldsAsync(null, {bearer: 'im encrypted', config: {userId: 'imauser'}});
        externalServices.getAgentId.yieldsAsync(null, {pid: 'someId'});

        const agent = new Agent({
            accountId: 'account',
            username: 'me',
            password: 'password'
        });

        agent.on('connected', msg => {
            agent.getClock({some: 'data'}, response => {
            });

            setImmediate(() => {
                agent.transport.emit('message', {
                    kind: 'resp',
                    reqId: tranportSendStub.getCall(1).args[0].id,
                    type: 'myRespType',
                    body: {x: 'x'}
                });
            });
        });

        agent.on('myRespType', body => {
            expect(body).to.be.defined;
            expect(body.x).to.equal('x');
            done();
        });
    });

    it('should call the request callback with error on timeout', done => {
        requestCSDSStub.yieldsAsync(null, {}, csdsResponse);
        externalServices.login.yieldsAsync(null, {bearer: 'im encrypted', config: {userId: 'imauser'}});
        externalServices.getAgentId.yieldsAsync(null, {pid: 'someId'});

        const agent = new Agent({
            accountId: 'account',
            username: 'me',
            password: 'password',
            requestTimeout: 10,
            errorCheckInterval: 10,
        });

        agent.on('connected', msg => {
            agent.getClock({some: 'data'}, (err, response) => {
                expect(err).to.be.defined;
                expect(err).to.be.instanceof(Error);
                expect(err.message).to.contain('timed');
                done();
            });
        });

    });

    it('should dispose correctly', done => {
        requestCSDSStub.yieldsAsync(null, {}, csdsResponse);
        externalServices.login.yieldsAsync(null, {bearer: 'im encrypted', config: {userId: 'imauser'}});
        externalServices.getAgentId.yieldsAsync(null, {pid: 'someId'});

        const agent = new Agent({
            accountId: 'account',
            username: 'me',
            password: 'password',
            requestTimeout: 10,
            errorCheckInterval: 10,
        });

        agent.on('connected', msg => {
            agent.dispose();
            expect(agent.transport).to.be.null;
            done();
        });

    });

    it('Should throw a TransformError when a notification with missed participantsPId data is received', done => {
        requestCSDSStub.yieldsAsync(null, {}, csdsResponse);
        externalServices.login.yieldsAsync(null, {bearer: 'im encrypted', config: {userId: 'imauser'}});
        externalServices.getAgentId.yieldsAsync(null, {pid: 'someId'});
        const change =  {'type':'UPSERT','result':{'convId':'38c1ff4b-24e5-2342-8d05-15a62de2daad','effectiveTTR':-1,'conversationDetails':{'convId':'38c1ff4b-24e5-2342-8d05-15a62de2daad','skillId':'1251428632','participants':{'CONSUMER':['102f83624a545696f5dd87ecdd6edf394430f3445666ba68b533c847abb11'],'MANAGER':['2344566.1282051932','2344566.901083232'],'CONTROLLER':['2344566.1257599432'],'READER':[]},'participantsPId':{'CONSUMER':['102f83624a545696f5dd87ecdd6edf394430f3445666ba68b533c847abb11'],'MANAGER':['f675416a-7d5a-5d06-a7bd-bdf5fcc426a1','8ffebb81-0614-568c-a011-3b17eafc5b9d'],'READER':[]},'dialogs':[{'dialogId':'5Yn6I7hpR6C3JWg4YT-Meg','participantsDetails':[{'id':'102f83624a545696f5dd87ecdd6edf394430f3445666ba68b533c847abb11','role':'CONSUMER','state':'ACTIVE'}],'dialogType':'POST_SURVEY','channelType':'MESSAGING','metaData':{'appInstallId':'896ef5ea-b954-42c9-91b7-a9134a47faa7'},'state':'OPEN','creationTs':1564734095888,'metaDataLastUpdateTs':1564734095887},{'dialogId':'38c1ff4b-24e5-2342-8d05-15a62de2daad','participantsDetails':[{'id':'102f83624a545696f5dd87ecdd6edf394430f3445666ba68b533c847abb11','role':'CONSUMER','state':'ACTIVE'},{'id':'2344566.1282051932','role':'MANAGER','state':'ACTIVE'},{'id':'2344566.1257599432','role':'CONTROLLER','state':'ACTIVE'},{'id':'2344566.901083232','role':'MANAGER','state':'ACTIVE'}],'dialogType':'MAIN','channelType':'MESSAGING','state':'CLOSE','creationTs':1564685380489,'endTs':1564734095888,'metaDataLastUpdateTs':1564734095888,'closedBy':'AGENT'}],'brandId':'2344566','state':'CLOSE','stage':'OPEN','closeReason':'AGENT','startTs':1564685380489,'metaDataLastUpdateTs':1564734095888,'firstConversation':false,'csatRate':0,'ttr':{'ttrType':'NORMAL','value':1200},'note':'','context':{'type':'CustomContext','clientProperties':{'type':'.ClientProperties','appId':'whatsapp','ipAddress':'10.42.138.108','features':['PHOTO_SHARING','QUICK_REPLIES','AUTO_MESSAGES','MULTI_DIALOG','FILE_SHARING','RICH_CONTENT']},'name':'WhatsApp Business'},'conversationHandlerDetails':{'accountId':'2344566','skillId':'1251428632'}},'numberOfunreadMessages':{'102f83624a545696f5dd87ecdd6edf394430f3445666ba68b533c847abb11':1,'2344566.901083232':0,'2344566.1282051932':10},'lastUpdateTime':1564734095888}};
        const agent = new Agent({
            accountId: 'account',
            username: 'me',
            password: 'password'
        });
        agent.on('connected', msg => {
            try{
                agent.transport.emit('message', {kind: 'notification', type: '.ams.aam.ExConversationChangeNotification', body: { changes:[change]}});
            } catch (err) {
                expect(err).to.be.defined;
                expect(err.message).to.be.equal('TypeError: Cannot read property \'0\' of undefined');
                expect(err.payload.body.changes[0]).to.be.equal(change);
                expect(err.constructor.name).to.be.equal('TransformError');
                done();
            }

        });

    });

    it('Should throw a TransformError when a response with missed participantsPId data is received', done => {
        requestCSDSStub.yieldsAsync(null, {}, csdsResponse);
        externalServices.login.yieldsAsync(null, {bearer: 'im encrypted', config: {userId: 'imauser'}});
        externalServices.getAgentId.yieldsAsync(null, {pid: 'someId'});
        const change =  {'type':'UPSERT','result':{'convId':'38c1ff4b-24e5-2342-8d05-15a62de2daad','effectiveTTR':-1,'conversationDetails':{'convId':'38c1ff4b-24e5-2342-8d05-15a62de2daad','skillId':'1251428632','participants':{'CONSUMER':['102f83624a545696f5dd87ecdd6edf394430f3445666ba68b533c847abb11'],'MANAGER':['2344566.1282051932','2344566.901083232'],'CONTROLLER':['2344566.1257599432'],'READER':[]},'participantsPId':{'CONSUMER':['102f83624a545696f5dd87ecdd6edf394430f3445666ba68b533c847abb11'],'MANAGER':['f675416a-7d5a-5d06-a7bd-bdf5fcc426a1','8ffebb81-0614-568c-a011-3b17eafc5b9d'],'READER':[]},'dialogs':[{'dialogId':'5Yn6I7hpR6C3JWg4YT-Meg','participantsDetails':[{'id':'102f83624a545696f5dd87ecdd6edf394430f3445666ba68b533c847abb11','role':'CONSUMER','state':'ACTIVE'}],'dialogType':'POST_SURVEY','channelType':'MESSAGING','metaData':{'appInstallId':'896ef5ea-b954-42c9-91b7-a9134a47faa7'},'state':'OPEN','creationTs':1564734095888,'metaDataLastUpdateTs':1564734095887},{'dialogId':'38c1ff4b-24e5-2342-8d05-15a62de2daad','participantsDetails':[{'id':'102f83624a545696f5dd87ecdd6edf394430f3445666ba68b533c847abb11','role':'CONSUMER','state':'ACTIVE'},{'id':'2344566.1282051932','role':'MANAGER','state':'ACTIVE'},{'id':'2344566.1257599432','role':'CONTROLLER','state':'ACTIVE'},{'id':'2344566.901083232','role':'MANAGER','state':'ACTIVE'}],'dialogType':'MAIN','channelType':'MESSAGING','state':'CLOSE','creationTs':1564685380489,'endTs':1564734095888,'metaDataLastUpdateTs':1564734095888,'closedBy':'AGENT'}],'brandId':'2344566','state':'CLOSE','stage':'OPEN','closeReason':'AGENT','startTs':1564685380489,'metaDataLastUpdateTs':1564734095888,'firstConversation':false,'csatRate':0,'ttr':{'ttrType':'NORMAL','value':1200},'note':'','context':{'type':'CustomContext','clientProperties':{'type':'.ClientProperties','appId':'whatsapp','ipAddress':'10.42.138.108','features':['PHOTO_SHARING','QUICK_REPLIES','AUTO_MESSAGES','MULTI_DIALOG','FILE_SHARING','RICH_CONTENT']},'name':'WhatsApp Business'},'conversationHandlerDetails':{'accountId':'2344566','skillId':'1251428632'}},'numberOfunreadMessages':{'102f83624a545696f5dd87ecdd6edf394430f3445666ba68b533c847abb11':1,'2344566.901083232':0,'2344566.1282051932':10},'lastUpdateTime':1564734095888}};
        const agent = new Agent({
            accountId: 'account',
            username: 'me',
            password: 'password'
        });
        agent.on('connected', msg => {
            try{
                agent.transport.emit('message', {kind: 'resp', type: '.ams.aam.ExConversationChangeNotification', body: { changes:[change]}});
            } catch (err) {
                expect(err).to.be.defined;
                expect(err.message).to.be.equal('TypeError: Cannot read property \'0\' of undefined');
                expect(err.payload.body.changes[0]).to.be.equal(change);
                expect(err.constructor.name).to.be.equal('TransformError');
                done();
            }

        });

    });

});
